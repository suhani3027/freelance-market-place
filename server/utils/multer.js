import multer from 'multer';

// Use memory storage to avoid hanging issues
const storage = multer.memoryStorage();

const parser = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export default parser;