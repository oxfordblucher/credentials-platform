import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from './schema/index.js';
import { encryptPW } from '../utils/encrypt.js';

const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL_DIRECT or DATABASE_URL must be set');
  process.exit(1);
}

const db = drizzle({ connection: url, schema, relations: schema.relations });

// Fixed UUIDs keep the seed deterministic and idempotent across runs
const IDS = {
  org:       'a1000000-0000-0000-0000-000000000001',
  owner:     'b1000000-0000-0000-0000-000000000001',
  admin:     'b1000000-0000-0000-0000-000000000002',
  marcus:    'b1000000-0000-0000-0000-000000000003',
  priya:     'b1000000-0000-0000-0000-000000000004',
  teamComp:  'c1000000-0000-0000-0000-000000000001',
  teamField: 'c1000000-0000-0000-0000-000000000002',
  credDL:    'd1000000-0000-0000-0000-000000000001',
  credFA:    'd1000000-0000-0000-0000-000000000002',
};

const SEED_PASSWORD = 'Seed@1234';

async function seed() {
  console.log('Seeding rejection reasons…');
  await db.insert(schema.rejectionReasons).values([
    { code: 'document_expired',      label: 'Document Expired' },
    { code: 'wrong_credential_type', label: 'Wrong Credential Type' },
    { code: 'illegible',             label: 'Illegible' },
    { code: 'metadata_incorrect',    label: 'Metadata Incorrect' },
    { code: 'other',                 label: 'Other' },
  ]).onConflictDoNothing();

  console.log('Seeding org…');
  // Insert without owner_id first (circular FK: org → user → org)
  await db.insert(schema.orgs).values({
    id: IDS.org,
    name: 'Hartwell Security Group',
    address: '100 Hartwell Ave, Boston, MA 02134',
  }).onConflictDoNothing();

  console.log('Seeding users…');
  const pw = await encryptPW(SEED_PASSWORD);
  await db.insert(schema.users).values([
    {
      id: IDS.owner,
      first: 'Owen', last: 'Hartwell',
      dob: new Date('1978-03-12'),
      email: 'owner@hartwell.dev',
      password: pw,
      org_id: IDS.org,
      org_role: 'owner' as const,
    },
    {
      id: IDS.admin,
      first: 'Ada', last: 'Chen',
      dob: new Date('1985-07-22'),
      email: 'admin@hartwell.dev',
      password: pw,
      org_id: IDS.org,
      org_role: 'admin' as const,
    },
    {
      id: IDS.marcus,
      first: 'Marcus', last: 'Webb',
      dob: new Date('1992-11-05'),
      email: 'marcus@hartwell.dev',
      password: pw,
      org_id: IDS.org,
    },
    {
      id: IDS.priya,
      first: 'Priya', last: 'Nair',
      dob: new Date('1995-02-18'),
      email: 'priya@hartwell.dev',
      password: pw,
      org_id: IDS.org,
    },
  ]).onConflictDoNothing();

  // Now that the owner user exists, set org.owner_id
  await db.update(schema.orgs)
    .set({ owner_id: IDS.owner })
    .where(eq(schema.orgs.id, IDS.org));

  console.log('Seeding teams…');
  await db.insert(schema.teams).values([
    {
      id: IDS.teamComp,
      org_id: IDS.org,
      manager_id: IDS.admin,
      name: 'Compliance',
      description: 'Manages credential compliance across the organization',
    },
    {
      id: IDS.teamField,
      org_id: IDS.org,
      manager_id: IDS.marcus,
      name: 'Field Ops',
      description: 'Field operations and on-site personnel',
    },
  ]).onConflictDoNothing();

  console.log('Seeding team members…');
  await db.insert(schema.teamMembers).values([
    { user_id: IDS.admin,  team_id: IDS.teamComp,  role: 'manager' },
    { user_id: IDS.marcus, team_id: IDS.teamComp,  role: 'member' },
    { user_id: IDS.priya,  team_id: IDS.teamComp,  role: 'member' },
    { user_id: IDS.marcus, team_id: IDS.teamField, role: 'manager' },
    { user_id: IDS.priya,  team_id: IDS.teamField, role: 'member' },
  ]).onConflictDoNothing();

  console.log('Seeding credential types…');
  await db.insert(schema.credentialTypes).values([
    {
      id: IDS.credDL,
      org_id: IDS.org,
      name: "Driver's License",
      description: "Valid government-issued driver's license",
      metadata_schema: {
        license_number: { type: 'string', required: true },
        state:          { type: 'string', required: true },
        expiry:         { type: 'date',   required: true },
      },
    },
    {
      id: IDS.credFA,
      org_id: IDS.org,
      name: 'First Aid Certificate',
      description: 'Current first aid and CPR certification',
      metadata_schema: {
        cert_number: { type: 'string', required: true },
        issuer:      { type: 'string', required: true },
        expiry:      { type: 'date',   required: true },
      },
    },
  ]).onConflictDoNothing();

  console.log('Seeding team credentials…');
  await db.insert(schema.teamCredentials).values([
    { team_id: IDS.teamComp,  credential_id: IDS.credDL },
    { team_id: IDS.teamComp,  credential_id: IDS.credFA },
    { team_id: IDS.teamField, credential_id: IDS.credDL },
  ]).onConflictDoNothing();

  const [expiredReason] = await db
    .select({ id: schema.rejectionReasons.id })
    .from(schema.rejectionReasons)
    .where(eq(schema.rejectionReasons.code, 'document_expired'))
    .limit(1);

  console.log('Seeding user credentials…');
  const now = new Date();
  await db.insert(schema.userCredentials).values([
    {
      user_id:            IDS.marcus,
      credential_id:      IDS.credDL,
      status:             'active',
      verifier_id:        IDS.admin,
      verified:           now,
      submitted_metadata: { license_number: 'DL-442891', state: 'MA', expiry: '2028-06-01' },
      verified_metadata:  { license_number: 'DL-442891', state: 'MA', expiry: '2028-06-01' },
      expiration_date:    new Date('2028-06-01'),
    },
    {
      user_id:            IDS.priya,
      credential_id:      IDS.credDL,
      status:             'pending',
      submitted_metadata: { license_number: 'DL-883204', state: 'MA', expiry: '2027-11-15' },
    },
    {
      user_id:             IDS.marcus,
      credential_id:       IDS.credFA,
      status:              'rejected',
      verifier_id:         IDS.admin,
      verified:            now,
      rejection_reason_id: expiredReason?.id,
      review_notes:        'Certificate expiry date has passed — please resubmit with a current cert.',
      submitted_metadata:  { cert_number: 'FA-2019-0042', issuer: 'Red Cross', expiry: '2023-03-01' },
    },
    {
      user_id:            IDS.priya,
      credential_id:      IDS.credFA,
      status:             'active',
      verifier_id:        IDS.admin,
      verified:           now,
      submitted_metadata: { cert_number: 'FA-2024-1187', issuer: 'Red Cross', expiry: '2026-08-01' },
      verified_metadata:  { cert_number: 'FA-2024-1187', issuer: 'Red Cross', expiry: '2026-08-01' },
      expiration_date:    new Date('2026-08-01'),
    },
  ]).onConflictDoNothing();

  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
