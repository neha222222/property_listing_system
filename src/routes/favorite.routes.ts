import { Router } from 'express';
import { Favorite } from '../models/favorite.model';
import { Property } from '../models/property.model';
import { ApiError } from '../utils/api-error';
import { redisService } from '../services/redis.service';

const router = Router();

// Get user's favorites
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Try to get from cache
    const cacheKey = `favorites:${userId}`;
    const cachedFavorites = await redisService.get(cacheKey);
    if (cachedFavorites) {
      return res.json(JSON.parse(cachedFavorites));
    }

    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: 'property',
        select: 'title description price location propertyType bedrooms bathrooms area amenities images status',
      })
      .sort({ createdAt: -1 });

    const data = {
      success: true,
      data: {
        favorites,
      },
    };

    // Cache the results
    await redisService.set(cacheKey, JSON.stringify(data), 300); // Cache for 5 minutes

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Add property to favorites
router.post('/:propertyId', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { propertyId } = req.params;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      user: userId,
      property: propertyId,
    });
    if (existingFavorite) {
      throw ApiError.badRequest('Property already in favorites');
    }

    // Add to favorites
    const favorite = await Favorite.create({
      user: userId,
      property: propertyId,
    });

    // Invalidate favorites cache
    await redisService.del(`favorites:${userId}`);

    res.status(201).json({
      success: true,
      data: {
        favorite,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Remove property from favorites
router.delete('/:propertyId', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { propertyId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      user: userId,
      property: propertyId,
    });

    if (!favorite) {
      throw ApiError.notFound('Favorite not found');
    }

    // Invalidate favorites cache
    await redisService.del(`favorites:${userId}`);

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    next(error);
  }
});

export default router; 