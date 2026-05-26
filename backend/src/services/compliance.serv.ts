import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { userCredentials, credentialTypes, users, teamMembers, teamCredentials, teams } from '../db/schema/index.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const EXPIRING_WINDOW_DAYS = 30;

function daysUntilExpiry(expirationDate: Date | null, now: Date): number | null {
  if (!expirationDate) return null;
  return Math.ceil((expirationDate.getTime() - now.getTime()) / MS_PER_DAY);
}

export const getTeamCompliance = async (teamId: string, orgId: string) => {
  const [credTypes, members, [teamRow]] = await Promise.all([
    db
      .select({ id: credentialTypes.id, name: credentialTypes.name })
      .from(teamCredentials)
      .innerJoin(credentialTypes, eq(credentialTypes.id, teamCredentials.credential_id))
      .innerJoin(teams, and(eq(teams.id, teamCredentials.team_id), eq(teams.org_id, orgId)))
      .where(eq(teamCredentials.team_id, teamId)),

    db
      .select({ id: users.id, first_name: users.first, last_name: users.last })
      .from(teamMembers)
      .innerJoin(users, eq(users.id, teamMembers.user_id))
      .where(and(eq(teamMembers.team_id, teamId), eq(teamMembers.role, 'member'))),

    db
      .select({ name: teams.name })
      .from(teams)
      .where(and(eq(teams.id, teamId), eq(teams.org_id, orgId)))
      .limit(1),
  ]);

  const emptySummary = { total_members: members.length, fully_compliant: 0, has_gaps: 0, has_expiring: 0 };

  if (credTypes.length === 0 || members.length === 0) {
    return { team_id: teamId, team_name: teamRow?.name ?? '', summary: emptySummary, matrix: members.map(m => ({
      user: { id: m.id, first_name: m.first_name, last_name: m.last_name },
      credentials: [],
    })) };
  }

  const memberIds = members.map(m => m.id);
  const credTypeIds = credTypes.map(c => c.id);

  const userCreds = await db
    .select({
      user_id: userCredentials.user_id,
      credential_id: userCredentials.credential_id,
      status: userCredentials.status,
      expiration_date: userCredentials.expiration_date,
    })
    .from(userCredentials)
    .where(and(
      inArray(userCredentials.user_id, memberIds),
      inArray(userCredentials.credential_id, credTypeIds),
    ));

  const lookup = new Map<string, Map<string, typeof userCreds[number]>>();
  for (const uc of userCreds) {
    if (!lookup.has(uc.user_id)) lookup.set(uc.user_id, new Map());
    lookup.get(uc.user_id)!.set(uc.credential_id, uc);
  }

  const now = new Date();
  let fully_compliant = 0;
  let has_gaps = 0;
  let has_expiring = 0;

  const matrix = members.map(member => {
    let memberFullyCompliant = true;
    let memberHasGap = false;
    let memberHasExpiring = false;

    const credentials = credTypes.map(ct => {
      const uc = lookup.get(member.id)?.get(ct.id);
      const days = daysUntilExpiry(uc?.expiration_date ?? null, now);
      const isActive = uc?.status === 'active';
      const isExpiring = isActive && days !== null && days <= EXPIRING_WINDOW_DAYS;

      if (!isActive) { memberFullyCompliant = false; memberHasGap = true; }
      if (isExpiring) { memberFullyCompliant = false; memberHasExpiring = true; }

      return {
        credential_type: { id: ct.id, name: ct.name },
        status: uc?.status ?? null,
        expiration_date: uc?.expiration_date?.toISOString() ?? null,
        days_until_expiry: days,
      };
    });

    if (memberFullyCompliant) fully_compliant++;
    if (memberHasGap) has_gaps++;
    if (memberHasExpiring) has_expiring++;

    return {
      user: { id: member.id, first_name: member.first_name, last_name: member.last_name },
      credentials,
    };
  });

  return {
    team_id: teamId,
    team_name: teamRow?.name ?? '',
    summary: { total_members: members.length, fully_compliant, has_gaps, has_expiring },
    matrix,
  };
};

export const getOrgCompliance = async (orgId: string) => {
  const orgTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.org_id, orgId));

  if (orgTeams.length === 0) {
    return { org_id: orgId, teams: [] };
  }

  const teamIds = orgTeams.map(t => t.id);

  const [allTeamCreds, allMembers] = await Promise.all([
    db
      .select({ team_id: teamCredentials.team_id, credential_id: teamCredentials.credential_id })
      .from(teamCredentials)
      .where(inArray(teamCredentials.team_id, teamIds)),

    db
      .select({ user_id: teamMembers.user_id, team_id: teamMembers.team_id })
      .from(teamMembers)
      .where(and(inArray(teamMembers.team_id, teamIds), eq(teamMembers.role, 'member'))),
  ]);

  const memberIds = [...new Set(allMembers.map(m => m.user_id))];
  const credIds = [...new Set(allTeamCreds.map(tc => tc.credential_id))];

  const allUserCreds = memberIds.length > 0 && credIds.length > 0
    ? await db
        .select({
          user_id: userCredentials.user_id,
          credential_id: userCredentials.credential_id,
          status: userCredentials.status,
          expiration_date: userCredentials.expiration_date,
        })
        .from(userCredentials)
        .where(and(
          inArray(userCredentials.user_id, memberIds),
          inArray(userCredentials.credential_id, credIds),
        ))
    : [];

  // Build lookup: userId → credentialId → row
  const ucLookup = new Map<string, Map<string, typeof allUserCreds[number]>>();
  for (const uc of allUserCreds) {
    if (!ucLookup.has(uc.user_id)) ucLookup.set(uc.user_id, new Map());
    ucLookup.get(uc.user_id)!.set(uc.credential_id, uc);
  }

  const now = new Date();

  const result = orgTeams.map(team => {
    const required = allTeamCreds.filter(tc => tc.team_id === team.id);
    const members = allMembers.filter(m => m.team_id === team.id);

    const total = members.length * required.length;
    let activeCount = 0;
    let expiringSoon = 0;
    let nonCompliant = 0;

    for (const member of members) {
      let memberFullyCompliant = true;
      let memberHasExpiring = false;

      for (const req of required) {
        const uc = ucLookup.get(member.user_id)?.get(req.credential_id);
        const isActive = uc?.status === 'active';
        const days = daysUntilExpiry(uc?.expiration_date ?? null, now);
        const isExpiring = isActive && days !== null && days <= EXPIRING_WINDOW_DAYS;

        if (isActive) activeCount++;
        if (isExpiring) { memberHasExpiring = true; }
        if (!isActive || isExpiring) memberFullyCompliant = false;
      }

      if (!memberFullyCompliant) nonCompliant++;
      if (memberHasExpiring) expiringSoon++;
    }

    const compliance_rate = total > 0 ? activeCount / total : 1;

    return {
      team: { id: team.id, name: team.name },
      compliance_rate,
      expiring_soon: expiringSoon,
      non_compliant: nonCompliant,
    };
  });

  return { org_id: orgId, teams: result };
};
