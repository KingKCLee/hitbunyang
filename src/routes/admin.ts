import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, requireAdmin } from '../middleware';

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>();
admin.use('*', authMiddleware);
admin.use('*', requireAdmin);

// 대시보드 통계
admin.get('/dashboard', async (c) => {
  const [totalProps, totalJobs, totalUsers, totalInquiries, unreadInquiries, todayVisitors] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) as count FROM properties WHERE status != 'closed'").first() as any,
    c.env.DB.prepare("SELECT COUNT(*) as count FROM job_posts WHERE status = 'active'").first() as any,
    c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE user_type != 'admin'").first() as any,
    c.env.DB.prepare("SELECT COUNT(*) as count FROM inquiries").first() as any,
    c.env.DB.prepare("SELECT COUNT(*) as count FROM inquiries WHERE is_read = 0").first() as any,
    c.env.DB.prepare("SELECT count FROM visitor_stats WHERE date = date('now')").first() as any,
  ]);

  const recentInquiries = await c.env.DB.prepare(
    `SELECT i.*, p.title as property_title FROM inquiries i 
     LEFT JOIN properties p ON i.property_id = p.id 
     ORDER BY i.created_at DESC LIMIT 10`
  ).all();

  const visitorStats = await c.env.DB.prepare(
    "SELECT date, count FROM visitor_stats ORDER BY date DESC LIMIT 7"
  ).all();

  const topProperties = await c.env.DB.prepare(
    "SELECT id, title, view_count, inquiry_count FROM properties ORDER BY view_count DESC LIMIT 5"
  ).all();

  return c.json({
    stats: {
      totalProperties: (totalProps as any)?.count || 0,
      totalJobs: (totalJobs as any)?.count || 0,
      totalUsers: (totalUsers as any)?.count || 0,
      totalInquiries: (totalInquiries as any)?.count || 0,
      unreadInquiries: (unreadInquiries as any)?.count || 0,
      todayVisitors: (todayVisitors as any)?.count || 0,
    },
    recentInquiries: recentInquiries.results,
    visitorStats: visitorStats.results,
    topProperties: topProperties.results
  });
});

// 회원 목록
admin.get('/users', async (c) => {
  const { page = '1', limit = '20', search } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let where = "WHERE user_type != 'admin'";
  let params: any[] = [];
  
  if (search) { where += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  
  const rows = await c.env.DB.prepare(
    `SELECT id, email, name, phone, user_type, company_name, is_active, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, parseInt(limit), offset).all();
  
  const count = await c.env.DB.prepare(`SELECT COUNT(*) as total FROM users ${where}`).bind(...params).first() as any;
  
  return c.json({ data: rows.results, total: count?.total || 0 });
});

// 회원 상태 변경
admin.put('/users/:id/status', async (c) => {
  const id = c.req.param('id');
  const { is_active } = await c.req.json();
  await c.env.DB.prepare('UPDATE users SET is_active = ? WHERE id = ?').bind(is_active ? 1 : 0, id).run();
  return c.json({ success: true });
});

// 현장 광고 설정
admin.put('/properties/:id/ad', async (c) => {
  const id = c.req.param('id');
  const { ad_type, ad_expires_at, is_featured, is_hot } = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE properties SET ad_type=?, ad_expires_at=?, is_featured=?, is_hot=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).bind(ad_type, ad_expires_at||null, is_featured?1:0, is_hot?1:0, id).run();
  return c.json({ success: true });
});

// 구인 게시글 광고 설정
admin.put('/jobs/:id/ad', async (c) => {
  const id = c.req.param('id');
  const { ad_type, ad_expires_at, is_hot, is_urgent, is_best } = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE job_posts SET ad_type=?, ad_expires_at=?, is_hot=?, is_urgent=?, is_best=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).bind(ad_type, ad_expires_at||null, is_hot?1:0, is_urgent?1:0, is_best?1:0, id).run();
  return c.json({ success: true });
});

// 배너 관리
admin.get('/banners', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM banners ORDER BY position, sort_order').all();
  return c.json(rows.results);
});

admin.post('/banners', async (c) => {
  const { title, image_url, link_url, position, is_active, sort_order, starts_at, expires_at } = await c.req.json();
  const result = await c.env.DB.prepare(
    'INSERT INTO banners (title, image_url, link_url, position, is_active, sort_order, starts_at, expires_at) VALUES (?,?,?,?,?,?,?,?)'
  ).bind(title, image_url, link_url||null, position||'top', is_active?1:0, sort_order||0, starts_at||null, expires_at||null).run();
  return c.json({ success: true, id: result.meta.last_row_id });
});

admin.put('/banners/:id', async (c) => {
  const id = c.req.param('id');
  const { title, image_url, link_url, position, is_active, sort_order } = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE banners SET title=?,image_url=?,link_url=?,position=?,is_active=?,sort_order=? WHERE id=?'
  ).bind(title, image_url, link_url||null, position, is_active?1:0, sort_order||0, id).run();
  return c.json({ success: true });
});

admin.delete('/banners/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM banners WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

export default admin;
