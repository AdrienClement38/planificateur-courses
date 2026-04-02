import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Encrypts a string using AES-256-GCM.
 * Requires ENCRYPTION_KEY (32 chars) in environment.
 */
export function encrypt(text: string): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length < 32) {
        throw new Error("ENCRYPTION_KEY must be at least 32 characters long. Please set it in .env.local.");
    }

    // Use the first 32 bytes of the key
    const keyBuffer = Buffer.from(key.slice(0, 32));
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Format: iv:tag:encrypted (all hex)
    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a string using AES-256-GCM.
 */
export function decrypt(ciphered: string): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length < 32) {
        throw new Error("ENCRYPTION_KEY must be at least 32 characters long. Please set it in .env.local.");
    }

    const keyBuffer = Buffer.from(key.slice(0, 32));
    const [ivHex, tagHex, encryptedHex] = ciphered.split(":");

    if (!ivHex || !tagHex || !encryptedHex) {
        throw new Error("Invalid encrypted format. Expected iv:tag:encrypted.");
    }

    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
}
