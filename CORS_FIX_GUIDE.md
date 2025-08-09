# CORS Issue Fix Guide

## Problem Identified

Your frontend is deployed on Vercel (`https://tasknest-freelance.vercel.app`) but trying to connect to `localhost:5000`, which causes CORS errors in production.

## Solution Steps

### 1. Get Your Backend URL

First, you need to find your actual backend URL from Render:

1. Go to your Render dashboard
2. Find your backend service
3. Copy the URL (it should look like: `https://your-app-name.onrender.com`)

### 2. Update Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project (`tasknest-freelance`)
3. Go to Settings → Environment Variables
4. Add these variables:

```
NEXT_PUBLIC_API_URL=https://YOUR_ACTUAL_BACKEND_URL.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://YOUR_ACTUAL_BACKEND_URL.onrender.com
```

Replace `YOUR_ACTUAL_BACKEND_URL` with your actual backend URL from Render.

### 3. Update Server CORS Configuration

Your server CORS is already updated to allow `https://tasknest-freelance.vercel.app`, but make sure your backend is deployed with the latest code.

### 4. Alternative Quick Fix

If you want to test immediately, you can temporarily hardcode the URL in `client/lib/api.js`:

```javascript
// Replace this line:
return 'https://YOUR_ACTUAL_BACKEND_URL.onrender.com';

// With your actual backend URL, for example:
return 'https://freelance-marketplace-backend.onrender.com';
```

### 5. Deploy and Test

1. After updating environment variables in Vercel, redeploy your frontend
2. Test the registration functionality
3. Check browser console for any remaining errors

## Common Issues

### Issue: Still getting CORS errors
**Solution:** Make sure your backend is actually deployed and running on Render

### Issue: Environment variables not working
**Solution:** 
1. Check that you're using `NEXT_PUBLIC_` prefix
2. Redeploy after adding environment variables
3. Clear browser cache

### Issue: Backend URL not working
**Solution:**
1. Test your backend URL directly in browser
2. Make sure it's accessible (not in sleep mode)
3. Check Render logs for any errors

## Testing Steps

1. **Test Backend URL:** Visit your backend URL directly (e.g., `https://your-app.onrender.com/health`)
2. **Test Frontend:** Try registering a new user on your Vercel deployment
3. **Check Console:** Look for any remaining CORS or connection errors

## Support

If you still encounter issues:
1. Check Render logs for backend errors
2. Check Vercel logs for frontend errors
3. Verify all environment variables are set correctly
4. Ensure your backend is actually running and accessible
