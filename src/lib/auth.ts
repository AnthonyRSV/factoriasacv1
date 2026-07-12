import { Role } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

const textEncoder = new TextEncoder();

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const keyData = textEncoder.encode(secret);
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64urlEncode(str: string): string {
  const bytes = textEncoder.encode(str);
  let binString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const binString = atob(str);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev_only';

export async function signToken(payload: JWTPayload): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerStr = base64urlEncode(JSON.stringify(header));
  const payloadStr = base64urlEncode(JSON.stringify({ 
    ...payload, 
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days expiration
  }));
  const partialToken = `${headerStr}.${payloadStr}`;
  
  const key = await getCryptoKey(JWT_SECRET);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, textEncoder.encode(partialToken));
  
  const signatureBytes = new Uint8Array(signatureBuffer);
  let binString = '';
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binString += String.fromCharCode(signatureBytes[i]);
  }
  const signature = btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
    
  return `${partialToken}.${signature}`;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerStr, payloadStr, signatureStr] = parts;
    const partialToken = `${headerStr}.${payloadStr}`;
    
    const key = await getCryptoKey(JWT_SECRET);
    
    const sigStrClean = signatureStr.replace(/-/g, '+').replace(/_/g, '/');
    const sigBinString = atob(sigStrClean);
    const sigBytes = new Uint8Array(sigBinString.length);
    for (let i = 0; i < sigBinString.length; i++) {
      sigBytes[i] = sigBinString.charCodeAt(i);
    }
    
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, textEncoder.encode(partialToken));
    if (!isValid) return null;
    
    const payload = JSON.parse(base64urlDecode(payloadStr)) as JWTPayload & { exp: number };
    
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    
    return payload;
  } catch (err: any) {
    console.error('Token verification failed:', err.message);
    return null;
  }
}
