import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface StorageConfig {
  endpoint: string;
  region: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  presignExpirySeconds: number;
}

@Injectable()
export class MinioService implements OnModuleInit {
  private client: S3Client;
  private config: StorageConfig;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.config = this.configService.get<StorageConfig>('storage');
    this.client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
      forcePathStyle: true,
    });
  }

  async upload(bucket: string, objectKey: string, body: Buffer, contentType: string): Promise<void> {
    try {
      await this.client.send(new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: body, ContentType: contentType }));
    } catch (err) {
      throw new InternalServerErrorException(`Failed to upload object: ${(err as Error).message}`);
    }
  }

  async getPresignedUrl(bucket: string, objectKey: string, expiresInSeconds?: number): Promise<string> {
    const expiry = expiresInSeconds ?? this.config.presignExpirySeconds;
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: bucket, Key: objectKey }),
      { expiresIn: expiry },
    );
  }

  async delete(bucket: string, objectKey: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
    } catch (err) {
      throw new InternalServerErrorException(`Failed to delete object: ${(err as Error).message}`);
    }
  }

  async ensureBucket(bucket: string): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (err: any) {
      if (err?.name === 'NoSuchBucket' || err?.$metadata?.httpStatusCode === 404) {
        await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
      }
    }
  }
}
