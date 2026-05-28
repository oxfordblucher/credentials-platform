# Schema Notes

## credential_audit_log — APPEND ONLY
No UPDATE or DELETE statements may ever be issued against this table in application code.
This is enforced by convention and code review, not a DB constraint.
Every credential status transition writes one row. The table is the authoritative audit trail.

## org_role convention
`users.org_role` is nullable.
- `null`    → regular team member, no org-level privilege
- `'admin'` → org-wide admin (create teams, define credential types, view all compliance)
- `'owner'` → org superadmin; exactly one per org at any time

## upload_tokens
Short-lived (15-minute TTL) single-use tokens that gate the confirm-upload step.
One active token per user at a time. Expired tokens are safe to purge periodically.
