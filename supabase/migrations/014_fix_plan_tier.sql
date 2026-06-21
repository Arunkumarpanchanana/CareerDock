-- Ensure plan_tier column exists (if migration 006 was missed)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free';

-- Backfill any existing NULL plan_tier values
UPDATE profiles SET plan_tier = 'free' WHERE plan_tier IS NULL;

-- Update trigger function to explicitly set plan_tier = 'free' on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, plan_tier)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'free');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
