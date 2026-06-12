// Audio storage abstraction. Multer always lands uploads on local disk
// first (Whisper needs a file stream anyway); `store` then decides where
// the file permanently lives. With S3 configured (S3_BUCKET set) the file
// is uploaded to S3 and removed locally; otherwise it stays on disk.
import fs from 'node:fs';
import path from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { config } from '../config';

export interface AudioStorage {
  /** Persists the uploaded file and returns its location URI. */
  store(localPath: string): Promise<string>;
}

class LocalAudioStorage implements AudioStorage {
  async store(localPath: string): Promise<string> {
    return `local:${path.basename(localPath)}`;
  }
}

class S3AudioStorage implements AudioStorage {
  private readonly client: S3Client;

  constructor(private readonly bucket: string) {
    this.client = new S3Client({
      ...(config.S3_ENDPOINT ? { endpoint: config.S3_ENDPOINT, forcePathStyle: true } : {}),
    });
  }

  async store(localPath: string): Promise<string> {
    const key = `audio/${path.basename(localPath)}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fs.createReadStream(localPath),
      }),
    );
    await fs.promises.unlink(localPath);
    return `s3://${this.bucket}/${key}`;
  }
}

export function createAudioStorage(): AudioStorage {
  if (config.S3_BUCKET) {
    return new S3AudioStorage(config.S3_BUCKET);
  }
  return new LocalAudioStorage();
}

export const audioStorage = createAudioStorage();
