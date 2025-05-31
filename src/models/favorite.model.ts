import mongoose, { Schema } from 'mongoose';
import { IFavorite } from '../types';

const favoriteSchema = new Schema<IFavorite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to ensure a user can't favorite the same property twice
favoriteSchema.index({ user: 1, property: 1 }, { unique: true });

// Create index for efficient querying of user's favorites
favoriteSchema.index({ user: 1, createdAt: -1 });

export const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema); 