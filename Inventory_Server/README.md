# Inventory Management Backend

A RESTful API backend for the Inventory Management System built with Express.js and MongoDB.

## Features

- Product CRUD operations
- Advanced filtering and search
- Pagination support
- Inventory statistics
- MongoDB integration
- CORS enabled for frontend integration

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the Backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/inventory_management
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Seed the database (optional):
   ```bash
   npm run seed
   ```

## API Endpoints

### Products

- `GET /api/products` - Get all products with filtering and pagination
- `POST /api/products` - Create a new product
- `DELETE /api/products` - Delete all products (requires confirmation)
- `GET /api/products/:id` - Get a single product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Soft delete a product

### Statistics

- `GET /api/products/stats` - Get inventory statistics

### Health Check

- `GET /health` - Server health status

## Query Parameters for GET /api/products

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `search` - Text search in title, distributor, description
- `category` - Filter by category
- `subCategory` - Filter by sub-category
- `priceMin` - Minimum price filter
- `priceMax` - Maximum price filter
- `stockStatus` - Filter by stock status (in-stock, low-stock, out-of-stock)
- `sortBy` - Sort field (title, distributor, price, stock, gst)
- `sortOrder` - Sort order (asc, desc)

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Environment (development, production)
- `FRONTEND_URL` - Frontend URL for CORS

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data
