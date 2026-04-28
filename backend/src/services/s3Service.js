const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Validate AWS configuration
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('WARNING: AWS credentials not fully configured. S3 upload will fail if used.');
}

if (!process.env.AWS_S3_BUCKET) {
  console.warn('WARNING: AWS_S3_BUCKET environment variable not set. S3 upload will fail if used.');
}

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function getPresignedUploadUrl(key, contentType, expiresIn = 900) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ACL: 'public-read',
  });

  const url = await getSignedUrl(s3, command, { expiresIn });
  const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  return { url, publicUrl };
}

module.exports = {
  getPresignedUploadUrl,
  s3,
};
