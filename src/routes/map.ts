import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware';

const map = new Hono<{ Bindings: Bindings; Variables: Variables }>();
map.use('*', authMiddleware);

// 지도용 현장 목록 (좌표 포함)
map.get('/properties', async (c) => {
  const { region, type, bounds, search } = c.req.query();

  let where: string[] = ["p.status != 'closed'", 'p.lat IS NOT NULL', 'p.lng IS NOT NULL'];
  let params: any[] = [];

  if (region && region !== 'all') { where.push('p.region = ?'); params.push(region); }
  if (type && type !== 'all') { where.push('p.property_type = ?'); params.push(type); }
  if (search) { where.push('(p.title LIKE ? OR p.address LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

  // bounds: "swLat,swLng,neLat,neLng"
  if (bounds) {
    const [swLat, swLng, neLat, neLng] = bounds.split(',').map(parseFloat);
    if (!isNaN(swLat)) {
      where.push('p.lat BETWEEN ? AND ?'); params.push(swLat, neLat);
      where.push('p.lng BETWEEN ? AND ?'); params.push(swLng, neLng);
    }
  }

  const whereClause = `WHERE ${where.join(' AND ')}`;

  const rows = await c.env.DB.prepare(
    `SELECT p.id, p.title, p.subtitle, p.property_type, p.region, p.address,
            p.lat, p.lng, p.price_min, p.price_max, p.status,
            p.is_hot, p.is_new, p.ad_type, p.view_count, p.inquiry_count, p.score,
            p.supply_area_min, p.supply_area_max, p.total_units, p.contact_phone
     FROM properties p ${whereClause}
     ORDER BY p.ad_type DESC, p.score DESC LIMIT 200`
  ).bind(...params).all();

  return c.json(rows.results);
});

// 지도용 구인 목록 (좌표 포함)
map.get('/jobs', async (c) => {
  const { region, rank, bounds } = c.req.query();

  let where: string[] = ["j.status = 'active'", 'j.lat IS NOT NULL', 'j.lng IS NOT NULL'];
  let params: any[] = [];

  if (region && region !== 'all') { where.push('j.region = ?'); params.push(region); }
  if (rank && rank !== 'all') { where.push('(j.rank_type = ? OR j.rank_type = \'any\')'); params.push(rank); }

  if (bounds) {
    const [swLat, swLng, neLat, neLng] = bounds.split(',').map(parseFloat);
    if (!isNaN(swLat)) {
      where.push('j.lat BETWEEN ? AND ?'); params.push(swLat, neLat);
      where.push('j.lng BETWEEN ? AND ?'); params.push(swLng, neLng);
    }
  }

  const whereClause = `WHERE ${where.join(' AND ')}`;

  const rows = await c.env.DB.prepare(
    `SELECT j.id, j.title, j.site_name, j.region, j.rank_type,
            j.lat, j.lng, j.full_address, j.commission_rate, j.daily_pay,
            j.accommodation_pay, j.is_hot, j.is_urgent, j.ad_type, j.contact_phone
     FROM job_posts j ${whereClause}
     ORDER BY j.is_urgent DESC, j.ad_type DESC LIMIT 200`
  ).bind(...params).all();

  return c.json(rows.results);
});

// 내 위치 주변 현장 (거리 기반 정렬)
map.get('/nearby', async (c) => {
  const { lat, lng, radius = '50', type = 'property' } = c.req.query();
  if (!lat || !lng) return c.json({ error: '위치 정보가 필요합니다.' }, 400);

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const radiusKm = parseFloat(radius);

  // 위도/경도 범위 계산 (1도 ≈ 111km)
  const latDelta = radiusKm / 111.0;
  const lngDelta = radiusKm / (111.0 * Math.cos(userLat * Math.PI / 180));

  if (type === 'job') {
    const rows = await c.env.DB.prepare(
      `SELECT j.*, 
       (ABS(j.lat - ?) + ABS(j.lng - ?)) * 111 AS dist_approx
       FROM job_posts j
       WHERE j.status = 'active' AND j.lat IS NOT NULL
       AND j.lat BETWEEN ? AND ? AND j.lng BETWEEN ? AND ?
       ORDER BY dist_approx ASC LIMIT 20`
    ).bind(userLat, userLng, userLat - latDelta, userLat + latDelta, userLng - lngDelta, userLng + lngDelta).all();
    return c.json(rows.results);
  } else {
    const rows = await c.env.DB.prepare(
      `SELECT p.*,
       (ABS(p.lat - ?) + ABS(p.lng - ?)) * 111 AS dist_approx
       FROM properties p
       WHERE p.status != 'closed' AND p.lat IS NOT NULL
       AND p.lat BETWEEN ? AND ? AND p.lng BETWEEN ? AND ?
       ORDER BY dist_approx ASC LIMIT 20`
    ).bind(userLat, userLng, userLat - latDelta, userLat + latDelta, userLng - lngDelta, userLng + lngDelta).all();
    return c.json(rows.results);
  }
});

// 주소 → 좌표 (카카오 API 프록시)
map.get('/geocode', async (c) => {
  const { query } = c.req.query();
  if (!query) return c.json({ error: '주소를 입력해주세요.' }, 400);

  const kakaoKey = c.env.KAKAO_REST_API_KEY as string;
  if (!kakaoKey) {
    // 카카오 API 키 없을 때 더미 응답
    return c.json({
      documents: [],
      meta: { total_count: 0 },
      error: 'KAKAO_REST_API_KEY not configured'
    });
  }

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `KakaoAK ${kakaoKey}` } }
    );
    const data = await res.json() as any;
    return c.json(data);
  } catch (e) {
    return c.json({ error: '주소 검색에 실패했습니다.' }, 500);
  }
});

// 현장 좌표 업데이트 (등록/수정 시)
map.post('/properties/:id/location', async (c) => {
  const id = c.req.param('id');
  const { lat, lng, address } = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE properties SET lat=?, lng=?, address=? WHERE id=?'
  ).bind(lat, lng, address, id).run();
  return c.json({ success: true });
});

export default map;
