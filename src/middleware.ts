import { Context, Next } from 'hono';
import { verifyToken } from './utils';
import { Bindings, Variables } from './types';

export async function authMiddleware(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  const cookieToken = getCookieValue(c.req.header('Cookie') || '', 'auth_token');
  
  const token = authHeader?.replace('Bearer ', '') || cookieToken;
  
  if (token) {
    const secret = c.env.JWT_SECRET || 'default_secret_change_in_production';
    const payload = await verifyToken(token, secret);
    if (payload) {
      c.set('userId', payload.userId);
      c.set('userType', payload.userType);
      c.set('user', payload);
    }
  }
  
  await next();
}

export async function requireAuth(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: '로그인이 필요합니다.' }, 401);
  }
  await next();
}

export async function requireAdmin(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  const userType = c.get('userType');
  if (userType !== 'admin') {
    return c.json({ error: '관리자 권한이 필요합니다.' }, 403);
  }
  await next();
}

function getCookieValue(cookieStr: string, name: string): string | null {
  const match = cookieStr.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
