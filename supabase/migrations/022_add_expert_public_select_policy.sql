-- Allow all authenticated users to view active expert consultants
CREATE POLICY "Anyone can view active experts"
    ON expert_consultants FOR SELECT
    USING (is_active = true);
