import { orgs, teamMembers, teams } from "../db/schema/index.js";
import { db } from "../db/index.js";
import { createUser } from "./auth.serv.js";
import { eq } from "drizzle-orm";
export const createOrg = async (input) => {
    const result = db.transaction(async (tx) => {
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
            org_id: org.id,
            org_role: 'admin'
        }, tx);
        const update = await tx.update(orgs).set({ admin_id: user.id }).where(eq(orgs.id, org.id)).returning({
            orgId: orgs.id,
            admin: orgs.admin_id
        });
        return update;
    });
};
export const fetchTeams = async (id) => {
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
            members: {
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
};
export const createTeam = async (team) => {
    const [result] = await db.insert(teams).values(team).returning();
    return result;
};
export const deleteTeam = async (id) => {
    await db.transaction(async (tx) => {
        const deleted = await tx.update(teams).set({
            deleted: new Date()
        }).where(eq(teams.id, id)).returning({
            teamId: teams.id
        });
        await tx.delete(teamMembers).where(eq(teamMembers.team_id, id));
        return deleted.length > 0;
    });
};
