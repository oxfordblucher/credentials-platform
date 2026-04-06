import bcrypt from 'bcrypt';

export const encryptPW = async (password: string) => {
  return await bcrypt.hash(password, 10);
}

export const verifyPW = async (input: string, hashed: string) => {
  return bcrypt.compare(input, hashed);
}