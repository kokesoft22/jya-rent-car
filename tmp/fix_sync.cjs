const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const envStr = envFile.split('\n');
const envVars = {};
for (const line of envStr) {
    if (line.includes('=')) {
        const [k, v] = line.split('=');
        envVars[k.trim()] = v.trim();
    }
}

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSync() {
    console.log('--- Iniciando Sincronización de Gastos ---');
    try {
        // Sign in to bypass RLS for this script (using admin/user credentials if possible)
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: 'Yoelperez1998@gmail.com',
            password: '123456',
        });
        if (authErr) throw authErr;

        // 1. Fetch data
        const {data: vehicles} = await supabase.from('vehicles').select('id, model');
        const {data: logs} = await supabase.from('maintenance_logs').select('*');
        const {data: expenses} = await supabase.from('expenses').select('*');

        console.log(`Vehículos: ${vehicles.length}, Logs: ${logs.length}, Gastos: ${expenses.length}`);

        const vehicleMap = {};
        vehicles.forEach(v => vehicleMap[v.id] = v.model);

        let createdCount = 0;

        for (const log of logs) {
            // Check if this log has a corresponding expense
            // Matching by vehicle_id, amount (cost), date and ilike description
            const exists = expenses.find(e => 
                e.vehicle_id === log.vehicle_id && 
                parseFloat(e.amount) === parseFloat(log.cost) && 
                e.expense_date === log.date
            );

            if (!exists && log.cost > 0) {
                console.log(`FALTA: Gasto para ${vehicleMap[log.vehicle_id]} [$${log.cost}] - ${log.description}`);
                
                const model = vehicleMap[log.vehicle_id] || 'Vehículo';
                const newExpense = {
                    expense_date: log.date,
                    category: log.category || 'maintenance',
                    description: `Mantenimiento: ${model} - ${log.description}`,
                    amount: log.cost,
                    vehicle_id: log.vehicle_id
                };

                const { error: insErr } = await supabase.from('expenses').insert([newExpense]);
                if (insErr) console.error('Error insertando:', insErr);
                else createdCount++;
            }
        }

        console.log(`--- Sincronización Finalizada ---`);
        console.log(`Gastos creados: ${createdCount}`);

        // 2. Identify "Ghost" expenses (in expenses table but not in logs)
        console.log('\n--- Análisis de Gastos sin Log (Posibles errores) ---');
        for (const exp of expenses) {
            if (exp.vehicle_id) {
                const hasLog = logs.find(l => 
                    l.vehicle_id === exp.vehicle_id && 
                    parseFloat(l.cost) === parseFloat(exp.amount) && 
                    l.date === exp.expense_date
                );
                
                if (!hasLog) {
                    console.log(`AVISO: Gasto en Finanzas sin registro en Vehículo: ${vehicleMap[exp.vehicle_id]} [$${exp.amount}] - ${exp.description}`);
                }
            }
        }

    } catch (e) {
        console.error('Error fatal:', e.message);
    }
}

fixSync();
