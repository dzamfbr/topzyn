import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "crypto";

export const OTP_COOKIE_NAME = "topzyn_pending_register";
const OTP_DIGIT_LENGTH = 6;
const DEFAULT_TTL_MINUTES = 5;
const MAX_TTL_MINUTES = 30;
const MIN_TTL_MINUTES = 1;

export type PendingRegisterSession = {
  username: string;
  email: string;
  passwordHash: string;
  otpCode: string;
  otpExpire: number;
  createdAt: number;
};

type SerializedPayload = {
  username: string;
  email: string;
  passwordHash: string;
  otpCode: string;
  otpExpire: number;
  createdAt: number;
};

function getSessionSecret(): string {
  const secret = process.env.OTP_SESSION_SECRET ?? process.env.SECRET_KEY;
  if (!secret || secret.trim().length < 16) {
    throw new Error(
      "OTP_SESSION_SECRET (atau SECRET_KEY) belum diatur atau terlalu pendek. Isi minimal 16 karakter.",
    );
  }
  return secret;
}

function getSessionKey(): Buffer {
  return createHash("sha256").update(getSessionSecret()).digest();
}

function toBase64Url(value: Buffer): string {
  return value.toString("base64url");
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

export function getOtpTtlMinutes(): number {
  const raw = Number.parseInt(process.env.OTP_TTL_MINUTES ?? "", 10);
  if (!Number.isFinite(raw)) {
    return DEFAULT_TTL_MINUTES;
  }
  return Math.min(MAX_TTL_MINUTES, Math.max(MIN_TTL_MINUTES, raw));
}

export function createOtpCode(): string {
  let otp = "";
  for (let index = 0; index < OTP_DIGIT_LENGTH; index += 1) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

export function createOtpExpire(): number {
  return Math.floor(Date.now() / 1000) + getOtpTtlMinutes() * 60;
}

export function encodeOtpSession(payload: PendingRegisterSession): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getSessionKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${toBase64Url(iv)}.${toBase64Url(tag)}.${toBase64Url(encrypted)}`;
}

export function decodeOtpSession(value: string): PendingRegisterSession | null {
  try {
    const [ivPart, tagPart, encryptedPart] = value.split(".");
    if (!ivPart || !tagPart || !encryptedPart) {
      return null;
    }

    const decipher = createDecipheriv("aes-256-gcm", getSessionKey(), fromBase64Url(ivPart));
    decipher.setAuthTag(fromBase64Url(tagPart));
    const decrypted = Buffer.concat([
      decipher.update(fromBase64Url(encryptedPart)),
      decipher.final(),
    ]);

    const parsed = JSON.parse(decrypted.toString("utf8")) as SerializedPayload;
    if (
      typeof parsed.username !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.passwordHash !== "string" ||
      typeof parsed.otpCode !== "string" ||
      typeof parsed.otpExpire !== "number" ||
      typeof parsed.createdAt !== "number"
    ) {
      return null;
    }

    return {
      username: parsed.username,
      email: parsed.email,
      passwordHash: parsed.passwordHash,
      otpCode: parsed.otpCode,
      otpExpire: parsed.otpExpire,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export function isOtpExpired(otpExpire: number): boolean {
  return Math.floor(Date.now() / 1000) >= otpExpire;
}

export function isValidOtpFormat(otp: string): boolean {
  return /^[0-9]{6}$/.test(otp);
}

export function otpMatches(input: string, expected: string): boolean {
  if (input.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}
