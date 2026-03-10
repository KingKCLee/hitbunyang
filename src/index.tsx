import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { Bindings, Variables } from './types'
import { authMiddleware } from './middleware'
import authRoutes from './routes/auth'
import propertiesRoutes from './routes/properties'
import jobsRoutes from './routes/jobs'
import inquiriesRoutes from './routes/inquiries'
import newsRoutes from './routes/news'
import adminRoutes from './routes/admin'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// CORS
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Auth middleware for all routes
app.use('*', authMiddleware)

// Static files
app.use('/static/*', serveStatic({ root: './' }))

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/properties', propertiesRoutes)
app.route('/api/jobs', jobsRoutes)
app.route('/api/inquiries', inquiriesRoutes)
app.route('/api/news', newsRoutes)
app.route('/api/admin', adminRoutes)

// Visitor counter API
app.get('/api/visitors', async (c) => {
  const today = new Date().toISOString().split('T')[0]
  
  await c.env.DB.prepare(`
    INSERT INTO visitor_stats (date, count) VALUES (?, 1)
    ON CONFLICT(date) DO UPDATE SET count = count + 1
  `).bind(today).run()
  
  const stats = await c.env.DB.prepare(
    "SELECT date, count FROM visitor_stats ORDER BY date DESC LIMIT 7"
  ).all()
  
  const todayStat = await c.env.DB.prepare(
    "SELECT count FROM visitor_stats WHERE date = ?"
  ).bind(today).first() as any
  
  return c.json({ today: todayStat?.count || 0, stats: stats.results })
})

// Site stats API (total properties, jobs, members, etc.)
app.get('/api/stats', async (c) => {
  const [siteStats, regionStats, todayVisitors] = await Promise.all([
    c.env.DB.prepare("SELECT stat_key, stat_value FROM site_stats").all(),
    c.env.DB.prepare("SELECT region, property_count FROM region_stats ORDER BY property_count DESC").all(),
    c.env.DB.prepare("SELECT count FROM visitor_stats WHERE date = ?")
      .bind(new Date().toISOString().split('T')[0]).first() as Promise<any>,
  ])
  
  const stats: any = {}
  for (const row of (siteStats.results as any[])) {
    stats[row.stat_key] = row.stat_value
  }
  
  return c.json({
    ...stats,
    today_visitors: (todayVisitors as any)?.count || 0,
    regions: regionStats.results
  })
})

// Banners API
app.get('/api/banners', async (c) => {
  const { position } = c.req.query()
  let query = "SELECT * FROM banners WHERE is_active = 1"
  let params: any[] = []
  
  if (position) {
    query += " AND position = ?"
    params.push(position)
  }
  query += " AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) ORDER BY sort_order"
  
  const rows = await c.env.DB.prepare(query).bind(...params).all()
  return c.json(rows.results)
})

