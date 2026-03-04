import { describe, it, expect } from 'vitest';
import { EnvelopeEncryption } from '../../../src/privacy-platform/services/encryption.js';
import type { EncryptedPayload, KeyMaterial } from '../../../src/privacy-platform/services/encryption.js';

describe('EnvelopeEncryption', () => {
  // Helper to create a valid KEK for tests
  function createKek(): KeyMaterial {
    return EnvelopeEncryption.generateKeyMaterial();
  }

  describe('generateKey', () => {
    it('should return a Buffer of 32 bytes', () => {
      const key = EnvelopeEncryption.generateKey();
      expect(Buffer.isBuffer(key)).toBe(true);
      expect(key.length).toBe(32);
    });

    it('should return a different key each time', () => {
      const key1 = EnvelopeEncryption.generateKey();
      const key2 = EnvelopeEncryption.generateKey();
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('generateKeyMaterial', () => {
    it('should return a proper KeyMaterial structure', () => {
      const km = EnvelopeEncryption.generateKeyMaterial();

      expect(km).toHaveProperty('keyId');
      expect(km).toHaveProperty('key');
      expect(km).toHaveProperty('createdAt');

      // keyId should be a valid UUID
      expect(km.keyId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );

      // key should be a 32-byte Buffer
      expect(Buffer.isBuffer(km.key)).toBe(true);
      expect(km.key.length).toBe(32);

      // createdAt should be a valid ISO date string
      expect(new Date(km.createdAt).toISOString()).toBe(km.createdAt);
    });

    it('should generate unique keyIds on each call', () => {
      const km1 = EnvelopeEncryption.generateKeyMaterial();
      const km2 = EnvelopeEncryption.generateKeyMaterial();
      expect(km1.keyId).not.toBe(km2.keyId);
    });

    it('should not include rotatedAt by default', () => {
      const km = EnvelopeEncryption.generateKeyMaterial();
      expect(km.rotatedAt).toBeUndefined();
    });
  });

  describe('encrypt / decrypt round-trip', () => {
    it('should decrypt back to the original plaintext', () => {
      const kek = createKek();
      const plaintext = 'Hello, World!';

      const encrypted = EnvelopeEncryption.encrypt(plaintext, kek);
      const decrypted = EnvelopeEncryption.decrypt(encrypted, kek);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string', () => {
      const kek = createKek();
      const plaintext = '';

      const encrypted = EnvelopeEncryption.encrypt(plaintext, kek);
      const decrypted = EnvelopeEncryption.decrypt(encrypted, kek);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode content', () => {
      const kek = createKek();
      const plaintext = 'Unicode test: \u00e9\u00e0\u00fc\u00f1 \u4f60\u597d \ud83d\ude00';

      const encrypted = EnvelopeEncryption.encrypt(plaintext, kek);
      const decrypted = EnvelopeEncryption.decrypt(encrypted, kek);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle large plaintext', () => {
      const kek = createKek();
      const plaintext = 'A'.repeat(100_000);

      const encrypted = EnvelopeEncryption.encrypt(plaintext, kek);
      const decrypted = EnvelopeEncryption.decrypt(encrypted, kek);

      expect(decrypted).toBe(plaintext);
    });

    it('should return a properly structured EncryptedPayload', () => {
      const kek = createKek();
      const encrypted = EnvelopeEncryption.encrypt('test data', kek);

      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('keyId');
      expect(encrypted).toHaveProperty('wrappedDek');
      expect(encrypted).toHaveProperty('dekIv');
      expect(encrypted).toHaveProperty('dekAuthTag');

      // All values should be base64-encoded strings
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      expect(encrypted.ciphertext).toMatch(base64Regex);
      expect(encrypted.iv).toMatch(base64Regex);
      expect(encrypted.authTag).toMatch(base64Regex);
      expect(encrypted.wrappedDek).toMatch(base64Regex);
      expect(encrypted.dekIv).toMatch(base64Regex);
      expect(encrypted.dekAuthTag).toMatch(base64Regex);

      // keyId should match the KEK's keyId
      expect(encrypted.keyId).toBe(kek.keyId);
    });
  });

  describe('different plaintexts produce different ciphertexts', () => {
    it('should produce different ciphertexts for different plaintexts', () => {
      const kek = createKek();
      const encrypted1 = EnvelopeEncryption.encrypt('plaintext one', kek);
      const encrypted2 = EnvelopeEncryption.encrypt('plaintext two', kek);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    });

    it('should produce different ciphertexts for the same plaintext (due to random DEK and IV)', () => {
      const kek = createKek();
      const encrypted1 = EnvelopeEncryption.encrypt('same plaintext', kek);
      const encrypted2 = EnvelopeEncryption.encrypt('same plaintext', kek);

      // Even with the same plaintext, the random DEK and IV should make ciphertexts differ
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.wrappedDek).not.toBe(encrypted2.wrappedDek);
    });
  });

  describe('decrypt fails with wrong KEK', () => {
    it('should throw when decrypting with a different KEK (same keyId forced)', () => {
      const kek1 = createKek();
      const kek2 = createKek();

      const encrypted = EnvelopeEncryption.encrypt('secret data', kek1);

      // Force the same keyId so it passes the ID check but fails on crypto
      const wrongKek: KeyMaterial = {
        ...kek2,
        keyId: kek1.keyId,
      };

      expect(() => EnvelopeEncryption.decrypt(encrypted, wrongKek)).toThrow();
    });
  });

  describe('decrypt fails with tampered ciphertext', () => {
    it('should throw when ciphertext is tampered', () => {
      const kek = createKek();
      const encrypted = EnvelopeEncryption.encrypt('sensitive data', kek);

      // Tamper with the ciphertext by modifying a character
      const ciphertextBuf = Buffer.from(encrypted.ciphertext, 'base64');
      ciphertextBuf[0] ^= 0xff;
      const tampered: EncryptedPayload = {
        ...encrypted,
        ciphertext: ciphertextBuf.toString('base64'),
      };

      expect(() => EnvelopeEncryption.decrypt(tampered, kek)).toThrow();
    });

    it('should throw when authTag is tampered', () => {
      const kek = createKek();
      const encrypted = EnvelopeEncryption.encrypt('sensitive data', kek);

      const authTagBuf = Buffer.from(encrypted.authTag, 'base64');
      authTagBuf[0] ^= 0xff;
      const tampered: EncryptedPayload = {
        ...encrypted,
        authTag: authTagBuf.toString('base64'),
      };

      expect(() => EnvelopeEncryption.decrypt(tampered, kek)).toThrow();
    });

    it('should throw when wrappedDek is tampered', () => {
      const kek = createKek();
      const encrypted = EnvelopeEncryption.encrypt('sensitive data', kek);

      const wrappedDekBuf = Buffer.from(encrypted.wrappedDek, 'base64');
      wrappedDekBuf[0] ^= 0xff;
      const tampered: EncryptedPayload = {
        ...encrypted,
        wrappedDek: wrappedDekBuf.toString('base64'),
      };

      expect(() => EnvelopeEncryption.decrypt(tampered, kek)).toThrow();
    });

    it('should throw when iv is tampered', () => {
      const kek = createKek();
      const encrypted = EnvelopeEncryption.encrypt('sensitive data', kek);

      const ivBuf = Buffer.from(encrypted.iv, 'base64');
      ivBuf[0] ^= 0xff;
      const tampered: EncryptedPayload = {
        ...encrypted,
        iv: ivBuf.toString('base64'),
      };

      expect(() => EnvelopeEncryption.decrypt(tampered, kek)).toThrow();
    });
  });

  describe('decrypt fails with mismatched keyId', () => {
    it('should throw an error mentioning key ID mismatch', () => {
      const kek = createKek();
      const encrypted = EnvelopeEncryption.encrypt('data', kek);

      const mismatchedKek: KeyMaterial = {
        ...kek,
        keyId: 'wrong-key-id',
      };

      expect(() => EnvelopeEncryption.decrypt(encrypted, mismatchedKek)).toThrow(
        /Key ID mismatch/,
      );
    });

    it('should include both keyIds in the error message', () => {
      const kek = createKek();
      const encrypted = EnvelopeEncryption.encrypt('data', kek);

      const otherKeyId = 'other-key-id-123';
      const mismatchedKek: KeyMaterial = {
        ...kek,
        keyId: otherKeyId,
      };

      expect(() => EnvelopeEncryption.decrypt(encrypted, mismatchedKek)).toThrow(
        new RegExp(`payload uses '${kek.keyId}'.*provided '${otherKeyId}'`),
      );
    });
  });

  describe('key rotation', () => {
    it('should produce a new payload that decrypts with the new KEK', () => {
      const oldKek = createKek();
      const newKek = createKek();
      const plaintext = 'data to rotate';

      const encrypted = EnvelopeEncryption.encrypt(plaintext, oldKek);
      const rotated = EnvelopeEncryption.rotateKey(encrypted, oldKek, newKek);

      const decrypted = EnvelopeEncryption.decrypt(rotated, newKek);
      expect(decrypted).toBe(plaintext);
    });

    it('should update the keyId to the new KEK keyId', () => {
      const oldKek = createKek();
      const newKek = createKek();

      const encrypted = EnvelopeEncryption.encrypt('test', oldKek);
      const rotated = EnvelopeEncryption.rotateKey(encrypted, oldKek, newKek);

      expect(rotated.keyId).toBe(newKek.keyId);
    });

    it('should preserve the original ciphertext, iv, and authTag', () => {
      const oldKek = createKek();
      const newKek = createKek();

      const encrypted = EnvelopeEncryption.encrypt('test', oldKek);
      const rotated = EnvelopeEncryption.rotateKey(encrypted, oldKek, newKek);

      // The data-level encryption is untouched; only the DEK wrapping changes
      expect(rotated.ciphertext).toBe(encrypted.ciphertext);
      expect(rotated.iv).toBe(encrypted.iv);
      expect(rotated.authTag).toBe(encrypted.authTag);
    });

    it('should change the wrappedDek, dekIv, and dekAuthTag', () => {
      const oldKek = createKek();
      const newKek = createKek();

      const encrypted = EnvelopeEncryption.encrypt('test', oldKek);
      const rotated = EnvelopeEncryption.rotateKey(encrypted, oldKek, newKek);

      expect(rotated.wrappedDek).not.toBe(encrypted.wrappedDek);
      expect(rotated.dekIv).not.toBe(encrypted.dekIv);
      // dekAuthTag may or may not differ, but the wrapping is definitely different
    });
  });

  describe('key rotation preserves original data', () => {
    it('should decrypt to the same plaintext after rotation', () => {
      const oldKek = createKek();
      const newKek = createKek();
      const plaintext = 'important secret data that must survive rotation';

      const encrypted = EnvelopeEncryption.encrypt(plaintext, oldKek);
      const decryptedBefore = EnvelopeEncryption.decrypt(encrypted, oldKek);

      const rotated = EnvelopeEncryption.rotateKey(encrypted, oldKek, newKek);
      const decryptedAfter = EnvelopeEncryption.decrypt(rotated, newKek);

      expect(decryptedBefore).toBe(plaintext);
      expect(decryptedAfter).toBe(plaintext);
      expect(decryptedAfter).toBe(decryptedBefore);
    });

    it('should work through multiple rotations', () => {
      const kek1 = createKek();
      const kek2 = createKek();
      const kek3 = createKek();
      const plaintext = 'multi-rotation test';

      const encrypted = EnvelopeEncryption.encrypt(plaintext, kek1);
      const rotated1 = EnvelopeEncryption.rotateKey(encrypted, kek1, kek2);
      const rotated2 = EnvelopeEncryption.rotateKey(rotated1, kek2, kek3);

      const decrypted = EnvelopeEncryption.decrypt(rotated2, kek3);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('old KEK cannot decrypt after rotation', () => {
    it('should fail to decrypt rotated payload with the old KEK', () => {
      const oldKek = createKek();
      const newKek = createKek();

      const encrypted = EnvelopeEncryption.encrypt('secret', oldKek);
      const rotated = EnvelopeEncryption.rotateKey(encrypted, oldKek, newKek);

      // The keyId has changed, so it should throw a Key ID mismatch error
      expect(() => EnvelopeEncryption.decrypt(rotated, oldKek)).toThrow(/Key ID mismatch/);
    });

    it('should also fail if we force the old KEK keyId to match', () => {
      const oldKek = createKek();
      const newKek = createKek();

      const encrypted = EnvelopeEncryption.encrypt('secret', oldKek);
      const rotated = EnvelopeEncryption.rotateKey(encrypted, oldKek, newKek);

      // Force keyId to match the rotated payload so it bypasses the ID check
      const forcedOldKek: KeyMaterial = {
        ...oldKek,
        keyId: newKek.keyId,
      };

      // Should fail on the crypto level since the key bytes are wrong
      expect(() => EnvelopeEncryption.decrypt(rotated, forcedOldKek)).toThrow();
    });
  });

  describe('hash', () => {
    it('should produce a consistent SHA-256 hex string', () => {
      const data = 'test data';
      const hash1 = EnvelopeEncryption.hash(data);
      const hash2 = EnvelopeEncryption.hash(data);

      expect(hash1).toBe(hash2);
    });

    it('should return a 64-character hex string', () => {
      const hash = EnvelopeEncryption.hash('anything');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = EnvelopeEncryption.hash('input one');
      const hash2 = EnvelopeEncryption.hash('input two');

      expect(hash1).not.toBe(hash2);
    });

    it('should produce a known SHA-256 hash for a known input', () => {
      // SHA-256 of empty string is well-known
      const hash = EnvelopeEncryption.hash('');
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('should handle unicode input', () => {
      const hash = EnvelopeEncryption.hash('\u4f60\u597d\u4e16\u754c');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      // Consistent across calls
      expect(EnvelopeEncryption.hash('\u4f60\u597d\u4e16\u754c')).toBe(hash);
    });
  });
});
