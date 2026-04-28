const s3Service = require('../services/s3Service');

exports.getPresigned = async (req, res, next) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ success: false, message: 'filename and contentType are required' });
    }

    const key = `uploads/${Date.now()}_${filename}`;
    const { url, publicUrl } = await s3Service.getPresignedUploadUrl(key, contentType);

    res.json({ success: true, uploadUrl: url, publicUrl });
  } catch (err) {
    next(err);
  }
};
