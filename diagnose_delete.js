import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afeyctnfdkfwkpesdrlx.supabase.co';
const supabaseAnonKey = 'sb_publishable_U5jOcHmjHqbq7hLeM0IMCA_G4ugt_zw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
    console.log('--- DELETION DIAGNOSIS START ---');
    
    // Try to delete a specific rental to see the EXACT Supabase error
    const rentalId = '1e443f2e-d2ab-4bf0-9389-9c280a8493b3'; // ID from previous logs
    console.log(`Attempting to delete rental: ${rentalId}`);

    const { error } = await supabase
        .from('rentals')
        .delete()
        .eq('id', rentalId);

    if (error) {
        console.error('SUPABASE DELETE ERROR:', error);
        console.log('Error Code:', error.code);
        console.log('Error Message:', error.message);
        console.log('Error Hint:', error.hint);
        console.log('Error Details:', error.details);
    } else {
        console.log('SUCCESS: Rental deleted successfully via direct script.');
    }

    console.log('--- DELETION DIAGNOSIS END ---');
    process.exit(0);
}

diagnose();
