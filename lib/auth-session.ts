import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

export const AUTH_COOKIE_NAME = "topzyn_auth";
const DEFAULT_AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AuthSessionUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

type AuthSessionPayload = AuthSessionUser & {
  exp: number;
  iat: number;
};

function getAuthSecret(): string {
  const secret =
    process.env.AUTH_SESSION_SECRET ??
    process.env.SECRET_KEY ??
    process.env.OTP_SESSION_SECRET;

  if (!secret || secret.trim().length < 16) {
    throw new Error(
      "AUTH_SESSION_SECRET (atau SECRET_KEY) belum diatur atau terlalu pendek. Minimal 16 karakter.",
    );
  }

  return secret;
}

function getAuthKey(): Buffer {
  return createHash("sha256").update(getAuthSecret()).digest();
}

function toBase64Url(value: Buffer): string {
  return value.toString("base64url");
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function encrypt(payload: AuthSessionPayload): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getAuthKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${toBase64Url(iv)}.${toBase64Url(tag)}.${toBase64Url(encrypted)}`;
}

function decrypt(token: string): AuthSessionPayload | null {
  try {
    const [ivPart, tagPart, encryptedPart] = token.split(".");
    if (!ivPart || !tagPart || !encryptedPart) {
      return null;
    }

    const decipher = createDecipheriv("aes-256-gcm", getAuthKey(), fromBase64Url(ivPart));
    decipher.setAuthTag(fromBase64Url(tagPart));
    const decrypted = Buffer.concat([
      decipher.update(fromBase64Url(encryptedPart)),
      decipher.final(),
    ]);
    const parsed = JSON.parse(decrypted.toString("utf8")) as Partial<AuthSessionPayload>;

    if (
      typeof parsed.id !== "number" ||
      typeof parsed.username !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.role !== "string" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.iat !== "number"
    ) {
      return null;
    }

    return parsed as AuthSessionPayload;
  } catch {
    return null;
  }
}

export function createAuthSessionToken(user: AuthSessionUser) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + DEFAULT_AUTH_MAX_AGE_SECONDS;
  const token = encrypt({
    ...user,
    iat: now,
    exp,
  });
  return {
    token,
    expiresAt: exp,
  };
}

export function parseAuthSessionToken(token: string): AuthSessionUser | null {
  const payload = decrypt(token);
  if (!payload) {
    return null;
  }
  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    id: payload.id,
    username: payload.username,
    email: payload.email,
    role: payload.role,
  };
}

