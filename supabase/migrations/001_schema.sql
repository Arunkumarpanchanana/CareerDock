-- 1. USERS PROFILE TABLE (Extensions of Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role_title TEXT,
    location TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 2. RESUMES TABLE (Stores structural documents)
CREATE TABLE resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'My Resume' NOT NULL,
    summary TEXT,
    experience JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. JOB TRACKER TABLE
CREATE TABLE job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    salary_range TEXT,
    job_url TEXT,
    status TEXT CHECK (status IN ('Wishlist', 'Applied', 'Interviewing', 'Offered', 'Rejected')) DEFAULT 'Wishlist' NOT NULL,
    notes TEXT,
    applied_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. EXPERT PROFILE TABLE
CREATE TABLE expert_consultants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain_expertise TEXT NOT NULL,
    bio TEXT,
    scheduling_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_consultants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view own resumes"
    ON resumes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes"
    ON resumes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
    ON resumes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
    ON resumes FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own applications"
    ON job_applications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
    ON job_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
    ON job_applications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
    ON job_applications FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active experts"
    ON expert_consultants FOR SELECT
    USING (is_active = true);
