// 히트분양 - Part 4: 채용정보 + 회원 + 뉴스 + 관리자

// ============================================================
// JOBS LIST PAGE
// ============================================================
async function renderJobsPage(container) {
  const params = new URLSearchParams(location.search);
  const region = params.get('region') || 'all';
  const rank = params.get('rank') || 'all';
  const min_commission = params.get('min_commission') || '';
  const min_daily = params.get('min_daily') || '';
  const has_accommodation = params.get('has_accommodation') || '';
  const search = params.get('search') || '';
  const sort = params.get('sort') || 'latest';
  const page = parseInt(params.get('page') || '1');
  
  container.innerHTML = `
  <div style="background:white;border-bottom:1px solid #e5e7eb;padding:1rem 0">
    <div class="container">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;margin-bottom:0.75rem">
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span style="font-size:1.25rem">💼</span>
          <h1 style="font-size:1.2rem;font-weight:800">💼 분양 채용정보</h1>
        </div>
        ${state.user ? `<button class="btn btn-primary btn-sm" onclick="navigate('/jobs/new')"><i class="fas fa-plus"></i> 구인 공고 등록</button>` : 
          `<button class="btn btn-outline btn-sm" onclick="navigate('/login')"><i class="fas fa-lock"></i> 로그인 후 등록</button>`}
      </div>
      <div class="filter-bar">
        <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center">
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
            <span style="font-size:0.8rem;color:#6b7280;align-self:center">지역</span>
            ${['all','서울','경기','인천','부산','충청','전라','경상','강원'].map(r =>
              `<button class="filter-btn ${region===r?'active':''}" onclick="updateJobFilter('region','${r}')">${r==='all'?'전체':r}</button>`
            ).join('')}
          </div>
          <div style="height:1px;background:#e5e7eb;width:100%"></div>
          <div style="display:flex;gap:0.4rem;align-items:center;flex-wrap:wrap">
            <span style="font-size:0.8rem;color:#6b7280">직급</span>
            ${[['all','전체'],['team_leader','팀장'],['team_member','팀원']].map(([v,l]) =>
              `<button class="filter-btn ${rank===v?'active':''}" onclick="updateJobFilter('rank','${v}')">${l}</button>`
            ).join('')}
            <div style="height:20px;width:1px;background:#e5e7eb;margin:0 0.25rem"></div>
            <label style="display:flex;align-items:center;gap:0.4rem;font-size:0.82rem;cursor:pointer">
              <input type="checkbox" ${has_accommodation==='1'?'checked':''} onchange="updateJobFilter('has_accommodation',this.checked?'1':'')"> 숙소비 지원
            </label>
            <select class="filter-select" onchange="updateJobFilter('sort',this.value)">
              <option value="latest" ${sort==='latest'?'selected':''}>최신순</option>
              <option value="hot" ${sort==='hot'?'selected':''}>인기순</option>
              <option value="commission" ${sort==='commission'?'selected':''}>수수료 높은순</option>
              <option value="daily_pay" ${sort==='daily_pay'?'selected':''}>일비 높은순</option>
            </select>
            <div style="position:relative">
              <i class="fas fa-search" style="position:absolute;left:0.6rem;top:50%;transform:translateY(-50%);color:#8fa3c8;font-size:0.8rem"></i>
              <input type="text" id="job-search" value="${escapeHtml(search)}" placeholder="현장명/지역 검색"
                style="padding:0.45rem 0.75rem 0.45rem 2rem;border:1.5px solid #e5e7eb;border-radius:8px;font-size:0.85rem;outline:none;width:160px"
                onkeydown="if(event.key==='Enter')updateJobFilter('search',this.value)">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="container" style="padding-top:1.5rem;padding-bottom:2rem">
    <div id="jobs-list"><div class="loading-overlay"><div class="spinner"></div></div></div>
  </div>`;
  
  await loadJobs(region, rank, min_commission, min_daily, has_accommodation, search, sort, page);
}

window.updateJobFilter = function(key, value) {
  const params = new URLSearchParams(location.search);
  params.set(key, value);
  if (key !== 'page') params.set('page', '1');
  navigate('/jobs?' + params.toString());
};

