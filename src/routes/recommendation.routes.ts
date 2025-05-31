import { Router } from 'express';
import { body } from 'express-validator';
import { Recommendation } from '../models/recommendation.model';
import { User } from '../models/user.model';
import { Property } from '../models/property.model';
import { ApiError } from '../utils/api-error';
import { redisService } from '../services/redis.service';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// Validation middleware
const recommendationValidation = [
  body('recipientEmail')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('propertyId')
    .notEmpty()
    .withMessage('Property ID is required'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must be less than 500 characters'),
];

// Recommend property to user
router.post('/', recommendationValidation, validateRequest, async (req, res, next) => {
  try {
    const { recipientEmail, propertyId, message } = req.body;
    const senderId = req.user._id;

    // Check if recipient exists
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      throw ApiError.notFound('Recipient user not found');
    }

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    // Check if recommendation already exists
    const existingRecommendation = await Recommendation.findOne({
      sender: senderId,
      recipient: recipient._id,
      property: propertyId,
    });
    if (existingRecommendation) {
      throw ApiError.badRequest('Recommendation already sent');
    }

    // Create recommendation
    const recommendation = await Recommendation.create({
      sender: senderId,
      recipient: recipient._id,
      property: propertyId,
      message,
    });

    // Invalidate recommendations cache for both users
    await Promise.all([
      redisService.del(`recommendations:sent:${senderId}`),
      redisService.del(`recommendations:received:${recipient._id}`),
    ]);

    res.status(201).json({
      success: true,
      data: {
        recommendation,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get received recommendations
router.get('/received', async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Try to get from cache
    const cacheKey = `recommendations:received:${userId}`;
    const cachedRecommendations = await redisService.get(cacheKey);
    if (cachedRecommendations) {
      return res.json(JSON.parse(cachedRecommendations));
    }

    const recommendations = await Recommendation.find({ recipient: userId })
      .populate('sender', 'name email')
      .populate('property', 'title description price location propertyType bedrooms bathrooms area amenities images status')
      .sort({ createdAt: -1 });

    const data = {
      success: true,
      data: {
        recommendations,
      },
    };

    // Cache the results
    await redisService.set(cacheKey, JSON.stringify(data), 300); // Cache for 5 minutes

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Get sent recommendations
router.get('/sent', async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Try to get from cache
    const cacheKey = `recommendations:sent:${userId}`;
    const cachedRecommendations = await redisService.get(cacheKey);
    if (cachedRecommendations) {
      return res.json(JSON.parse(cachedRecommendations));
    }

    const recommendations = await Recommendation.find({ sender: userId })
      .populate('recipient', 'name email')
      .populate('property', 'title description price location propertyType bedrooms bathrooms area amenities images status')
      .sort({ createdAt: -1 });

    const data = {
      success: true,
      data: {
        recommendations,
      },
    };

    // Cache the results
    await redisService.set(cacheKey, JSON.stringify(data), 300); // Cache for 5 minutes

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Update recommendation status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!['accepted', 'rejected'].includes(status)) {
      throw ApiError.badRequest('Invalid status');
    }

    const recommendation = await Recommendation.findOne({
      _id: id,
      recipient: userId,
    });

    if (!recommendation) {
      throw ApiError.notFound('Recommendation not found');
    }

    if (recommendation.status !== 'pending') {
      throw ApiError.badRequest('Recommendation already processed');
    }

    recommendation.status = status;
    await recommendation.save();

    // Invalidate recommendations cache for both users
    await Promise.all([
      redisService.del(`recommendations:sent:${recommendation.sender}`),
      redisService.del(`recommendations:received:${userId}`),
    ]);

    res.json({
      success: true,
      data: {
        recommendation,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router; 