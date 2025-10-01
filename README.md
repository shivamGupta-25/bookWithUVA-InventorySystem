# Book with UVA - Inventory Management System

A comprehensive, full-stack inventory management system built with modern web technologies. This system provides complete inventory tracking, order management, user administration, and real-time notifications for book inventory management.

## 🏗️ System Architecture

### Monorepo Structure
```
bookWithUVA-InventorySystem/
├── Inventory_Client/          # Next.js 15 Frontend Application
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React Context providers
│   │   ├── lib/              # Utility functions and API helpers
│   │   └── data/             # Static data and configurations
│   ├── public/               # Static assets
│   └── package.json
└── Inventory_Server/          # Express.js Backend API
    ├── controllers/          # Business logic controllers
    ├── models/               # MongoDB/Mongoose schemas
    ├── utils/                # Utility functions and middleware
    ├── script/               # Database seeding and admin creation
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or cloud instance)
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd bookWithUVA-InventorySystem
```

### 2. Backend Setup (Inventory_Server)
```bash
cd Inventory_Server
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### 3. Frontend Setup (Inventory_Client)
```bash
cd Inventory_Client
npm install

# Create environment file
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api" > .env.local
# Optional: if you need explicit WebSocket origin (rare), set:
# echo "NEXT_PUBLIC_API_URL=http://localhost:4000" >> .env.local

# Start development server
npm run dev
```

### 4. Database Initialization
```bash
# Create admin user
cd Inventory_Server
npm run create-admin

# Seed sample data (optional)
npm run seed
```
Notes:
- The admin script creates an initial user with role `admin`. Change the password after first login.
- Ensure `DATABASE_URI` is set before running these scripts.

## 🔧 Configuration

### Backend Environment Variables (.env)
```env
# Database Configuration
DATABASE_URI=mongodb://localhost:27017/bookwithuva-inventory
PORT=4000

# CORS Configuration
ALLOWED_HOSTS=["http://localhost:3000"]

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Login/Lockout & Rate Limiting
# Maximum failed login attempts before temporary lockout
LOGIN_MAX_ATTEMPTS=5
# Rolling window (ms) in which attempts are counted
LOGIN_ATTEMPT_WINDOW_MS=900000
# Lockout duration after exceeding attempts (ms)
LOGIN_LOCK_DURATION_MS=1800000
# Rate-limit login requests per IP+email
LOGIN_RATE_WINDOW_MS=900000
LOGIN_RATE_MAX=20
# Rate-limit forgot-password requests per IP+email
FORGOT_RATE_WINDOW_MS=900000
FORGOT_RATE_MAX=5
```

### Frontend Environment Variables (.env.local)
```env
# REST API base for the server
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api

# Optional: base URL used by Notification socket client
# If unset, code falls back to http://localhost:4000 (derived from API base)
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🎯 Core Features

### 📦 Inventory Management
- **Product Management**: Add, edit, delete, and view products
- **Stock Tracking**: Real-time stock level monitoring
- **Category Management**: Organize products by categories and subcategories
- **Distributor Management**: Track product suppliers and distributors
- **Stock Alerts**: Automated low-stock and out-of-stock notifications
- **Advanced Filtering**: Search and filter products by multiple criteria
- **Bulk Operations**: Delete all products with confirmation

### 🛒 Order Management
- **Order Creation**: Create new orders with customer details
- **Order Tracking**: Monitor order status (pending, processing, shipped, delivered)
- **Payment Management**: Track payment status and methods
- **Invoice Generation**: Generate PDF invoices for orders
- **Order Analytics**: View order statistics and trends
- **Customer Management**: Store customer information and order history

### 👥 User Management & Authentication
- **Role-Based Access Control**: Admin, Manager, and Viewer roles
- **User Administration**: Create, edit, and manage user accounts
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **Password Management**: Secure password reset via OTP email
- **Session Management**: Single active session enforcement
- **Activity Logging**: Comprehensive audit trail of user actions

### 📊 Analytics & Reporting
- **Dashboard Analytics**: Key metrics and statistics
- **Order Analytics**: Revenue tracking and order trends
- **Stock Reports**: Inventory status and alerts
- **User Activity Logs**: Detailed activity tracking
- **Real-time Notifications**: Socket.IO powered live updates

### ⚙️ System Settings
- **Stock Alert Configuration**: Customizable threshold settings
- **Notification Preferences**: Email and sound notification settings
- **System Configuration**: Global system settings management

## 🛡️ Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure access and refresh token system
- **Password Security**: Bcrypt hashing with salt rounds
- **Session Management**: Single active session enforcement
- **Role-Based Permissions**: Granular access control
- **Password Validation**: Strong password requirements
- **Email Verification**: OTP-based password reset

