import { teamMembers } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { sql, and, eq } from "drizzle-orm";

export const fetchStaff = async (id: string) => {
  const result = await db.query.teams.findMany({
    where: {
      manager_id: id
    },
    orderBy: { name: "asc" },
    with: {
      members: {
        where: { NOT: { user_id: id } },
        columns: { role: true },
        orderBy: { role: "asc" },
        with: {
          user: {
            columns: {
              id: true,
              first: true,
              last: true
            }
          }
        }
      }
    }
  });

  return result;
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