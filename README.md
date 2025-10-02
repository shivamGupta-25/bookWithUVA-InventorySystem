# Book with UVA - Inventory Management System

A comprehensive, full-stack inventory management system built with modern web technologies. This application provides complete inventory tracking, order management, user administration, and real-time notifications with role-based access control.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green.svg)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [User Roles & Permissions](#user-roles--permissions)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### 🏪 Inventory Management
- **Product Management**: Create, read, update, and delete products with detailed information
- **Stock Tracking**: Real-time stock level monitoring with automatic alerts
- **Category Organization**: Organize products by categories and subcategories
- **Distributor Management**: Manage supplier/distributor information and relationships
- **Stock Alerts**: Configurable low-stock and out-of-stock notifications with sound alerts
- **Inventory Analytics**: Comprehensive analytics including aging reports and value tracking

### 📦 Order Management
- **Order Processing**: Complete order lifecycle management from creation to delivery
- **Order Tracking**: Real-time order status updates with delivery analytics
- **Customer Management**: Detailed customer information and order history
- **Payment Tracking**: Multiple payment methods and status tracking
- **Invoice Generation**: Automated invoice creation with GST calculations
- **Order Analytics**: Revenue tracking, delivery performance, and order insights

### 👥 User Management
- **Role-Based Access Control**: Three-tier permission system (Admin, Manager, Viewer)
- **User Administration**: Complete user lifecycle management
- **Authentication**: Secure JWT-based authentication with refresh tokens
- **Account Security**: Login attempt tracking, account lockout, and password policies
- **Profile Management**: User profile updates and password changes

### 📊 Analytics & Reporting
- **Dashboard**: Comprehensive overview with key metrics and charts
- **Real-time Analytics**: Live data updates with filtering capabilities
- **Inventory Reports**: Stock levels, aging analysis, and value reports
- **Order Analytics**: Sales performance, delivery metrics, and customer insights
- **Activity Logging**: Complete audit trail of all system activities

### 🔔 Real-time Notifications
- **WebSocket Integration**: Real-time updates using Socket.IO
- **Stock Alerts**: Immediate notifications for stock level changes
- **Sound Notifications**: Configurable audio alerts for different events
- **Activity Notifications**: Real-time updates on system activities

### 🎨 User Experience
- **Modern UI**: Clean, responsive design with dark/light theme support
- **Mobile Responsive**: Optimized for all device sizes
- **Advanced Filtering**: Powerful search and filter capabilities
- **Data Tables**: Sortable, paginated tables with advanced features
- **Form Validation**: Comprehensive client and server-side validation

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15.5.4 (React 19.1.0)
- **Styling**: Tailwind CSS 4.0 with custom components
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: React Context API
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Notifications**: Sonner for toast notifications
- **Theme**: Next-themes for dark/light mode

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs for password hashing
- **Real-time**: Socket.IO for WebSocket connections
- **Security**: Helmet, CORS, rate limiting
- **Email**: Nodemailer with SendGrid integration
- **Validation**: Mongoose schema validation

### Development Tools
- **Language**: TypeScript/JavaScript
- **Build Tool**: Next.js built-in bundler
- **Linting**: ESLint with Next.js configuration
- **Package Manager**: npm

## 🏗 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Express.js)  │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
│ • React 19      │    │ • TypeScript    │    │ • Mongoose ODM  │
│ • Tailwind CSS  │    │ • JWT Auth      │    │ • Indexes       │
│ • Radix UI      │    │ • Socket.IO     │    │ • Validation    │
│ • Context API   │    │ • Rate Limiting │    │ • Aggregation   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              WebSocket (Socket.IO)
```

## 📋 Prerequisites

- **Node.js**: Version 18 or higher
- **MongoDB**: Local installation or MongoDB Atlas account
- **npm**: Package manager (comes with Node.js)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd bookWithUVA-InventorySystem
```

### 2. Install Server Dependencies
```bash
cd Inventory_Server
npm install
```

### 3. Install Client Dependencies
```bash
cd ../Inventory_Client
npm install
```

### 4. Set Up Environment Variables
Create `.env` files in both server and client directories (see [Environment Variables](#environment-variables) section).

### 5. Build and Start the Application

#### Development Mode
```bash
# Terminal 1 - Start the server
cd Inventory_Server
npm run dev

# Terminal 2 - Start the client
cd Inventory_Client
npm run dev
```

#### Production Mode
```bash
# Build and start server
cd Inventory_Server
npm run build
npm start

# Build and start client
cd Inventory_Client
npm run build
npm start
```

## 🔧 Environment Variables

### Server Environment Variables (`Inventory_Server/.env`)
```env
# Database
DATABASE_URI=Database_URI

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
ALLOWED_HOSTS=["http://localhost:3000"]
# For production: ["https://your-client-domain.com"]

# Server Configuration
PORT=4000

# Email Configuration (Optional - for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### Client Environment Variables (`Inventory_Client/.env.local`)
```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
# For production: https://your-api-domain.com/api
```

## 📖 Usage

### Default Admin Account
After starting the server, you can create an admin account through the API or use the seed script:

```bash
cd Inventory_Server
npm run seed
```

### Accessing the Application
1. **Frontend**: http://localhost:3000
2. **Backend API**: http://localhost:4000
3. **API Health Check**: http://localhost:4000 (should return "Live")

### Key Features Walkthrough

#### 1. Dashboard
- Overview of key metrics and charts
- Real-time data updates
- Advanced filtering capabilities
- Quick actions for common tasks

#### 2. Inventory Management
- Add/edit products with detailed information
- Track stock levels with automatic alerts
- Manage distributors and suppliers
- Generate inventory reports

#### 3. Order Management
- Create and track orders
- Manage customer information
- Process payments and deliveries
- Generate invoices

#### 4. User Administration (Admin Only)
- Create and manage user accounts
- Assign roles and permissions
- Monitor user activities
- Account security management

#### 5. Settings & Configuration
- Configure stock alert thresholds
- Customize notification preferences
- Manage sound settings
- System maintenance tools

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/login          # User login
POST /api/auth/logout         # User logout
POST /api/auth/refresh        # Refresh access token
GET  /api/auth/profile        # Get user profile
PUT  /api/auth/profile        # Update user profile
PUT  /api/auth/change-password # Change password
POST /api/auth/forgot-password # Request password reset
POST /api/auth/reset-password  # Reset password with OTP
```

### Product Endpoints
```
GET    /api/products          # Get all products (with filters)
POST   /api/products          # Create new product
GET    /api/product/:id       # Get product by ID
PUT    /api/product/:id       # Update product
DELETE /api/product/:id       # Delete product
DELETE /api/products          # Delete all products (Admin only)
GET    /api/products/stats    # Get product statistics
```

### Order Endpoints
```
GET    /api/orders            # Get all orders (with filters)
POST   /api/orders            # Create new order
GET    /api/order/:id         # Get order by ID
PUT    /api/order/:id         # Update order
DELETE /api/order/:id         # Delete order
GET    /api/orders/stats      # Get order statistics
GET    /api/orders/analytics  # Get order analytics
```

### User Management Endpoints (Admin Only)
```
GET    /api/users             # Get all users
POST   /api/users             # Create new user
GET    /api/users/:id         # Get user by ID
PUT    /api/users/:id         # Update user
DELETE /api/users/:id         # Delete user
PUT    /api/users/:id/toggle-status # Toggle user active status
```

### Settings Endpoints
```
GET /api/settings             # Get system settings
PUT /api/settings             # Update system settings
GET /api/settings/alerts      # Get stock alerts
PUT /api/settings/alerts/:id/acknowledge # Acknowledge alert
PUT /api/settings/alerts/:id/resolve     # Resolve alert
```

## 👤 User Roles & Permissions

### Admin
- **Full System Access**: Complete control over all features
- **User Management**: Create, edit, delete users
- **System Settings**: Configure system-wide settings
- **Data Management**: Bulk operations and data cleanup
- **Activity Monitoring**: View all user activities and logs

### Manager
- **Inventory Management**: Full product and distributor management
- **Order Management**: Complete order processing capabilities
- **Stock Alerts**: Acknowledge and resolve stock alerts
- **Reports**: Access to all analytics and reports
- **Limited User Access**: Cannot delete users or access admin settings

### Viewer
- **Read-Only Access**: View all data without modification rights
- **Dashboard**: Access to analytics and reports
- **Search & Filter**: Use all search and filtering capabilities
- **Profile Management**: Update own profile and password

## 🚀 Deployment

This application is designed to be deployed on Render.com, but can be deployed on any platform that supports Node.js applications.

### Deploy to Render (Recommended)

This repository contains two applications: `Inventory_Server` (API) and `Inventory_Client` (Next.js frontend). You will create two separate Render Web Services.

#### Prerequisites
- Render account and GitHub repository access
- MongoDB connection string (MongoDB Atlas recommended)

#### Required Environment Variables

**API Service (Inventory_Server):**
- `DATABASE_URI`: Your MongoDB connection string
- `JWT_SECRET`: A long, random string for JWT signing
- `JWT_EXPIRES_IN`: Token expiration (e.g., "7d")
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration (e.g., "30d")
- `ALLOWED_HOSTS`: JSON array of allowed origins (e.g., `["https://your-client.onrender.com"]`)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`: Email configuration (optional)

**Client Service (Inventory_Client):**
- `NEXT_PUBLIC_API_BASE_URL`: API base URL including /api (e.g., `https://your-api.onrender.com/api`)

#### Step-by-Step Deployment

**1. Deploy API Service**
- In Render: New → Web Service → Connect your repository
- **Settings:**
  - Root Directory: `Inventory_Server`
  - Build Command: `npm ci && npm run build`
  - Start Command: `npm start`
- Add all required environment variables
- Deploy and note the service URL (e.g., `https://your-api.onrender.com`)
- **Health Check**: GET `https://your-api.onrender.com/` should return "Live"

**2. Configure CORS/WebSocket Origins**
- Set `ALLOWED_HOSTS` environment variable to include your client URL
- Example: `["https://your-client.onrender.com"]`
- Socket.IO uses the same origin configuration

**3. Deploy Client Service**
- In Render: New → Web Service → Connect your repository
- **Settings:**
  - Root Directory: `Inventory_Client`
  - Build Command: `npm ci && npm run build`
  - Start Command: `npm start`
- **Environment Variable:**
  - `NEXT_PUBLIC_API_BASE_URL`: `https://your-api.onrender.com/api`
- Deploy and access your application

**4. Verify Deployment**
- Client loads successfully and can communicate with API
- WebSocket connections work (real-time notifications)
- Authentication and all features function properly

#### Automated Deployment with render.yaml

You can automate both services with a blueprint file at the repository root:

```yaml
services:
  - type: web
    name: inventory-api
    rootDir: Inventory_Server
    env: node
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URI
        sync: false
      - key: ALLOWED_HOSTS
        value: "[\"https://inventory-client.onrender.com\"]"
      - key: JWT_SECRET
        sync: false
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: JWT_REFRESH_EXPIRES_IN
        value: 30d

  - type: web
    name: inventory-client
    rootDir: Inventory_Client
    env: node
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: NEXT_PUBLIC_API_BASE_URL
        value: https://inventory-api.onrender.com/api
```

#### Local Development Setup
For local development that matches production:

```bash
# API Server
cd Inventory_Server
npm install
npm run dev

# Client (in another terminal)
cd Inventory_Client
npm install
npm run dev
```

Ensure your client's `.env.local` contains:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

### Alternative Deployment Platforms

#### Vercel (Client) + Railway/Heroku (Server)
- Deploy client to Vercel for optimal Next.js performance
- Deploy server to Railway or Heroku for backend services
- Configure environment variables accordingly

#### Docker Deployment
Both applications can be containerized using Docker:

```dockerfile
# Dockerfile for server
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

## 📁 Project Structure

```
bookWithUVA-InventorySystem/
├── Inventory_Server/              # Backend API
│   ├── controllers/               # Route controllers
│   │   ├── auth_controller.ts     # Authentication logic
│   │   ├── products_controller.ts # Product management
│   │   ├── orders_controller.ts   # Order management
│   │   ├── user_controller.ts     # User management
│   │   └── ...                    # Other controllers
│   ├── models/                    # Database models
│   │   ├── user.ts               # User schema
│   │   ├── products.ts           # Product schema
│   │   ├── order.ts              # Order schema
│   │   ├── distributor.ts        # Distributor schema
│   │   ├── activityLog.ts        # Activity logging
│   │   └── settings.ts           # System settings
│   ├── utils/                     # Utility functions
│   │   ├── authUtils.ts          # Authentication utilities
│   │   ├── emailService.ts       # Email functionality
│   │   ├── monetaryUtils.ts      # Financial calculations
│   │   └── stockAlertUtils.ts    # Stock alert logic
│   ├── api_routes.ts             # API route definitions
│   ├── index.ts                  # Server entry point
│   └── package.json              # Server dependencies
│
├── Inventory_Client/              # Frontend Application
│   ├── src/
│   │   ├── app/                   # Next.js app directory
│   │   │   ├── _components/       # Shared components
│   │   │   │   ├── Dashboard/     # Dashboard components
│   │   │   │   ├── Nav.jsx        # Navigation
│   │   │   │   └── ...            # Other components
│   │   │   ├── inventory/         # Inventory pages
│   │   │   ├── orders/            # Order pages
│   │   │   ├── users/             # User management
│   │   │   ├── settings/          # Settings page
│   │   │   ├── login/             # Authentication
│   │   │   └── ...                # Other pages
│   │   ├── components/            # Reusable UI components
│   │   │   ├── ui/                # Base UI components
│   │   │   ├── ProtectedRoute.jsx # Route protection
│   │   │   └── ...                # Other components
│   │   ├── contexts/              # React contexts
│   │   │   ├── AuthContext.jsx    # Authentication state
│   │   │   ├── NotificationContext.jsx # Notifications
│   │   │   └── DashboardFilterContext.jsx # Dashboard filters
│   │   └── lib/                   # Utility libraries
│   │       ├── api.js             # API client
│   │       ├── utils.js           # General utilities
│   │       └── soundUtils.js      # Sound management
│   └── package.json               # Client dependencies
│
├── README.md                      # This file
└── Deploy.md                      # Deployment guide (merged into README)
```

### Key Components

#### Backend Architecture
- **Controllers**: Handle HTTP requests and business logic
- **Models**: Define database schemas with validation
- **Utils**: Shared utilities for authentication, email, calculations
- **Middleware**: Authentication, authorization, rate limiting
- **WebSocket**: Real-time communication with Socket.IO

#### Frontend Architecture
- **Pages**: Next.js app router pages with server-side rendering
- **Components**: Reusable UI components with Radix UI
- **Contexts**: Global state management for auth and notifications
- **Hooks**: Custom React hooks for data fetching and state
- **API Layer**: Centralized API communication with error handling

## 🤝 Contributing

This is a complete, production-ready inventory management system. While the application is feature-complete, contributions for bug fixes and improvements are welcome.

### Development Guidelines
1. Follow TypeScript/JavaScript best practices
2. Maintain consistent code formatting
3. Add proper error handling and validation
4. Update documentation for any changes
5. Test thoroughly before submitting changes

### Setting Up Development Environment
1. Fork the repository
2. Create a feature branch
3. Set up local development environment
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## 👨‍💻 Credits

### Developer
**Shivam Raj Gupta** - Full Stack Developer

- **GitHub**: [shivamGupta-25](https://github.com/shivamGupta-25)
- **Email**: [guptashivam25oct@gmail.com](mailto:guptashivam25oct@gmail.com)
- **LinkedIn**: [Shivam Raj Gupta](https://www.linkedin.com/in/shivam-raj-gupta/)

### Project Information
- **Created for**: Book with UVA
- **Development Period**: 2024-2025
- **Project Type**: Full-Stack Inventory Management System
- **Made with**: ❤️ and modern web technologies

### Acknowledgments
- Built with **Next.js** and **React** for the frontend
- Powered by **Node.js** and **Express.js** for the backend
- **MongoDB** for reliable data storage
- **Socket.IO** for real-time functionality
- **Tailwind CSS** and **Radix UI** for beautiful, accessible UI components
- Special thanks to the open-source community for the amazing tools and libraries

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the documentation above
2. Review the deployment guide
3. Check existing issues in the repository
4. Create a new issue with detailed information

## 🎯 Features Summary

This inventory management system provides:
- ✅ Complete inventory tracking and management
- ✅ Order processing and customer management
- ✅ User administration with role-based access
- ✅ Real-time notifications and alerts
- ✅ Comprehensive analytics and reporting
- ✅ Modern, responsive user interface
- ✅ Secure authentication and authorization
- ✅ Production-ready deployment configuration
- ✅ Comprehensive API documentation
- ✅ Mobile-responsive design

The application is ready for production use and can be deployed immediately using the provided deployment guide.
