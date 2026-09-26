import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const hexKey = process.env.ENCRYPTION_MASTER_KEY || 'f8a3c2d1e0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a403';
    this.key = Buffer.from(hexKey, 'hex');
    if (this.key.length !== 32) {
      throw new Error(`ENCRYPTION_MASTER_KEY must be exactly 32 bytes (64 hex characters). Received ${this.key.length} bytes.`);
    }
  }

  encrypt(plainText: string): string {
    if (!plainText) return plainText;
    if (plainText.startsWith('enc:v1:')) return plainText; // Already encrypted

    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decrypt(cipherText: string): string {
    if (!cipherText || !cipherText.startsWith('enc:v1:')) {
      return cipherText;
    }

    const parts = cipherText.split(':');
    if (parts.length !== 5) {
      throw new Error('Invalid AES-256-GCM ciphertext format');
    }

    const iv = Buffer.from(parts[2], 'hex');
    const authTag = Buffer.from(parts[3], 'hex');
    const encryptedData = parts[4];

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  mask(value: string, visibleDigits: number = 4): string {
    if (!value) return value;
    const decrypted = this.decrypt(value);
    if (decrypted.length <= visibleDigits) {
      return '*'.repeat(decrypted.length);
    }
    const masked = '*'.repeat(decrypted.length - visibleDigits) + decrypted.slice(-visibleDigits);
    return masked;
  }
}
