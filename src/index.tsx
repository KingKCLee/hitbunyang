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

// Static files - /static/* 경로로 모든 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './' }))

// 브라우저 기본 favicon 요청 → /static/logo-32.png로 리다이렉트
app.get('/favicon.ico', (c) => c.redirect('/static/logo-32.png', 301))

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
    // 홈 구인공고: 광고등급 프리미엄→슈페리어→베이직→없음 순, 각 등급 내 최신순, 확장필드 전부 포함
    c.env.DB.prepare(
      `SELECT j.*,
        CASE j.ad_type WHEN 'premium' THEN 0 WHEN 'superior' THEN 1 WHEN 'basic' THEN 2 ELSE 3 END as ad_order
       FROM job_posts j
       WHERE j.status = 'active'
       ORDER BY ad_order ASC, j.is_urgent DESC, j.is_best DESC, j.is_hot DESC, j.created_at DESC
       LIMIT 60`
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

  // 광고등급별 그룹핑
  const allJobs = featuredJobs.results as any[]
  const premiumJobs  = allJobs.filter(j => j.ad_type === 'premium')
  const superiorJobs = allJobs.filter(j => j.ad_type === 'superior')
  const basicJobs    = allJobs.filter(j => j.ad_type === 'basic')
  const normalJobs   = allJobs.filter(j => !j.ad_type || j.ad_type === 'none')
  
  return c.json({
    bestProperties: bestProperties.results,
    newProperties: newProperties.results,
    featuredJobs: allJobs,          // 전체 (기존 호환)
    premiumJobs,
    superiorJobs,
    basicJobs,
    normalJobs,
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
  <meta name="theme-color" content="#1c7cff">
  <!-- 파비콘 - /static/ 경로 사용 -->
  <link rel="icon" type="image/png" sizes="32x32" href="/static/logo-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/static/logo-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/static/logo-180.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/static/logo-192.png">
  <link rel="icon" type="image/png" sizes="256x256" href="/static/logo-256.png">
  <!-- OG 태그 -->
  <meta property="og:title" content="히트분양 - 전국 신규 분양 단지 정보">
  <meta property="og:description" content="전국 신규 분양 단지 정보를 히트분양에서 확인하세요">
  <meta property="og:url" content="https://hitbunyang.com">
  <meta property="og:image" content="https://hitbunyang.com/static/logo.png">
  <meta property="og:image:width" content="1024">
  <meta property="og:image:height" content="1024">
  <!-- Pretendard Variable - 다방앱 동일 CDN -->
  <link rel="preconnect" href="//static.dabangapp.com">
  <link rel="stylesheet" href="//static.dabangapp.com/web/fonts/pretendard-variable/v1.3.9/pretendardvariable-dynamic-subset.min.gzip.css">
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Tailwind 폰트 재정의: Pretendard를 기본 폰트로 강제 설정 -->
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="bg-gray-50" style="font-family:'Pretendard Variable','Pretendard',-apple-system,BlinkMacSystemFont,system-ui,'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;">
  <div id="app"></div>
  <div id="modal-root"></div>
  <script src="/static/app.js" defer></script>
  <script src="/static/app-home.js" defer></script>
  <script src="/static/app-properties.js" defer></script>
  <script src="/static/app-jobs.js" defer></script>
  <script src="/static/app-admin.js" defer></script>
  <script src="/static/app-map.js" defer></script>
  <script src="/static/app-pages.js" defer></script>
  <script src="/static/app-sites.js" defer></script>
  <script src="/static/app-ranking.js" defer></script>
</body>
</html>`
}

export default app
