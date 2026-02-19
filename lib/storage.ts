import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

const S3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || '',
        secretAccessKey: R2_SECRET_ACCESS_KEY || '',
    },
});

export async function uploadFile(buffer: Buffer, key: string, contentType: string) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID) {
        console.warn('Storage credentials not configured. Skipping upload.');
        return null; // or throw error
    }

    try {
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        });

        await S3.send(command);
        return key;
    } catch (error) {
        console.error('Error uploading to R2:', error);
        throw error;
    }
}

export async function getDownloadUrl(key: string) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID) {
        return null;
    }

    try {
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        });

        // Generate a presigned URL valid for 1 hour
        const url = await getSignedUrl(S3, command, { expiresIn: 3600 });
        return url;
    } catch (error) {
        console.error('Error generating download URL:', error);
        return null;
    }
}

export async function deleteFile(key: string) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID) {
        return false;
    }

    try {
        const command = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        });

        await S3.send(command);
        console.log(`[Storage] Deleted file: ${key}`);
        return true;
    } catch (error) {
        console.error('Error deleting from R2:', error);
        return false;
    }
}
