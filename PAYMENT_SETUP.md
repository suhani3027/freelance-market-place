# Payment Integration Setup Guide

## Prerequisites

1. **Stripe Account**: Sign up at [stripe.com](https://stripe.com) and get your API keys
2. **Node.js and npm**: Make sure you have Node.js installed

## Installation Commands

### Client (Next.js)
```bash
cd client
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Server (Node.js)
```bash
cd server
npm install stripe
```

## Environment Variables Setup

### Client (.env.local)
Create a file `client/.env.local` with:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Server (.env)
Create a file `server/.env` with:
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
MONGODB_URI=mongodb://localhost:27017/freelance-marketplace
JWT_SECRET=your_jwt_secret_here
```

## Stripe Configuration

1. **Get Your Stripe Keys**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Navigate to Developers > API keys
   - Copy your Publishable key and Secret key
   - Replace the placeholder values in your .env files

2. **Test Mode**: Make sure you're using test keys (they start with `pk_test_` and `sk_test_`)

## Features Implemented

### A. Gig Detail Page (/gigs/[id])
- ✅ "Purchase Now" button with Stripe checkout
- ✅ Order status display for existing purchases
- ✅ Payment guarantee section
- ✅ Disabled purchase for gig owners

### B. Client Dashboard (/dashboard)
- ✅ "My Purchases" section showing all orders
- ✅ Order status tracking
- ✅ Action buttons for order management

### C. Freelancer Dashboard (/dashboard)
- ✅ "My Orders" section showing received orders
- ✅ Order status management
- ✅ Start work and mark complete actions

### D. Payment Flow
- ✅ Stripe payment processing
- ✅ Order creation and tracking
- ✅ Payment success/cancel pages
- ✅ Order status updates

## Database Models

### Order Model
- `gigId`: Reference to the gig
- `clientId`: Buyer's email
- `freelancerId`: Seller's email
- `amount`: Payment amount
- `status`: pending/paid/in_progress/completed/cancelled
- `stripePaymentIntentId`: Stripe payment reference
- `gigTitle`: Gig title for display
- `createdAt`: Order timestamp

## API Endpoints

### Payment Routes
- `POST /api/payments/create-payment-intent`: Create Stripe payment intent
- `POST /api/payments/confirm-payment`: Confirm payment completion
- `GET /api/payments/orders/:userId/:role`: Get user orders
- `PUT /api/payments/orders/:orderId/status`: Update order status
- `GET /api/payments/orders/:orderId`: Get order details

## Testing the Integration

1. **Start the servers**:
   ```bash
   # Terminal 1 - Server
   cd server
   npm run dev

   # Terminal 2 - Client
   cd client
   npm run dev
   ```

2. **Test Payment Flow**:
   - Browse to a gig detail page
   - Click "Purchase Now"
   - Complete Stripe checkout with test card: `4242 4242 4242 4242`
   - Verify order appears in dashboard

3. **Test Order Management**:
   - Check order status updates
   - Test freelancer actions (Start Work, Mark Complete)
   - Verify client can mark orders as complete

## Security Notes

- ✅ Payment amounts validated server-side
- ✅ User authentication required for all payment operations
- ✅ Stripe webhook verification (recommended for production)
- ✅ Order status validation
- ✅ Duplicate order prevention

## Production Considerations

1. **Webhooks**: Implement Stripe webhooks for payment confirmation
2. **Error Handling**: Add comprehensive error handling
3. **Logging**: Add payment event logging
4. **Security**: Use environment variables for all sensitive data
5. **Testing**: Use Stripe test mode for development

## Troubleshooting

### Common Issues:
1. **Stripe not loading**: Check your publishable key
2. **Payment fails**: Verify secret key and webhook configuration
3. **Orders not showing**: Check user authentication and API endpoints
4. **CORS errors**: Ensure server CORS configuration includes client URL

### Debug Steps:
1. Check browser console for client-side errors
2. Check server logs for API errors
3. Verify environment variables are loaded
4. Test Stripe keys in Stripe dashboard 