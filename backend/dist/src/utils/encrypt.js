import bcrypt from 'bcrypt';
export const encryptPW = async (password) => {
    return await bcrypt.hash(password, 10);
};
export const verifyPW = async (input, hashed) => {
    return bcrypt.compare(input, hashed);
};
