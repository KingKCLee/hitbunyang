import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, requireAdmin } from '../middleware';

const news = new Hono<{ Bindings: Bindings; Variables: Variables }>();
news.use('*', authMiddleware);

// 뉴스/공지 목록
news.get('/', async (c) => {
  const { type, page = '1', limit = '10' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let where: string[] = [];
  let params: any[] = [];
  
  if (type && type !== 'all') { where.push('news_type = ?'); params.push(type); }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as total FROM news ${whereClause}`).bind(...params).first() as any;
  
  const rows = await c.env.DB.prepare(
    `SELECT n.*, u.name as author_name FROM news n LEFT JOIN users u ON n.user_id = u.id
     ${whereClause} ORDER BY n.is_pinned DESC, n.created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, parseInt(limit), offset).all();
  
  return c.json({
    data: rows.results,
    total: countResult?.total || 0,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

// 뉴스/공지 상세
news.get('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE news SET view_count = view_count + 1 WHERE id = ?').bind(id).run();
  
  const item = await c.env.DB.prepare(
    `SELECT n.*, u.name as author_name FROM news n LEFT JOIN users u ON n.user_id = u.id WHERE n.id = ?`
  ).bind(id).first();
  
  if (!item) return c.json({ error: '게시글을 찾을 수 없습니다.' }, 404);
  
  // 이전/다음 글
  const prev = await c.env.DB.prepare('SELECT id, title FROM news WHERE id < ? ORDER BY id DESC LIMIT 1').bind(id).first();
  const next = await c.env.DB.prepare('SELECT id, title FROM news WHERE id > ? ORDER BY id ASC LIMIT 1').bind(id).first();
  
  return c.json({ item, prev, next });
});

// 뉴스/공지 등록 (관리자)
news.post('/', requireAdmin, async (c) => {
  const userId = (c as any).get('userId');
  const body = await c.req.json();
  const { title, content, news_type, is_pinned, image_url } = body;
  
  if (!title || !content) return c.json({ error: '제목과 내용을 입력해주세요.' }, 400);
  
  const result = await c.env.DB.prepare(
    'INSERT INTO news (title, content, news_type, is_pinned, image_url, user_id) VALUES (?,?,?,?,?,?)'
  ).bind(title, content, news_type||'news', is_pinned?1:0, image_url||null, userId).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

// 뉴스/공지 수정 (관리자)
news.put('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const { title, content, news_type, is_pinned, image_url } = await c.req.json();
  
  await c.env.DB.prepare(
    'UPDATE news SET title=?,content=?,news_type=?,is_pinned=?,image_url=?,updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).bind(title, content, news_type||'news', is_pinned?1:0, image_url||null, id).run();
  
  return c.json({ success: true });
});

// 뉴스/공지 삭제 (관리자)
news.delete('/:id', requireAdmin, async (c) => {
  await c.env.DB.prepare('DELETE FROM news WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

export default news;
