import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, requireAuth, requireAdmin } from '../middleware';

const properties = new Hono<{ Bindings: Bindings; Variables: Variables }>();
properties.use('*', authMiddleware);

// 분양 현장 목록
properties.get('/', async (c) => {
  const { region, type, status, search, sort, page = '1', limit = '12', featured, ad } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let where: string[] = [];
  let params: any[] = [];
  
  if (region && region !== 'all') { where.push('p.region = ?'); params.push(region); }
  if (type && type !== 'all') { where.push('p.property_type = ?'); params.push(type); }
  if (status && status !== 'all') { where.push('p.status = ?'); params.push(status); }
  else if (!status) { where.push("p.status != 'closed'"); }
  if (search) { where.push('(p.title LIKE ? OR p.address LIKE ? OR p.subtitle LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (featured === '1') { where.push('p.is_featured = 1'); }
  if (ad === '1') { where.push("p.ad_type != 'none'"); }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  let orderBy = 'p.created_at DESC';
  if (sort === 'views') orderBy = 'p.view_count DESC';
  else if (sort === 'inquiries') orderBy = 'p.inquiry_count DESC';
  else if (sort === 'price_asc') orderBy = 'p.price_min ASC';
  else if (sort === 'price_desc') orderBy = 'p.price_min DESC';
  else if (sort === 'hot') orderBy = 'p.is_hot DESC, p.view_count DESC';
  
  // Premium ads first
  const adOrder = "CASE WHEN p.ad_type='premium' THEN 0 WHEN p.ad_type='superior' THEN 1 WHEN p.ad_type='basic' THEN 2 ELSE 3 END";
  
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM properties p ${whereClause}`
  ).bind(...params).first() as any;
  
  const rows = await c.env.DB.prepare(
    `SELECT p.*, u.name as author_name FROM properties p LEFT JOIN users u ON p.user_id = u.id
     ${whereClause} ORDER BY ${adOrder}, ${orderBy} LIMIT ? OFFSET ?`
  ).bind(...params, parseInt(limit), offset).all();
  
  return c.json({
    data: rows.results,
    total: countResult?.total || 0,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil((countResult?.total || 0) / parseInt(limit))
  });
});

// 베스트 현장 (조회수+문의수 기반)
properties.get('/best', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT * FROM properties WHERE status != 'closed' ORDER BY (view_count + inquiry_count * 3) DESC LIMIT 6`
  ).all();
  return c.json(rows.results);
});

// 분양 현장 상세
properties.get('/:id', async (c) => {
  const id = c.req.param('id');
  
  // 조회수 증가
  await c.env.DB.prepare('UPDATE properties SET view_count = view_count + 1 WHERE id = ?').bind(id).run();
  
  const property = await c.env.DB.prepare(
    `SELECT p.*, u.name as author_name, u.phone as author_phone FROM properties p 
     LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?`
  ).bind(id).first();
  
  if (!property) return c.json({ error: '현장을 찾을 수 없습니다.' }, 404);
  
  // 관련 현장
  const related = await c.env.DB.prepare(
    `SELECT id, title, property_type, region, price_min, price_max, is_hot, is_new, ad_type FROM properties 
     WHERE id != ? AND region = ? AND status != 'closed' ORDER BY created_at DESC LIMIT 4`
  ).bind(id, (property as any).region).all();
  
  return c.json({ property, related: related.results });
});

// 분양 현장 등록 (로그인 필요)
properties.post('/', requireAuth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const { title, subtitle, property_type, region, address, price_min, price_max, supply_area_min, supply_area_max,
    total_units, floors, completion_date, sale_start_date, sale_end_date, description, 
    floor_plan_url, image_urls, amenities, status, contact_name, contact_phone, contact_email } = body;
  
  if (!title || !property_type || !region || !address) {
    return c.json({ error: '필수 항목을 입력해주세요.' }, 400);
  }
  
  const result = await c.env.DB.prepare(
    `INSERT INTO properties (title, subtitle, property_type, region, address, price_min, price_max, 
     supply_area_min, supply_area_max, total_units, floors, completion_date, sale_start_date, sale_end_date, 
     description, floor_plan_url, image_urls, amenities, status, contact_name, contact_phone, contact_email, user_id, is_new)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`
  ).bind(title, subtitle||null, property_type, region, address, price_min||null, price_max||null,
    supply_area_min||null, supply_area_max||null, total_units||null, floors||null,
    completion_date||null, sale_start_date||null, sale_end_date||null, description||null,
    floor_plan_url||null, JSON.stringify(image_urls||[]), JSON.stringify(amenities||[]),
    status||'active', contact_name||null, contact_phone||null, contact_email||null, userId).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

// 분양 현장 수정
properties.put('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const userType = c.get('userType');
  const body = await c.req.json();
  
  const property = await c.env.DB.prepare('SELECT user_id FROM properties WHERE id = ?').bind(id).first() as any;
  if (!property) return c.json({ error: '현장을 찾을 수 없습니다.' }, 404);
  if (property.user_id !== userId && userType !== 'admin') {
    return c.json({ error: '수정 권한이 없습니다.' }, 403);
  }
  
  const { title, subtitle, property_type, region, address, price_min, price_max, supply_area_min, supply_area_max,
    total_units, floors, completion_date, sale_start_date, sale_end_date, description,
    floor_plan_url, image_urls, amenities, status, contact_name, contact_phone, contact_email } = body;
  
  await c.env.DB.prepare(
    `UPDATE properties SET title=?,subtitle=?,property_type=?,region=?,address=?,price_min=?,price_max=?,
     supply_area_min=?,supply_area_max=?,total_units=?,floors=?,completion_date=?,sale_start_date=?,sale_end_date=?,
     description=?,floor_plan_url=?,image_urls=?,amenities=?,status=?,contact_name=?,contact_phone=?,contact_email=?,
     updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(title, subtitle||null, property_type, region, address, price_min||null, price_max||null,
    supply_area_min||null, supply_area_max||null, total_units||null, floors||null,
    completion_date||null, sale_start_date||null, sale_end_date||null, description||null,
    floor_plan_url||null, JSON.stringify(image_urls||[]), JSON.stringify(amenities||[]),
    status||'active', contact_name||null, contact_phone||null, contact_email||null, id).run();
  
  return c.json({ success: true, message: '수정되었습니다.' });
});

// 분양 현장 삭제
properties.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const userType = c.get('userType');
  
  const property = await c.env.DB.prepare('SELECT user_id FROM properties WHERE id = ?').bind(id).first() as any;
  if (!property) return c.json({ error: '현장을 찾을 수 없습니다.' }, 404);
  if (property.user_id !== userId && userType !== 'admin') {
    return c.json({ error: '삭제 권한이 없습니다.' }, 403);
  }
  
  await c.env.DB.prepare('DELETE FROM properties WHERE id = ?').bind(id).run();
  return c.json({ success: true, message: '삭제되었습니다.' });
});

// 즐겨찾기 토글
properties.post('/:id/bookmark', requireAuth, async (c) => {
  const propertyId = c.req.param('id');
  const userId = c.get('userId');
  
  const existing = await c.env.DB.prepare(
    'SELECT id FROM bookmarks WHERE user_id = ? AND property_id = ?'
  ).bind(userId, propertyId).first();
  
  if (existing) {
    await c.env.DB.prepare('DELETE FROM bookmarks WHERE user_id = ? AND property_id = ?').bind(userId, propertyId).run();
    return c.json({ bookmarked: false });
  } else {
    await c.env.DB.prepare('INSERT INTO bookmarks (user_id, property_id) VALUES (?,?)').bind(userId, propertyId).run();
    return c.json({ bookmarked: true });
  }
});

export default properties;
