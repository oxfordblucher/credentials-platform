import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import fs from "fs";

const jwtSecret = fs.readFileSync(process.env.JWT_SECRET_FILE!, 'utf-8').trim();

export const authenticate = (req: Request, res: Response, next: NextFunction) => {

}