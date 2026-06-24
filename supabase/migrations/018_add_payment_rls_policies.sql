-- RLS policies for payment tables
-- payment_configs: admin-only access
ALTER TABLE payment_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payment_configs"
  ON payment_configs FOR SELECT
  USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert payment_configs"
  ON payment_configs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update payment_configs"
  ON payment_configs FOR UPDATE
  USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

-- plan_prices: public read, admin write
ALTER TABLE plan_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan_prices"
  ON plan_prices FOR SELECT
  USING (true);

CREATE POLICY "Admins can update plan_prices"
  ON plan_prices FOR UPDATE
  USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

-- coupons: public read, admin write
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coupons"
  ON coupons FOR SELECT
  USING (true);

CREATE POLICY "Admins can update coupons"
  ON coupons FOR UPDATE
  USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert coupons"
  ON coupons FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

-- payment_transactions: users see own, admins see all
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON payment_transactions FOR SELECT
  USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Service role can insert transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update transactions"
  ON payment_transactions FOR UPDATE
  USING (true);
