import { Request, Response, NextFunction } from 'express';
import { Property } from '../models/property.model';
import { ApiError } from '../utils/api-error';
import { redisService } from '../services/redis.service';
import { PropertyFilters } from '../types';

interface AuthRequest extends Request {
  user?: any;
}

// Helper function to build filter query
const buildFilterQuery = (filters: PropertyFilters) => {
  const query: any = {};

  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = filters.minPrice;
    if (filters.maxPrice) query.price.$lte = filters.maxPrice;
  }

  if (filters.propertyType) {
    query.propertyType = filters.propertyType;
  }

  if (filters.bedrooms) {
    query.bedrooms = filters.bedrooms;
  }

  if (filters.bathrooms) {
    query.bathrooms = filters.bathrooms;
  }

  if (filters.minArea || filters.maxArea) {
    query.area = {};
    if (filters.minArea) query.area.$gte = filters.minArea;
    if (filters.maxArea) query.area.$lte = filters.maxArea;
  }

  if (filters.city) {
    query['location.city'] = new RegExp(filters.city, 'i');
  }

  if (filters.state) {
    query['location.state'] = new RegExp(filters.state, 'i');
  }

  if (filters.amenities?.length) {
    query.amenities = { $all: filters.amenities };
  }

  if (filters.status) {
    query.status = filters.status;
  }

  return query;
};

// Get all properties with filtering and pagination
export const getProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = req.query as unknown as PropertyFilters;
    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build cache key
    const cacheKey = redisService.generateKey('properties', {
      ...filters,
      page,
      limit,
    });

    // Try to get from cache
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Build query
    const query = buildFilterQuery(filters);

    // Get total count
    const total = await Property.countDocuments(query);

    // Get properties
    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email');

    const data = {
      success: true,
      data: {
        properties,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    };

    // Cache the results
    await redisService.set(cacheKey, JSON.stringify(data), 300); // Cache for 5 minutes

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// Get single property
export const getProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Try to get from cache
    const cachedProperty = await redisService.get(`property:${id}`);
    if (cachedProperty) {
      return res.json({
        success: true,
        data: {
          property: JSON.parse(cachedProperty),
        },
      });
    }

    const property = await Property.findById(id).populate(
      'createdBy',
      'name email'
    );

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    // Cache the property
    await redisService.set(
      `property:${id}`,
      JSON.stringify(property),
      300 // Cache for 5 minutes
    );

    res.json({
      success: true,
      data: {
        property,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create property
export const createProperty = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const propertyData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const property = await Property.create(propertyData);

    // Invalidate properties cache
    await redisService.del('properties:*');

    res.status(201).json({
      success: true,
      data: {
        property,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update property
export const updateProperty = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);
    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    // Check ownership
    if (property.createdBy.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('Not authorized to update this property');
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // Invalidate caches
    await Promise.all([
      redisService.del(`property:${id}`),
      redisService.del('properties:*'),
    ]);

    res.json({
      success: true,
      data: {
        property: updatedProperty,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete property
export const deleteProperty = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);
    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    // Check ownership
    if (property.createdBy.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('Not authorized to delete this property');
    }

    await property.deleteOne();

    // Invalidate caches
    await Promise.all([
      redisService.del(`property:${id}`),
      redisService.del('properties:*'),
    ]);

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    next(error);
  }
}; 