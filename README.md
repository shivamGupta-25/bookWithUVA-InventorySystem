# Inventory Management System

A full-stack inventory management system with a React/Next.js frontend and Express.js backend.

## Project Structure

```
inventory_management_system/
├── Backend/                    # Express.js API Server
│   ├── lib/                   # Database connection utilities
│   ├── models/                # MongoDB models
│   ├── routes/                # API route handlers
│   ├── scripts/               # Database seeding scripts
│   ├── package.json           # Backend dependencies
│   ├── server.js              # Express server entry point
│   └── README.md              # Backend documentation
├── src/                       # Next.js Frontend
│   ├── app/                   # Next.js app directory
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Frontend utilities and API client
│   └── data/                  # Static data files
├── public/                    # Static assets
├── package.json               # Frontend dependencies
└── README.md                  # This file
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

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

4. Start the backend server:
   ```bash
   npm run dev
   ```

5. Seed the database (optional):
   ```bash
   npm run seed
   ```

### Frontend Setup

1. Navigate to the root directory:
   ```bash
   cd ..
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Frontend
- Modern React/Next.js interface
- Responsive design with Tailwind CSS
- Product inventory management
- Advanced filtering and search
- Real-time statistics dashboard
- Product creation and editing
- Bulk operations

### Backend
- RESTful API with Express.js
- MongoDB integration with Mongoose
- Product CRUD operations
- Advanced filtering and pagination
- Inventory statistics
- CORS enabled for frontend integration
- Error handling and validation

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

## Development

### Running Both Services

To run both frontend and backend simultaneously:

1. Start the backend (in Backend directory):
   ```bash
   npm run dev
   ```

2. Start the frontend (in root directory):
   ```bash
   npm run dev
   ```

### Environment Variables

#### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Environment (development, production)
- `FRONTEND_URL` - Frontend URL for CORS

#### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Deployment

### Backend Deployment
1. Set up MongoDB database
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, Railway, etc.)

### Frontend Deployment
1. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL
2. Deploy to Vercel, Netlify, or your preferred platform

## Technologies Used

### Frontend
- Next.js 15
- React 19
- Tailwind CSS
- Radix UI
- Lucide React
- Sonner (toast notifications)

### Backend
- Express.js
- MongoDB
- Mongoose
- CORS
- Helmet
- Morgan

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License