### Data Protection
- **Input Validation**: Comprehensive server-side validation
- **SQL Injection Prevention**: Mongoose ODM protection
- **XSS Protection**: Helmet.js security headers
- **CORS Configuration**: Controlled cross-origin access
- **Rate Limiting**: API request throttling
- **Activity Logging**: Complete audit trail

## 🗄️ Database Schema

### Core Models

#### User Model
```typescript
{
  name: string (required, max 100 chars)
  email: string (required, unique, validated)
  password: string (required, min 6 chars, hashed)
  role: enum ['admin', 'manager', 'viewer']
  avatar: string (optional URL)
  isActive: boolean (default: true)
  lastLogin: Date
  sessionVersion: number (for session management)
  passwordChangedAt: Date
  otpCode: string (for password reset)
  otpExpires: Date
}
```

#### Product Model
```typescript
{
  title: string (required, max 200 chars)
  distributor: ObjectId (ref: Distributor)
  category: string (required, max 50 chars)
  subCategory: string (required, max 50 chars)
  price: number (required, min 0)
  stock: number (required, min 0, default 0)
  gst: number (required, 0-100%, default 18)
  description: string (max 500 chars)
  isActive: boolean (default: true)
}
```

#### Order Model
```typescript
{
  orderNumber: string (required, unique, auto-generated)
  customer: {
    name: string (required)
    email: string (optional, validated)
    phone: string (optional, validated)
    address: {
      street, city, state, pincode, country
    }
  }
  items: [{
    product: ObjectId (ref: Product)
    productName: string
    quantity: number (min 1)
    unitPrice: number
    totalPrice: number
    gstRate: number
    gstAmount: number
    finalPrice: number
  }]
  status: enum ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
  paymentStatus: enum ['pending', 'paid', 'failed', 'refunded']
  paymentMethod: enum ['cash', 'card', 'upi', 'netbanking', 'wallet']
  subtotal: number
  totalGst: number
  shippingCharges: number (default 0)
  discount: number (0-100%, default 0)
  totalAmount: number
  notes: string (max 500 chars)
  orderDate: Date (default now)
  expectedDeliveryDate: Date
  deliveredDate: Date
  cancelledDate: Date
  cancellationReason: string
  refundAmount: number
  refundDate: Date
  refundReason: string
}
```

#### Distributor Model
```typescript
{
  name: string (required, max 150 chars)
  phoneNumber: string (optional, validated)
  email: string (optional, validated)
  address: string (max 500 chars)
  gstinNumber: string (max 30 chars)
  isActive: boolean (default: true)
}
```

#### Activity Log Model
```typescript
{
  user: ObjectId (ref: User)
  userName: string
  userEmail: string
  activityType: enum ['login', 'logout', 'create', 'update', 'delete', ...]
  description: string (max 500 chars)
  resource: string (max 100 chars)
  resourceId: ObjectId
  oldValues: Mixed
  newValues: Mixed
  userAgent: string (max 500 chars)
  metadata: Mixed
}
```

#### Stock Alert Model
```typescript
{
  product: ObjectId (ref: Product)
  productName: string
  alertType: enum ['low-stock', 'out-of-stock']
  currentStock: number
  threshold: number
  message: string
  status: enum ['active', 'acknowledged', 'resolved']
  acknowledgedBy: ObjectId (ref: User)
  acknowledgedAt: Date
  resolvedAt: Date
  priority: enum ['low', 'medium', 'high', 'critical']
}
```

#### Settings Model
```typescript
{
  stockAlertThresholds: {
    lowStockThreshold: number (default 10)
    outOfStockThreshold: number (default 0)
  }
  notificationSettings: {
    enableLowStockAlerts: boolean
    enableOutOfStockAlerts: boolean
    alertFrequency: enum ['immediate', 'hourly', 'daily']
    soundSettings: {
      enableSound: boolean
      lowStockSound: enum ['bell', 'chime', 'beep', ...]
      outOfStockSound: enum ['bell', 'chime', 'beep', 'alarm', ...]
      volume: number (0-100)
    }
  }
  systemSettings: {
    lastUpdatedBy: ObjectId (ref: User)
    version: number
  }
}
```

## 🔌 API Endpoints

### Authentication Endpoints
```
POST   /api/auth/login              # User login
POST   /api/auth/logout             # User logout (authenticated)
POST   /api/auth/refresh            # Refresh access token
GET    /api/auth/profile            # Get user profile (authenticated)
PUT    /api/auth/profile            # Update user profile (authenticated)
PUT    /api/auth/change-password    # Change password (authenticated)
GET    /api/auth/verify             # Verify token (authenticated)
POST   /api/auth/forgot-password    # Request password reset
POST   /api/auth/reset-password     # Reset password with OTP
```

