import { teams, users, teamMembers } from "../db/schema/index.js";
import { db } from "../db/index.js";

export const fetchStaff = async (id: string) => {
  const result = await db.query.teams.findMany({
    where: {
      manager_id: id
    },
    orderBy: { name: "asc" },
    with: {
      teamMembers: {
        where: { not: { user_id: id } },
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