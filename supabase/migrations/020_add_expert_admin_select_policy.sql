-- Allow admins to view all expert consultants (including inactive)
CREATE POLICY "Admins can view all expert consultants"
    ON expert_consultants FOR SELECT
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
