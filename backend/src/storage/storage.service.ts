import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { randomUUID } from 'crypto';

export interface PresignedUpload {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

@Injectable()
export class StorageService {
  private readonly s3: AWS.S3;
  private readonly bucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {
    this.bucket = config.getOrThrow<string>('AWS_S3_BUCKET');

    this.s3 = new AWS.S3({
      accessKeyId: config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      region: config.get<string>('AWS_REGION', 'us-east-1'),
    });
  }

  /**
   * Generate a pre-signed URL allowing a client to upload a file directly
   * to S3, bypassing the backend (no large-payload bottleneck).
   */
  async createPresignedUpload(
    folder: string,
    mimeType: string,
    expiresInSeconds = 300,
  ): Promise<PresignedUpload> {
    const ext = mimeType.split('/')[1] ?? 'bin';
    const key = `${folder}/${randomUUID()}.${ext}`;

    const uploadUrl = this.s3.getSignedUrl('putObject', {
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
      Expires: expiresInSeconds,
      // ACL removed — use bucket policy / CloudFront instead
    });

    const publicUrl = `https://${this.bucket}.s3.amazonaws.com/${key}`;
    return { uploadUrl, key, publicUrl };
  }

  /**
   * Generate a pre-signed URL to allow a client to download a private object.
   */
  async createPresignedDownload(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.s3.getSignedUrl('getObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: expiresInSeconds,
    });
  }

  /**
   * Delete an object from S3.
   */
  async deleteObject(key: string): Promise<void> {
    await this.s3
      .deleteObject({ Bucket: this.bucket, Key: key })
      .promise();
    this.logger.log(`Deleted S3 object: ${key}`);
  }
}
