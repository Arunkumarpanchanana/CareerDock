-- Allow users to insert their own profile row (needed for upsert on first save)
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
