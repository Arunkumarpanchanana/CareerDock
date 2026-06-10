ALTER TABLE resumes
  ADD COLUMN projects JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN certificates JSONB DEFAULT '[]'::jsonb;
