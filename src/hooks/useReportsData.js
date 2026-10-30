import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// 1. Efectividad de Cobros (Facturado vs Cobrado)
export const useCollectionEfficiency = () => {
    return useQuery({
        queryKey: ['report-collection-efficiency'],
        queryFn: async () => {
            const now = new Date();
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            
            const { data: rentals, error } = await supabase
                .from('rentals')
                .select('start_date, total_amount, amount_paid')
                .gte('start_date', sixMonthsAgo.toISOString())
                .neq('status', 'cancelled');
                
            if (error) throw error;
            
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const monthlyData = [];

            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const month = d.getMonth();
                const year = d.getFullYear();

                const filteredRentals = (rentals || []).filter(r => {
                    const rd = new Date(r.start_date);
                    return rd.getMonth() === month && rd.getFullYear() === year;
                });

                const totalBilled = filteredRentals.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);
                const totalCollected = filteredRentals.reduce((sum, r) => sum + parseFloat(r.amount_paid || 0), 0);

                let efficiency = 0;
                if (totalBilled > 0) {
                    efficiency = Math.round((totalCollected / totalBilled) * 100);
                }

                monthlyData.push({
                    month: monthNames[month],
                    facturado: totalBilled,
                    cobrado: totalCollected,
                    efectividad: efficiency
                });
            }
            return monthlyData;
        }
    });
};

// 2. Cuentas por Cobrar
export const useAccountsReceivable = () => {
    return useQuery({
        queryKey: ['report-accounts-receivable'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('rentals')
                .select(`
                    id, start_date, end_date, total_amount, amount_paid, status,
                    customers (id, full_name, phone, id_number),
                    vehicles (id, model, license_plate)
                `)
                .neq('status', 'cancelled');
                
            if (error) throw error;
            
            // Filter where total_amount > amount_paid
            const pending = (data || []).filter(r => {
                const total = parseFloat(r.total_amount || 0);
                const paid = parseFloat(r.amount_paid || 0);
                return total > paid;
            });
            
            // Sort by largest debt
            return pending.sort((a, b) => {
                const debtA = parseFloat(a.total_amount || 0) - parseFloat(a.amount_paid || 0);
                const debtB = parseFloat(b.total_amount || 0) - parseFloat(b.amount_paid || 0);
                return debtB - debtA;
            });
        }
    });
};

// 3. Tasa de Ocupación de Vehículos (Parametrizado por Mes)
export const useFleetUtilization = (date = new Date()) => {
    return useQuery({
        queryKey: ['report-fleet-utilization', date.getFullYear(), date.getMonth()],
        queryFn: async () => {
            const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            const daysInMonth = lastDayOfMonth.getDate();
            
            const { data: vehicles, error: vError } = await supabase.from('vehicles').select('id, model');
            if (vError) throw vError;
            
            const { data: rentals, error: rError } = await supabase
                .from('rentals')
                .select('vehicle_id, start_date, end_date')
                .neq('status', 'cancelled')
                .lte('start_date', lastDayOfMonth.toISOString())
                .gte('end_date', firstDayOfMonth.toISOString());
                
            if (rError) throw rError;
            
            const utilizationData = (vehicles || []).map(v => {
                const vRentals = (rentals || []).filter(r => r.vehicle_id === v.id);
                let rentedDays = 0;
                
                vRentals.forEach(r => {
                    const rStart = new Date(r.start_date);
                    const rEnd = new Date(r.end_date);
                    
                    const start = new Date(Math.max(rStart, firstDayOfMonth));
                    const end = new Date(Math.min(rEnd, lastDayOfMonth));
                    
                    // Asegurar que no contemos días negativos y sumar 1 para inclusividad
                    const diffTime = end.getTime() - start.getTime();
                    if (diffTime >= 0) {
                        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        rentedDays += days;
                    }
                });
                
                rentedDays = Math.min(rentedDays, daysInMonth);
                const rate = Math.round((rentedDays / daysInMonth) * 100);
                
                return {
                    vehicle: v.model,
                    rentedDays,
                    availableDays: daysInMonth - rentedDays,
                    rate
                };
            });
            
            return utilizationData.sort((a, b) => b.rate - a.rate);
        }
    });
};

// 4. Proyección de Ingresos Futuros
export const useFutureRevenue = () => {
    return useQuery({
        queryKey: ['report-future-revenue'],
        queryFn: async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Get rentals where start_date is >= today
            const { data, error } = await supabase
                .from('rentals')
                .select('id, start_date, end_date, total_amount, amount_paid, vehicles(model)')
                .gte('start_date', today.toISOString())
                .neq('status', 'cancelled');
                
            if (error) throw error;
            
            const totalProjected = (data || []).reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);
            const totalAlreadyPaid = (data || []).reduce((sum, r) => sum + parseFloat(r.amount_paid || 0), 0);
            const pendingToCollect = totalProjected - totalAlreadyPaid;
            
            const upcomingRentals = [...(data || [])].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
            
            return {
                totalProjected,
                totalAlreadyPaid,
                pendingToCollect,
                upcomingRentals
            };
        }
    });
};
