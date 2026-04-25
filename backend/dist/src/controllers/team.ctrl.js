import { fetchStaff, addMember, deleteMember } from '../services/team.serv.js';
export const getStaff = async (req, res, next) => {
    try {
        const { id } = req.user;
        const staff = await fetchStaff(id);
        res.status(200).json({
            message: "Success",
            staff: staff
        });
    }
    catch (error) {
        next(error);
    }
};
export const addStaff = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const { userId } = req.body;
        await addMember(teamId, userId);
        res.status(200).json({
            message: "Success"
        });
    }
    catch (error) {
        next(error);
    }
};
export const removeStaff = async (req, res, next) => {
    try {
        const { teamId, userId } = req.params;
        await deleteMember(teamId, userId);
        res.status(200).json({
            message: "Success"
        });
    }
    catch (error) {
        next(error);
    }
};
