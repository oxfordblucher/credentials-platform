import { NewTeam, orgs, teamMembers, teams, users } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { SetupInput } from "../utils/zod.js";
import { Transaction } from "../types/types.js";
import { AppError } from "../errors/AppError.js";
import { createUser } from "./auth.serv.js";
import { eq } from "drizzle-orm";

export const createOrg = async (input: SetupInput) => {
  const result = db.transaction(async (tx: Transaction) => {
    const [org] = await tx.insert(orgs).values({
      name: input.orgName,
      address: input.orgAddress,
    }).returning({ id: orgs.id });

    const user = await createUser({
      first: input.first,
      last: input.last,
      dob: input.dob,
      email: input.email,
      password: input.password,
      orgId: org.id,
      is_admin: true
    }, tx);

    await tx.update(orgs).set({ admin_id: user.id }).where(eq(orgs.id, org.id));
  });

  if (!result.rowCount) throw new AppError(404, "Setup unsuccessful");
}

export const fetchTeams = async (id: string) => {
  const result = await db.query.teams.findMany({
    where: {
      org_id: id
    },
    orderBy: { name: "asc" },
    columns: {
      id: true,
      name: true
    },
    with: {
      teamMembers: {
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

export const createTeam = async (team: NewTeam) => {
  const result = await db.insert(teams).values(team);

  if (!result.rowCount) throw new AppError(404, "Team not created");
}

export const deleteTeam = async (id: string) => {
  const result = await db.transaction(async (tx: Transaction) => {
    await tx.update(teams).set({ deleted: new Date() }).where(eq(teams.id, id));
    await tx.delete(teamMembers).where(eq(teamMembers.team_id, id));
  });

  if (!result.rowCount) throw new AppError(404, "Team not found");
}