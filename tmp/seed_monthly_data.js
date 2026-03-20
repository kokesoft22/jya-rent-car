import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afeyctnfdkfwkpesdrlx.supabase.co';
const supabaseAnonKey = 'sb_publishable_U5jOcHmjHqbq7hLeM0IMCA_G4ugt_zw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedData() {
    // 0. Authenticate
    console.log('Autenticando...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'cjtaveras22@gmail.com',
        password: '@Coqueto2288*'
    });
    if (authError) {
        console.error('Error de autenticación:', authError.message);
        return;
    }
    console.log('✅ Autenticado como:', authData.user.email);

    // 1. Get existing vehicles and customers
    const { data: vehicles } = await supabase.from('vehicles').select('id, model');
    const { data: customers } = await supabase.from('customers').select('id, full_name');

    console.log('Vehículos encontrados:', vehicles?.map(v => v.model));
    console.log('Clientes encontrados:', customers?.map(c => c.full_name));

    if (!vehicles?.length || !customers?.length) {
        console.error('No hay vehículos o clientes en la BD.');
        return;
    }

    const v1 = vehicles[0].id;
    const v2 = vehicles[1]?.id || v1;
    const v3 = vehicles[2]?.id || v1;
    const c1 = customers[0].id;
    const c2 = customers[1]?.id || c1;

    // 2. Insert sample rentals for Nov, Dec, Jan, Feb
    const rentalData = [
        // Noviembre 2025
        { vehicle_id: v1, customer_id: c1, start_date: '2025-11-05T10:00:00Z', end_date: '2025-11-12T10:00:00Z', total_amount: 980, amount_paid: 980, deposit: 200, status: 'completed' },
        { vehicle_id: v2, customer_id: c2, start_date: '2025-11-15T10:00:00Z', end_date: '2025-11-22T10:00:00Z', total_amount: 750, amount_paid: 750, deposit: 150, status: 'completed' },
        // Diciembre 2025
        { vehicle_id: v1, customer_id: c2, start_date: '2025-12-01T10:00:00Z', end_date: '2025-12-10T10:00:00Z', total_amount: 1200, amount_paid: 1200, deposit: 250, status: 'completed' },
        { vehicle_id: v3, customer_id: c1, start_date: '2025-12-15T10:00:00Z', end_date: '2025-12-28T10:00:00Z', total_amount: 1400, amount_paid: 1400, deposit: 300, status: 'completed' },
        // Enero 2026
        { vehicle_id: v2, customer_id: c1, start_date: '2026-01-05T10:00:00Z', end_date: '2026-01-15T10:00:00Z', total_amount: 1100, amount_paid: 1100, deposit: 200, status: 'completed' },
        { vehicle_id: v1, customer_id: c2, start_date: '2026-01-18T10:00:00Z', end_date: '2026-01-25T10:00:00Z', total_amount: 850, amount_paid: 850, deposit: 150, status: 'completed' },
        // Febrero 2026
        { vehicle_id: v3, customer_id: c1, start_date: '2026-02-03T10:00:00Z', end_date: '2026-02-14T10:00:00Z', total_amount: 1350, amount_paid: 1350, deposit: 250, status: 'completed' },
        { vehicle_id: v2, customer_id: c2, start_date: '2026-02-16T10:00:00Z', end_date: '2026-02-23T10:00:00Z', total_amount: 900, amount_paid: 900, deposit: 200, status: 'completed' },
    ];

    console.log('\nInsertando rentas de prueba...');
    const { data: insertedRentals, error: rentalError } = await supabase.from('rentals').insert(rentalData).select();
    if (rentalError) {
        console.error('Error insertando rentas:', rentalError);
    } else {
        console.log(`✅ ${insertedRentals.length} rentas insertadas.`);
    }

    // 3. Insert sample expenses for Nov, Dec, Jan, Feb
    const expenseData = [
        // Noviembre 2025
        { description: 'Cambio de aceite', amount: 120, category: 'maintenance', expense_date: '2025-11-08', vehicle_id: v1 },
        { description: 'Gasolina mensual', amount: 180, category: 'fuel', expense_date: '2025-11-15', vehicle_id: v2 },
        { description: 'Lavado exterior', amount: 45, category: 'cleaning', expense_date: '2025-11-20', vehicle_id: v1 },
        // Diciembre 2025
        { description: 'Cambio de frenos', amount: 350, category: 'maintenance', expense_date: '2025-12-05', vehicle_id: v3 },
        { description: 'Seguro mensual', amount: 200, category: 'insurance', expense_date: '2025-12-10', vehicle_id: v1 },
        { description: 'Gasolina mensual', amount: 220, category: 'fuel', expense_date: '2025-12-18', vehicle_id: v2 },
        // Enero 2026
        { description: 'Alineacion y balanceo', amount: 150, category: 'maintenance', expense_date: '2026-01-10', vehicle_id: v2 },
        { description: 'Gasolina mensual', amount: 195, category: 'fuel', expense_date: '2026-01-15', vehicle_id: v1 },
        { description: 'Lavado completo', amount: 60, category: 'cleaning', expense_date: '2026-01-22', vehicle_id: v3 },
        // Febrero 2026
        { description: 'Cambio de llantas', amount: 480, category: 'maintenance', expense_date: '2026-02-05', vehicle_id: v3 },
        { description: 'Seguro mensual', amount: 200, category: 'insurance', expense_date: '2026-02-12', vehicle_id: v1 },
        { description: 'Gasolina mensual', amount: 175, category: 'fuel', expense_date: '2026-02-20', vehicle_id: v2 },
    ];

    console.log('\nInsertando gastos de prueba...');
    const { data: insertedExpenses, error: expenseError } = await supabase.from('expenses').insert(expenseData).select();
    if (expenseError) {
        console.error('Error insertando gastos:', expenseError);
    } else {
        console.log(`✅ ${insertedExpenses.length} gastos insertados.`);
    }

    console.log('\n🎉 Seed completado. Recarga la página de Finanzas para ver la gráfica actualizada.');
}

seedData().catch(console.error);
