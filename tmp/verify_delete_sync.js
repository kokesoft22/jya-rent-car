import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    console.log("Running Sync Deletion Verification Test...");
    const { data: vehicle, error: vError } = await supabase.from('vehicles').select('*').limit(1).single();
    if (vError || !vehicle) {
        console.error("No vehicles found for testing", vError);
        return;
    }

    const testDesc = "Reparacion de Prueba Deleteme";
    const testAmount = 1;
    const testDate = new Date().toISOString().split('T')[0];

    console.log(`1. Creating maintenance log for ${vehicle.make} ${vehicle.model}...`);
    const { data: log, error: logError } = await supabase.from('maintenance_logs').insert([{
        vehicle_id: vehicle.id,
        date: testDate,
        description: testDesc,
        cost: testAmount,
        type: 'correctiva',
        status: 'completado'
    }]).select().single();

    if (logError) {
        console.error("Log error", logError);
        return;
    }

    console.log(`2. Creating expense with NEW format...`);
    const modelStr = `${vehicle.make} ${vehicle.model} ${vehicle.year || ''}`.trim();
    const expenseDesc = `Mantenimiento: ${testDesc} (${modelStr})`;
    
    // Check if expense already exists with same desc (to avoid duplicates interfering)
    await supabase.from('expenses').delete().eq('description', expenseDesc);

    const { data: expense, error: expError } = await supabase.from('expenses').insert([{
        vehicle_id: vehicle.id,
        amount: testAmount,
        expense_date: testDate,
        description: expenseDesc,
        category: 'maintenance'
    }]).select().single();

    if (expError) {
        console.error("Exp error", expError);
        // cleanup log
        await supabase.from('maintenance_logs').delete().eq('id', log.id);
        return;
    }

    console.log(`3. Deleting expense ${expense.id} (Refactored logic simulation)...`);
    
    // THE LOGIC WE REFACTORED:
    let originalDesc = expense.description;
    originalDesc = originalDesc.replace(/^Mantenimiento:\s*/i, '');
    if (originalDesc.includes(' - ')) {
        originalDesc = originalDesc.split(' - ').slice(1).join(' - ');
    }
    if (originalDesc.includes(' (')) {
        const parts = originalDesc.split(' (');
        if (parts.length > 1) {
            originalDesc = parts[0].trim();
        }
    }
    console.log(`   - Extracted clean desc: "${originalDesc}"`);

    // Perform deletion
    // Simulating expenseService.delete:
    const { error: deleteExpError } = await supabase.from('expenses').delete().eq('id', expense.id);
    if (deleteExpError) {
        console.error("Error deleting expense", deleteExpError);
    }
    
    const { data: deletedLogs, error: deleteLogError } = await supabase
        .from('maintenance_logs')
        .delete()
        .eq('vehicle_id', expense.vehicle_id)
        .eq('date', expense.expense_date)
        .eq('cost', expense.amount)
        .or(`description.ilike.%${originalDesc}%, description.ilike.%${expense.description}%`)
        .select();

    if (deleteLogError) {
        console.error("Error during log deletion", deleteLogError);
    } else {
        console.log(`   - Deleted matches: ${deletedLogs?.length || 0}`);
    }

    // FINAL VERIFICATION
    const { data: checkLog } = await supabase.from('maintenance_logs').select('*').eq('id', log.id);
    if (!checkLog || checkLog.length === 0) {
        console.log("✅ SYNC SUCCESS: Maintenance log was automatically deleted.");
    } else {
        console.log("❌ SYNC FAILED: Maintenance log still exists.");
        // cleanup
        await supabase.from('maintenance_logs').delete().eq('id', log.id);
    }
}

test();
