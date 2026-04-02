import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Dummy for test
if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = "dummy-key-32-chars-exactly-12345";
}

import { encrypt, decrypt } from "./lib/crypto";

const secret = "AIzaSy-Test-Key-V2-67890";
console.log("Original:", secret);

try {
    const enc = encrypt(secret);
    console.log("Encrypted:", enc);

    const dec = decrypt(enc);
    console.log("Decrypted:", dec);

    if (secret === dec) {
        console.log("✅ Encryption works!");
    } else {
        console.log("❌ Failed!");
    }
} catch (e: any) {
    console.log("❌ Error:", e.message);
}
