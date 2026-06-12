ALTER TABLE profiles ADD COLUMN persona TEXT NOT NULL DEFAULT 'professional'
  CHECK (persona IN ('fresher', 'professional', 'executive'));
