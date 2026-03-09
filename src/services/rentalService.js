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

    async create(rental) {
        // 1. Create the rental record
        const { data, error: rentalError } = await supabase
            .from('rentals')
            .insert([rental])
            .select();

        if (rentalError) throw rentalError;

        // 2. Update vehicle status to 'rented'
        const { error: vehicleError } = await supabase
            .from('vehicles')
            .update({ status: 'rented' })
            .eq('id', rental.vehicle_id);

        if (vehicleError) throw vehicleError;

        return data[0];
    },

    async complete(id, vehicleId) {
        // 1. Update rental status
        const { error: rentalError } = await supabase
            .from('rentals')
            .update({ status: 'completed' })
            .eq('id', id);

        if (rentalError) throw rentalError;

        // 2. Update vehicle status back to 'available'
        const { error: vehicleError } = await supabase
            .from('vehicles')
            .update({ status: 'available' })
            .eq('id', vehicleId);

        if (vehicleError) throw vehicleError;
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