### Admin Security Operations
```
PUT    /api/users/:id/unlock        # Unlock a user's account (admin only)
```

### User Management Endpoints (Admin Only)
```
POST   /api/users                   # Create new user
GET    /api/users                   # Get all users (paginated)
GET    /api/users/stats             # Get user statistics
GET    /api/users/:id               # Get user by ID
PUT    /api/users/:id               # Update user
DELETE /api/users/:id               # Delete user
PUT    /api/users/:id/toggle-status # Activate/deactivate user
```

### Product Management Endpoints
```
GET    /api/products                # Get all products (with filtering)
POST   /api/products                # Create product (Admin/Manager)
DELETE /api/products                # Delete all products (Admin)
GET    /api/product/:id             # Get product by ID
PUT    /api/product/:id             # Update product (Admin/Manager)
DELETE /api/product/:id             # Delete product (Admin/Manager)
GET    /api/products/stats          # Get product statistics
```

### Distributor Management Endpoints
```
GET    /api/distributors            # Get all distributors
POST   /api/distributors            # Create distributor (Admin/Manager)
PUT    /api/distributor/:id         # Update distributor (Admin/Manager)
DELETE /api/distributor/:id         # Delete distributor (Admin/Manager)
DELETE /api/distributors            # Delete all distributors (Admin)
```

### Order Management Endpoints
```
GET    /api/orders                  # Get all orders (with filtering)
GET    /api/order/:id               # Get order by ID
POST   /api/orders                  # Create order (Admin/Manager)
PUT    /api/order/:id               # Update order (Admin/Manager)
DELETE /api/order/:id               # Delete order (Admin/Manager)
DELETE /api/orders                  # Delete all orders (Admin)
GET    /api/orders/stats            # Get order statistics
```

### Activity Log Endpoints (Admin Only)
```
GET    /api/activity-logs           # Get activity logs (paginated)
GET    /api/activity-logs/stats     # Get activity statistics
GET    /api/activity-logs/:id       # Get activity log by ID
GET    /api/users/:userId/activity-logs # Get user activity logs
DELETE /api/activity-logs/cleanup   # Clean old activity logs
```

### Settings Endpoints (Admin Only)
```
GET    /api/settings                # Get system settings
PUT    /api/settings                # Update system settings
GET    /api/settings/alerts         # Get stock alerts
GET    /api/settings/alerts/stats   # Get alert statistics
PUT    /api/settings/alerts/:id/acknowledge # Acknowledge alert
PUT    /api/settings/alerts/:id/resolve     # Resolve alert
```

## 🎨 Frontend Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui with Radix UI primitives
- **Charts**: Recharts for data visualization
- **State Management**: React Context API
- **Authentication**: JWT access/refresh tokens stored in cookies
- **Real-time**: Socket.IO client
- **Notifications**: Sonner toast notifications

### Key Components

#### Layout & Navigation
- `src/app/layout.js` - Root layout with providers
- `src/app/_components/Nav.jsx` - Main navigation sidebar
- `src/app/_components/ConditionalNav.jsx` - Conditional navigation wrapper
- `src/components/ProtectedRoute.jsx` - Route protection component

#### Core Pages
- `src/app/page.js` - Dashboard home page
- `src/app/_components/Dashboard.jsx` - Main dashboard component
- `src/app/inventory/page.js` - Inventory management page
- `src/app/orders/page.js` - Order management page
- `src/app/users/page.js` - User management page (Admin only)
- `src/app/NewProduct/page.js` - Add new product page
- `src/app/NewOrder/page.js` - Create new order page

#### Context Providers
- `src/contexts/AuthContext.jsx` - Authentication state management
- `src/contexts/NotificationContext.jsx` - Notification state management

#### Utility Libraries
- `src/lib/api.js` - API client with typed endpoints
- `src/lib/utils.js` - General utility functions
- `src/lib/monetaryUtils.js` - Currency and calculation utilities
- `src/lib/invoiceUtils.js` - Invoice generation utilities
- `src/lib/soundUtils.js` - Audio notification utilities

## 🔧 Backend Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript (tsx)
- **Framework**: Express.js 5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **Email**: Nodemailer for SMTP
- **Real-time**: Socket.IO server
- **Security**: Helmet.js, CORS
- **Validation**: Mongoose schema validation

### Project Structure

