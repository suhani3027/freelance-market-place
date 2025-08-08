import cloudinary from 'cloudinary';

// Use environment variables with fallback to hardcoded values
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dutt8dg2k';
const apiKey = process.env.CLOUDINARY_API_KEY || '183269781542528';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'GV0GJlb-DU-UEj4XMzUr_9vBNlk';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

console.log('Cloudinary configured with cloud name:', cloudName);

export default cloudinary;