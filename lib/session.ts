import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { Track } from './config-types';

export const SESSION_COOKIE = 'sb_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 gün

export type SessionUser = {
  email: string;
  name: string;
  track: Track;
  isAdmin: boolean;
};

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET tanımlı değil.');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, track: user.track, isAdmin: user.isAdmin })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.email)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

/** Token'ı doğrular. proxy.ts de bunu kullanır (Node.js runtime'da çalışır). */
export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return {
      email: payload.sub,
      name: String(payload.name ?? ''),
      track: payload.track as Track,
      isAdmin: payload.isAdmin === true,
    };
  } catch {
    return null;
  }
}

/** Sunucu bileşenleri ve route handler'lar için oturumu okur. */
export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Oturum yoksa 401 fırlatmak yerine çağıran tarafın karar vermesi için null döner. */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
