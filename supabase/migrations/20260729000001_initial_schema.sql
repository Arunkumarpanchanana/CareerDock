CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    excerpt TEXT,
    image_url TEXT,
    published BOOLEAN DEFAULT false,
    author_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE plan_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'premium_pro')),
    price DECIMAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_prices ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Anyone can read published articles"
    ON articles FOR SELECT
    USING (published = true);

CREATE POLICY "Admins can read all articles"
    ON articles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert articles"
    ON articles FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update articles"
    ON articles FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete articles"
    ON articles FOR DELETE
    USING (public.is_admin());

CREATE POLICY "Anyone can view active plan prices"
    ON plan_prices FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage plan prices"
    ON plan_prices FOR ALL
    USING (public.is_admin());

INSERT INTO plan_prices (tier, price, currency, interval, features) VALUES
    ('free', 0, 'USD', 'month', '["AI Resume Builder", "Basic Templates", "Job Tracker"]'),
    ('premium', 19.99, 'USD', 'month', '["AI Resume Builder", "Premium Templates", "Job Tracker", "ATS Optimization", "Cover Letter Generator"]'),
    ('premium_pro', 49.99, 'USD', 'month', '["AI Resume Builder", "Premium Templates", "Job Tracker", "ATS Optimization", "Cover Letter Generator", "Expert Consultation", "Priority Support"]');
