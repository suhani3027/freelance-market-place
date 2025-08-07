# Quick Setup Guide to Fix Current Issues

## 1. Install Dependencies

First, install the required packages:

```bash
# Server dependencies
cd server
npm install stripe

# Client dependencies  
cd ../client
npm install @stripe/stripe-js @stripe/react-stripe-js
```

## 2. Environment Variables

Create these files with your actual values:

### Server (.env)
Create `server/.env` with:
```
MONGODB_URI=mongodb://localhost:27017/freelance-marketplace
JWT_SECRET=your_jwt_secret_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
PORT=5000
```

### Client (.env.local)
Create `client/.env.local` with:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 3. Get Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers > API keys
3. Copy your test keys (they start with `pk_test_` and `sk_test_`)
4. Replace the placeholder values in your .env files

## 4. Test the Server

```bash
cd server
npm run dev
```

The server should now start without the authMiddleware error.

## 5. Test the Client

```bash
cd client
npm run dev
```

## Common Issues Fixed:

✅ **authMiddleware Error**: Fixed the import name from `authMiddleware` to `authenticateJWT`
✅ **Missing Dependencies**: Added Stripe package installation
✅ **Environment Variables**: Created setup guide for required env vars

## Next Steps:

1. Start both servers
2. Test the payment flow on a gig detail page
3. Check the dashboard for orders section

If you encounter any other errors, please share them and I'll help fix them! 