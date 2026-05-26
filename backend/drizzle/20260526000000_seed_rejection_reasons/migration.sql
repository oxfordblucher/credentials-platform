-- Seed standard rejection reasons.
-- WHERE NOT EXISTS makes this safe to re-run if the migration tracker is bypassed.
INSERT INTO rejection_reasons (id, code, label)
SELECT gen_random_uuid(), seeds.code, seeds.label
FROM (VALUES
  ('document_expired',      'Document Expired'),
  ('wrong_credential_type', 'Wrong Credential Type'),
  ('illegible',             'Illegible'),
  ('metadata_incorrect',    'Metadata Incorrect'),
  ('other',                 'Other')
) AS seeds(code, label)
WHERE NOT EXISTS (
  SELECT 1 FROM rejection_reasons WHERE rejection_reasons.code = seeds.code
);
