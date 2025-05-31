import { Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IProperty extends Document {
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  images: string[];
  status: 'available' | 'sold' | 'pending';
  createdBy: IUser['_id'];
  createdAt: Date;
  updatedAt: Date;
}

export interface IFavorite extends Document {
  user: IUser['_id'];
  property: IProperty['_id'];
  createdAt: Date;
}

export interface IRecommendation extends Document {
  sender: IUser['_id'];
  recipient: IUser['_id'];
  property: IProperty['_id'];
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface ApiError extends Error {
  statusCode?: number;
  errors?: any[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PropertyFilters extends PaginationParams {
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  city?: string;
  state?: string;
  amenities?: string[];
  status?: string;
} 