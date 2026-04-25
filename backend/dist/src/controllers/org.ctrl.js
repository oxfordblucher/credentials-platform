import { newTeamSchema, setupSchema } from '../utils/zod.js';
import { createOrg, fetchTeams, createTeam, deleteTeam } from '../services/org.serv.js';
export const setupOrg = async (req, res, next) => {
    try {
        const validated = setupSchema.parse(req.body);
        await createOrg(validated);
        res.status(201).json({
            message: 'Organization registered successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
export const getTeams = async (req, res, next) => {
    try {
        const { orgId } = req.user;
        const teams = await fetchTeams(orgId);
        res.status(200).json({
            message: "Teams fetched successfully",
            teams: teams
        });
    }
    catch (error) {
        next(error);
    }
};
export const makeTeam = async (req, res, next) => {
    try {
        const { orgId } = req.user;
        const validated = newTeamSchema.parse(req.body);
        const team = await createTeam({
            org_id: orgId,
            name: validated.name,
            description: validated.description
        });
        res.status(200).json({
            message: "Team created successfully",
            team: team
        });
    }
    catch (error) {
        next(error);
    }
};
export const removeTeam = async (req, res, next) => {
    try {
        const teamId = req.params.teamId;
        const deletedTeam = await deleteTeam(teamId);
        res.status(200).json({
            message: "Success",
            deleted: deletedTeam
        });
    }
    catch (error) {
        next(error);
    }
};
