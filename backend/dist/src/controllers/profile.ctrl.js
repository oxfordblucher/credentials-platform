import { fetchProfile, updateEmail, updateName, updatePassword } from '../services/user.serv.js';
export const getProfile = async (req, res, next) => {
    try {
        const id = req.params.id ?? req.user.id;
        const profile = await fetchProfile(id);
        res.status(200).json({
            profile: profile
        });
    }
    catch (error) {
        next(error);
    }
};
export const editEmail = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { email } = req.body;
        const newEmail = await updateEmail(id, email);
        res.status(200).json({
            message: "Email changed successfully",
            email: newEmail
        });
    }
    catch (error) {
        next(error);
    }
};
export const editName = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { first, last } = req.body;
        const newName = await updateName(id, { first: first, last: last });
        res.status(200).json({
            message: "Name changed successfully",
            first: newName.first,
            last: newName.last
        });
    }
    catch (error) {
        next(error);
    }
};
export const editPassword = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { password, newPass } = req.body;
        await updatePassword(id, password, newPass);
        res.status(200).json({
            message: "Success"
        });
    }
    catch (error) {
        next(error);
    }
};
