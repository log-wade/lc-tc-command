-- Rename the existing default organization to match the current market center.
UPDATE organizations
SET
  name = 'Keller Williams Southwest',
  slug = 'kw-southwest'
WHERE id = 'a0000000-0000-4000-8000-000000000001';
