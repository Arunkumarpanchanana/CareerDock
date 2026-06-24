-- Allow admins to view all profiles (needed for admin dashboard)
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Allow admins to update all profiles (needed for plan/role changes)
CREATE POLICY "Admins can update all profiles"
    ON profiles FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
