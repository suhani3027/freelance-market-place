import jwt from 'jsonwebtoken';

export function authenticateJWT(req, res, next) {
  const authHeader = req.header("Authorization");
  
  if (!authHeader) {

    return res.status(401).json({ error: "Access denied - No authorization header" });
  }
  
  // Handle both "Bearer <token>" and "<token>" formats
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  
  if (!token) {

    return res.status(401).json({ error: "Access denied - No token provided" });
  }
  
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ error: "Server configuration error" });
    }
    
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    
    
    // Check if role is missing from token
    if (!verified.role) {
      console.error('⚠️ WARNING: Role field is missing from JWT token!');
      console.error('This usually means the user needs to re-login to get a new token.');
    }
    
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    } else {
      return res.status(401).json({ error: "Token verification failed" });
    }
  }
}
