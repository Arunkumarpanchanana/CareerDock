ALTER TABLE profiles ADD COLUMN plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'premium')) NOT NULL;
