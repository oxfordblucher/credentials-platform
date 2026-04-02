import { db } from "../db/index.js";
import { teamMembers, teams, orgs, users } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { ProfileRow } from "../types/types.js";

export const fetchProfile = async (userId: string) => {
  const rows: ProfileRow[] = await db.select({
    id: users.id,
    first: users.first,
    last: users.last,
    dob: users.dob,
    email: users.email,
    role: teamMembers.role,
    org: orgs.name,
    isAdmin: users.is_admin,
    team: teams.name
  }).from(users)
  .innerJoin(orgs, eq(users.org_id, orgs.id))
  .leftJoin(teamMembers, eq(users.id, teamMembers.user_id))
  .leftJoin(teams, eq(teamMembers.team_id, teams.id))
  .where(eq(users.id, userId));

  if (rows.length === 0) return null;

  const userTeams = rows
    .flatMap(r => r.team && r.role
      ? [{name: r.team, role: r.role}] : []
    );

  const result = {
    first: rows[0].first,
    last: rows[0].last,
    dob: rows[0].dob,
    email: rows[0].email,
    org: rows[0].org,
    isAdmin: rows[0].isAdmin,
    teams: userTeams
  };

  return result;
}

export const editProfile = async (userId: string, field: string, input: string) => {
  
}