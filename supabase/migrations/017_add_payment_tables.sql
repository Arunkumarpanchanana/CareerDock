-- Payment gateway configs
CREATE TABLE payment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL CHECK (gateway IN ('instamojo', 'phonepe')),
  api_key TEXT NOT NULL DEFAULT '',
  api_secret TEXT NOT NULL DEFAULT '',
  merchant_id TEXT DEFAULT '',
  salt_key TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Plan prices (admin-configurable)
CREATE TABLE plan_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('premium', 'premium_pro')),
  monthly_price INTEGER NOT NULL,
  yearly_price INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default prices
INSERT INTO plan_prices (plan_tier, monthly_price, yearly_price) VALUES
  ('premium', 299, 3000),
  ('premium_pro', 500, 5500);

-- Coupon codes
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  min_cart_amount INTEGER,
  plan_tier TEXT CHECK (plan_tier IN ('premium', 'premium_pro') OR plan_tier IS NULL),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payment transactions log
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('premium', 'premium_pro')),
  billing TEXT NOT NULL CHECK (billing IN ('monthly', 'yearly')),
  original_amount INTEGER NOT NULL,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  final_amount INTEGER NOT NULL,
  coupon_code TEXT,
  gateway TEXT NOT NULL CHECK (gateway IN ('instamojo', 'phonepe')),
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Function to increment coupon usage (used by webhooks)
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code TEXT)
RETURNS void AS $$
BEGIN
  UPDATE coupons SET current_uses = current_uses + 1 WHERE code = coupon_code;
END;
$$ LANGUAGE plpgsql;