#### Controllers
- `controllers/auth_controller.ts` - Authentication logic
- `controllers/user_controller.ts` - User management
- `controllers/products_controller.ts` - Product CRUD operations
- `controllers/product_controller.ts` - Individual product operations
- `controllers/orders_controller.ts` - Order management
- `controllers/distributors_controller.ts` - Distributor management
- `controllers/activityLog_controller.ts` - Activity logging
- `controllers/settings_controller.ts` - System settings
- `controllers/statistic.ts` - Analytics and statistics

#### Models
- `models/user.ts` - User schema with authentication methods
- `models/products.ts` - Product schema with virtuals
- `models/order.ts` - Order schema with embedded items
- `models/distributor.ts` - Distributor schema
- `models/activityLog.ts` - Activity log schema with static methods
- `models/settings.ts` - Settings schema with singleton pattern
- `models/stockAlert.ts` - Stock alert schema with alert management

#### Utilities
- `utils/authUtils.ts` - Authentication middleware and utilities
- `utils/emailService.ts` - Email service with templates
- `utils/monetaryUtils.ts` - Financial calculations
- `utils/stockAlertUtils.ts` - Stock alert management

#### Scripts
- `script/createAdmin.js` - Create default admin user
- `script/seedData.js` - Seed database with sample data

## 🚀 Deployment

### Production Environment Setup

#### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB instance
2. Configure environment variables for production
3. Use PM2 or similar process manager
4. Set up reverse proxy (nginx)
5. Configure SSL certificates

#### Frontend Deployment
1. Build the Next.js application: `npm run build`
2. Deploy to Vercel, Netlify, or similar platform
3. Configure environment variables
4. Set up custom domain and SSL

### Environment Variables for Production
```env
# Backend Production
DATABASE_URI= DB_URI
PORT=4000
ALLOWED_HOSTS=["https://yourdomain.com"]
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
EMAIL_HOST=your-smtp-host
EMAIL_USER=your-email
EMAIL_PASS=your-email-password
EMAIL_FROM=your-email

# Frontend Production
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## 📱 Features by User Role

### Admin Role
- Full system access
- User management (create, edit, delete users)
- System settings configuration
- Activity log access
- All product and order operations
- Stock alert management
- Bulk delete operations

### Manager Role
- Product management (create, edit, delete)
- Order management (create, edit, delete)
- Distributor management
- Stock alert acknowledgment
- View analytics and reports
- Cannot manage users or system settings

### Viewer Role
- View products and inventory
- View orders and analytics
- View stock alerts
- Cannot modify any data
- Read-only access to all features

## 🔔 Real-time Features

### Socket.IO Integration
- Real-time stock alerts
- WebSocket URL is derived from `NEXT_PUBLIC_API_URL` (or `NEXT_PUBLIC_API_BASE_URL` without `/api`). Example: `ws://localhost:4000`.
- Live order updates
- User activity notifications
- System status updates

### Notification System
- Browser notifications
- Sound alerts for stock warnings
- Email notifications for critical events
- Toast notifications for user actions

## 📊 Analytics & Reporting

### Dashboard Metrics
- Total products count
- Stock status breakdown (in-stock, low-stock, out-of-stock)
- Order statistics
- Revenue tracking
- User activity metrics

### Order Analytics
- Order trends over time
- Top-selling products
- Revenue analysis
- Customer insights
- Payment method distribution

### Stock Reports
- Low stock alerts
- Out-of-stock items
- Stock movement history
- Reorder recommendations

## 🛠️ Development Scripts

### Backend Scripts
```bash
npm run dev           # Start development server with hot reload
npm run build         # Compile TypeScript to dist/
npm run start         # Start compiled server from dist/
npm run create-admin  # Create default admin user
npm run seed          # Seed database with sample data
```

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] User authentication and authorization
- [ ] Product CRUD operations
- [ ] Order management workflow
- [ ] Stock alert system
- [ ] User management (Admin only)
- [ ] Email notifications
- [ ] Real-time updates
- [ ] Responsive design
- [ ] Error handling
- [ ] Data validation

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
- Ensure MongoDB is running
- Check DATABASE_URI in .env file
- Verify network connectivity

#### Authentication Issues
- Check JWT_SECRET configuration
- Verify token expiration settings
- Clear browser cookies and localStorage

#### Email Notifications
- Verify SMTP credentials
- Check email service provider settings
- Ensure proper firewall configuration

#### CORS Issues
- Update ALLOWED_HOSTS in backend .env
- Check frontend API_BASE_URL configuration

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core inventory management features
- **v1.1.0** - Added order management and analytics
- **v1.2.0** - Implemented real-time notifications and stock alerts
- **v1.3.0** - Enhanced user management and activity logging

---

**Built with ❤️ for efficient inventory management**
