import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '../errors/AppError.js';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const getPutPresignedUrl = async (key: string, expiresIn: number): Promise<string> => {
  const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
};

export const getGetPresignedUrl = async (key: string, expiresIn: number): Promise<string> => {
  const command = new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
};

export const headObject = async (
  key: string,
): Promise<{ contentType: string; contentLength: number }> => {
  try {
    const command = new HeadObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: key });
    const res = await s3Client.send(command);
    return {
      contentType: res.ContentType ?? '',
      contentLength: res.ContentLength ?? 0,
    };
  } catch (err: unknown) {
    const isNotFound =
      (err instanceof Error && (err.name === 'NotFound' || err.name === 'NoSuchKey')) ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (typeof err === 'object' && err !== null && (err as any).$metadata?.httpStatusCode === 404);
    if (isNotFound) throw new AppError(422, 'File not found in storage');
    throw err;
  }
};
