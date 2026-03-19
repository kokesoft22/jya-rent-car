import { supabase } from '../lib/supabase';

export const expenseService = {
    async getAll() {
        const { data, error } = await supabase
            .from('expenses')
            .select('*, vehicles(model)')
            .order('expense_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async create(expense) {
        const { data, error } = await supabase
            .from('expenses')
            .insert([expense])
            .select();

        if (error) throw error;
        return data[0];
    },

    async getSummary() {
        const { data: expenses } = await supabase.from('expenses').select('amount');
        const { data: rentals } = await supabase.from('rentals').select('total_amount, amount_paid');

        const totalExpenses = (expenses || []).reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

        // Income is the sum of all actual payments received
        const totalIncome = (rentals || []).reduce((acc, curr) => acc + parseFloat(curr.amount_paid || 0), 0);

        // Pending payments is the sum of all remaining balances
        const pendingPayments = (rentals || []).reduce((acc, curr) => {
            const total = parseFloat(curr.total_amount || 0);
            const paid = parseFloat(curr.amount_paid || 0);
            const balance = Math.max(0, total - paid);
            return acc + balance;
        }, 0);

        return {
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
            pendingPayments
        };
    },

    // Get monthly data for charts (last 6 months)
    async getMonthlyData() {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const { data: rentals } = await supabase
            .from('rentals')
            .select('amount_paid, start_date, status')
            .gte('start_date', sixMonthsAgo.toISOString());

        const { data: expenses } = await supabase
            .from('expenses')
            .select('amount, expense_date, category')
            .gte('expense_date', sixMonthsAgo.toISOString());

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthlyData = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = d.getMonth();
            const year = d.getFullYear();

            const monthIncome = (rentals || [])
                .filter(r => {
                    const rd = new Date(r.start_date);
                    return rd.getMonth() === month && rd.getFullYear() === year;
                })
                .reduce((acc, curr) => acc + parseFloat(curr.amount_paid || 0), 0);

            const monthExpenses = (expenses || [])
                .filter(e => {
                    const ed = new Date(e.expense_date);
                    return ed.getMonth() === month && ed.getFullYear() === year;
                })
                .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

            monthlyData.push({
                month: monthNames[month],
                income: monthIncome,
                expenses: monthExpenses
            });
        }

        return monthlyData;
    },

    // Get expenses grouped by category
    async getCategoryBreakdown() {
        const { data: expenses } = await supabase
            .from('expenses')
            .select('amount, category');

        const categories = {};
        (expenses || []).forEach(e => {
            const cat = e.category || 'Sin Categoría';
            categories[cat] = (categories[cat] || 0) + parseFloat(e.amount);
        });

        return Object.entries(categories).map(([name, value]) => ({ name, value }));
    },

    // Calculate profitability per vehicle
    async getVehicleProfitability() {
        const { data: vehicles } = await supabase.from('vehicles').select('id, model, license_plate');
        const { data: rentals } = await supabase.from('rentals').select('vehicle_id, amount_paid');
        const { data: expenses } = await supabase.from('expenses').select('vehicle_id, amount');

        const profitability = (vehicles || []).map(v => {
            const vIncome = (rentals || []).filter(r => r.vehicle_id === v.id).reduce((sum, r) => sum + parseFloat(r.amount_paid || 0), 0);
            const vExpenses = (expenses || []).filter(e => e.vehicle_id === v.id).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
            return {
                id: v.id,
                model: v.model,
                license_plate: v.license_plate,
                income: vIncome,
                expenses: vExpenses,
                netProfit: vIncome - vExpenses
            };
        });

        return profitability.sort((a, b) => b.netProfit - a.netProfit);
    },

    async delete(id) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
