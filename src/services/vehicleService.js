import { supabase } from '../lib/supabase';

export const vehicleService = {
    async getAll() {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(vehicle) {
        const { data, error } = await supabase
            .from('vehicles')
            .insert([vehicle])
            .select();

        if (error) throw error;
        return data[0];
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('vehicles')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async delete(id) {
        // 1. Check for active rentals before deleting
        const { data: activeRentals, error: checkError } = await supabase
            .from('rentals')
            .select('id')
            .eq('vehicle_id', id)
            .eq('status', 'active');

        if (checkError) throw checkError;

        if (activeRentals && activeRentals.length > 0) {
            throw new Error('No se puede eliminar un vehículo que tiene rentas activas.');
        }

        // 2. Proceed with deletion
        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async uploadImage(file) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('vehicles')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('vehicles')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (err) {
            console.error('Error uploading image:', err);
            throw new Error('Hubo un problema al subir la imagen. Verifica el tamaño y formato.');
        }
    }
};
