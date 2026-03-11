import { supabase } from '../lib/supabase';

export const rentalService = {
    async getAll() {
        const { data, error } = await supabase
            .from('rentals')
            .select('*, vehicles(model, image_url), customers(full_name)')
            .order('status', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async checkAvailability(vehicleId, startDate, endDate, excludeRentalId = null) {
        let query = supabase
            .from('rentals')
            .select('id, start_date, end_date, customers(full_name)')
            .eq('vehicle_id', vehicleId)
            .neq('status', 'cancelled')
            .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

        if (excludeRentalId) {
            query = query.neq('id', excludeRentalId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getByVehicle(vehicleId) {
        const { data, error } = await supabase
            .from('rentals')
            .select('*, customers(full_name)')
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

        return data[0];
    },

    async complete(id) {
        // 1. Update rental status
        const { error: rentalError } = await supabase
            .from('rentals')
            .update({ status: 'completed' })
            .eq('id', id);

        if (rentalError) throw rentalError;
    },

    async delete(id) {
        const { error } = await supabase
            .from('rentals')
            .delete()
            .eq('id', id);

        if (error) throw error;
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
