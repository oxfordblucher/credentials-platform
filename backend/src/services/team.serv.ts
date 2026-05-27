import { teamMembers, teams, users } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { sql, and, eq, inArray } from "drizzle-orm";
import { OrgRole } from "../types/types.js";

export const fetchTeamMembers = async (userId: string, orgId: string, orgRole: OrgRole) => {
  const fields = {
    userId: teamMembers.user_id,
    teamId: teamMembers.team_id,
    role: teamMembers.role,
    first: users.first,
    last: users.last,
    teamName: teams.name,
  };

  if (orgRole === 'admin' || orgRole === 'owner') {
    return db.select(fields)
      .from(teamMembers)
      .innerJoin(teams, and(eq(teams.id, teamMembers.team_id), eq(teams.org_id, orgId)))
      .innerJoin(users, eq(users.id, teamMembers.user_id));
  }

  return db.select(fields)
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.team_id))
    .innerJoin(users, eq(users.id, teamMembers.user_id))
    .where(
      inArray(
        teamMembers.team_id,
        db.select({ id: teamMembers.team_id }).from(teamMembers).where(eq(teamMembers.user_id, userId)),
      ),
    );
}

export const addMember = async (team: string, user: string) => {
  const [result] = await db.insert(teamMembers).values({
    team_id: team,
    user_id: user,
    role: 'member',
    joined: sql`NOW()`
  }).returning();

  return result ?? null;
}

export const deleteMember = async (team: string, user: string) => {
  const [result] = await db.delete(teamMembers).where(and(
    eq(teamMembers.team_id, team),
    eq(teamMembers.user_id, user)
  )).returning({ deleted: teamMembers.user_id });

  return result ?? null;
}