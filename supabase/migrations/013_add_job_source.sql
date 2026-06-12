ALTER TABLE job_applications
ADD COLUMN adzuna_id TEXT,
ADD COLUMN source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'adzuna'));

CREATE UNIQUE INDEX idx_job_applications_adzuna_id ON job_applications(adzuna_id) WHERE adzuna_id IS NOT NULL;
