-- Fix RLS policies on payment tables that used auth.jwt() ->> 'role'
-- which checks the JWT's built-in role claim (always 'authenticated'),
-- not the application-level admin role in profiles.

-- Use the existing is_admin() security definer function (from 021)
-- which correctly checks profiles.role without RLS recursion.

-- payment_configs
DROP POLICY IF EXISTS "Admins can view payment_configs" ON payment_configs;
DROP POLICY IF EXISTS "Admins can insert payment_configs" ON payment_configs;
DROP POLICY IF EXISTS "Admins can update payment_configs" ON payment_configs;

CREATE POLICY "Admins can view payment_configs"
  ON payment_configs FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert payment_configs"
  ON payment_configs FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update payment_configs"
  ON payment_configs FOR UPDATE
  USING (is_admin());

-- plan_prices
DROP POLICY IF EXISTS "Admins can update plan_prices" ON plan_prices;

CREATE POLICY "Admins can update plan_prices"
  ON plan_prices FOR UPDATE
  USING (is_admin());

-- coupons
DROP POLICY IF EXISTS "Admins can update coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can insert coupons" ON coupons;

CREATE POLICY "Admins can update coupons"
  ON coupons FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can insert coupons"
  ON coupons FOR INSERT
  WITH CHECK (is_admin());

-- payment_transactions admin view
DROP POLICY IF EXISTS "Admins can view all transactions" ON payment_transactions;

CREATE POLICY "Admins can view all transactions"
  ON payment_transactions FOR SELECT
  USING (is_admin());
