import { supabase } from '../lib/supabase';

export const customerService = {
    async getAll() {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('full_name');

        if (error) throw error;
        return data;
    },

    async create(customer) {
        const { data, error } = await supabase
            .from('customers')
            .insert([customer])
            .select();

        if (error) throw error;
        return data[0];
    },

    async search(query) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .ilike('full_name', `%${query}%`)
            .limit(5);

        if (error) throw error;
        return data;
    },

    async getByIdNumber(idNumber) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id_number', idNumber)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('customers')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async delete(id) {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getBlacklisted() {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('is_blacklisted', true)
            .order('blacklisted_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async blacklist(id, reason) {
        const { data, error } = await supabase
            .from('customers')
            .update({
                is_blacklisted: true,
                blacklist_reason: reason,
                blacklisted_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async unblacklist(id) {
        const { data, error } = await supabase
            .from('customers')
            .update({
                is_blacklisted: false,
                blacklist_reason: null,
                blacklisted_at: null
            })
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async uploadDocument(file) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('customer_documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('customer_documents')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (err) {
            console.error('Error uploading customer document:', err);
            throw new Error('Hubo un problema al subir la foto del documento. Verifica el formato e inténtalo de nuevo.');
        }
    }
};
