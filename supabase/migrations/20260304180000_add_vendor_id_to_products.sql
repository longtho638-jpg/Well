-- Add vendor_id column to products table
-- This enables vendor-specific product management and data isolation

ALTER TABLE products ADD COLUMN vendor_id UUID;

-- Add foreign key constraint to link to users table
ALTER TABLE products ADD CONSTRAINT fk_products_vendor_id
  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create index on vendor_id for performance
CREATE INDEX idx_products_vendor_id ON products(vendor_id);

-- Update RLS policies to allow vendors to access their own products
-- Drop existing public read policy
DROP POLICY IF EXISTS "Public products read" ON products;

-- Create new policies for different user types
-- Policy for vendors to manage their own products
CREATE POLICY "Vendors can manage own products"
  ON products FOR ALL
  USING (
    (auth.uid() = vendor_id)
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'vendor'
    ))
  )
  WITH CHECK (
    (auth.uid() = vendor_id)
    OR (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'vendor'
    ))
  );

-- Policy for anonymous and authenticated users to read public products
CREATE POLICY "All users can read all products"
  ON products FOR SELECT
  TO authenticated, anon
  USING (true);

-- Optional: Add default vendor_id to existing products where it makes sense
-- UPDATE products SET vendor_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1) WHERE vendor_id IS NULL;