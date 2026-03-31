import { jwtVerify, SignJWT } from "jose";

const getJwtSecretKey = () => {
  const secret = process.env.ADMIN_SECRET || "drive-planner-secret-key-fallback";
  return new TextEncoder().encode(secret);
};

export async function verifyAuth(token: string) {
  try {
    const verified = await jwtVerify(token, getJwtSecretKey());
    return verified.payload;
  } catch (err) {
    throw new Error("Your token has expired or is invalid.");
  }
}

export async function createAuthToken() {
  const token = await new SignJWT({ user: "admin", authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d") // 30 days session
    .sign(getJwtSecretKey());
  
  return token;
}
