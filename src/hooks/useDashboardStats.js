import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getLocalTodayDate } from '../utils/dateUtils';

export const useDashboardStats = () => {
    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const now = new Date();
            const todayStr = getLocalTodayDate();

            // 1. Parallel basic stats
            const [
                { count: activeCount },
                { data: fleetData },
                { data: rentalsFinance },
                { data: thisMonthRentals },
                { data: lastMonthRentals }
            ] = await Promise.all([
                supabase.from('rentals').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('vehicles').select('id, status'),
                supabase.from('rentals').select('total_amount, amount_paid').neq('status', 'cancelled'),
                supabase.from('rentals').select('total_amount').gte('start_date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
                supabase.from('rentals').select('total_amount').gte('start_date', new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()).lt('start_date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
            ]);

            // Process Fleet
            const fleetTotal = fleetData?.length || 0;
            const maintenanceDue = fleetData?.filter(v => v.status === 'maintenance').length || 0;

            // Rented/Available check
            const { data: currentRentals } = await supabase
                .from('rentals')
                .select('vehicle_id')
                .eq('status', 'active')
                .lte('start_date', todayStr)
                .gte('end_date', todayStr);
            
            const currentlyRentedIds = new Set((currentRentals || []).map(r => r.vehicle_id));
            const fleetAvailable = fleetData?.filter(v => v.status !== 'maintenance' && !currentlyRentedIds.has(v.id)).length || 0;
            const activeRentals = currentlyRentedIds.size;

            // Financials
            const totalEarnings = (rentalsFinance || []).reduce((acc, curr) => acc + parseFloat(curr.amount_paid || 0), 0);
            const totalExpected = (rentalsFinance || []).reduce((acc, curr) => acc + parseFloat(curr.total_amount || 0), 0);
            const accountsReceivable = totalExpected - totalEarnings;
            const avgIncomePerVehicle = fleetTotal > 0 ? totalEarnings / fleetTotal : 0;

            // Trend
            const thisMonthTotal = (thisMonthRentals || []).reduce((acc, c) => acc + parseFloat(c.total_amount), 0);
            const lastMonthTotal = (lastMonthRentals || []).reduce((acc, c) => acc + parseFloat(c.total_amount), 0);
            let trend = '';
            if (lastMonthTotal > 0) {
                const pct = Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);
                trend = `${pct >= 0 ? '+' : ''}${pct}% vs mes pasado`;
            } else if (thisMonthTotal > 0) {
                trend = '+100% este mes';
            }

            // 2. Fetch Chart Data (last 6 months)
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            const { data: chartRentals } = await supabase
                .from('rentals')
                .select('total_amount, start_date')
                .gte('start_date', sixMonthsAgo.toISOString());

            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const chartData = [];
            // Mock data for presentation: November, December, January, February
            const mockData = {
                10: 850,   // Nov
                11: 1420,  // Dic
                0: 2150,   // Ene
                1: 1150    // Feb (dipped down)
            };
            
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const m = d.getMonth();
                const y = d.getFullYear();
                let income = (chartRentals || [])
                    .filter(r => {
                        const rd = new Date(r.start_date);
                        return rd.getMonth() === m && rd.getFullYear() === y;
                    })
                    .reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);
                
                // Add mock data if this month has no real income
                if (income === 0 && mockData[m]) {
                    income = mockData[m];
                }
                
                chartData.push({ name: monthNames[m], income });
            }

            // 3. Vehicle Ranking
            const { data: rankingRentals } = await supabase.from('rentals').select('total_amount, vehicles(model)');
            const vehicleMap = {};
            (rankingRentals || []).forEach(r => {
                const model = r.vehicles?.model || 'Desconocido';
                vehicleMap[model] = (vehicleMap[model] || 0) + parseFloat(r.total_amount);
            });
            const vehicleStats = Object.entries(vehicleMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 6);

            // 4. Recent Rentals
            const { data: recentRentals } = await supabase
                .from('rentals')
                .select('*, vehicles(model, image_url), customers(full_name)')
                .order('created_at', { ascending: false })
                .limit(5);

            // 5. Maintenance
            const { data: maintenanceVehicles } = await supabase.from('vehicles').select('*').eq('status', 'maintenance');

            // 6. Returning Soon
            const { data: returningSoon } = await supabase
                .from('rentals')
                .select('*, vehicles(model, image_url), customers(full_name)')
                .eq('status', 'active')
                .lte('start_date', todayStr)
                .gte('end_date', todayStr)
                .order('end_date', { ascending: true })
                .limit(4);

            return {
                stats: {
                    totalEarnings,
                    avgIncomePerVehicle,
                    accountsReceivable,
                    activeRentals,
                    fleetTotal,
                    fleetAvailable,
                    maintenanceDue,
                    trend
                },
                chartData,
                vehicleStats,
                recentRentals: recentRentals || [],
                maintenanceVehicles: maintenanceVehicles || [],
                returningSoon: returningSoon || []
            };
        },
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });
};
