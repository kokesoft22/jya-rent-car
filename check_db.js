import { supabase } from './src/lib/supabase.js';

async function checkData() {
    try {
        console.log('--- Maintenance Logs ---');
        const { data: logs, error: logsError } = await supabase
            .from('maintenance_logs')
            .select('*')
            .limit(10);
        if (logsError) throw logsError;
        console.log(JSON.stringify(logs, null, 2));

        console.log('--- Expenses with vehicle_id ---');
        const { data: expenses, error: expError } = await supabase
            .from('expenses')
            .select('*')
            .not('vehicle_id', 'is', null)
            .limit(10);
        if (expError) throw expError;
        console.log(JSON.stringify(expenses, null, 2));
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkData();
