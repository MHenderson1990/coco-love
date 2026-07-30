let { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
let { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

let bucket = process.env.R2_BUCKET;

let client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// presigned PUT for direct upload from the app
async function presignUpload(key) {
  let url = await getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 600 });
  return { url, key };
}

// presigned GET for playback (bucket stays private)
async function presignDownload(key) {
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 3600 });
}

async function deleteObject(key) {
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.error('R2 delete failed:', key, err.message);
  }
}

module.exports = { presignUpload, presignDownload, deleteObject };