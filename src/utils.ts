// Simple JWT implementation for Cloudflare Workers
export async function createToken(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(unescape(encodeURIComponent(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }))))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigArray = Array.from(new Uint8Array(signature));
  let binary = '';
  for (const byte of sigArray) binary += String.fromCharCode(byte);
  const encodedSig = btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${data}.${encodedSig}`;
}

export async function verifyToken(token: string, secret: string): Promise<any | null> {
  try {
    const [headerB64, payloadB64, sigB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !sigB64) return null;
    
    const data = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const sigStr = sigB64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = sigStr + '=='.slice(0, (4 - sigStr.length % 4) % 4);
    const sigBinary = atob(padded);
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) sigBytes[i] = sigBinary.charCodeAt(i);
    
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return null;
    
    const payloadStr = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const payloadPadded = payloadStr + '=='.slice(0, (4 - payloadStr.length % 4) % 4);
    const payload = JSON.parse(decodeURIComponent(escape(atob(payloadPadded))));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password + 'bunyang_salt_2025');
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuf));
  // Convert to base64 safely
  let binary = '';
  for (let i = 0; i < hashArray.length; i++) {
    binary += String.fromCharCode(hashArray[i]);
  }
  return btoa(binary);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

export function formatPrice(price: number): string {
  if (price >= 100000000) {
    const eok = Math.floor(price / 100000000);
    const man = Math.floor((price % 100000000) / 10000);
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
  }
  return `${Math.floor(price / 10000).toLocaleString()}만원`;
}

export function getRegionBadgeClass(region: string): string {
  const map: Record<string, string> = {
    '서울': 'badge-blue',
    '경기': 'badge-green',
    '인천': 'badge-teal',
    '부산': 'badge-orange',
    '충청': 'badge-purple',
    '전라': 'badge-yellow',
    '경상': 'badge-red',
    '강원': 'badge-indigo',
    '제주': 'badge-pink',
  };
  return map[region] || 'badge-gray';
}
