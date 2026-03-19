-- secure_supabase_schema.sql
-- Este script reemplaza las políticas de acceso público (inseguras) por políticas
-- que exigen que el usuario haya iniciado sesión (authenticated) en su aplicación.

-- 1. Asegurar que RLS esté activo en todas las tablas
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    ALTER TABLE IF EXISTS public.maintenance_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- 2. Eliminar las políticas públicas en caso de que existan
DROP POLICY IF EXISTS "Public Read Access" ON public.vehicles;
DROP POLICY IF EXISTS "Public Write Access" ON public.vehicles;

DROP POLICY IF EXISTS "Public Read Access" ON public.customers;
DROP POLICY IF EXISTS "Public Write Access" ON public.customers;

DROP POLICY IF EXISTS "Public Read Access" ON public.rentals;
DROP POLICY IF EXISTS "Public Write Access" ON public.rentals;

DROP POLICY IF EXISTS "Public Read Access" ON public.expenses;
DROP POLICY IF EXISTS "Public Write Access" ON public.expenses;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Read Access" ON public.maintenance_logs;
    DROP POLICY IF EXISTS "Public Write Access" ON public.maintenance_logs;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- 3. Crear las nuevas políticas protegidas (Solo usuarios autenticados)
-- Vehicles
CREATE POLICY "Authenticated Read Access" ON public.vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Write Access" ON public.vehicles FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Customers
CREATE POLICY "Authenticated Read Access" ON public.customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Write Access" ON public.customers FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Rentals
CREATE POLICY "Authenticated Read Access" ON public.rentals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Write Access" ON public.rentals FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Expenses
CREATE POLICY "Authenticated Read Access" ON public.expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Write Access" ON public.expenses FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Maintenance Logs
DO $$ 
BEGIN
    CREATE POLICY "Authenticated Read Access" ON public.maintenance_logs FOR SELECT USING (auth.role() = 'authenticated');
    CREATE POLICY "Authenticated Write Access" ON public.maintenance_logs FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;
