import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gigs', // Folder name in your Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const parser = multer({ storage: storage });

export default parser;