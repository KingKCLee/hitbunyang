-- 부동산 분양 플랫폼 초기 스키마

-- 회원 테이블
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  user_type TEXT DEFAULT 'normal' CHECK(user_type IN ('normal', 'business', 'admin')),
  company_name TEXT,
  business_number TEXT,
  alert_regions TEXT DEFAULT '[]', -- JSON array of regions
  alert_ranks TEXT DEFAULT '[]',   -- JSON array of ranks
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 분양 현장 테이블
CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subtitle TEXT,
  property_type TEXT NOT NULL CHECK(property_type IN ('apartment', 'officetel', 'commercial', 'villa', 'land', 'other')),
  region TEXT NOT NULL,
  address TEXT NOT NULL,
  price_min INTEGER,
  price_max INTEGER,
  supply_area_min REAL,
  supply_area_max REAL,
  total_units INTEGER,
  floors INTEGER,
  completion_date TEXT,
  sale_start_date TEXT,
  sale_end_date TEXT,
  description TEXT,
  floor_plan_url TEXT,
  image_urls TEXT DEFAULT '[]', -- JSON array
  amenities TEXT DEFAULT '[]',  -- JSON array
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'upcoming', 'completed', 'closed')),
  is_featured INTEGER DEFAULT 0,
  is_hot INTEGER DEFAULT 0,
  is_new INTEGER DEFAULT 1,
  ad_type TEXT DEFAULT 'none' CHECK(ad_type IN ('none', 'premium', 'superior', 'basic')),
  ad_expires_at DATETIME,
  view_count INTEGER DEFAULT 0,
  inquiry_count INTEGER DEFAULT 0,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  user_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 분양 구인 게시판 테이블
CREATE TABLE IF NOT EXISTS job_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  site_name TEXT NOT NULL,         -- 현장명
  region TEXT NOT NULL,
  property_type TEXT,
  rank_type TEXT NOT NULL CHECK(rank_type IN ('team_leader', 'team_member', 'any')), -- 팀장/팀원/무관
  commission_rate REAL,            -- 수수료율 (%)
  commission_note TEXT,            -- 수수료 조건 설명
  daily_pay INTEGER DEFAULT 0,     -- 일비
  accommodation_pay INTEGER DEFAULT 0, -- 숙소비
  experience_required TEXT,        -- 경력요건
  description TEXT,                -- 상세설명
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_kakao TEXT,
  is_hot INTEGER DEFAULT 0,
  is_urgent INTEGER DEFAULT 0,
  is_best INTEGER DEFAULT 0,
  ad_type TEXT DEFAULT 'none' CHECK(ad_type IN ('none', 'premium', 'superior', 'basic')),
  ad_expires_at DATETIME,
  view_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed', 'draft')),
  user_id INTEGER REFERENCES users(id),
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 고객 문의 테이블
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER REFERENCES properties(id),
  job_post_id INTEGER REFERENCES job_posts(id),
  inquiry_type TEXT DEFAULT 'property' CHECK(inquiry_type IN ('property', 'job', 'general')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  is_replied INTEGER DEFAULT 0,
  reply_message TEXT,
  user_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 뉴스/공지사항 테이블
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  news_type TEXT DEFAULT 'news' CHECK(news_type IN ('news', 'notice', 'event')),
  is_pinned INTEGER DEFAULT 0,
  image_url TEXT,
  view_count INTEGER DEFAULT 0,
  user_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 배너 광고 테이블
CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT DEFAULT 'top' CHECK(position IN ('top', 'middle', 'bottom', 'sidebar')),
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  starts_at DATETIME,
  expires_at DATETIME,
  click_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 방문자 통계 테이블
CREATE TABLE IF NOT EXISTS visitor_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(date)
);

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 즐겨찾기 테이블
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  property_id INTEGER REFERENCES properties(id),
  job_post_id INTEGER REFERENCES job_posts(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_properties_region ON properties(region);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_ad_type ON properties(ad_type);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_posts_region ON job_posts(region);
CREATE INDEX IF NOT EXISTS idx_job_posts_rank ON job_posts(rank_type);
CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
