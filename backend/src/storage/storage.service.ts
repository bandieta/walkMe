import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobServiceClient,
  BlobSASPermissions,
  SASProtocol,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { randomUUID } from 'crypto';

export interface PresignedUpload {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

@Injectable()
export class StorageService {
  private readonly blobService: BlobServiceClient;
  private readonly container: string;
  private readonly accountName: string;
  private readonly credential: StorageSharedKeyCredential;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {
    this.accountName = config.getOrThrow<string>('AZURE_STORAGE_ACCOUNT_NAME');
    const accountKey   = config.getOrThrow<string>('AZURE_STORAGE_ACCOUNT_KEY');
    this.container     = config.getOrThrow<string>('AZURE_STORAGE_CONTAINER');

    this.credential  = new StorageSharedKeyCredential(this.accountName, accountKey);
    this.blobService = new BlobServiceClient(
      `https://${this.accountName}.blob.core.windows.net`,
      this.credential,
    );
  }

  /**
   * Generate a SAS URL allowing a client to upload a blob directly
   * to Azure Blob Storage, bypassing the backend.
   */
  async createPresignedUpload(
    folder: string,
    mimeType: string,
    expiresInSeconds = 300,
  ): Promise<PresignedUpload> {
    const ext = mimeType.split('/')[1] ?? 'bin';
    const key = `${folder}/${randomUUID()}.${ext}`;

    const expiresOn = new Date(Date.now() + expiresInSeconds * 1000);
    const sasToken  = generateBlobSASQueryParameters(
      {
        containerName: this.container,
        blobName: key,
        permissions: BlobSASPermissions.parse('cw'), // create + write
        contentType: mimeType,
        expiresOn,
        protocol: SASProtocol.Https,
      },
      this.credential,
    ).toString();

    const publicUrl = `https://${this.accountName}.blob.core.windows.net/${this.container}/${key}`;
    const uploadUrl = `${publicUrl}?${sasToken}`;
    return { uploadUrl, key, publicUrl };
  }

  /**
   * Generate a SAS URL to allow a client to download a private blob.
   */
  async createPresignedDownload(key: string, expiresInSeconds = 3600): Promise<string> {
    const expiresOn = new Date(Date.now() + expiresInSeconds * 1000);
    const sasToken  = generateBlobSASQueryParameters(
      {
        containerName: this.container,
        blobName: key,
        permissions: BlobSASPermissions.parse('r'),
        expiresOn,
        protocol: SASProtocol.Https,
      },
      this.credential,
    ).toString();

    return `https://${this.accountName}.blob.core.windows.net/${this.container}/${key}?${sasToken}`;
  }

  /**
   * Delete a blob from Azure Blob Storage.
   */
  async deleteObject(key: string): Promise<void> {
    const containerClient = this.blobService.getContainerClient(this.container);
    await containerClient.deleteBlob(key);
    this.logger.log(`Deleted Azure blob: ${key}`);
  }
}