async function loadJobs(region, rank, min_commission, min_daily, has_accommodation, search, sort, page) {
  const p = new URLSearchParams();
  if (region !== 'all') p.set('region', region);
  if (rank !== 'all') p.set('rank', rank);
  if (min_commission) p.set('min_commission', min_commission);
  if (min_daily) p.set('min_daily_pay', min_daily);
  if (has_accommodation) p.set('has_accommodation', has_accommodation);
  if (search) p.set('search', search);
  p.set('sort', sort);
  p.set('page', page);
  p.set('limit', '15');
  
  const r = await api.get('/jobs?' + p.toString());
  const list = document.getElementById('jobs-list');
  if (!list) return;
  
  if (!r.ok) { list.innerHTML = `<div class="alert alert-error">데이터를 불러오는데 실패했습니다.</div>`; return; }
  
  const { data, total, pages } = r.data;
  
  if (!data.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💼</div><div class="empty-state-text">등록된 채용 공고가 없습니다.</div></div>`;
    return;
  }
  
  list.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <span style="font-size:0.9rem;color:#6b7280">총 <strong style="color:#1f2937">${total.toLocaleString()}</strong>개의 채용 공고</span>
    </div>
    ${data.map(j => renderJobCard(j)).join('')}
    ${renderPagination(page, pages, (p) => updateJobFilter('page', p))}`;
}

function renderJobCard(j) {
  const badges = [];
  if (j.ad_type === 'premium') badges.push('<span class="badge badge-premium-ad">★ 프리미엄</span>');
  if (j.ad_type === 'superior') badges.push('<span class="badge" style="background:#ede9fe;color:#6d28d9;border:1px solid #c4b5fd">◆ 슈페리어</span>');
  if (j.is_urgent) badges.push('<span class="badge badge-urgent">급구</span>');
  if (j.is_hot) badges.push('<span class="badge badge-hot">HOT</span>');
  if (j.is_best) badges.push('<span class="badge badge-best">대박</span>');
  
  return `
  <div class="job-card ${j.ad_type==='premium'?'ad-premium':j.ad_type==='superior'?'ad-superior':''}" 
    onclick="navigate('/jobs/${j.id}')" style="margin-bottom:0.75rem">
    <div class="job-card-header">
      <div>
        <div style="display:flex;gap:0.4rem;margin-bottom:0.4rem;flex-wrap:wrap">${badges.join('')}</div>
        <div class="job-title">${escapeHtml(j.title)}</div>
        <div class="job-site"><i class="fas fa-map-pin"></i> ${escapeHtml(j.site_name)}</div>
      </div>
      <div style="text-align:right;white-space:nowrap">
        <div style="font-size:0.75rem;color:#8fa3c8">${timeAgo(j.created_at)}</div>
        <div style="font-size:0.75rem;color:#8fa3c8;margin-top:0.25rem">조회 ${(j.view_count||0).toLocaleString()}</div>
      </div>
    </div>
    <div style="display:flex;gap:0.75rem;font-size:0.82rem;color:#6b7280;flex-wrap:wrap;margin-bottom:0.4rem">
      <span><i class="fas fa-map-marker-alt" style="color:#3b82f6"></i> ${escapeHtml(j.region)}</span>
      <span><i class="fas fa-users" style="color:#10b981"></i> ${getRankLabel(j.rank_type)}</span>
      ${j.experience_required ? `<span><i class="fas fa-briefcase" style="color:#f59e0b"></i> ${escapeHtml(j.experience_required)}</span>` : ''}
    </div>
    <div class="job-conditions">
      ${j.commission_rate ? `<span class="job-condition-badge commission"><i class="fas fa-percent"></i> 수수료 ${j.commission_rate}%</span>` : ''}
      ${j.daily_pay > 0 ? `<span class="job-condition-badge daily"><i class="fas fa-money-bill"></i> 일비 ${(j.daily_pay).toLocaleString()}원</span>` : ''}
      ${j.accommodation_pay > 0 ? `<span class="job-condition-badge accommodation"><i class="fas fa-hotel"></i> 숙소비 ${(j.accommodation_pay).toLocaleString()}원</span>` : ''}
    </div>
    ${j.contact_name ? `<div style="margin-top:0.5rem;font-size:0.8rem;color:#6b7280">담당: ${escapeHtml(j.contact_name)} | ${escapeHtml(j.contact_phone)}</div>` : ''}
  </div>`;
}

// ============================================================
// JOB DETAIL PAGE  (분양라인 샘플사이트 동일 구조 v3)
// ============================================================
async function renderJobDetailPage(container, params) {
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;

  const r = await api.get(`/jobs/${params.id}`);
  if (!r.ok) {
    container.innerHTML = `<div class="container" style="padding:2rem"><div class="alert alert-error">게시글을 불러오는데 실패했습니다.</div></div>`;
    return;
  }

  const { post: j, related } = r.data;

  // ── 광고 배지 ──
  const adBadge = j.ad_type === 'premium'
    ? `<span style="background:#ff6f00;color:#fff;font-size:0.72rem;font-weight:900;padding:3px 10px;border-radius:4px;letter-spacing:0.3px">★ AD</span>`
    : j.ad_type === 'superior'
    ? `<span style="background:#7b1fa2;color:#fff;font-size:0.72rem;font-weight:900;padding:3px 10px;border-radius:4px">◆ AD</span>`
    : j.ad_type === 'basic'
    ? `<span style="background:#1565c0;color:#fff;font-size:0.72rem;font-weight:800;padding:3px 10px;border-radius:4px">● AD</span>`
    : '';

  const statusBadges = [];
  if (j.is_urgent) statusBadges.push(`<span style="background:#e53935;color:#fff;font-size:0.72rem;font-weight:800;padding:3px 8px;border-radius:4px">급구</span>`);
  if (j.is_hot)    statusBadges.push(`<span style="background:#f57c00;color:#fff;font-size:0.72rem;font-weight:800;padding:3px 8px;border-radius:4px">HOT</span>`);
  if (j.is_best)   statusBadges.push(`<span style="background:#2e7d32;color:#fff;font-size:0.72rem;font-weight:800;padding:3px 8px;border-radius:4px">대박</span>`);

  // ── 업종 파싱 ──
  const propTypes = j.property_types
    ? j.property_types.split(',').map(t => t.trim()).filter(Boolean)
    : (j.property_type ? [j.property_type] : []);

  // ── 급여 형태 문자열 ──
  const payType = '계약 수수료';

  // ── 수수료 rows 구성 (분양라인처럼: 형태 + 각 업종별 금액) ──
  const commissionRows = [];
  commissionRows.push(`<tr><td class="bl-td-label">형태</td><td class="bl-td-val">${payType}</td></tr>`);
  if (j.commission_note) {
    // commission_note에서 줄별로 파싱해서 각 행으로 표시
    const lines = j.commission_note.split('\n').map(l => l.trim()).filter(Boolean);
    lines.forEach(line => {
      // "아파트 분양 9,000,000원" 형태이면 라벨/값 분리
      const m = line.match(/^(.+?)\s+([\d,]+원|\d+\.?\d*%)$/);
      if (m) {
        commissionRows.push(`<tr><td class="bl-td-label">${escapeHtml(m[1])}</td><td class="bl-td-val" style="font-weight:700;color:#c0392b">${escapeHtml(m[2])}</td></tr>`);
      } else if (line && !line.startsWith('※') && !line.startsWith('#')) {
        commissionRows.push(`<tr><td class="bl-td-label" colspan="2" style="color:#555;font-size:0.83rem;white-space:pre-line">${escapeHtml(line)}</td></tr>`);
      }
    });
  } else if (j.commission_rate) {
    commissionRows.push(`<tr><td class="bl-td-label">수수료율</td><td class="bl-td-val" style="font-weight:700;color:#c0392b">${j.commission_rate}%</td></tr>`);
  }

  // ── 근무후생 rows (분양라인: 식사/교통비/숙소/숙소비/일비/영업비 2열 그리드) ──
  const welfare = [
    { label: '식사',   val: j.meal_support      || '상담시 안내' },
    { label: '교통비', val: j.transport_support  || '상담시 안내' },
    { label: '숙소',   val: j.accommodation_pay > 0 ? `지원(${Number(j.accommodation_pay).toLocaleString()}원/월)` : '상담시 안내' },
    { label: '숙소비', val: j.accommodation_pay > 0 ? `${Number(j.accommodation_pay).toLocaleString()}원/월` : '상담시 안내' },
    { label: '일비',   val: j.daily_pay > 0 ? `${Number(j.daily_pay).toLocaleString()}원` : '상담시 안내' },
    { label: '영업비', val: j.sales_support      || '상담시 안내' },
  ];

  // ── 카카오맵 지도 URL ──
  const mapAddr = encodeURIComponent(j.work_address || j.biz_address || j.region);
  const kakaoMapUrl = `https://map.kakao.com/?q=${mapAddr}`;

  // ── 공유 URL ──
  const shareUrl = `https://hitbunyang.pages.dev/jobs/${j.id}`;

  container.innerHTML = `
<style>
  /* ── 전체 래퍼 ── */
  .bl-wrap { background:#f4f6fa; min-height:100vh; padding-bottom:3rem; }
  .bl-inner { max-width:1000px; margin:0 auto; padding:0 1rem; }

  /* ── 상단 헤더 바 ── */
  .bl-header { background:#fff; border-bottom:1px solid #e5e7eb; padding:0.75rem 0; margin-bottom:0; }
  .bl-breadcrumb { display:flex; align-items:center; gap:0.4rem; font-size:0.82rem; color:#9ca3af; }
  .bl-breadcrumb a { color:#9ca3af; text-decoration:none; }
  .bl-breadcrumb a:hover { color:#374151; }

  /* ── 페이지 레이아웃 ── */
  .bl-layout { display:grid; grid-template-columns:1fr 300px; gap:1.25rem; padding-top:1.25rem; }
  @media(max-width:860px){ .bl-layout{ grid-template-columns:1fr !important; } }

  /* ── 섹션 박스 ── */
  .bl-section { background:#fff; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:1rem; overflow:hidden; }
  .bl-section-title { background:#f8f9fb; border-bottom:1px solid #e5e7eb; padding:0.6rem 1rem;
    font-size:0.82rem; font-weight:700; color:#374151; display:flex; align-items:center; gap:0.4rem; }

  /* ── 정보 테이블 (분양라인 스타일) ── */
  .bl-table { width:100%; border-collapse:collapse; }
  .bl-table td { padding:0.7rem 1rem; font-size:0.87rem; border-bottom:1px solid #f3f4f6; vertical-align:top; }
  .bl-table tr:last-child td { border-bottom:none; }
  .bl-td-label { width:110px; color:#6b7280; font-size:0.82rem; white-space:nowrap; background:#fafbfc; }
  .bl-td-val { color:#1f2937; }

  /* ── 2열 그리드 테이블 (사업자 정보 / 근무후생) ── */
  .bl-table-2col td { width:25%; }
  .bl-table-2col .bl-td-label { width:80px; }

  /* ── 지도 영역 ── */
  .bl-map-area { background:#e8edf2; border-radius:6px; overflow:hidden; margin:0.75rem 1rem;
    height:160px; display:flex; align-items:center; justify-content:center; position:relative;
    cursor:pointer; border:1px solid #d1d5db; }
  .bl-map-area:hover .bl-map-overlay { opacity:1; }
  .bl-map-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.35);
    display:flex; align-items:center; justify-content:center;
    color:#fff; font-size:0.88rem; font-weight:700; opacity:0; transition:opacity 0.2s; gap:0.4rem; }
  .bl-map-note { font-size:0.74rem; color:#6b7280; padding:0 1rem 0.75rem; }

  /* ── 업종 태그 ── */
  .bl-type-tag { display:inline-block; background:#eff6ff; color:#1d4ed8;
    border:1px solid #bfdbfe; border-radius:4px; padding:2px 10px; font-size:0.82rem; font-weight:700; margin-right:4px; }

  /* ── 상세정보 본문 ── */
  .bl-desc { padding:1rem; font-size:0.9rem; line-height:1.9; color:#374151; white-space:pre-line; word-break:break-word; }

  /* ── 이미지 ── */
  .bl-main-img { width:100%; max-height:420px; object-fit:cover; display:block; }

  /* ── 공유 버튼바 ── */
  .bl-share-bar { display:flex; gap:0.5rem; padding:0.85rem 1rem; border-top:1px solid #f3f4f6; background:#fafbfc; }
  .bl-share-btn { flex:1; padding:0.5rem 0.25rem; border:1px solid #e5e7eb; border-radius:6px;
    background:#fff; font-size:0.8rem; cursor:pointer; text-align:center; color:#374151;
    font-family:inherit; transition:background 0.15s; text-decoration:none; display:flex;
    align-items:center; justify-content:center; gap:0.3rem; }
  .bl-share-btn:hover { background:#f0f4ff; border-color:#93c5fd; color:#1d4ed8; }

  /* ── 사이드바 연락처 ── */
  .bl-sidebar-contact { background:#fff; border:2px solid #1c7cff; border-radius:10px;
    overflow:hidden; position:sticky; top:72px; box-shadow:0 4px 20px rgba(28,124,255,0.12); }
  .bl-contact-header { background:linear-gradient(135deg,#1c7cff,#0057d9); padding:1rem;
    color:#fff; display:flex; align-items:center; gap:0.5rem; }
  .bl-contact-name { font-size:1.05rem; font-weight:900; color:#fff; margin-bottom:2px; }
  .bl-contact-phone { font-size:1rem; font-weight:700; color:#fff; text-decoration:none; display:flex; align-items:center; gap:0.4rem; }
  .bl-contact-phone:hover { color:#bfdbfe; }
  .bl-call-btn { display:block; background:#1c7cff; color:#fff; text-align:center;
    padding:0.75rem; font-size:0.95rem; font-weight:700; text-decoration:none;
    border-top:1px solid rgba(255,255,255,0.2); transition:background 0.15s; }
  .bl-call-btn:hover { background:#0057d9; }
  .bl-msg-btn { display:block; background:#FEE500; color:#1c1c1c; text-align:center;
    padding:0.65rem; font-size:0.88rem; font-weight:700; cursor:pointer;
    border:none; width:100%; font-family:inherit; transition:opacity 0.15s; }
  .bl-msg-btn:hover { opacity:0.88; }

  /* ── 관련 구인 리스트 ── */
  .bl-related-item { padding:0.7rem 1rem; border-bottom:1px solid #f3f4f6; cursor:pointer; transition:background 0.15s; }
  .bl-related-item:last-child { border-bottom:none; }
  .bl-related-item:hover { background:#f4f8ff; }
  .bl-related-title { font-size:0.86rem; font-weight:700; color:#111827; margin-bottom:0.25rem;
    overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
  .bl-related-meta { font-size:0.77rem; color:#6b7280; display:flex; gap:0.6rem; flex-wrap:wrap; }
  .bl-related-badge { background:#eff6ff; color:#1d4ed8; padding:1px 7px; border-radius:3px; font-weight:700; font-size:0.7rem; }
</style>

<div class="bl-wrap">
  <!-- 브레드크럼 헤더 -->
  <div class="bl-header">
    <div class="bl-inner">
      <div class="bl-breadcrumb">
        <a href="/" onclick="navigate('/');return false">홈</a>
        <i class="fas fa-chevron-right" style="font-size:0.6rem"></i>
        <a href="/jobs" onclick="navigate('/jobs');return false">구인글 목록</a>
        <i class="fas fa-chevron-right" style="font-size:0.6rem"></i>
        <span style="color:#374151">구인글 상세보기</span>
      </div>
    </div>
  </div>

  <div class="bl-inner">
    <div class="bl-layout">

      <!-- ▌메인 컬럼 -->
      <div>

        <!-- 현장 이미지 (있을 때) -->
        ${j.image_url ? `
        <div class="bl-section" style="margin-bottom:1rem">
          <img src="${escapeHtml(j.image_url)}" alt="${escapeHtml(j.title)}" class="bl-main-img"
            onerror="this.closest('.bl-section').style.display='none'">
        </div>` : ''}

        <!-- 제목 / 배지 -->
        <div class="bl-section" style="padding:1rem 1rem 0.85rem">
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;margin-bottom:0.55rem">
            ${adBadge} ${statusBadges.join(' ')}
          </div>
          <h1 style="font-size:1.25rem;font-weight:900;color:#111827;line-height:1.35;margin-bottom:0.5rem">
            ${escapeHtml(j.title)}
          </h1>
          <div style="display:flex;align-items:center;gap:1rem;font-size:0.8rem;color:#9ca3af;flex-wrap:wrap">
            <span><i class="fas fa-eye"></i> 조회 ${(j.view_count||0).toLocaleString()}</span>
            <span><i class="fas fa-clock"></i> ${j.created_at ? j.created_at.replace('T',' ').substring(0,19) : ''}</span>
            ${j.expires_at ? `<span style="color:#ef4444"><i class="fas fa-calendar-times"></i> 마감 ${formatDate(j.expires_at)}</span>` : ''}
          </div>
        </div>

        <!-- 1. 근무지 정보 -->
        <div class="bl-section">
          <div class="bl-section-title"><i class="fas fa-map-marker-alt" style="color:#e53935"></i> 근무지 정보</div>
          <!-- 지도 영역 -->
          <a href="${kakaoMapUrl}" target="_blank" class="bl-map-area">
            <div style="text-align:center;color:#6b7280">
              <i class="fas fa-map" style="font-size:2rem;margin-bottom:0.4rem;display:block;color:#9ca3af"></i>
              <div style="font-size:0.82rem">${escapeHtml((j.work_address||j.biz_address||j.region).substring(0,30))}</div>
            </div>
            <div class="bl-map-overlay"><i class="fas fa-external-link-alt"></i> 카카오맵에서 보기</div>
          </a>
          <p class="bl-map-note">※ 지도 클릭 시 카카오맵에서 자세히 확인하실 수 있습니다.</p>
          <table class="bl-table">
            <tr>
              <td class="bl-td-label">근무지역 주소</td>
              <td class="bl-td-val">
                ${escapeHtml(j.work_address || '-')}
                ${j.work_address_detail ? `<br><span style="color:#6b7280;font-size:0.8rem">${escapeHtml(j.work_address_detail)}</span>` : ''}
              </td>
            </tr>
          </table>
        </div>

        <!-- 2. 사업자 정보 -->
        <div class="bl-section">
          <div class="bl-section-title"><i class="fas fa-building" style="color:#1c7cff"></i> 사업자 정보</div>
          <table class="bl-table bl-table-2col">
            <tr>
              <td class="bl-td-label">시행사</td>
              <td class="bl-td-val">${escapeHtml(j.enforcement_company||'-')}</td>
              <td class="bl-td-label">시공사</td>
              <td class="bl-td-val">${escapeHtml(j.construction_company||'-')}</td>
            </tr>
            <tr>
              <td class="bl-td-label">신탁사</td>
              <td class="bl-td-val">${escapeHtml(j.trust_company||'-')}</td>
              <td class="bl-td-label">대행사</td>
              <td class="bl-td-val">${escapeHtml(j.agency_company||'-')}</td>
            </tr>
            <tr>
              <td class="bl-td-label">담당자 이름</td>
              <td class="bl-td-val">${escapeHtml(j.contact_name||'-')}</td>
              <td class="bl-td-label">담당자 연락처</td>
              <td class="bl-td-val">
                <a href="tel:${escapeHtml(j.contact_phone||'')}" style="color:#1c7cff;font-weight:700;text-decoration:none">
                  ${escapeHtml(j.contact_phone||'-')}
                </a>
              </td>
            </tr>
          </table>
        </div>

        <!-- 3. 사업지 정보 -->
        <div class="bl-section">
          <div class="bl-section-title"><i class="fas fa-home" style="color:#7c3aed"></i> 사업지 정보</div>
          <!-- 사업지 지도 -->
          ${j.biz_address ? `
          <a href="https://map.kakao.com/?q=${encodeURIComponent(j.biz_address)}" target="_blank" class="bl-map-area">
            <div style="text-align:center;color:#6b7280">
              <i class="fas fa-map-pin" style="font-size:2rem;margin-bottom:0.4rem;display:block;color:#9ca3af"></i>
              <div style="font-size:0.82rem">${escapeHtml(j.biz_address.substring(0,30))}</div>
            </div>
            <div class="bl-map-overlay"><i class="fas fa-external-link-alt"></i> 카카오맵에서 보기</div>
          </a>
          <p class="bl-map-note">※ 지도 클릭 시 카카오맵에서 자세히 확인하실 수 있습니다.</p>` : ''}
          <table class="bl-table">
            <tr>
              <td class="bl-td-label">현장명</td>
              <td class="bl-td-val" style="font-weight:700">${escapeHtml(j.site_name)}</td>
            </tr>
            <tr>
              <td class="bl-td-label">사업지 주소</td>
              <td class="bl-td-val">${escapeHtml(j.biz_address||j.work_address||'-')}</td>
            </tr>
          </table>
        </div>

        <!-- 4. 기본요강 -->
        <div class="bl-section">
          <div class="bl-section-title"><i class="fas fa-list-alt" style="color:#059669"></i> 기본요강</div>
          <table class="bl-table bl-table-2col">
            <tr>
              <td class="bl-td-label">업종</td>
              <td class="bl-td-val">
                ${propTypes.length
                  ? propTypes.map(t => `<span class="bl-type-tag">${escapeHtml(t)}</span>`).join('')
                  : '<span class="bl-type-tag">-</span>'}
              </td>
              <td class="bl-td-label">직종</td>
              <td class="bl-td-val" style="font-weight:700">${getRankLabel(j.rank_type)}</td>
            </tr>
            <tr>
              <td class="bl-td-label">성별</td>
              <td class="bl-td-val">${j.gender==='M'?'남성':j.gender==='F'?'여성':'무관'}</td>
              <td class="bl-td-label">나이</td>
              <td class="bl-td-val">${escapeHtml(j.age_condition||'무관')}</td>
            </tr>
            <tr>
              <td class="bl-td-label">경력</td>
              <td class="bl-td-val">${escapeHtml(j.experience_required||'경력무관')}</td>
              <td class="bl-td-label">인원</td>
              <td class="bl-td-val">${escapeHtml(j.recruit_count||'00명')}</td>
            </tr>
          </table>
        </div>

        <!-- 5. 급여정보 -->
        <div class="bl-section">
          <div class="bl-section-title"><i class="fas fa-won-sign" style="color:#d97706"></i> 급여정보</div>
          <table class="bl-table">
            ${commissionRows.join('')}
          </table>
        </div>

        <!-- 6. 근무후생 -->
        <div class="bl-section">
          <div class="bl-section-title"><i class="fas fa-gift" style="color:#db2777"></i> 근무후생</div>
          <table class="bl-table bl-table-2col">
            ${welfare.map((w,i) => {
              // 2개씩 한 행으로
              if (i % 2 === 0) {
                const next = welfare[i+1];
                return `<tr>
                  <td class="bl-td-label">${escapeHtml(w.label)}</td>
                  <td class="bl-td-val">${escapeHtml(w.val)}</td>
                  ${next ? `<td class="bl-td-label">${escapeHtml(next.label)}</td><td class="bl-td-val">${escapeHtml(next.val)}</td>` : '<td></td><td></td>'}
                </tr>`;
              }
              return '';
            }).filter(Boolean).join('')}
          </table>
        </div>

        <!-- 7. 상세정보 -->
        ${j.description ? `
        <div class="bl-section">
          <div class="bl-section-title"><i class="fas fa-align-left" style="color:#0ea5e9"></i> 상세정보</div>
          <div class="bl-desc">${escapeHtml(j.description)}</div>
        </div>` : ''}

        <!-- 공유 버튼바 -->
        <div class="bl-section">
          <div class="bl-share-bar">
            <button class="bl-share-btn" onclick="jobCopyLink('${shareUrl}')">
              <i class="fas fa-link"></i> URL 복사
            </button>
            <button class="bl-share-btn" onclick="window.print()">
              <i class="fas fa-print"></i> 인쇄
            </button>
            <a class="bl-share-btn" href="https://sharer.kakao.com/talk/friends/picker/link?app_key=KAKAO&url=${encodeURIComponent(shareUrl)}" target="_blank">
              <i class="fas fa-comment" style="color:#FEE500"></i> 카카오 공유
            </a>
            <a class="bl-share-btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" target="_blank">
              <i class="fab fa-facebook" style="color:#1877f2"></i> 페이스북
            </a>
          </div>
        </div>

        <!-- 관련 구인 공고 -->
        ${related && related.length ? `
        <div class="bl-section">
          <div class="bl-section-title"><i class="fas fa-th-list" style="color:#6366f1"></i> 같은 지역 구인 공고</div>
          ${related.map(rj => `
          <div class="bl-related-item" onclick="navigate('/jobs/${rj.id}')">
            <div class="bl-related-title">${escapeHtml(rj.title)}</div>
            <div class="bl-related-meta">
              <span class="bl-related-badge">${escapeHtml(rj.region)}</span>
              <span>${getRankLabel(rj.rank_type)}</span>
              ${rj.commission_rate ? `<span style="color:#c0392b;font-weight:700">수수료 ${rj.commission_rate}%</span>` : ''}
              ${rj.daily_pay > 0 ? `<span style="color:#166534">일비 ${Number(rj.daily_pay).toLocaleString()}원</span>` : ''}
              <span style="color:#9ca3af">${timeAgo(rj.created_at)}</span>
            </div>
          </div>`).join('')}
        </div>` : ''}

      </div><!-- /메인 컬럼 -->

      <!-- ▌사이드바 -->
      <div>
        <div class="bl-sidebar-contact">
          <!-- 담당자 헤더 -->
          <div class="bl-contact-header">
            <i class="fas fa-user-circle" style="font-size:2rem;opacity:0.8"></i>
            <div style="flex:1">
              <div class="bl-contact-name">${escapeHtml(j.contact_name)}</div>
              <a href="tel:${escapeHtml(j.contact_phone)}" class="bl-contact-phone">
                <i class="fas fa-phone"></i> ${escapeHtml(j.contact_phone)}
              </a>
            </div>
          </div>

          <!-- 전화/문자 버튼 -->
          <a href="tel:${escapeHtml(j.contact_phone)}" class="bl-call-btn">
            <i class="fas fa-phone"></i> 전화하기
          </a>
          ${j.contact_kakao ? `
          <div style="padding:0.75rem;background:#fafbfc;border-top:1px solid #e5e7eb;text-align:center">
            <div style="background:#FEE500;color:#1c1c1c;font-weight:700;font-size:0.85rem;
              padding:0.5rem 1rem;border-radius:6px;display:inline-block">
              💬 카카오 ID: ${escapeHtml(j.contact_kakao)}
            </div>
          </div>` : ''}

          <!-- 문의 폼 -->
          <div style="padding:1rem;border-top:1px solid #e5e7eb">
            <div style="font-size:0.82rem;font-weight:700;color:#374151;margin-bottom:0.65rem">
              <i class="fas fa-paper-plane" style="color:#1c7cff"></i> 지원 문의
            </div>
            <form onsubmit="submitJobInquiry(event, ${j.id})">
              <div style="margin-bottom:0.5rem">
                <input class="form-input" name="name" placeholder="이름 *" required
                  value="${state.user ? escapeHtml(state.user.name) : ''}"
                  style="font-size:0.85rem;padding:0.5rem 0.75rem">
              </div>
              <div style="margin-bottom:0.5rem">
                <input class="form-input" name="phone" placeholder="연락처 *" required
                  value="${state.user ? escapeHtml(state.user.phone||'') : ''}"
                  style="font-size:0.85rem;padding:0.5rem 0.75rem">
              </div>
              <div style="margin-bottom:0.65rem">
                <textarea class="form-textarea" name="message"
                  placeholder="경력, 희망 조건 등 자유롭게 작성해 주세요"
                  style="min-height:70px;font-size:0.85rem;resize:vertical"></textarea>
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%;font-size:0.88rem;padding:0.6rem">
                <i class="fas fa-paper-plane"></i> 지원 문의 접수
              </button>
            </form>
            <div id="job-inquiry-result" style="margin-top:0.5rem"></div>
          </div>

          <!-- 공유 URL -->
          <div style="padding:0.75rem 1rem;border-top:1px solid #e5e7eb;background:#fafbfc">
            <div style="font-size:0.72rem;color:#9ca3af;margin-bottom:0.3rem">공유 URL</div>
            <div style="font-size:0.72rem;color:#6b7280;word-break:break-all;line-height:1.5">${shareUrl}</div>
            <button onclick="jobCopyLink('${shareUrl}')"
              style="margin-top:0.5rem;width:100%;padding:0.4rem;border:1px solid #e5e7eb;
              border-radius:5px;background:#fff;font-size:0.78rem;cursor:pointer;color:#374151;font-family:inherit">
              <i class="fas fa-copy"></i> 링크 복사
            </button>
          </div>
        </div>
      </div><!-- /사이드바 -->

    </div><!-- /bl-layout -->
  </div><!-- /bl-inner -->
</div><!-- /bl-wrap -->`;
}

window.jobCopyLink = function(url) {
  navigator.clipboard.writeText(url).then(() => {
    alert('URL이 클립보드에 복사되었습니다.');
  }).catch(() => {
    const t = document.createElement('textarea');
    t.value = url;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
    alert('URL이 복사되었습니다.');
  });
};

window.submitJobInquiry = async function(e, jobId) {
  e.preventDefault();
  const form = e.target;
  const r = await api.post('/inquiries', {
    job_post_id: jobId, inquiry_type: 'job',
    name: form.name.value, phone: form.phone.value,
    email: '', message: form.message.value || '지원 문의드립니다.',
  });
  const res = document.getElementById('job-inquiry-result');
  if (r.ok) {
    res.innerHTML = `<div class="alert alert-success"><i class="fas fa-check"></i> 지원 문의가 접수되었습니다!</div>`;
    form.reset();
  } else {
    res.innerHTML = `<div class="alert alert-error">${r.data.error || '문의 접수 실패'}</div>`;
  }
};

// ============================================================
// JOB FORM PAGE
// ============================================================
async function renderJobFormPage(container) {
  if (!state.user) { navigate('/login'); return; }
  
  container.innerHTML = `
  <div class="container" style="padding:2rem 1rem;max-width:760px">
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem">
      <button onclick="history.back()" class="btn btn-secondary btn-sm"><i class="fas fa-arrow-left"></i></button>
      <h1 style="font-size:1.25rem;font-weight:800">채용 공고 등록</h1>
    </div>
    <div style="background:white;border-radius:16px;padding:1.5rem;box-shadow:0 2px 12px rgba(0,0,0,0.07)">
      <form onsubmit="submitJobPost(event)">
        <div class="form-group">
          <label class="form-label">공고 제목 *</label>
          <input class="form-input" name="title" required placeholder="예) [급구] 판교 프리미엄 아파트 팀장/팀원 모집">
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">현장명 *</label>
            <input class="form-input" name="site_name" required placeholder="예) 힐스테이트 판교역 퍼스트">
          </div>
          <div class="form-group">
            <label class="form-label">지역 *</label>
            <select class="form-select" name="region" required>
              <option value="">선택</option>
              ${['서울','경기','인천','부산','충청','전라','경상','강원','제주'].map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">현장 유형</label>
            <select class="form-select" name="property_type">
              <option value="">선택</option>
              <option value="apartment">아파트</option>
              <option value="officetel">오피스텔</option>
              <option value="commercial">상가</option>
              <option value="villa">빌라/연립</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">모집 직급 *</label>
            <select class="form-select" name="rank_type" required>
              <option value="any">팀장/팀원 (무관)</option>
              <option value="team_leader">팀장</option>
              <option value="team_member">팀원</option>
            </select>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">수수료율 (%)</label>
            <input class="form-input" name="commission_rate" type="number" step="0.1" placeholder="예) 1.5">
          </div>
          <div class="form-group">
            <label class="form-label">일비 (원)</label>
            <input class="form-input" name="daily_pay" type="number" placeholder="예) 50000">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">수수료 조건 상세</label>
          <input class="form-input" name="commission_note" placeholder="예) 계약건당 분양가 1.5% 지급, 팀원 1.0%">
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">숙소비 지원 (원/월)</label>
            <input class="form-input" name="accommodation_pay" type="number" placeholder="예) 300000">
          </div>
          <div class="form-group">
            <label class="form-label">경력 요건</label>
            <input class="form-input" name="experience_required" placeholder="예) 아파트 분양 경력 1년 이상">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">상세 내용</label>
          <textarea class="form-textarea" name="description" style="min-height:150px" placeholder="모집 상세 내용, 근무 조건, 특이사항 등을 입력해주세요."></textarea>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">담당자 이름 *</label>
            <input class="form-input" name="contact_name" required value="${state.user ? escapeHtml(state.user.name) : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">담당자 연락처 *</label>
            <input class="form-input" name="contact_phone" required value="${state.user ? escapeHtml(state.user.phone||'') : ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">카카오 ID (선택)</label>
          <input class="form-input" name="contact_kakao" placeholder="카카오톡 아이디">
        </div>
        <div class="form-group">
          <label class="form-label">공고 마감일</label>
          <input class="form-input" name="expires_at" type="date">
        </div>
        <div id="job-form-error"></div>
        <div style="display:flex;gap:0.75rem;margin-top:1rem">
          <button type="submit" class="btn btn-primary btn-lg"><i class="fas fa-save"></i> 공고 등록</button>
          <button type="button" class="btn btn-secondary btn-lg" onclick="history.back()">취소</button>
        </div>
      </form>
    </div>
  </div>`;
}

window.submitJobPost = async function(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  ['commission_rate','daily_pay','accommodation_pay'].forEach(k => {
    if (data[k]) data[k] = parseFloat(data[k]);
    else delete data[k];
  });
  
  const r = await api.post('/jobs', data);
  const errEl = document.getElementById('job-form-error');
  
  if (r.ok) {
    navigate('/jobs/' + r.data.id);
  } else {
    errEl.innerHTML = `<div class="alert alert-error">${r.data.error || '등록에 실패했습니다.'}</div>`;
  }
};

// ============================================================
// NEWS PAGE
// ============================================================
async function renderNewsPage(container) {
  const params = new URLSearchParams(location.search);
  const type = params.get('type') || 'all';
  const page = parseInt(params.get('page') || '1');
  
  container.innerHTML = `
  <div style="background:white;border-bottom:1px solid #e5e7eb;padding:1rem 0">
    <div class="container">
      <h1 style="font-size:1.2rem;font-weight:800;margin-bottom:0.75rem">
        <span style="font-size:1.25rem">📰</span> 뉴스 & 공지사항
      </h1>
      <div class="tab-list">
        ${[['all','전체'],['notice','공지사항'],['news','뉴스'],['event','이벤트']].map(([v,l]) =>
          `<div class="tab-item ${type===v?'active':''}" onclick="navigate('/news?type=${v}')">${l}</div>`
        ).join('')}
      </div>
    </div>
  </div>
  <div class="container" style="padding-top:1.5rem;padding-bottom:2rem;max-width:800px">
    <div id="news-list"><div class="loading-overlay"><div class="spinner"></div></div></div>
  </div>`;
  
  const qp = new URLSearchParams();
  if (type !== 'all') qp.set('type', type);
  qp.set('page', page);
  qp.set('limit', '15');
  
  const r = await api.get('/news?' + qp.toString());
  const list = document.getElementById('news-list');
  if (!list || !r.ok) return;
  
  const { data, total, pages } = r.data;
  
  list.innerHTML = `
    <div style="background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden">
      ${data.length ? data.map((n, i) => `
      <div style="display:flex;align-items:center;padding:0.9rem 1.25rem;${i>0?'border-top:1px solid #f3f4f6':''};cursor:pointer;transition:background 0.15s"
        onclick="navigate('/news/${n.id}')"
        onmouseover="this.style.background='#f4f8ff'" onmouseout="this.style.background='white'">
        ${n.is_pinned ? '<i class="fas fa-thumbtack" style="color:#f59e0b;margin-right:0.5rem;font-size:0.8rem"></i>' : '<span style="width:1.1rem;display:inline-block"></span>'}
        <span class="news-type-badge news-type-${n.news_type}" style="margin-right:0.75rem;flex-shrink:0">
          ${n.news_type==='notice'?'공지':n.news_type==='event'?'이벤트':'뉴스'}
        </span>
        <span style="flex:1;font-size:0.92rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;${n.is_pinned?'font-weight:600':''}">${escapeHtml(n.title)}</span>
        <div style="display:flex;gap:1rem;font-size:0.78rem;color:#8fa3c8;flex-shrink:0;margin-left:1rem">
          <span><i class="fas fa-eye"></i> ${(n.view_count||0).toLocaleString()}</span>
          <span>${formatDate(n.created_at)}</span>
        </div>
      </div>`) .join('')
      : '<div style="text-align:center;padding:3rem;color:#8fa3c8">등록된 게시글이 없습니다.</div>'}
    </div>
    ${renderPagination(page, pages, (p) => navigate('/news?type='+type+'&page='+p))}`;
}

// News Detail
async function renderNewsDetailPage(container, params) {
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
  
  const r = await api.get(`/news/${params.id}`);
  if (!r.ok) return;
  
  const { item: n, prev, next } = r.data;
  
  container.innerHTML = `
  <div class="container" style="padding-top:1.5rem;padding-bottom:3rem;max-width:800px">
    <div style="font-size:0.85rem;color:#6b7280;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
      <a href="/news" onclick="navigate('/news');return false" style="color:#6b7280;text-decoration:none">뉴스/공지</a>
      <i class="fas fa-chevron-right" style="font-size:0.7rem"></i>
      <span>${n.news_type==='notice'?'공지사항':n.news_type==='event'?'이벤트':'뉴스'}</span>
    </div>
    <div style="background:white;border-radius:16px;padding:2rem;box-shadow:0 2px 12px rgba(0,0,0,0.07)">
      <div style="margin-bottom:1rem">
        <span class="news-type-badge news-type-${n.news_type}" style="margin-bottom:0.75rem;display:inline-block">
          ${n.news_type==='notice'?'공지사항':n.news_type==='event'?'이벤트':'뉴스'}
        </span>
        <h1 style="font-size:1.35rem;font-weight:800;line-height:1.4;margin-bottom:0.5rem">${escapeHtml(n.title)}</h1>
        <div style="display:flex;gap:1rem;font-size:0.82rem;color:#8fa3c8">
          <span>${escapeHtml(n.author_name || '관리자')}</span>
          <span>${formatDate(n.created_at)}</span>
          <span>조회 ${(n.view_count||0).toLocaleString()}</span>
        </div>
      </div>
      <div style="border-top:1px solid #f3f4f6;padding-top:1.5rem;font-size:0.95rem;line-height:1.9;color:#374151">
        ${nl2br(n.content)}
      </div>
    </div>
    
    <!-- 이전/다음 -->
    <div style="background:white;border-radius:12px;margin-top:1rem;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
      ${prev ? `<div style="display:flex;align-items:center;padding:0.75rem 1.25rem;border-bottom:1px solid #f3f4f6;cursor:pointer" onclick="navigate('/news/${prev.id}')">
        <span style="font-size:0.78rem;color:#8fa3c8;width:50px">◀ 이전글</span>
        <span style="font-size:0.9rem;flex:1">${escapeHtml(prev.title)}</span>
      </div>` : ''}
      ${next ? `<div style="display:flex;align-items:center;padding:0.75rem 1.25rem;cursor:pointer" onclick="navigate('/news/${next.id}')">
        <span style="font-size:0.78rem;color:#8fa3c8;width:50px">▶ 다음글</span>
        <span style="font-size:0.9rem;flex:1">${escapeHtml(next.title)}</span>
      </div>` : ''}
    </div>
    <div style="margin-top:1rem">
      <button class="btn btn-secondary" onclick="navigate('/news')"><i class="fas fa-list"></i> 목록으로</button>
    </div>
  </div>`;
}

// ============================================================
// PAGINATION HELPER
// ============================================================
function renderPagination(currentPage, totalPages, onClickFn) {
  if (totalPages <= 1) return '';
  
  window._paginationHandler = onClickFn;
  
  let html = '<div class="pagination">';
  html += `<button class="page-btn" onclick="_paginationHandler(${currentPage-1})" ${currentPage<=1?'disabled':''}>
    <i class="fas fa-chevron-left"></i></button>`;
  
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  
  if (start > 1) html += `<button class="page-btn" onclick="_paginationHandler(1)">1</button>`;
  if (start > 2) html += `<span style="padding:0 0.25rem;color:#8fa3c8">...</span>`;
  
  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i===currentPage?'active':''}" onclick="_paginationHandler(${i})">${i}</button>`;
  }
  
  if (end < totalPages - 1) html += `<span style="padding:0 0.25rem;color:#8fa3c8">...</span>`;
  if (end < totalPages) html += `<button class="page-btn" onclick="_paginationHandler(${totalPages})">${totalPages}</button>`;
  
  html += `<button class="page-btn" onclick="_paginationHandler(${currentPage+1})" ${currentPage>=totalPages?'disabled':''}>
    <i class="fas fa-chevron-right"></i></button>`;
  html += '</div>';
  
  return html;
}
