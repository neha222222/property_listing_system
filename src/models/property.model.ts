import mongoose, { Schema } from 'mongoose';
import { IProperty } from '../types';

const propertySchema = new Schema<IProperty>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      address: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      zipCode: {
        type: String,
        required: true,
        trim: true,
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    propertyType: {
      type: String,
      required: true,
      enum: ['apartment', 'house', 'condo', 'townhouse', 'land', 'commercial'],
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    area: {
      type: Number,
      required: true,
      min: 0,
    },
    amenities: [{
      type: String,
      trim: true,
    }],
    images: [{
      type: String,
      trim: true,
    }],
    status: {
      type: String,
      required: true,
      enum: ['available', 'sold', 'pending'],
      default: 'available',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
propertySchema.index({ 'location.city': 1, 'location.state': 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ bedrooms: 1, bathrooms: 1 });
propertySchema.index({ area: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ createdBy: 1 });
propertySchema.index({ createdAt: -1 });

// Compound index for location-based queries
propertySchema.index({
  'location.city': 1,
  'location.state': 1,
  price: 1,
  bedrooms: 1,
  bathrooms: 1,
});

export const Property = mongoose.model<IProperty>('Property', propertySchema); 