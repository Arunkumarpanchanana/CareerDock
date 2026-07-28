-- Enable Row Level Security on referrals table (was missing from 007_referrals.sql)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer or referee)
CREATE POLICY "Users can view own referrals"
    ON referrals FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Users can insert referrals where they are the referrer
CREATE POLICY "Users can insert own referrals"
    ON referrals FOR INSERT
    WITH CHECK (auth.uid() = referrer_id);

-- Admins can view all referrals
CREATE POLICY "Admins can view all referrals"
    ON referrals FOR SELECT
    USING (is_admin());

-- Admins can update any referral
CREATE POLICY "Admins can update all referrals"
    ON referrals FOR UPDATE
    USING (is_admin());
