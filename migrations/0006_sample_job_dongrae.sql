-- 동래 에코팰리스 아시아드 리안 샘플 채용공고 데이터

-- 먼저 0005 마이그레이션의 컬럼이 없으면 추가 (중복 방지용 try)
-- SQLite는 IF NOT EXISTS를 ALTER TABLE에서 지원하지 않으므로 실제 마이그레이션 순서 보장 필요

INSERT OR REPLACE INTO job_posts (
  id,
  title,
  site_name,
  region,
  property_type,
  rank_type,
  commission_rate,
  commission_note,
  daily_pay,
  accommodation_pay,
  experience_required,
  description,
  contact_name,
  contact_phone,
  contact_kakao,
  is_hot,
  is_urgent,
  is_best,
  ad_type,
  view_count,
  status,
  user_id,
  created_at,
  updated_at,
  -- 확장 필드 (0005 마이그레이션)
  enforcement_company,
  construction_company,
  trust_company,
  agency_company,
  work_address,
  work_address_detail,
  biz_address,
  start_date,
  property_types,
  gender,
  recruit_count,
  meal_support,
  transport_support,
  image_url
) VALUES (
  100,
  '동래 에코팰리스 아시아드 리안 직원모집!',
  '동래 에코팰리스 아시아드 리안',
  '부산',
  'apartment',
  'any',
  NULL,
  '아파트 분양 수수료: 팀장 300만원, 팀원 600만원
상가/쇼핑몰 분양 수수료: 4.5%

※ 수수료 지급 조건
- 아파트: 계약 완료 후 지급 (팀장 300만원 고정, 팀원 600만원 고정)
- 상가/쇼핑몰: 분양가의 4.5% 지급
- 성과 우수자 추가 인센티브 별도 협의 가능',
  10000,
  0,
  '경력 무관 (분양 유경험자 우대)',
  '📍 동래 에코팰리스 아시아드 리안 직원 모집 안내

▶ 모집 현장
부산 동래구 사직북로 4 (사직동, 삼정자이언츠파크) 소재
동래 에코팰리스 아시아드 리안 아파트 + 상가/쇼핑몰 분양 현장

▶ 현장 특징
- 부산 최고의 주거 명품 브랜드 에코팰리스 + 아시아드 리안 결합 프리젝트
- 사직 야구장(삼정자이언츠파크) 인근 최고의 입지
- 아파트 + 상가/쇼핑몰 복합 분양으로 높은 수익 기회
- 안정적인 시행사·시공사·신탁사 구성

▶ 급여 조건
- 일비: 10,000원
- 기타 교통비·숙소·식사 등 지원사항은 상담 시 안내

▶ 수수료
- 아파트 분양: 팀장 300만원 / 팀원 600만원 (계약 1건당)
- 상가/쇼핑몰: 분양가 4.5%

▶ 지원 방법
전화 또는 문의 접수 후 면접 일정 조율
현장 방문 환영 (부산 동래구 사직북로 4, 홍보관 3층)

▶ 유의사항
- 공고 기간 및 조건은 현장 상황에 따라 변경될 수 있습니다.
- 계약 체결 전 반드시 조건 재확인 바랍니다.',
  '동래에코팰리스아시아드리안',
  '051-503-3110',
  NULL,
  1,
  0,
  1,
  'premium',
  0,
  'active',
  1,
  '2026-03-11 10:45:50',
  '2026-03-11 10:45:50',
  '(주)지민건설',
  '(주)금오종합건설',
  '신영부동산신탁 주식회사',
  '신우아이엔디(주)',
  '부산 동래구 사직북로 4 (사직동, 삼정자이언츠파크) 3층 동래 에코팰리스 아시아드 리안 홍보관',
  '카카오맵 기준 250m',
  '부산 동래구 사직북로 4 (사직동, 삼정자이언츠파크)',
  '2026-03-11',
  '아파트,상가,쇼핑몰',
  'N',
  '00명',
  '상담 시 안내',
  '상담 시 안내',
  '/upload/files/files1772418895499/1773193104487.png'
);
