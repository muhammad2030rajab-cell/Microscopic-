ALTER TABLE patients
ADD COLUMN IF NOT EXISTS drive_file_id TEXT;

CREATE INDEX IF NOT EXISTS patients_drive_file_id_idx
ON patients(drive_file_id);
