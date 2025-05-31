# Property Listing System Backend

A robust backend system for managing property listings with advanced features including CRUD operations, user authentication, property favorites, and recommendations.

## Features

- 🔐 User Authentication (Email/Password)
- 🏠 Property CRUD Operations
- 🔍 Advanced Property Search & Filtering
- ⭐ Property Favorites Management
- 💌 Property Recommendations
- 🚀 Redis Caching for Performance
- 📊 MongoDB Database
- 🔒 Role-based Access Control

## Tech Stack

- TypeScript
- Node.js
- Express.js
- MongoDB
- Redis
- JWT Authentication
- Docker (for containerization)

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Redis
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/property-listing
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/neha222222/property_listing_system.git
cd property_listing_system
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## API Documentation

### Authentication Endpoints
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user

### Property Endpoints
- GET /api/properties - List properties with filters
- POST /api/properties - Create new property
- GET /api/properties/:id - Get property details
- PUT /api/properties/:id - Update property
- DELETE /api/properties/:id - Delete property

### Favorites Endpoints
- GET /api/favorites - Get user's favorite properties
- POST /api/favorites/:propertyId - Add property to favorites
- DELETE /api/favorites/:propertyId - Remove property from favorites

### Recommendations Endpoints
- POST /api/recommendations - Recommend property to user
- GET /api/recommendations/received - Get received recommendations
- GET /api/recommendations/sent - Get sent recommendations

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/        # Database models
├── routes/        # API routes
├── services/      # Business logic
├── types/         # TypeScript types
├── utils/         # Utility functions
└── app.ts         # Express app setup
```

## Development

```bash
# Run in development mode
npm run dev

# Build the project
npm run build

# Run in production mode
npm start

# Run tests
npm test
```

## License

MIT

## Author

Neha Dhruw