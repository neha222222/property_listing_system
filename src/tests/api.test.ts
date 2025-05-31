import axios from 'axios';
import { expect } from 'chai';

const API_URL = 'http://localhost:3000/api';
let authToken: string;
let userId: string;
let propertyId: string;

describe('Property Listing System API Tests', () => {
  // Auth Tests
  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email: 'test@example.com',
        password: 'test123',
        name: 'Test User'
      });
      expect(response.status).to.equal(201);
      expect(response.data.success).to.be.true;
      expect(response.data.data.token).to.exist;
      authToken = response.data.data.token;
      userId = response.data.data.user.id;
    });

    it('should login user', async () => {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'test123'
      });
      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.token).to.exist;
    });

    it('should get current user', async () => {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.user.email).to.equal('test@example.com');
    });
  });

  // Property Tests
  describe('Properties', () => {
    it('should get all properties with filters', async () => {
      const response = await axios.get(`${API_URL}/properties?minPrice=100000&maxPrice=500000&propertyType=house`);
      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.properties).to.be.an('array');
    });

    it('should create a new property', async () => {
      const propertyData = {
        title: 'Test Property',
        description: 'A test property',
        price: 300000,
        location: {
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345'
        },
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 2,
        area: 2000,
        amenities: ['garage', 'pool'],
        images: ['https://example.com/image.jpg']
      };

      const response = await axios.post(
        `${API_URL}/properties`,
        propertyData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      expect(response.status).to.equal(201);
      expect(response.data.success).to.be.true;
      expect(response.data.data.property.title).to.equal('Test Property');
      propertyId = response.data.data.property._id;
    });

    it('should get a single property', async () => {
      const response = await axios.get(`${API_URL}/properties/${propertyId}`);
      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.property._id).to.equal(propertyId);
    });

    it('should update a property', async () => {
      const updateData = {
        title: 'Updated Test Property',
        price: 350000
      };

      const response = await axios.put(
        `${API_URL}/properties/${propertyId}`,
        updateData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.property.title).to.equal('Updated Test Property');
    });

    it('should delete a property', async () => {
      const response = await axios.delete(
        `${API_URL}/properties/${propertyId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
    });
  });

  // Favorites Tests
  describe('Favorites', () => {
    it('should add a property to favorites', async () => {
      const response = await axios.post(
        `${API_URL}/favorites/${propertyId}`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      expect(response.status).to.equal(201);
      expect(response.data.success).to.be.true;
    });

    it('should get user favorites', async () => {
      const response = await axios.get(
        `${API_URL}/favorites`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.favorites).to.be.an('array');
    });

    it('should remove a property from favorites', async () => {
      const response = await axios.delete(
        `${API_URL}/favorites/${propertyId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
    });
  });

  // Recommendations Tests
  describe('Recommendations', () => {
    it('should recommend a property to another user', async () => {
      const response = await axios.post(
        `${API_URL}/recommendations`,
        {
          recipientEmail: 'another@example.com',
          propertyId: propertyId,
          message: 'Check out this property!'
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      expect(response.status).to.equal(201);
      expect(response.data.success).to.be.true;
    });

    it('should get received recommendations', async () => {
      const response = await axios.get(
        `${API_URL}/recommendations/received`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.recommendations).to.be.an('array');
    });

    it('should get sent recommendations', async () => {
      const response = await axios.get(
        `${API_URL}/recommendations/sent`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.recommendations).to.be.an('array');
    });
  });
}); 