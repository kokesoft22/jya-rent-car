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

async function checkData() {
    let out = '';
    const log = (msg) => {
        console.log(msg);
        out += msg + '\n';
    };

    try {
        log('Starting check data...');
        const {data: vehicles, error: vErr} = await supabase.from('vehicles').select('id, model');
        if (vErr) log('Error vehicles: ' + JSON.stringify(vErr));

        const {data: expenses, error: eErr} = await supabase.from('expenses').select('id, vehicle_id, amount, description');
        if (eErr) log('Error expenses: ' + JSON.stringify(eErr));

        const {data: logs, error: lErr} = await supabase.from('maintenance_logs').select('id, vehicle_id, cost, description');
        if (lErr) log('Error logs: ' + JSON.stringify(lErr));

        log(`Vehicles count: ${vehicles?.length}`);
        log(`Expenses count: ${expenses?.length}`);
        log(`Logs count: ${logs?.length}`);

        for (const v of (vehicles || [])) {
            const vexp = (expenses || []).filter(e => e.vehicle_id === v.id);
            const vlog = (logs || []).filter(l => l.vehicle_id === v.id);
            const vexpSum = vexp.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
            const vlogSum = vlog.reduce((acc, curr) => acc + parseFloat(curr.cost || 0), 0);
            
            if (vexpSum !== vlogSum || v.model.includes('Civic') || v.model.includes('Y20')) {
                log(`--- ${v.model} (ID: ${v.id}) ---`);
                log(`Expenses Sum: $${vexpSum} (${vexp.length} records)`);
                if (vexp.length > 0) {
                    log('Expenses: ' + JSON.stringify(vexp.map(e => `[${e.id}] $${e.amount} - ${e.description.substring(0, 30)}...`)));
                }
                log(`Logs Sum: $${vlogSum} (${vlog.length} records)`);
            }
        }
        fs.writeFileSync('tmp/check_result.txt', out);
    } catch (e) {
        fs.writeFileSync('tmp/check_result.txt', out + '\nERROR: ' + e.message);
    }
}

checkData();
