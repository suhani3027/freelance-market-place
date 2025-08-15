# 🚀 Freelance Marketplace - Upwork Clone

A full-stack freelance marketplace platform built with Next.js, Node.js, and MongoDB. This project replicates core Upwork functionality with a modern, professional UI and real-time features.

## ✨ Features

### 🔐 Authentication & User Management
- **User Registration & Login**: Separate flows for clients and freelancers
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different interfaces for clients and freelancers
- **Profile Management**: Comprehensive user profiles with customization options

### 💼 Freelancer Features
- **Profile Creation**: Detailed profiles with skills, experience, and portfolio
- **Gig Management**: Create, edit, and manage service offerings
- **Proposal System**: Submit proposals to client projects
- **Portfolio Showcase**: Display work samples and achievements
- **Skill Tags**: Categorized skill sets for better discoverability

### 🏢 Client Features
- **Project Posting**: Create detailed project requirements
- **Proposal Review**: Evaluate freelancer proposals
- **Project Management**: Track ongoing projects and milestones
- **Client Dashboard**: Overview of all projects and activities

### 💬 Real-time Messaging System
- **Conversation Management**: Organized chat threads
- **Real-time Chat**: Socket.io powered instant messaging
- **Typing Indicators**: Show when users are typing
- **Message Notifications**: Real-time alerts for new messages
- **Professional UI**: Clean, modern messaging interface
- **Responsive Design**: Works seamlessly on all devices

### 🔗 Connection System
- **Professional Networking**: Connect with other users
- **Connection Management**: Accept/reject connection requests
- **Network Building**: Build professional relationships

### 📊 Review & Rating System
- **Multi-criteria Reviews**: Rate different aspects of work
- **Anonymous Reviews**: Option for anonymous feedback
- **Review Management**: View and manage received reviews
- **Rating Analytics**: Track performance metrics

### 🔍 Advanced Search & Discovery
- **Multi-criteria Search**: Find users and projects by various parameters
- **Filtering Options**: Refine search results
- **Category-based Browsing**: Explore projects by category
- **Smart Recommendations**: AI-powered suggestions

### 💳 Payment Integration
- **Secure Payment Processing**: Stripe integration
- **Escrow System**: Secure payment handling
- **Transaction History**: Complete payment records
- **Multiple Payment Methods**: Flexible payment options

### 📱 Modern UI/UX
- **Responsive Design**: Mobile-first approach
- **Tailwind CSS**: Modern styling framework
- **Professional Layout**: Clean, intuitive interface
- **Dark/Light Themes**: User preference options
- **Accessibility**: WCAG compliant design

### 🔔 Notification System
- **Real-time Notifications**: Instant updates for important events
- **Email Notifications**: Email alerts for key activities
- **Push Notifications**: Browser push notifications
- **Customizable Settings**: User preference management

## 🛠️ Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Socket.io Client**: Real-time communication
- **React Hooks**: Modern React patterns

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Socket.io**: Real-time bidirectional communication
- **JWT**: JSON Web Token authentication

### Infrastructure
- **MongoDB Atlas**: Cloud database hosting
- **Render**: Backend deployment platform
- **Vercel/Netlify**: Frontend deployment options

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/freelance-market-place.git
   cd freelance-market-place
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` files in both `server/` and `client/` directories:
   
   **Server (.env)**
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLIENT_URL=http://localhost:3000
   PORT=5000
   NODE_ENV=development
   ```

   **Client (.env.local)**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```

4. **Start the development servers**
   ```bash
   # Start backend server (from server directory)
   npm run dev
   
   # Start frontend (from client directory)
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 📁 Project Structure

```
freelance-market-place/
├── client/                 # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # Reusable components
│   ├── lib/               # Utilities and API
│   └── public/            # Static assets
├── server/                # Express.js backend
│   ├── config/            # Database configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── socket/            # Socket.io handlers
└── README.md              # Project documentation
```

## 🔧 Key Components

### Messaging System
- **Real-time Communication**: Socket.io powered instant messaging
- **Conversation Management**: Organized chat threads with search
- **Typing Indicators**: Real-time typing status
- **Message Notifications**: Instant alerts for new messages
- **Professional UI**: Clean, modern interface with proper scrolling

### User Authentication
- **JWT Tokens**: Secure authentication system
- **Role-based Access**: Different interfaces for different user types
- **Protected Routes**: Secure page access
- **Session Management**: Persistent user sessions

### Database Models
- **User Management**: Comprehensive user profiles
- **Project System**: Gig and proposal management
- **Messaging**: Conversation and message storage
- **Reviews**: Rating and feedback system

## 🚀 Deployment

### Backend Deployment (Render)
1. Connect your GitHub repository to Render
2. Set environment variables
3. Deploy the server directory
4. Update client API URLs

### Frontend Deployment (Vercel/Netlify)
1. Connect your GitHub repository
2. Set build settings
3. Configure environment variables
4. Deploy automatically on push

## 🔒 Security Features

- **CORS Protection**: Comprehensive cross-origin resource sharing
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Server-side validation
- **SQL Injection Protection**: Mongoose ODM protection
- **XSS Protection**: Security headers implementation
- **Rate Limiting**: API abuse prevention

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Responsive tablet layouts
- **Desktop Experience**: Full-featured desktop interface
- **Touch-Friendly**: Mobile-optimized interactions

## 🔄 Real-time Features

- **Live Messaging**: Instant message delivery
- **Typing Indicators**: Real-time user activity
- **Notifications**: Instant system alerts
- **Status Updates**: Live connection status

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Smooth Animations**: CSS transitions and animations
- **Loading States**: User feedback during operations
- **Error Handling**: User-friendly error messages
- **Success Feedback**: Confirmation of actions

## 🧪 Testing

- **Component Testing**: React component validation
- **API Testing**: Backend endpoint testing
- **Integration Testing**: Full system testing
- **Performance Testing**: Load and stress testing

## 📈 Performance Optimizations

- **Code Splitting**: Dynamic imports for better loading
- **Image Optimization**: Next.js image optimization
- **Bundle Analysis**: Webpack bundle optimization
- **Lazy Loading**: On-demand component loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing React framework
- **Tailwind CSS**: For the utility-first CSS framework
- **Socket.io**: For real-time communication capabilities
- **MongoDB**: For the flexible NoSQL database

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ using modern web technologies**