// Banner click tracking
app.post('/api/banners/:id/click', async (c) => {
  await c.env.DB.prepare('UPDATE banners SET click_count = click_count + 1 WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ success: true })
})

// Properties near location (for map page)
app.get('/api/properties/nearby', async (c) => {
  const { lat, lng, radius = '5', limit = '20' } = c.req.query()
  
  if (!lat || !lng) {
    return c.json({ error: '위치 정보가 필요합니다.' }, 400)
  }
  
  const latF = parseFloat(lat)
  const lngF = parseFloat(lng)
  const radiusF = parseFloat(radius)
  
  // Haversine formula approximation using bounding box
  const latDelta = radiusF / 111.0
  const lngDelta = radiusF / (111.0 * Math.cos(latF * Math.PI / 180))
  
  const rows = await c.env.DB.prepare(
    `SELECT p.*, 
      (ABS(p.latitude - ?) * ABS(p.latitude - ?) + ABS(p.longitude - ?) * ABS(p.longitude - ?)) as dist_sq
     FROM properties p
     WHERE p.latitude BETWEEN ? AND ?
       AND p.longitude BETWEEN ? AND ?
       AND p.status != 'closed'
       AND p.latitude IS NOT NULL
     ORDER BY dist_sq ASC
     LIMIT ?`
  ).bind(
    latF, latF, lngF, lngF,
    latF - latDelta, latF + latDelta,
    lngF - lngDelta, lngF + lngDelta,
    parseInt(limit)
  ).all()
  
  return c.json(rows.results)
})

// All properties with coordinates (for map display)
app.get('/api/properties/map', async (c) => {
  const { region, type } = c.req.query()
  let where = ["p.latitude IS NOT NULL", "p.status != 'closed'"]
  let params: any[] = []
  
  if (region && region !== 'all') { where.push('p.region = ?'); params.push(region) }
  if (type && type !== 'all') { where.push('p.property_type = ?'); params.push(type) }
  
  const rows = await c.env.DB.prepare(
    `SELECT id, title, property_type, region, address, price_min, price_max, 
     latitude, longitude, is_hot, is_new, ad_type, view_count
     FROM properties p WHERE ${where.join(' AND ')}
     ORDER BY ad_type DESC, view_count DESC LIMIT 200`
  ).bind(...params).all()
  
  return c.json(rows.results)
})

// Best properties (Top 10 by score)
app.get('/api/properties/best', async (c) => {
  const { days = '10', limit = '10' } = c.req.query()
  const rows = await c.env.DB.prepare(
    `SELECT *, (view_count * 1 + inquiry_count * 3 + share_count * 2) as score
     FROM properties 
     WHERE status != 'closed'
     ORDER BY ad_type = 'premium' DESC, score DESC 
     LIMIT ?`
  ).bind(parseInt(limit)).all()
  return c.json(rows.results)
})

// Main page data
app.get('/api/home', async (c) => {
  const today = new Date().toISOString().split('T')[0]
  
  const [bestProperties, newProperties, featuredJobs, latestNews, banners, siteStats] = await Promise.all([
    c.env.DB.prepare(
      `SELECT *, (view_count + inquiry_count * 3 + COALESCE(share_count, 0) * 2) as score 
       FROM properties WHERE status != 'closed' 
       ORDER BY ad_type = 'premium' DESC, score DESC LIMIT 10`
    ).all(),
    c.env.DB.prepare(
      "SELECT * FROM properties WHERE status != 'closed' AND is_new = 1 ORDER BY created_at DESC LIMIT 8"
    ).all(),
    c.env.DB.prepare(
      "SELECT * FROM job_posts WHERE status = 'active' ORDER BY is_urgent DESC, is_best DESC, is_hot DESC, created_at DESC LIMIT 6"
    ).all(),
    c.env.DB.prepare(
      "SELECT id, title, news_type, is_pinned, view_count, created_at FROM news ORDER BY is_pinned DESC, created_at DESC LIMIT 5"
    ).all(),
    c.env.DB.prepare(
      "SELECT * FROM banners WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) ORDER BY position, sort_order"
    ).all(),
    c.env.DB.prepare(
      "SELECT stat_key, stat_value FROM site_stats"
    ).all(),
  ])
  
  const stats: any = {}
  for (const row of (siteStats.results as any[])) {
    stats[(row as any).stat_key] = (row as any).stat_value
  }
  
  return c.json({
    bestProperties: bestProperties.results,
    newProperties: newProperties.results,
    featuredJobs: featuredJobs.results,
    latestNews: latestNews.results,
    banners: banners.results,
    stats
  })
})

// SPA fallback - serve main HTML for all non-API routes
app.get('*', (c) => {
  return c.html(getHtmlTemplate())
})

function getHtmlTemplate(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>히트분양 - 전국 신규 분양 단지 정보</title>
  <meta name="description" content="전국 신규 분양 단지 정보와 분양 채용 정보를 한곳에서! 아파트, 오피스텔, 상가 분양 정보 제공 | 히트분양 1533-9077">
  <meta name="theme-color" content="#dc2626">
  <meta property="og:title" content="히트분양 - 전국 신규 분양 단지 정보">
  <meta property="og:description" content="전국 신규 분양 단지 정보를 히트분양에서 확인하세요">
  <meta property="og:url" content="https://hitbunyang.com">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-50 font-sans">
  <div id="app"></div>
  <div id="modal-root"></div>
  <script src="/static/app.js" defer></script>
  <script src="/static/app-home.js" defer></script>
  <script src="/static/app-properties.js" defer></script>
  <script src="/static/app-jobs.js" defer></script>
  <script src="/static/app-admin.js" defer></script>
  <script src="/static/app-map.js" defer></script>
  <script src="/static/app-pages.js" defer></script>
</body>
</html>`
}

export default app
