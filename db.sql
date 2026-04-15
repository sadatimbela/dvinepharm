-- SQL Script for PharmERP Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    barcode TEXT UNIQUE,
    description TEXT,
    category TEXT DEFAULT 'General',
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inventory Table (handles multiple batches for the same product)
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number TEXT,
    stock_qty INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sales Table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID, -- usually references auth.users(id)
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Sale Items Table
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Procurement Table
CREATE TABLE procurement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_name TEXT NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'pending', -- pending, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Procurement Items Table
CREATE TABLE procurement_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    procurement_id UUID NOT NULL REFERENCES procurement(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a generic trigger to auto-update 'updated_at'
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_timestamp BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER update_inventory_timestamp BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- VIEWS FOR DASHBOARD & REPORTS

-- View: Daily Sales Summary
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
    DATE(created_at) AS sale_date,
    COUNT(id) AS total_transactions,
    SUM(total_amount) AS total_revenue
FROM sales
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- View: Top Products View
CREATE OR REPLACE VIEW top_products_view AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.category,
    SUM(si.quantity) AS total_quantity_sold,
    SUM(si.subtotal) AS total_revenue
FROM sale_items si
JOIN products p ON p.id = si.product_id
GROUP BY p.id, p.name, p.category
ORDER BY total_revenue DESC;

-- OPTIONAL: Sample data loading script
-- Uncomment if you want to insert dummy data automatically.
/*
INSERT INTO products (name, barcode, category, base_price) VALUES 
('Paracetamol 500mg', '1234567890123', 'Analgesics', 2000),
('Amoxicillin 250mg', '1234567890124', 'Antibiotics', 5000),
('Vitamin C', '1234567890125', 'Supplements', 3500);

-- Note: In a real system, you'll need the generated UUIDs to link inventory and sales.
*/
