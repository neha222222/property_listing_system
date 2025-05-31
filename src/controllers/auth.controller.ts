import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { ApiError } from '../utils/api-error';
import { redisService } from '../services/redis.service';

interface AuthRequest extends Request {
  user?: any;
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.badRequest('Email already registered');
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Cache user data
    await redisService.set(
      `user:${user._id}`,
      JSON.stringify({
        id: user._id,
        email: user.email,
        name: user.name,
      }),
      3600 // Cache for 1 hour
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Cache user data
    await redisService.set(
      `user:${user._id}`,
      JSON.stringify({
        id: user._id,
        email: user.email,
        name: user.name,
      }),
      3600 // Cache for 1 hour
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Try to get user from cache first
    const cachedUser = await redisService.get(`user:${req.user._id}`);
    if (cachedUser) {
      return res.json({
        success: true,
        data: {
          user: JSON.parse(cachedUser),
        },
      });
    }

    // If not in cache, get from database
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Cache user data
    await redisService.set(
      `user:${user._id}`,
      JSON.stringify({
        id: user._id,
        email: user.email,
        name: user.name,
      }),
      3600 // Cache for 1 hour
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}; 