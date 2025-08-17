import jwt from 'jsonwebtoken';

export function authenticateJWT(req, res, next) {
  const authHeader = req.header("Authorization");
  
  if (!authHeader) {
    console.log('🚫 No authorization header provided');
    return res.status(401).json({ error: "Access denied - No authorization header" });
  }
  
  // Handle both "Bearer <token>" and "<token>" formats
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  
  if (!token) {
    console.log('🚫 No token found in authorization header');
    return res.status(401).json({ error: "Access denied - No token provided" });
  }

  // Basic token format validation
  if (!isValidTokenFormat(token)) {
    console.log('🚫 Invalid token format received:', token.substring(0, 20) + '...');
    return res.status(401).json({ error: "Invalid token format" });
  }
  
  try {
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ error: "Server configuration error" });
    }
    
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    
    // Check if role is missing from token
    if (!verified.role) {
      console.error('⚠️ WARNING: Role field is missing from JWT token!');
      console.error('This usually means the user needs to re-login to get a new token.');
    }
    
    console.log(`✅ Token verified successfully for user: ${verified.email}`);
    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    console.error('Token details:', {
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...',
      errorType: err.name,
      errorMessage: err.message
    });
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    } else if (err.name === 'NotBeforeError') {
      return res.status(401).json({ error: "Token not active yet" });
    } else {
      return res.status(401).json({ error: "Token verification failed" });
    }
  }
}

// Helper function to validate basic JWT token format
function isValidTokenFormat(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Each part should be a valid base64 string
  try {
    parts.forEach(part => {
      if (part && part.length > 0) {
        // Try to decode base64
        Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Optional: Add a function to decode token without verification (for debugging)
export function decodeToken(token) {
  try {
    if (!isValidTokenFormat(token)) {
      return null;
    }
    
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}
