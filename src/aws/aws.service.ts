import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class AwsService {
  private readonly region =
    process.env.AWS_BUCKET_REGION || process.env.AWS_REGION || 'us-east-1';
  private readonly s3 = new S3Client({
    region: this.region,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
  private readonly bucketName = process.env.AWS_S3_BUCKET_NAME!;

  // Allowed image MIME types for profile photos
  private readonly allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  /**
   * Validate if a file is an image
   */
  private isImageFile(file: Express.Multer.File): boolean {
    return this.allowedImageTypes.includes(file.mimetype);
  }

  private getFileUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Upload a single file to S3
   */
  async upload(file: Express.Multer.File): Promise<any> {
    if (!file) {
      throw new BadRequestException('File not provided');
    }

    const fileKey = `uploads/${file.originalname}-${Date.now()}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentDisposition: 'inline',
        ContentType: file.mimetype,
      }),
    );

    return {
      status: 'success',
      message: 'File uploaded successfully',
      url: this.getFileUrl(fileKey),
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Upload multiple files to S3
   */
  async uploadMultiple(files: Express.Multer.File[]): Promise<any> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map(async (file) => {
      const fileKey = `uploads/${file.originalname}-${Date.now()}`;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
          Body: file.buffer,
          ContentDisposition: 'inline',
          ContentType: file.mimetype,
        }),
      );

      return {
        url: this.getFileUrl(fileKey),
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      };
    });

    const results = await Promise.all(uploadPromises);

    return {
      status: 'success',
      message: `${files.length} file(s) uploaded successfully`,
      files: results,
      count: files.length,
    };
  }

  /**
   * Upload profile photo (images only)
   */
  async uploadProfilePhoto(
    userId: string,
    file: Express.Multer.File,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('File not provided');
    }

    // Validate that the file is an image
    if (!this.isImageFile(file)) {
      throw new BadRequestException(
        `Only image files are allowed for profile photos. Allowed types: ${this.allowedImageTypes.join(', ')}`,
      );
    }

    const fileKey = `profiles/${userId}/avatar-${Date.now()}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentDisposition: 'inline',
        ContentType: file.mimetype,
      }),
    );

    return {
      status: 'success',
      message: 'Profile photo uploaded successfully',
      url: this.getFileUrl(fileKey),
    };
  }
}
