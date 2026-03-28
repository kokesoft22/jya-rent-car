const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '..', '.env');
const env = fs.readFileSync(envPath, 'utf-8');
const url = env.match(/VITE_SUPABASE_URL\s*=\s*(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/)[1].trim();

const supabase = createClient(url, key);

async function repairSync() {
    console.log('--- Iniciando reparación de sincronización ---');

    // 0. Authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'yoelperez1998@gmail.com',
        password: '123456'
    });

    if (authError) {
        console.error('Error de autenticación:', authError.message);
        process.exit(1);
    }

    console.log('Autenticado como:', authData.user.email);

    // 1. Get all maintenance logs with cost > 0
    const { data: logs, error: logsError } = await supabase
        .from('maintenance_logs')
        .select('*');

    if (logsError) {
        console.error('Error fetching logs:', logsError);
        process.exit(1);
    }

    // 2. Get ALL expenses (not just maintenance category, since category might differ)
    const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*');

    if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        process.exit(1);
    }

    console.log(`Encontrados ${logs.length} registros de mantenimiento.`);
    console.log(`Encontrados ${expenses.length} gastos totales.`);

    // 3. Identify maintenance logs that have no matching expense
    const missingLogs = logs.filter(log => {
        if (parseFloat(log.cost || 0) <= 0) return false;

        // Check if any expense matches by vehicle_id + date + amount
        const exists = expenses.some(exp =>
            exp.vehicle_id === log.vehicle_id &&
            exp.expense_date === log.date &&
            Math.abs(parseFloat(exp.amount) - parseFloat(log.cost)) < 0.01
        );

        return !exists;
    });

    console.log(`Detectados ${missingLogs.length} mantenimientos sin registro en gastos.`);

    if (missingLogs.length === 0) {
        console.log('✅ Todo está sincronizado correctamente.');
        process.exit(0);
    }

    // 4. Create missing expenses
    for (const log of missingLogs) {
        console.log(`Reparando: ${log.description} (${log.date}) $${log.cost}`);

        // Get vehicle model for description
        const { data: vehicle } = await supabase
            .from('vehicles')
            .select('model')
            .eq('id', log.vehicle_id)
            .single();

        const expense = {
            expense_date: log.date,
            category: log.category || 'maintenance',
            description: `Mantenimiento: ${log.description} (${vehicle?.model || 'Vehículo'})`,
            amount: parseFloat(log.cost),
            vehicle_id: log.vehicle_id
        };

        console.log('  Insertando:', JSON.stringify(expense));

        const { data: inserted, error: insError } = await supabase
            .from('expenses')
            .insert([expense])
            .select();

        if (insError) {
            console.error(`  ❌ Error insertando gasto para log ${log.id}:`, JSON.stringify(insError));
        } else {
            console.log(`  ✅ Sincronizado: ${log.description} -> expense id: ${inserted?.[0]?.id}`);
        }
    }

    console.log('--- Reparación finalizada ---');
    process.exit(0);
}

// Add timeout to prevent hanging
setTimeout(() => {
    console.error('TIMEOUT: Script took too long, exiting.');
    process.exit(1);
}, 30000);

repairSync();
