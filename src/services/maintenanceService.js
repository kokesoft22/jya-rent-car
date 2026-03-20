import { supabase } from '../lib/supabase';

export const maintenanceService = {
    async getByVehicle(vehicleId) {
        const { data, error } = await supabase
            .from('maintenance_logs')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    async create(log, skipExpense = false) {
        // 1. Create maintenance log
        // Note: We use the provided category if it exists, otherwise default to maintenance
        const logData = { ...log };
        const { data, error } = await supabase
            .from('maintenance_logs')
            .insert([logData])
            .select();

        if (error) throw error;

        // 2. Update vehicle's last maintenance date and mileage if needed
        await this.updateVehicleFromLog(log);

        // 3. If cost > 0 and not skipping, create an expense record
        if (!skipExpense && parseFloat(log.cost) > 0) {
            const { data: vehicle } = await supabase
                .from('vehicles')
                .select('model')
                .eq('id', log.vehicle_id)
                .single();

            const expense = {
                expense_date: log.date,
                category: log.category || 'maintenance',
                description: `Mantenimiento: ${vehicle?.model || 'Vehículo'} - ${log.description}`,
                amount: log.cost,
                vehicle_id: log.vehicle_id
            };

            await supabase.from('expenses').insert([expense]);
        }

        return data[0];
    },

    async updateVehicleFromLog(log) {
        const desc = log.description.toLowerCase();
        const oilKeywords = ['aceite', 'aseite', 'haceite', 'oil', 'aserte', 'aselte'];
        const isOilChange = oilKeywords.some(keyword => desc.includes(keyword)) || log.category === 'aceite';

        const { data: vehicleData } = await supabase
            .from('vehicles')
            .select('mileage, last_maintenance')
            .eq('id', log.vehicle_id)
            .single();

        if (!vehicleData) return;

        const updates = {};
        if (isOilChange) {
            updates.last_maintenance = log.date;
        }

        if (log.mileage_at_service && (!vehicleData.mileage || parseFloat(log.mileage_at_service) > parseFloat(vehicleData.mileage))) {
            updates.mileage = log.mileage_at_service;
        }

        if (Object.keys(updates).length > 0) {
            await supabase
                .from('vehicles')
                .update(updates)
                .eq('id', log.vehicle_id);
        }
    },
    async createFromExpense(expense) {
        const log = {
            vehicle_id: expense.vehicle_id,
            description: expense.description.replace(/^Mantenimiento:\s*/i, '').replace(/^[^\-]*\-\s*/i, '').trim() || expense.description,
            cost: expense.amount,
            date: expense.expense_date,
            category: expense.category
        };
        return this.create(log, true);
    },

    async update(id, updates) {
        // Find existing to know if we need to update expense
        const { data: existing, error: fetchError } = await supabase
            .from('maintenance_logs')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // 1. Update maintenance log
        const { data, error } = await supabase
            .from('maintenance_logs')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;

        // 2. Adjust vehicle's last maintenance date and mileage if needed
        const newDesc = (updates.description || existing.description).toLowerCase();
        const oilKeywords = ['aceite', 'aseite', 'haceite', 'oil', 'aserte', 'aselte'];
        const isOilChange = oilKeywords.some(keyword => newDesc.includes(keyword));

        const { data: vehicleData } = await supabase
            .from('vehicles')
            .select('mileage, last_maintenance')
            .eq('id', existing.vehicle_id)
            .single();

        const vUpdates = {};
        if (isOilChange && updates.date) {
            vUpdates.last_maintenance = updates.date;
        }

        const newMileage = updates.mileage_at_service || existing.mileage_at_service;
        if (newMileage && (!vehicleData.mileage || newMileage > vehicleData.mileage)) {
            vUpdates.mileage = newMileage;
        }

        if (Object.keys(vUpdates).length > 0) {
            await supabase
                .from('vehicles')
                .update(vUpdates)
                .eq('id', existing.vehicle_id);
        }

        // 3. Adjust expense if cost or date changed
        if (existing.cost > 0 || parseFloat(updates.cost) > 0) {
            const { data: vehicle } = await supabase
                .from('vehicles')
                .select('model')
                .eq('id', existing.vehicle_id)
                .single();

            const oldDesc = `Mantenimiento: ${vehicle?.model || 'Vehículo'} - ${existing.description}`;
            const newDesc = `Mantenimiento: ${vehicle?.model || 'Vehículo'} - ${updates.description || existing.description}`;

            // Easiest way is to try deleting the old expense and recreating it
            if (existing.cost > 0) {
                await supabase
                    .from('expenses')
                    .delete()
                    .eq('vehicle_id', existing.vehicle_id)
                    .eq('amount', existing.cost)
                    .eq('expense_date', existing.date)
                    .eq('description', oldDesc);
            }

            if (parseFloat(updates.cost) > 0) {
                const expense = {
                    expense_date: updates.date || existing.date,
                    category: 'maintenance',
                    description: newDesc,
                    amount: updates.cost,
                    vehicle_id: existing.vehicle_id
                };
                await supabase.from('expenses').insert([expense]);
            }
        }

        return data ? data[0] : null;
    },

    async delete(id) {
        // 1. Get the log details before deleting to find the associated expense
        const { data: log, error: fetchError } = await supabase
            .from('maintenance_logs')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // 2. Delete the maintenance log
        const { error: deleteError } = await supabase
            .from('maintenance_logs')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        // 3. Delete the associated expense if it exists
        if (log && log.cost > 0) {
            // Search by vehicle_id, amount, date and category instead of exact description match
            // This is more robust in case the vehicle model name changes
            const { error: expError } = await supabase
                .from('expenses')
                .delete()
                .eq('vehicle_id', log.vehicle_id)
                .eq('amount', log.cost)
                .eq('expense_date', log.date)
                .eq('category', 'maintenance')
                .ilike('description', `%${log.description}%`);

            if (expError) console.error('Could not delete associated expense:', expError);
        }
    }
};
