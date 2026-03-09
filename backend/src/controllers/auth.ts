import { Request, Response } from 'express';

export const registerUser = (req: Request, res: Response) => {
    res.status(200).json({
        message: 'User registered successfully'
    });
}

export const loginUser = (req: Request, res: Response) => {
    res.status(200).json({
        message: 'User logged in successfully'
    });
}

export const logoutUser = (req: Request, res: Response) => { 
    res.status(200).json({
        message: 'User logged out successfully'
    });
}