import fs from 'fs';
import path from 'path';
import csv from 'csv-parse';
import mongoose from 'mongoose';
import { Property } from '../models/property.model';
import { User } from '../models/user.model';
import dotenv from 'dotenv';

dotenv.config();

const CSV_FILE_PATH = path.join(__dirname, '../../db424fd9fb74_1748258398689.csv');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-listing');
    console.log('Connected to MongoDB');

    // Create a default admin user if it doesn't exist
    const adminUser = await User.findOneAndUpdate(
      { email: 'admin@example.com' },
      {
        email: 'admin@example.com',
        password: 'admin123', // This will be hashed by the pre-save hook
        name: 'Admin User',
      },
      { upsert: true, new: true }
    );

    console.log('Admin user created/updated:', adminUser.email);

    // Read and parse CSV file
    const records: any[] = [];
    const parser = fs
      .createReadStream(CSV_FILE_PATH)
      .pipe(csv.parse({ columns: true, skip_empty_lines: true }));

    for await (const record of parser) {
      records.push(record);
    }

    console.log(`Found ${records.length} records in CSV`);

    // Transform and insert records
    const properties = records.map((record) => ({
      title: record.title || 'Untitled Property',
      description: record.description || '',
      price: parseFloat(record.price) || 0,
      location: {
        address: record.address || '',
        city: record.city || '',
        state: record.state || '',
        zipCode: record.zipCode || '',
        coordinates: record.latitude && record.longitude
          ? {
              lat: parseFloat(record.latitude),
              lng: parseFloat(record.longitude),
            }
          : undefined,
      },
      propertyType: record.propertyType || 'house',
      bedrooms: parseInt(record.bedrooms) || 0,
      bathrooms: parseInt(record.bathrooms) || 0,
      area: parseFloat(record.area) || 0,
      amenities: record.amenities ? record.amenities.split(',').map((a: string) => a.trim()) : [],
      images: record.images ? record.images.split(',').map((i: string) => i.trim()) : [],
      status: 'available',
      createdBy: adminUser._id,
    }));

    // Insert properties in batches
    const batchSize = 100;
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      await Property.insertMany(batch, { ordered: false });
      console.log(`Inserted ${i + batch.length} of ${properties.length} properties`);
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase(); 