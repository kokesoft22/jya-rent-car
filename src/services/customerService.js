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

    async delete(id) {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
