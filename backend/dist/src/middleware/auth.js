import { verifyAccess } from '../utils/token.js';
import { AppError, PermissionError, AuthError } from '../errors/AppError.js';
import { db } from '../db/index.js';
import { teams, teamMembers } from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
export const authenticate = (req, res, next) => {
    try {
        const authHead = req.headers.authorization;
        if (authHead && authHead.startsWith('Bearer ')) {
            const token = authHead.split(' ')[1];
            const decoded = verifyAccess(token);
            req.user = decoded;
            next();
        }
        else {
            return next(new AuthError());
        }
    }
    catch (error) {
        next(new AuthError());
    }
};
export const authorize = async (req, res, next) => {
    try {
        const { id, orgId, orgRole } = req.user;
        const teamId = req.params.teamId ?? req.body.teamId;
        if (!teamId) {
            return orgRole ? next() : next(new PermissionError);
        }
        const [access] = await db.select({
            teamId: teams.id,
            role: teamMembers.role,
        }).from(teams)
            .leftJoin(teamMembers, and(eq(teamMembers.team_id, teams.id), eq(teamMembers.user_id, id)))
            .where(and(eq(teams.org_id, orgId), eq(teams.id, teamId))).limit(1);
        if (!access) {
            return next(new AppError(403, "Team not found"));
        }
        if (orgRole || access.role === 'manager') {
            return next();
        }
        return next(new PermissionError);
    }
    catch (error) {
        next(new AppError(403, "Forbidden"));
    }
};
export const requireAdmin = async (req, res, next) => {
    try {
        const { orgRole } = req.user;
        if (!orgRole)
            return next(new PermissionError);
        return next();
    }
    catch (error) {
        next(new PermissionError);
    }
};
