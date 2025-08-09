# Deployment Setup Guide

## Issues Fixed

### 1. Server Connection Issues
- ✅ Added root route (`/`) for health checks
- ✅ Added proper CORS configuration for production
- ✅ Added 404 handler for undefined routes
- ✅ Updated API base URL configuration

### 2. Frontend Configuration Issues
- ✅ Created API utility for dynamic URL handling
- ✅ Updated registration and login pages
- ✅ Updated socket configuration

## Environment Variables Setup

### Server (.env file in server directory)
```bash
# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Environment
NODE_ENV=production

# Port (Render will set this automatically)
PORT=5000
```

### Client (.env.local file in client directory)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain.onrender.com

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## Render Deployment Steps

### 1. Backend Deployment on Render
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the following:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: Your JWT secret
     - `STRIPE_SECRET_KEY`: Your Stripe secret key
     - `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
     - `NODE_ENV`: `production`

### 2. Frontend Deployment on Vercel/Netlify
1. Connect your GitHub repository to Vercel/Netlify
2. Set the following environment variables:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g., `https://your-app.onrender.com`)
   - `NEXT_PUBLIC_SOCKET_URL`: Your Render backend URL
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

## Local Development Setup

### 1. Start Backend
```bash
cd server
npm install
npm run dev
```

### 2. Start Frontend
```bash
cd client
npm install
npm run dev
```

## Testing the Fixes

### 1. Test Root Route
- Visit `http://localhost:5000/` - should show API status
- Visit `http://localhost:5000/health` - should show health status

### 2. Test Registration
- Try registering a new user - should work without connection errors
- Check browser console for any remaining localhost references

### 3. Test Production URLs
- Update your frontend environment variables with your actual backend URL
- Test the application in production

## Common Issues and Solutions

### Issue: "Cannot GET /" on Render
**Solution:** ✅ Fixed by adding root route in server.js

### Issue: Connection refused errors
**Solution:** ✅ Fixed by updating API base URL configuration

### Issue: CORS errors in production
**Solution:** ✅ Fixed by updating CORS configuration

### Issue: Socket connection errors
**Solution:** ✅ Fixed by updating socket URL configuration

## Next Steps

1. **Update Environment Variables:** Replace placeholder URLs with your actual backend URL
2. **Test Registration:** Try registering a new user to ensure the connection works
3. **Deploy to Production:** Follow the deployment steps above
4. **Monitor Logs:** Check Render logs for any remaining issues

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Check the server logs on Render
3. Verify all environment variables are set correctly
4. Ensure your MongoDB connection string is correct
