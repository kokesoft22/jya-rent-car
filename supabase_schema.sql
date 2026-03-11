-- Vehicles Table
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    license_plate TEXT UNIQUE NOT NULL,
    daily_rate DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Customers Table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    id_number TEXT UNIQUE NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Rentals Table
CREATE TABLE public.rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    deposit DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Expenses Table
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for all tables
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Important: maintenance_logs might already exist in the DB but not in this file
-- We try to enable it just in case
DO $$ 
BEGIN
    ALTER TABLE IF EXISTS public.maintenance_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Policies (Maintaining functionality without full Auth)
-- Vehicles
DROP POLICY IF EXISTS "Public Read Access" ON public.vehicles;
DROP POLICY IF EXISTS "Public Write Access" ON public.vehicles;
CREATE POLICY "Public Read Access" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Public Write Access" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

-- Customers
DROP POLICY IF EXISTS "Public Read Access" ON public.customers;
DROP POLICY IF EXISTS "Public Write Access" ON public.customers;
CREATE POLICY "Public Read Access" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Public Write Access" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- Rentals
DROP POLICY IF EXISTS "Public Read Access" ON public.rentals;
DROP POLICY IF EXISTS "Public Write Access" ON public.rentals;
CREATE POLICY "Public Read Access" ON public.rentals FOR SELECT USING (true);
CREATE POLICY "Public Write Access" ON public.rentals FOR ALL USING (true) WITH CHECK (true);

-- Expenses
DROP POLICY IF EXISTS "Public Read Access" ON public.expenses;
DROP POLICY IF EXISTS "Public Write Access" ON public.expenses;
CREATE POLICY "Public Read Access" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Public Write Access" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- Maintenance Logs
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Read Access" ON public.maintenance_logs;
    DROP POLICY IF EXISTS "Public Write Access" ON public.maintenance_logs;
    CREATE POLICY "Public Read Access" ON public.maintenance_logs FOR SELECT USING (true);
    CREATE POLICY "Public Write Access" ON public.maintenance_logs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;
