import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.S3_REGION! });

export const getPutPresignedUrl = async (key: string, expiresIn: number): Promise<string> => {
  const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
};
