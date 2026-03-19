import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afeyctnfdkfwkpesdrlx.supabase.co';
const supabaseAnonKey = 'sb_publishable_U5jOcHmjHqbq7hLeM0IMCA_G4ugt_zw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
    console.log('--- DIAGNOSIS START ---');
    const today = '2026-03-19';
    console.log('Target Date:', today);

    // 1. Get ALL vehicles
    const { data: vehicles, error: vErr } = await supabase.from('vehicles').select('*');
    if (vErr) return console.error('Error fetching vehicles:', vErr);
    
    console.log('\n--- ALL VEHICLES ---');
    console.log(JSON.stringify(vehicles, null, 2));

    // 2. Get ALL rentals
    console.log('\n--- ALL RENTALS ---');
    const { data: rentals, error: rErr } = await supabase
        .from('rentals')
        .select('*, customers(full_name), vehicles(model, license_plate)');
    
    if (rErr) return console.error('Error fetching rentals:', rErr);
    console.log(JSON.stringify(rentals, null, 2));

    console.log('\n--- DIAGNOSIS END ---');
    process.exit(0);
}

diagnose();
