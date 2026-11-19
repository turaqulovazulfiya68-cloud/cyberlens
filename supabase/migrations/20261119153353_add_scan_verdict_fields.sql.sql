/*
# Add real file-scan verdict fields to scan_history

1. Modified Tables
- `scan_history`
  - ADD `file_hash` (text, nullable) — SHA-256 hash of the scanned file (not the file itself).
  - ADD `file_size` (bigint, nullable) — file size in bytes.
  - ADD `verdict` (text, nullable) — file scan verdict: SAFE / SUSPICIOUS / MALICIOUS / UNKNOWN.
  - ADD `confidence` (text, nullable) — detection confidence: past / orta / yuqori.
  - ADD `reasons` (jsonb, nullable) — list of scan reasons with weights (no file content).
  - ADD `privacy_risks` (int, not null, default 0) — number of personal-data findings.
  - ADD `av_status` (text, nullable) — antivirus engine status note (e.g. 'mavjud emas').

2. Security
- No policy changes: the table already has RLS enabled with anon + authenticated CRUD
  policies for this single-tenant, no-auth app.
- All changes are additive columns with safe defaults; no data is dropped or altered.
- Only metadata is ever stored (file name, hash, verdict). Original file contents are
  never uploaded or persisted, so no sensitive data lands in these new columns.
*/

ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS file_hash text;
ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS verdict text;
ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS confidence text;
ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS reasons jsonb;
ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS privacy_risks int NOT NULL DEFAULT 0;
ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS av_status text;
