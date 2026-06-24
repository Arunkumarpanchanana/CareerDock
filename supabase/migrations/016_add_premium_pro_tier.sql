-- Add premium_pro to the plan_tier check constraint
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_plan_tier_check;

ALTER TABLE profiles 
  ADD CONSTRAINT profiles_plan_tier_check 
  CHECK (plan_tier IN ('free', 'premium', 'premium_pro'));
