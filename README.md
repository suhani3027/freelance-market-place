# Freelance Marketplace - Upwork Clone

A comprehensive freelance marketplace platform with payment integration, search functionality, and feedback system.

## Features Implemented

### Payment System
- ✅ Stripe payment integration
- ✅ Payment intents and checkout sessions
- ✅ Order management system
- ✅ Payment success/cancel pages
- ✅ Order status tracking
- ✅ Client and freelancer order views
- ✅ Edit gig button visibility (only for gig owner)

### Search & Discovery
- ✅ LinkedIn-style search with user profiles
- ✅ Recent gigs display
- ✅ User profile view with gigs
- ✅ Search by people or gigs
- ✅ Clickable user cards

### Feedback & Review System
- ✅ Complete review system with star ratings
- ✅ Review form with anonymous option
- ✅ Review display on gig detail pages
- ✅ Freelancer feedback dashboard with stats
- ✅ Rating breakdown and average calculations
- ✅ Helpful review voting system
- ✅ Review sorting (by date/rating)
- ✅ Order completion review prompts
- ✅ Client review management

## Database Models

### Order Model
- `gigId`, `clientId`, `freelancerId`, `amount`, `status`
- `stripePaymentIntentId`, `stripeSessionId`, `paymentMethod`
- `gigTitle`, `clientEmail`, `freelancerEmail`, `description`
- `completedAt`, `cancelledAt`, `timestamps`

### Review Model
- `gigId`, `orderId`, `clientId`, `freelancerId`
- `rating` (1-5 stars), `comment`, `clientName`, `gigTitle`
- `isAnonymous`, `helpfulCount`, `createdAt`

## API Endpoints

### Payment Routes
- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/confirm-payment` - Confirm payment
- `GET /api/payments/orders/:userId/:role` - Get user orders
- `PUT /api/payments/orders/:orderId/status` - Update order status
- `GET /api/payments/orders/:orderId` - Get order details

### Review Routes
- `POST /api/reviews` - Create a new review
- `GET /api/reviews/gig/:gigId` - Get reviews for a gig
- `GET /api/reviews/freelancer/:freelancerId` - Get freelancer reviews
- `GET /api/reviews/client/:clientId` - Get client reviews
- `PUT /api/reviews/:reviewId/helpful` - Mark review as helpful
- `DELETE /api/reviews/:reviewId` - Delete a review

## Setup Instructions

### 1. Install Dependencies

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

### 2. Environment Variables

**Server (.env):**
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

**Client (.env.local):**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 3. Stripe Configuration

1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Add the keys to your environment variables
4. Configure webhook endpoints (optional)

### 4. Start the Application

**Server:**
```bash
cd server
npm run dev
```

**Client:**
```bash
cd client
npm run dev
```

## Testing the Feedback System

### 1. Create a Gig
- Register as a freelancer
- Create a new gig with details

### 2. Purchase the Gig
- Register as a client
- Purchase the gig using Stripe test cards
- Complete the payment

### 3. Complete the Order
- Mark the order as completed
- Leave a review with rating and comment

### 4. View Reviews
- Check the gig detail page for reviews
- Visit freelancer dashboard to see feedback stats
- Test helpful voting and sorting

## Security Notes

- All payment operations are handled server-side
- JWT tokens for authentication
- Input validation on all forms
- Rate limiting recommended for production

## Production Considerations

- Use environment variables for all secrets
- Implement proper error handling
- Add rate limiting and security headers
- Set up monitoring and logging
- Configure CORS properly
- Use HTTPS in production