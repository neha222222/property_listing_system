import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/property.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// Validation middleware
const propertyValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters long'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be greater than 0'),
  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('location.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('location.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('location.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required'),
  body('propertyType')
    .isIn(['apartment', 'house', 'condo', 'townhouse', 'land', 'commercial'])
    .withMessage('Invalid property type'),
  body('bedrooms')
    .isInt({ min: 0 })
    .withMessage('Bedrooms must be a non-negative integer'),
  body('bathrooms')
    .isFloat({ min: 0 })
    .withMessage('Bathrooms must be a non-negative number'),
  body('area')
    .isFloat({ min: 0 })
    .withMessage('Area must be a non-negative number'),
  body('amenities')
    .isArray()
    .withMessage('Amenities must be an array'),
  body('images')
    .isArray()
    .withMessage('Images must be an array'),
  body('status')
    .optional()
    .isIn(['available', 'sold', 'pending'])
    .withMessage('Invalid status'),
];

// Routes
router.get('/', getProperties);
router.get('/:id', getProperty);
router.post('/', authMiddleware, propertyValidation, validateRequest, createProperty);
router.put('/:id', authMiddleware, propertyValidation, validateRequest, updateProperty);
router.delete('/:id', authMiddleware, deleteProperty);

export default router; 