import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, requireAuth } from '../middleware';

const jobs = new Hono<{ Bindings: Bindings; Variables: Variables }>();
jobs.use('*', authMiddleware);

// 구인 게시글 목록
jobs.get('/', async (c) => {
  const { region, rank, min_commission, min_daily_pay, has_accommodation, search, sort, page = '1', limit = '12' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let where: string[] = ["j.status = 'active'"];
  let params: any[] = [];
  
  if (region && region !== 'all') { where.push('j.region = ?'); params.push(region); }
  if (rank && rank !== 'all') { where.push('(j.rank_type = ? OR j.rank_type = \'any\')'); params.push(rank); }
  if (min_commission) { where.push('j.commission_rate >= ?'); params.push(parseFloat(min_commission)); }
  if (min_daily_pay) { where.push('j.daily_pay >= ?'); params.push(parseInt(min_daily_pay)); }
  if (has_accommodation === '1') { where.push('j.accommodation_pay > 0'); }
  if (search) { where.push('(j.title LIKE ? OR j.site_name LIKE ? OR j.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  
  const whereClause = `WHERE ${where.join(' AND ')}`;
  
  let orderBy = 'j.created_at DESC';
  if (sort === 'views') orderBy = 'j.view_count DESC';
  else if (sort === 'commission') orderBy = 'j.commission_rate DESC';
  else if (sort === 'daily_pay') orderBy = 'j.daily_pay DESC';
  else if (sort === 'hot') orderBy = 'j.is_hot DESC, j.view_count DESC';
  
  const adOrder = "CASE WHEN j.ad_type='premium' THEN 0 WHEN j.ad_type='superior' THEN 1 WHEN j.ad_type='basic' THEN 2 ELSE 3 END";
  const urgentOrder = 'j.is_urgent DESC, j.is_best DESC, j.is_hot DESC';
  
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM job_posts j ${whereClause}`
  ).bind(...params).first() as any;
  
  const rows = await c.env.DB.prepare(
    `SELECT j.*, u.name as author_name, u.company_name FROM job_posts j 
     LEFT JOIN users u ON j.user_id = u.id
     ${whereClause} ORDER BY ${adOrder}, ${urgentOrder}, ${orderBy} LIMIT ? OFFSET ?`
  ).bind(...params, parseInt(limit), offset).all();
  
  return c.json({
    data: rows.results,
    total: countResult?.total || 0,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil((countResult?.total || 0) / parseInt(limit))
  });
});

// 구인 게시글 상세
jobs.get('/:id', async (c) => {
  const id = c.req.param('id');
  
  await c.env.DB.prepare('UPDATE job_posts SET view_count = view_count + 1 WHERE id = ?').bind(id).run();
  
  const post = await c.env.DB.prepare(
    `SELECT j.*, u.name as author_name, u.company_name, u.phone as author_phone 
     FROM job_posts j LEFT JOIN users u ON j.user_id = u.id WHERE j.id = ?`
  ).bind(id).first();
  
  if (!post) return c.json({ error: '게시글을 찾을 수 없습니다.' }, 404);
  
  // 관련 게시글
  const related = await c.env.DB.prepare(
    `SELECT id, title, site_name, region, rank_type, commission_rate, daily_pay, is_hot, is_urgent 
     FROM job_posts WHERE id != ? AND region = ? AND status = 'active' ORDER BY created_at DESC LIMIT 4`
  ).bind(id, (post as any).region).all();
  
  return c.json({ post, related: related.results });
});

// 구인 게시글 등록
jobs.post('/', requireAuth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { title, site_name, region, property_type, rank_type, commission_rate, commission_note,
    daily_pay, accommodation_pay, experience_required, description, contact_name, contact_phone, 
    contact_kakao, expires_at } = body;
  
  if (!title || !site_name || !region || !rank_type || !contact_name || !contact_phone) {
    return c.json({ error: '필수 항목을 입력해주세요.' }, 400);
  }
  
  const result = await c.env.DB.prepare(
    `INSERT INTO job_posts (title, site_name, region, property_type, rank_type, commission_rate, commission_note,
     daily_pay, accommodation_pay, experience_required, description, contact_name, contact_phone, contact_kakao, 
     expires_at, user_id, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'active')`
  ).bind(title, site_name, region, property_type||null, rank_type, commission_rate||null, commission_note||null,
    daily_pay||0, accommodation_pay||0, experience_required||null, description||null,
    contact_name, contact_phone, contact_kakao||null, expires_at||null, userId).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

// 구인 게시글 수정
jobs.put('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const userType = c.get('userType');
  const body = await c.req.json();
  
  const post = await c.env.DB.prepare('SELECT user_id FROM job_posts WHERE id = ?').bind(id).first() as any;
  if (!post) return c.json({ error: '게시글을 찾을 수 없습니다.' }, 404);
  if (post.user_id !== userId && userType !== 'admin') {
    return c.json({ error: '수정 권한이 없습니다.' }, 403);
  }
  
  const { title, site_name, region, property_type, rank_type, commission_rate, commission_note,
    daily_pay, accommodation_pay, experience_required, description, contact_name, contact_phone, 
    contact_kakao, expires_at, status } = body;
  
  await c.env.DB.prepare(
    `UPDATE job_posts SET title=?,site_name=?,region=?,property_type=?,rank_type=?,commission_rate=?,commission_note=?,
     daily_pay=?,accommodation_pay=?,experience_required=?,description=?,contact_name=?,contact_phone=?,contact_kakao=?,
     expires_at=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(title, site_name, region, property_type||null, rank_type, commission_rate||null, commission_note||null,
    daily_pay||0, accommodation_pay||0, experience_required||null, description||null,
    contact_name, contact_phone, contact_kakao||null, expires_at||null, status||'active', id).run();
  
  return c.json({ success: true, message: '수정되었습니다.' });
});

// 구인 게시글 삭제
jobs.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const userType = c.get('userType');
  
  const post = await c.env.DB.prepare('SELECT user_id FROM job_posts WHERE id = ?').bind(id).first() as any;
  if (!post) return c.json({ error: '게시글을 찾을 수 없습니다.' }, 404);
  if (post.user_id !== userId && userType !== 'admin') {
    return c.json({ error: '삭제 권한이 없습니다.' }, 403);
  }
  
  await c.env.DB.prepare('DELETE FROM job_posts WHERE id = ?').bind(id).run();
  return c.json({ success: true, message: '삭제되었습니다.' });
});

export default jobs;
