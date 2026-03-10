import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { hashPassword, verifyPassword, createToken } from '../utils';
import { authMiddleware, requireAuth } from '../middleware';

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();
auth.use('*', authMiddleware);

// 회원가입
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, phone, user_type, company_name, business_number } = body;

    if (!email || !password || !name) {
      return c.json({ error: '필수 항목을 입력해주세요.' }, 400);
    }

    if (password.length < 8) {
      return c.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, 400);
    }

    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
      return c.json({ error: '이미 사용 중인 이메일입니다.' }, 409);
    }

    const hashedPw = await hashPassword(password);
    const result = await c.env.DB.prepare(
      `INSERT INTO users (email, password, name, phone, user_type, company_name, business_number) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(email, hashedPw, name, phone || null, user_type || 'normal', company_name || null, business_number || null).run();

    return c.json({ success: true, userId: result.meta.last_row_id, message: '회원가입이 완료되었습니다.' });
  } catch (e: any) {
    return c.json({ error: '서버 오류: ' + e.message }, 500);
  }
});

// 로그인
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: '이메일과 비밀번호를 입력해주세요.' }, 400);
    }

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').bind(email).first() as any;
    if (!user) {
      return c.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return c.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);
    }

    const secret = c.env.JWT_SECRET || 'default_secret_change_in_production';
    const token = await createToken(
      { userId: user.id, userType: user.user_type, email: user.email, name: user.name,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 },
      secret
    );

    const { password: _, ...userWithoutPassword } = user;
    return c.json({ success: true, token, user: userWithoutPassword });
  } catch (e: any) {
    return c.json({ error: '서버 오류: ' + e.message }, 500);
  }
});

// 내 정보 조회
auth.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId');
  const user = await c.env.DB.prepare('SELECT id, email, name, phone, user_type, company_name, business_number, alert_regions, alert_ranks, created_at FROM users WHERE id = ?').bind(userId).first();
  if (!user) return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404);
  return c.json(user);
});

// 내 정보 수정
auth.put('/me', requireAuth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { name, phone, company_name, alert_regions, alert_ranks } = body;

  await c.env.DB.prepare(
    `UPDATE users SET name=?, phone=?, company_name=?, alert_regions=?, alert_ranks=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(name, phone || null, company_name || null, 
    JSON.stringify(alert_regions || []), JSON.stringify(alert_ranks || []), userId).run();

  return c.json({ success: true, message: '정보가 수정되었습니다.' });
});

// 비밀번호 변경
auth.put('/password', requireAuth, async (c) => {
  const userId = c.get('userId');
  const { current_password, new_password } = await c.req.json();

  const user = await c.env.DB.prepare('SELECT password FROM users WHERE id = ?').bind(userId).first() as any;
  const valid = await verifyPassword(current_password, user.password);
  if (!valid) return c.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, 400);
  if (new_password.length < 8) return c.json({ error: '새 비밀번호는 8자 이상이어야 합니다.' }, 400);

  const hashed = await hashPassword(new_password);
  await c.env.DB.prepare('UPDATE users SET password=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(hashed, userId).run();

  return c.json({ success: true, message: '비밀번호가 변경되었습니다.' });
});

export default auth;
