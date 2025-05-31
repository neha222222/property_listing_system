import mongoose, { Schema } from 'mongoose';
import { IRecommendation } from '../types';

const recommendationSchema = new Schema<IRecommendation>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
recommendationSchema.index({ sender: 1, createdAt: -1 });
recommendationSchema.index({ recipient: 1, createdAt: -1 });
recommendationSchema.index({ status: 1 });
recommendationSchema.index({ property: 1 });

// Compound index for checking if a recommendation already exists
recommendationSchema.index(
  { sender: 1, recipient: 1, property: 1 },
  { unique: true }
);

export const Recommendation = mongoose.model<IRecommendation>(
  'Recommendation',
  recommendationSchema
); 