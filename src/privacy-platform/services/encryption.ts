import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export interface EncryptedPayload {
  /** Base64-encoded encrypted data */
  ciphertext: string;
  /** Base64-encoded initialization vector */
  iv: string;
  /** Base64-encoded authentication tag */
  authTag: string;
  /** Key ID for key rotation tracking */
  keyId: string;
  /** Base64-encoded wrapped DEK (encrypted with KEK) */
  wrappedDek: string;
  /** Base64-encoded IV used for DEK wrapping */
  dekIv: string;
  /** Base64-encoded auth tag for DEK wrapping */
  dekAuthTag: string;
}

export interface KeyMaterial {
  keyId: string;
  key: Buffer;
  createdAt: string;
  rotatedAt?: string;
}

export class EnvelopeEncryption {
  /**
   * Generate a new random key (KEK or standalone)
   */
  static generateKey(): Buffer {
    return crypto.randomBytes(KEY_LENGTH);
  }

  /**
   * Generate key material with ID and metadata
   */
  static generateKeyMaterial(): KeyMaterial {
    return {
      keyId: crypto.randomUUID(),
      key: EnvelopeEncryption.generateKey(),
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Encrypt data using envelope encryption
   * 1. Generate random DEK
   * 2. Encrypt data with DEK (AES-256-GCM)
   * 3. Wrap DEK with KEK (AES-256-GCM)
   * 4. Return encrypted payload with wrapped DEK
   */
  static encrypt(plaintext: string, kek: KeyMaterial): EncryptedPayload {
    // Generate a random DEK
    const dek = crypto.randomBytes(KEY_LENGTH);

    // Encrypt data with DEK
    const dataIv = crypto.randomBytes(IV_LENGTH);
    const dataCipher = crypto.createCipheriv(ALGORITHM, dek, dataIv);
    const encrypted = Buffer.concat([
      dataCipher.update(plaintext, 'utf8'),
      dataCipher.final(),
    ]);
    const dataAuthTag = dataCipher.getAuthTag();

    // Wrap DEK with KEK
    const dekIv = crypto.randomBytes(IV_LENGTH);
    const dekCipher = crypto.createCipheriv(ALGORITHM, kek.key, dekIv);
    const wrappedDek = Buffer.concat([
      dekCipher.update(dek),
      dekCipher.final(),
    ]);
    const dekAuthTag = dekCipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: dataIv.toString('base64'),
      authTag: dataAuthTag.toString('base64'),
      keyId: kek.keyId,
      wrappedDek: wrappedDek.toString('base64'),
      dekIv: dekIv.toString('base64'),
      dekAuthTag: dekAuthTag.toString('base64'),
    };
  }

  /**
   * Decrypt data using envelope encryption
   * 1. Unwrap DEK using KEK
   * 2. Decrypt data using DEK
   */
  static decrypt(payload: EncryptedPayload, kek: KeyMaterial): string {
    // Verify key ID matches
    if (payload.keyId !== kek.keyId) {
      throw new Error(`Key ID mismatch: payload uses '${payload.keyId}', provided '${kek.keyId}'`);
    }

    // Unwrap DEK
    const dekDecipher = crypto.createDecipheriv(
      ALGORITHM,
      kek.key,
      Buffer.from(payload.dekIv, 'base64')
    );
    dekDecipher.setAuthTag(Buffer.from(payload.dekAuthTag, 'base64'));
    const dek = Buffer.concat([
      dekDecipher.update(Buffer.from(payload.wrappedDek, 'base64')),
      dekDecipher.final(),
    ]);

    // Decrypt data
    const dataDecipher = crypto.createDecipheriv(
      ALGORITHM,
      dek,
      Buffer.from(payload.iv, 'base64')
    );
    dataDecipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
    const decrypted = Buffer.concat([
      dataDecipher.update(Buffer.from(payload.ciphertext, 'base64')),
      dataDecipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * Re-wrap a payload with a new KEK (key rotation)
   * Decrypts DEK with old KEK, re-encrypts with new KEK.
   * Data remains encrypted with original DEK.
   */
  static rotateKey(payload: EncryptedPayload, oldKek: KeyMaterial, newKek: KeyMaterial): EncryptedPayload {
    // Unwrap DEK with old KEK
    const dekDecipher = crypto.createDecipheriv(
      ALGORITHM,
      oldKek.key,
      Buffer.from(payload.dekIv, 'base64')
    );
    dekDecipher.setAuthTag(Buffer.from(payload.dekAuthTag, 'base64'));
    const dek = Buffer.concat([
      dekDecipher.update(Buffer.from(payload.wrappedDek, 'base64')),
      dekDecipher.final(),
    ]);

    // Re-wrap DEK with new KEK
    const newDekIv = crypto.randomBytes(IV_LENGTH);
    const dekCipher = crypto.createCipheriv(ALGORITHM, newKek.key, newDekIv);
    const newWrappedDek = Buffer.concat([
      dekCipher.update(dek),
      dekCipher.final(),
    ]);
    const newDekAuthTag = dekCipher.getAuthTag();

    return {
      ...payload,
      keyId: newKek.keyId,
      wrappedDek: newWrappedDek.toString('base64'),
      dekIv: newDekIv.toString('base64'),
      dekAuthTag: newDekAuthTag.toString('base64'),
    };
  }

  /**
   * Compute SHA-256 hash of data (for policy_hash, params_hash)
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
