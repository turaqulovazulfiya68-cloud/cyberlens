/*
# Create scan_history table for CyberLens (single-tenant, no auth)

1. New Tables
- `scan_history`
  - `id` (uuid, primary key)
  - `file_name` (text, not null) — name of the scanned file
  - `file_type` (text, not null) — detected file type (rasm/pdf/hujjat)
  - `risk_score` (int, not null) — risk score before protection (0-100)
  - `risk_level` (text, not null) — risk level before protection
  - `protected_risk_score` (int, not null) — risk score after protection (0-100)
  - `protected_risk_level` (text, not null) — risk level after protection
  - `findings_count` (int, not null) — total findings detected
  - `protected_findings_count` (int, not null) — number of findings protected
  - `status` (text, not null) — scan status (tekshirilgan/himoyalangan/qayta-tekshirilgan)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `scan_history`.
- Allow anon + authenticated CRUD because this is a single-tenant prototype with no sign-in.
*/

CREATE TABLE IF NOT EXISTS scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_type text NOT NULL,
  risk_score int NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'past',
  protected_risk_score int NOT NULL DEFAULT 0,
  protected_risk_level text NOT NULL DEFAULT 'past',
  findings_count int NOT NULL DEFAULT 0,
  protected_findings_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'tekshirilgan',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_scan_history" ON scan_history;
CREATE POLICY "anon_select_scan_history" ON scan_history FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_scan_history" ON scan_history;
CREATE POLICY "anon_insert_scan_history" ON scan_history FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_scan_history" ON scan_history;
CREATE POLICY "anon_update_scan_history" ON scan_history FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_scan_history" ON scan_history;
CREATE POLICY "anon_delete_scan_history" ON scan_history FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON scan_history (created_at DESC);
