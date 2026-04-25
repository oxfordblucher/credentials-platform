import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '../errors/AppError.js';

const s3Client = new S3Client({ region: process.env.S3_REGION! });

export const getPutPresignedUrl = async (key: string, expiresIn: number): Promise<string> => {
  const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
};

export const headObject = async (key: string): Promise<void> => {
  try {
    const command = new HeadObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: key });
    await s3Client.send(command);
  } catch (err: unknown) {
    const isNotFound =
      (err instanceof Error && (err.name === 'NotFound' || err.name === 'NoSuchKey')) ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (typeof err === 'object' && err !== null && (err as any).$metadata?.httpStatusCode === 404);
    if (isNotFound) throw new AppError(422, 'File not found in storage');
    throw err;
  }
};
