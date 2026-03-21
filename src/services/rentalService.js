import { supabase } from '../lib/supabase';
import { getLocalTodayDate } from '../utils/dateUtils';

export const rentalService = {
    async getAll() {
        const { data, error } = await supabase
            .from('rentals')
            .select('*, vehicles(model, image_url), customers(full_name, id_number, phone)')
            .order('status', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async checkAvailability(vehicleId, startDate, endDate, excludeRentalId = null) {
        // A vehicle is UNAVAILABLE if there is any rental that:
        // 1. Is NOT cancelled
        // 2. Overlaps with the requested range
        let query = supabase
            .from('rentals')
            .select('id, start_date, end_date, status, customers(full_name)')
            .eq('vehicle_id', vehicleId)
            .neq('status', 'cancelled')
            .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

        if (excludeRentalId) {
            query = query.neq('id', excludeRentalId);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        // Only consider 'active' or 'pending' as conflicts for availability
        return (data || []).filter(r => r.status === 'active' || r.status === 'pending');
    },

    async getActiveRental(vehicleId, date) {
        // Find a rental that is 'active' or 'pending' and includes the specified date
        
        // Helper to normalize dates (DD/MM/YYYY or YYYY-MM-DD to YYYY-MM-DD)
        const normalizeDate = (dateStr) => {
            if (!dateStr) return null;
            if (dateStr.includes('/')) {
                const [d, m, y] = dateStr.split('/');
                return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
            return dateStr;
        };

        const targetDate = normalizeDate(date);

        // 1. Fetch ALL rentals for this vehicle to inspect
        const { data: allRentals, error: allErr } = await supabase
            .from('rentals')
            .select('*, customers(full_name, id_number, phone)')
            .eq('vehicle_id', vehicleId);
        
        if (allErr) {
            console.error('Error fetching ALL rentals:', allErr);
            throw allErr;
        }

        // 2. Filter manually with normalized dates
        const matchingRental = allRentals.find(r => {
            const isStatusMatch = ['active', 'pending'].includes(r.status);
            const rStart = normalizeDate(r.start_date);
            const rEnd = normalizeDate(r.end_date);
            const isDateMatch = rStart <= targetDate && rEnd >= targetDate;
            return isStatusMatch && isDateMatch;
        });

        return matchingRental || null;
    },

    async getNextRental(vehicleId) {
        const todayStr = getLocalTodayDate();
        const { data, error } = await supabase
            .from('rentals')
            .select('*, customers(full_name, id_number, phone)')
            .eq('vehicle_id', vehicleId)
            .neq('status', 'cancelled')
            .gt('start_date', todayStr)
            .order('start_date', { ascending: true })
            .limit(1);

        if (error) throw error;
        return data.length > 0 ? data[0] : null;
    },

    async getByVehicle(vehicleId) {
        const { data, error } = await supabase
            .from('rentals')
            .select('*, customers(full_name, id_number, phone)')
            .eq('vehicle_id', vehicleId)
            .neq('status', 'cancelled')
            .order('start_date', { ascending: true });

        if (error) throw error;
        return data;
    },

    async create(rental) {
        // 1. Check for conflicts first
        const conflicts = await this.checkAvailability(rental.vehicle_id, rental.start_date, rental.end_date);
        if (conflicts.length > 0) {
            throw new Error('El vehículo ya tiene una renta programada en esas fechas.');
        }

        // 2. Create the rental record
        const { data, error: rentalError } = await supabase
            .from('rentals')
            .insert([rental])
            .select();

        if (rentalError) throw rentalError;

        // Simple synchronization: If the rental starts today or earlier and hasn't ended, mark vehicle as rented.
        const today = getLocalTodayDate();
        if (rental.start_date <= today && rental.end_date >= today) {
            await supabase
                .from('vehicles')
                .update({ status: 'rented' })
                .eq('id', rental.vehicle_id);
        }

        return data[0];
    },

    async complete(id) {
        // 1. Update rental status
        const { error: rentalError } = await supabase
            .from('rentals')
            .update({ status: 'completed' })
            .eq('id', id);

        if (rentalError) throw rentalError;

        // 2. Get vehicle_id to update its status
        const { data: rentalData } = await supabase
            .from('rentals')
            .select('vehicle_id')
            .eq('id', id)
            .single();

        if (rentalData && rentalData.vehicle_id) {
            await supabase
                .from('vehicles')
                .update({ status: 'available' })
                .eq('id', rentalData.vehicle_id);
        }
    },

    async delete(id) {
        try {
            // 1. Get rental details before deleting
            const { data: rental, error: fetchError } = await supabase
                .from('rentals')
                .select('vehicle_id, status, start_date, end_date')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            // 2. Delete the rental record
            const { error: deleteError } = await supabase
                .from('rentals')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // 3. Update vehicle status if the deleted rental was active today
            if (rental && rental.vehicle_id) {
                const today = getLocalTodayDate();
                const isCurrentlyRented = rental.status === 'active' && 
                                          rental.start_date <= today && 
                                          rental.end_date >= today;
                
                if (isCurrentlyRented) {
                    await supabase
                        .from('vehicles')
                        .update({ status: 'available' })
                        .eq('id', rental.vehicle_id);
                }
            }
        } catch (error) {
            console.error('Error in rentalService.delete:', error);
            throw error;
        }
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('rentals')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async addPayment(id, paymentAmount) {
        // 1. Get current rental
        const { data: rental, error: fetchError } = await supabase
            .from('rentals')
            .select('total_amount, amount_paid')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const currentPaid = parseFloat(rental.amount_paid) || 0;
        const totalAmount = parseFloat(rental.total_amount) || 0;
        const newPaid = Math.min(currentPaid + parseFloat(paymentAmount), totalAmount);

        // 2. Determine payment status
        let paymentStatus = 'pending';
        if (newPaid >= totalAmount) {
            paymentStatus = 'paid';
        } else if (newPaid > 0) {
            paymentStatus = 'partial';
        }

        // 3. Update rental
        const { error: updateError } = await supabase
            .from('rentals')
            .update({
                amount_paid: newPaid,
                payment_status: paymentStatus
            })
            .eq('id', id);

        if (updateError) throw updateError;

        return { newPaid, paymentStatus };
    }
};
