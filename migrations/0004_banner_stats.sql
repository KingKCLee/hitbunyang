-- 배너 테이블 확장 (슬라이더용 추가 컬럼)
ALTER TABLE banners ADD COLUMN subtitle TEXT;
ALTER TABLE banners ADD COLUMN badge_text TEXT;

-- 추가 배너 데이터 (슬라이더 15개+)
INSERT INTO banners (title, subtitle, badge_text, link_url, position, sort_order, is_active, image_url) VALUES
('힐스테이트 판교역 퍼스트', '판교 중심 프리미엄 아파트 분양', '프리미엄', '/properties/1', 'top', 1, 1, ''),
('래미안 원펜타스', '서초구 반포동 한강뷰 랜드마크', '신규분양', '/properties/2', 'top', 2, 1, ''),
('DMC SK뷰아이파크', '수도권 광역교통 핵심 요지', '분양중', '/properties/3', 'top', 3, 1, ''),
('더샵 퍼스트파크', '경기 하남 친환경 주거단지', 'HOT', '/properties', 'top', 4, 1, ''),
('롯데캐슬 시그니처', '인천 송도 국제업무지구 인근', '특별공급', '/properties', 'top', 5, 1, ''),
('광교 아이파크', '수원 광교 신도시 프리미엄', '잔여세대', '/properties', 'top', 6, 1, ''),
('힐스테이트 용인 둔전역', '용인시 처인구 역세권 아파트', '신규', '/properties', 'top', 7, 1, ''),
('포레나 부산 두구', '부산 기장 해운대 근접 단지', 'NEW', '/properties', 'top', 8, 1, ''),
('자이 더 엘리언트', '강남 청담 럭셔리 오피스텔', '프리미엄', '/properties', 'top', 9, 1, ''),
('SK뷰 위례', '위례신도시 역세권 대단지', 'BEST', '/properties', 'top', 10, 1, ''),
('브리즈힐 위스테이', '제주 서귀포 프리미엄 리조트', '특가', '/properties', 'top', 11, 1, ''),
('대우 푸르지오 어반피스', '대전 유성 트리플역세권', '분양중', '/properties', 'top', 12, 1, ''),
('e편한세상 파크센트럴', '광주 첨단 3지구 대단지', '신규', '/properties', 'top', 13, 1, ''),
('아이파크 시티 천안', '충남 천안 1만세대 신도시', 'HOT', '/properties', 'top', 14, 1, ''),
('두산위브더제니스 울산', '울산 중구 핵심입지 타워', '잔여세대', '/properties', 'top', 15, 1, ''),
('서해그랑블 인천 검단', '인천 서구 검단 신도시', 'NEW', '/properties', 'top', 16, 1, '');

-- 사이트 통계 테이블
CREATE TABLE IF NOT EXISTS site_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_key TEXT UNIQUE NOT NULL,
  stat_value INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO site_stats (stat_key, stat_value) VALUES
('total_properties', 314124),
('total_jobs', 52381),
('total_members', 128456),
('total_inquiries', 891203);

-- 지역별 현장 수 캐시
CREATE TABLE IF NOT EXISTS region_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region TEXT NOT NULL,
  property_count INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO region_stats (region, property_count) VALUES
('서울', 89234), ('경기', 112456), ('인천', 23145),
('부산', 18923), ('대구', 12341), ('광주', 8923),
('대전', 11234), ('울산', 6789), ('세종', 3456),
('충청', 15678), ('전라', 12890), ('경상', 14567),
('강원', 7234), ('제주', 4567);
