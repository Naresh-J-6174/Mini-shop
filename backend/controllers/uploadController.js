import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

// @desc Seller: upload a product image file, get back a hosted Cloudinary URL
// @route POST /api/upload/image
export const uploadImage = async (req, res) => {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({
      message:
        'Image upload is not configured yet — add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and ' +
        'CLOUDINARY_API_SECRET to backend/.env (free at cloudinary.com)'
    });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No image file was received' });
  }

  try {
    const url = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'shophub/products', resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(req.file.buffer);
    });

    res.json({ url });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(502).json({ message: 'Image upload failed — please try again' });
  }
};
