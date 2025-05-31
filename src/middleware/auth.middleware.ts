import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { ApiError } from '../utils/api-error';

interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret'
    ) as { userId: string };

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new ApiError('User not found', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const checkOwnership = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { createdBy } = req.body;
    if (createdBy.toString() !== req.user._id.toString()) {
      throw new ApiError('Not authorized to perform this action', 403);
    }
    next();
  } catch (error) {
    next(error);
  }
}; 