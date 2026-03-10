import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, requireAuth, requireAdmin } from '../middleware';

const inquiries = new Hono<{ Bindings: Bindings; Variables: Variables }>();
inquiries.use('*', authMiddleware);

// 문의 등록
inquiries.post('/', async (c) => {
  const body = await c.req.json();
  const { property_id, job_post_id, inquiry_type, name, phone, email, message } = body;
  
  if (!name || !phone || !message) {
    return c.json({ error: '이름, 연락처, 문의 내용을 입력해주세요.' }, 400);
  }
  
  const userId = c.get('userId');
  
  const result = await c.env.DB.prepare(
    `INSERT INTO inquiries (property_id, job_post_id, inquiry_type, name, phone, email, message, user_id)
     VALUES (?,?,?,?,?,?,?,?)`
  ).bind(property_id||null, job_post_id||null, inquiry_type||'general', 
    name, phone, email||null, message, userId||null).run();
  
  // 문의수 증가 (분양 현장인 경우)
  if (property_id) {
    await c.env.DB.prepare('UPDATE properties SET inquiry_count = inquiry_count + 1 WHERE id = ?').bind(property_id).run();
  }
  
  return c.json({ success: true, id: result.meta.last_row_id, message: '문의가 접수되었습니다.' });
});

// 문의 목록 (관리자용)
inquiries.get('/', requireAdmin, async (c) => {
  const { type, is_read, page = '1', limit = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let where: string[] = [];
  let params: any[] = [];
  
  if (type && type !== 'all') { where.push('inquiry_type = ?'); params.push(type); }
  if (is_read !== undefined && is_read !== '') { where.push('is_read = ?'); params.push(parseInt(is_read)); }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as total FROM inquiries ${whereClause}`).bind(...params).first() as any;
  
  const rows = await c.env.DB.prepare(
    `SELECT i.*, p.title as property_title, j.title as job_title 
     FROM inquiries i 
     LEFT JOIN properties p ON i.property_id = p.id
     LEFT JOIN job_posts j ON i.job_post_id = j.id
     ${whereClause} ORDER BY i.created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, parseInt(limit), offset).all();
  
  return c.json({
    data: rows.results,
    total: countResult?.total || 0,
    unread: 0,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

// 문의 상세 (관리자용)
inquiries.get('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  
  await c.env.DB.prepare('UPDATE inquiries SET is_read = 1 WHERE id = ?').bind(id).run();
  
  const inquiry = await c.env.DB.prepare(
    `SELECT i.*, p.title as property_title, j.title as job_title 
     FROM inquiries i 
     LEFT JOIN properties p ON i.property_id = p.id
     LEFT JOIN job_posts j ON i.job_post_id = j.id
     WHERE i.id = ?`
  ).bind(id).first();
  
  return c.json(inquiry);
});

// 답변 등록 (관리자용)
inquiries.put('/:id/reply', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const { reply_message } = await c.req.json();
  
  await c.env.DB.prepare(
    'UPDATE inquiries SET reply_message = ?, is_replied = 1 WHERE id = ?'
  ).bind(reply_message, id).run();
  
  return c.json({ success: true, message: '답변이 등록되었습니다.' });
});

// 내 문의 목록 (로그인 회원)
inquiries.get('/my', requireAuth, async (c) => {
  const userId = c.get('userId');
  const rows = await c.env.DB.prepare(
    `SELECT i.*, p.title as property_title, j.title as job_title 
     FROM inquiries i 
     LEFT JOIN properties p ON i.property_id = p.id
     LEFT JOIN job_posts j ON i.job_post_id = j.id
     WHERE i.user_id = ? ORDER BY i.created_at DESC LIMIT 50`
  ).bind(userId).all();
  
  return c.json(rows.results);
});

export default inquiries;
