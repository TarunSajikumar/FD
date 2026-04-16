# food-point

This repository is a static storefront for Food Point with a MongoDB backend and local storage fallback.

## Setup

1. Ensure you have Node.js installed
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

## Environment Variables

Copy the example environment file and update with your MongoDB URI:

```bash
cp .env.example .env
```

Edit `.env` with your MongoDB connection string:
```env
MONGO_URI=mongodb+srv://foodpoint_db:foodpoint_db@foodpint.otnysi6.mongodb.net/
OWNER_PASSWORD=1515
PORT=3000
USE_LOCAL_STORAGE=false
```

**Note:** Ensure your MongoDB Atlas cluster allows connections from your IP address and the database user has appropriate permissions.

## Storage Modes

The backend supports two storage modes:

### MongoDB Mode (Default)
- Uses MongoDB Atlas for persistent data storage
- Requires internet connection and valid MongoDB URI
- Supports multiple users and concurrent access

### Local Storage Mode (Fallback)
- Uses JSON files for data storage
- No internet connection required
- Perfect for development and testing
- Data persists between server restarts

To enable local storage mode, set `USE_LOCAL_STORAGE=true` in your `.env` file.

## Test Database Connection

```bash
cd backend
npm run test-db
```

If the connection fails, you can:
1. Fix MongoDB connectivity issues, or
2. Switch to local storage mode by setting `USE_LOCAL_STORAGE=true`

## Run the backend

```bash
cd backend
npm start
```

The server will automatically detect the storage mode and display which one is active.

## Run the frontend

Open `frontend/index.html` in your browser or serve the frontend directory. If you are running the backend server, open `http://localhost:3000/` instead.

The backend provides:
- `/api/menu` for menu items (CRUD operations)
- `/api/orders` for order persistence with payment status tracking
- `/api/orders/:id/status` for updating order payment status (owner only)
- `/api/user/profile` for user profile with order history
- `/api/auth/login` and `/api/auth/signup` for user authentication
- Password encryption using bcrypt
- User order history tracking
- Real-time updates via Socket.IO

## API Features

### Authentication
- User signup with encrypted passwords
- Login with email/name and password
- JWT-like token-based authentication
- Owner special login

### Orders
- Payment status tracking (paid/unpaid/cancelled)
- Link orders to authenticated users
- Order history per user
- Real-time order notifications

### Menu Management
- CRUD operations for menu items
- Owner-only access for modifications

Owner login credentials:
- identifier: `Owner`
- password: `1515` (or set via OWNER_PASSWORD env var)

## Database Schema

### Users
- `name`, `email` (unique), `password` (bcrypt hashed), `role` (customer/owner)
- Order history linked via `customerId`

### Menu Items
- `name`, `price`, `description`, `available` (boolean)

### Orders
- `customerId` (reference to User), `customerName`, `items` array
- `amount`, `method` (cash/online), `provider`, `status` (paid/unpaid/cancelled)
- `createdAt` timestamp

## Security Features

- Passwords are encrypted using bcrypt with salt rounds
- JWT-like token authentication
- Owner-only endpoints for menu and order management
- CORS enabled for frontend access

