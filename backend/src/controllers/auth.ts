import { Request, Response } from 'express';
import { users } from '../db/users.js';
import { RegisterUser, LoginUser } from '../types/types.js';
import { createUser } from '../services/user.js';
import jwt from 'jsonwebtoken';
import { z } from "zod";

const registerSchema = z.object({
  first: z.string().min(1),
  last: z.string().min(1),
  dob: z.preprocess((val) => new Date(val as string), z.date()),
  email: z.email(),
  password: z.string().min(8),
  role: z.string().regex(/^(admin|manager|team member)$/)
});

export const registerUser = async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);

    const created = await createUser(validated);
  }
  catch (error) {
    res.status(500).json({
      message: 'Error registering user'
    });
  }
}

export const loginUser = (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const loginInput: LoginUser = {
      email,
      password
    };

    res.status(200).json({
      message: 'User logged in successfully'
    });
  }
  catch (error) {

  }
}

export const logoutUser = (req: Request, res: Response) => {
  res.status(200).json({
    message: 'User logged out successfully'
  });
}