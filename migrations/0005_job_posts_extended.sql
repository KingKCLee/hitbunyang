-- 구인공고 상세 필드 추가 (분양라인 스타일)
ALTER TABLE job_posts ADD COLUMN enforcement_company TEXT;      -- 시행사
ALTER TABLE job_posts ADD COLUMN construction_company TEXT;     -- 시공사
ALTER TABLE job_posts ADD COLUMN trust_company TEXT;            -- 신탁사
ALTER TABLE job_posts ADD COLUMN agency_company TEXT;           -- 대행사
ALTER TABLE job_posts ADD COLUMN work_address TEXT;             -- 근무지 주소 (홍보관)
ALTER TABLE job_posts ADD COLUMN work_address_detail TEXT;      -- 근무지 상세주소
ALTER TABLE job_posts ADD COLUMN biz_address TEXT;              -- 사업지 주소
ALTER TABLE job_posts ADD COLUMN biz_address_detail TEXT;       -- 사업지 상세주소
ALTER TABLE job_posts ADD COLUMN start_date TEXT;               -- 투입일
ALTER TABLE job_posts ADD COLUMN property_types TEXT;           -- 업종 (콤마구분)
ALTER TABLE job_posts ADD COLUMN gender TEXT DEFAULT 'N';       -- 성별
ALTER TABLE job_posts ADD COLUMN age_condition TEXT;            -- 나이 조건
ALTER TABLE job_posts ADD COLUMN recruit_count TEXT;            -- 모집인원
ALTER TABLE job_posts ADD COLUMN meal_support TEXT;             -- 식사 지원
ALTER TABLE job_posts ADD COLUMN transport_support TEXT;        -- 교통비
ALTER TABLE job_posts ADD COLUMN sales_support TEXT;            -- 영업비
ALTER TABLE job_posts ADD COLUMN image_url TEXT;                -- 현장 이미지
ALTER TABLE job_posts ADD COLUMN youtube_url TEXT;              -- 유튜브 링크
ALTER TABLE job_posts ADD COLUMN work_address_coords TEXT;      -- 근무지 좌표
ALTER TABLE job_posts ADD COLUMN biz_address_coords TEXT;       -- 사업지 좌표
