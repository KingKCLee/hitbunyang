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
// JOB DETAIL PAGE  (분양라인 스타일 v2)
// ============================================================
async function renderJobDetailPage(container, params) {
  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
  
  const r = await api.get(`/jobs/${params.id}`);
  if (!r.ok) { container.innerHTML = `<div class="container"><div class="alert alert-error">게시글을 불러오는데 실패했습니다.</div></div>`; return; }
  
  const { post: j, related } = r.data;
  
  const badges = [];
  if (j.ad_type === 'premium') badges.push('<span class="badge badge-premium-ad" style="font-size:0.82rem;padding:3px 10px">★ 프리미엄</span>');
  if (j.ad_type === 'superior') badges.push('<span class="badge" style="background:#ede9fe;color:#6d28d9;border:1px solid #c4b5fd;font-size:0.82rem;padding:3px 10px">◆ 슈페리어</span>');
  if (j.is_urgent) badges.push('<span class="badge badge-urgent" style="font-size:0.82rem;padding:3px 10px">🚨 급구</span>');
  if (j.is_hot) badges.push('<span class="badge badge-hot" style="font-size:0.82rem;padding:3px 10px">🔥 HOT</span>');
  if (j.is_best) badges.push('<span class="badge badge-best" style="font-size:0.82rem;padding:3px 10px">💰 대박</span>');

  // 공유 URL  
  const shareUrl = `https://www.bunyangline.com/r/share/${j.id}`;

  // 업종 파싱
  const propTypes = j.property_types ? j.property_types.split(',').map(t => t.trim()).filter(Boolean) : [];

  // 급여 정보 행 구성
  const payRows = [];
  if (j.commission_note || j.commission_rate) {
    if (j.commission_rate) payRows.push(`<tr><td class="cl-info-label">수수료율</td><td>${escapeHtml(String(j.commission_rate))}%</td></tr>`);
    if (j.commission_note) payRows.push(`<tr><td class="cl-info-label">수수료 조건</td><td style="white-space:pre-line">${escapeHtml(j.commission_note)}</td></tr>`);
  }
  if (j.daily_pay > 0) payRows.push(`<tr><td class="cl-info-label">일비</td><td>${Number(j.daily_pay).toLocaleString()}원</td></tr>`);
  if (j.accommodation_pay > 0) payRows.push(`<tr><td class="cl-info-label">숙소비</td><td>${Number(j.accommodation_pay).toLocaleString()}원/월</td></tr>`);
  if (j.meal_support) payRows.push(`<tr><td class="cl-info-label">식사</td><td>${escapeHtml(j.meal_support)}</td></tr>`);
  if (j.transport_support) payRows.push(`<tr><td class="cl-info-label">교통비</td><td>${escapeHtml(j.transport_support)}</td></tr>`);
  if (j.sales_support) payRows.push(`<tr><td class="cl-info-label">영업비</td><td>${escapeHtml(j.sales_support)}</td></tr>`);

  container.innerHTML = `
  <style>
    .cl-detail-wrap { max-width:960px; margin:0 auto; padding:1.5rem 1rem 4rem; }
    .cl-detail-grid { display:grid; grid-template-columns:1fr 300px; gap:1.5rem; }
    @media(max-width:860px){ .cl-detail-grid{ grid-template-columns:1fr!important; } }
    .cl-card { background:#fff; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.07); margin-bottom:1rem; overflow:hidden; }
    .cl-card-body { padding:1.25rem 1.5rem; }
    .cl-infoBoxBasic { border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:1rem; }
    .cl-infoBoxBasic-title { background:#f4f6fa; padding:0.65rem 1rem; font-size:0.88rem; font-weight:700; color:#374151; border-bottom:1px solid #e5e7eb; }
    .cl-infoBoxBasic table { width:100%; border-collapse:collapse; }
    .cl-infoBoxBasic table td { padding:0.6rem 1rem; font-size:0.87rem; border-bottom:1px solid #f3f4f6; vertical-align:top; }
    .cl-infoBoxBasic table tr:last-child td { border-bottom:none; }
    .cl-info-label { width:110px; color:#6b7280; font-size:0.82rem; white-space:nowrap; }
    .cl-title-area { padding:1.25rem 1.5rem 0; }
    .cl-main-img { width:100%; max-height:400px; object-fit:cover; border-radius:0; display:block; }
    .cl-main-img-wrap { position:relative; background:#f3f4f6; }
    .cl-contact-box { background:#fff; border-radius:12px; padding:1.25rem; box-shadow:0 4px 20px rgba(0,0,0,0.1); border:2px solid #bfdbfe; position:sticky; top:80px; }
    .cl-share-bar { display:flex; gap:0.5rem; padding:0.75rem 1.5rem; border-top:1px solid #f3f4f6; }
    .cl-share-btn { flex:1; padding:0.5rem; border:1px solid #e5e7eb; border-radius:6px; background:#fff; font-size:0.8rem; cursor:pointer; text-align:center; color:#374151; }
    .cl-share-btn:hover { background:#f9fafb; }
    .cl-desc-box { padding:1.25rem 1.5rem; font-size:0.9rem; line-height:1.85; color:#374151; white-space:pre-line; }
  </style>

  <div class="cl-detail-wrap">
    <!-- 브레드크럼 -->
    <div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:1rem;font-size:0.83rem;color:#9ca3af">
      <a href="/" onclick="navigate('/');return false" style="color:#9ca3af;text-decoration:none">홈</a>
      <i class="fas fa-chevron-right" style="font-size:0.65rem"></i>
      <a href="/jobs" onclick="navigate('/jobs');return false" style="color:#9ca3af;text-decoration:none">채용정보</a>
      <i class="fas fa-chevron-right" style="font-size:0.65rem"></i>
      <span style="color:#374151;font-weight:600">${escapeHtml(j.title)}</span>
    </div>

    <div class="cl-detail-grid">
      <!-- 메인 컨텐츠 -->
      <div>
        <div class="cl-card">
          <!-- 이미지 -->
          ${j.image_url ? `<div class="cl-main-img-wrap">
            <img src="${escapeHtml(j.image_url)}" alt="${escapeHtml(j.title)}" class="cl-main-img" onerror="this.style.display='none'">
          </div>` : ''}

          <!-- 제목 영역 -->
          <div class="cl-title-area">
            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.6rem">${badges.join('')}</div>
            <h1 style="font-size:1.35rem;font-weight:900;line-height:1.35;margin-bottom:0.4rem;color:#111827">${escapeHtml(j.title)}</h1>
            <div style="display:flex;align-items:center;gap:1rem;font-size:0.82rem;color:#9ca3af;margin-bottom:0.5rem">
              <span><i class="fas fa-eye"></i> 조회 ${(j.view_count||0).toLocaleString()}</span>
              <span><i class="fas fa-clock"></i> ${j.created_at ? j.created_at.replace('T',' ').substring(0,19) : ''}</span>
              ${j.expires_at ? `<span><i class="fas fa-calendar-times" style="color:#ef4444"></i> 마감 ${formatDate(j.expires_at)}</span>` : ''}
            </div>
          </div>

          <!-- 근무지 정보 -->
          <div class="cl-card-body" style="padding-top:0.5rem">
            <div class="cl-infoBoxBasic">
              <div class="cl-infoBoxBasic-title">📍 근무지 정보</div>
              <table>
                <tr><td class="cl-info-label">근무지명</td><td style="font-weight:700">${escapeHtml(j.site_name)}</td></tr>
                ${j.work_address ? `<tr><td class="cl-info-label">근무지 주소</td><td>${escapeHtml(j.work_address)}${j.work_address_detail ? `<br><span style="font-size:0.8rem;color:#6b7280">(${escapeHtml(j.work_address_detail)})</span>` : ''}</td></tr>` : ''}
                ${j.biz_address && j.biz_address !== j.work_address ? `<tr><td class="cl-info-label">사업지 주소</td><td>${escapeHtml(j.biz_address)}</td></tr>` : ''}
                <tr><td class="cl-info-label">지역</td><td>${escapeHtml(j.region)}</td></tr>
                ${j.start_date ? `<tr><td class="cl-info-label">투입일</td><td>${escapeHtml(j.start_date)}</td></tr>` : ''}
              </table>
            </div>

            <!-- 사업자 정보 -->
            ${(j.enforcement_company || j.construction_company || j.trust_company || j.agency_company) ? `
            <div class="cl-infoBoxBasic">
              <div class="cl-infoBoxBasic-title">🏢 사업자 정보</div>
              <table>
                ${j.enforcement_company ? `<tr><td class="cl-info-label">시행사</td><td>${escapeHtml(j.enforcement_company)}</td></tr>` : ''}
                ${j.construction_company ? `<tr><td class="cl-info-label">시공사</td><td>${escapeHtml(j.construction_company)}</td></tr>` : ''}
                ${j.trust_company ? `<tr><td class="cl-info-label">신탁사</td><td>${escapeHtml(j.trust_company)}</td></tr>` : ''}
                ${j.agency_company ? `<tr><td class="cl-info-label">대행사</td><td>${escapeHtml(j.agency_company)}</td></tr>` : ''}
              </table>
            </div>` : ''}

            <!-- 사업지 정보 -->
            <div class="cl-infoBoxBasic">
              <div class="cl-infoBoxBasic-title">🏗 사업지 정보</div>
              <table>
                <tr><td class="cl-info-label">업종</td><td>${propTypes.length ? propTypes.map(t => `<span style="display:inline-block;background:#eff6ff;color:#1d4ed8;border-radius:4px;padding:1px 8px;font-size:0.8rem;margin-right:4px">${escapeHtml(t)}</span>`).join('') : escapeHtml(j.property_type||'-')}</td></tr>
                <tr><td class="cl-info-label">모집직급</td><td><strong>${getRankLabel(j.rank_type)}</strong></td></tr>
                ${j.recruit_count ? `<tr><td class="cl-info-label">모집인원</td><td>${escapeHtml(j.recruit_count)}</td></tr>` : ''}
                ${j.experience_required ? `<tr><td class="cl-info-label">경력조건</td><td>${escapeHtml(j.experience_required)}</td></tr>` : ''}
                ${j.gender && j.gender !== 'N' ? `<tr><td class="cl-info-label">성별</td><td>${j.gender==='M'?'남성':j.gender==='F'?'여성':'무관'}</td></tr>` : ''}
                ${j.age_condition ? `<tr><td class="cl-info-label">나이</td><td>${escapeHtml(j.age_condition)}</td></tr>` : ''}
              </table>
            </div>

            <!-- 급여 정보 -->
            ${payRows.length ? `
            <div class="cl-infoBoxBasic">
              <div class="cl-infoBoxBasic-title">💰 급여정보</div>
              <table>${payRows.join('')}</table>
            </div>` : ''}

            <!-- 근무후생 -->
            ${(j.meal_support || j.transport_support || j.sales_support || j.accommodation_pay > 0) ? `
            <div class="cl-infoBoxBasic">
              <div class="cl-infoBoxBasic-title">🎁 근무후생</div>
              <table>
                ${j.daily_pay > 0 ? `<tr><td class="cl-info-label">일비</td><td>${Number(j.daily_pay).toLocaleString()}원</td></tr>` : ''}
                ${j.accommodation_pay > 0 ? `<tr><td class="cl-info-label">숙소비</td><td>${Number(j.accommodation_pay).toLocaleString()}원/월</td></tr>` : ''}
                ${j.meal_support ? `<tr><td class="cl-info-label">식사</td><td>${escapeHtml(j.meal_support)}</td></tr>` : ''}
                ${j.transport_support ? `<tr><td class="cl-info-label">교통비</td><td>${escapeHtml(j.transport_support)}</td></tr>` : ''}
                ${j.sales_support ? `<tr><td class="cl-info-label">영업비</td><td>${escapeHtml(j.sales_support)}</td></tr>` : ''}
              </table>
            </div>` : ''}
          </div>

          <!-- 상세정보 (description) -->
          ${j.description ? `
          <div style="padding:0 1.5rem 0.5rem">
            <div class="cl-infoBoxBasic">
              <div class="cl-infoBoxBasic-title">📋 상세정보</div>
              <div class="cl-desc-box">${escapeHtml(j.description)}</div>
            </div>
          </div>` : ''}

          <!-- 공유 버튼 -->
          <div class="cl-share-bar">
            <button class="cl-share-btn" onclick="jobCopyLink('${shareUrl}')"><i class="fas fa-link"></i> URL 복사</button>
            <button class="cl-share-btn" onclick="window.print()"><i class="fas fa-print"></i> 인쇄</button>
            <a class="cl-share-btn" style="text-decoration:none" href="https://open.kakao.com/o/share?url=${encodeURIComponent(shareUrl)}" target="_blank"><i class="fas fa-share"></i> 공유</a>
          </div>
        </div>

        <!-- 관련 공고 -->
        ${related && related.length ? `
        <div class="cl-card">
          <div class="cl-card-body">
            <div style="font-weight:800;font-size:1rem;margin-bottom:0.75rem;color:#1f2937">📌 같은 지역 구인 공고</div>
            ${related.map(rj => `
            <div style="padding:0.6rem 0;border-bottom:1px solid #f3f4f6;cursor:pointer" onclick="navigate('/jobs/${rj.id}')">
              <div style="font-weight:700;font-size:0.9rem;color:#111827">${escapeHtml(rj.title)}</div>
              <div style="font-size:0.78rem;color:#6b7280;margin-top:0.2rem">
                ${escapeHtml(rj.region)} | ${getRankLabel(rj.rank_type)}
                ${rj.commission_rate ? ` | 수수료 ${rj.commission_rate}%` : ''}
                ${rj.daily_pay > 0 ? ` | 일비 ${Number(rj.daily_pay).toLocaleString()}원` : ''}
              </div>
            </div>`).join('')}
          </div>
        </div>` : ''}
      </div>

      <!-- 연락처 사이드바 -->
      <div>
        <div class="cl-contact-box">
          <div style="font-size:0.95rem;font-weight:800;color:#1e40af;margin-bottom:0.85rem;display:flex;align-items:center;gap:0.5rem">
            <i class="fas fa-phone-alt"></i> 지원 / 문의
          </div>
          <div style="background:#eff6ff;border-radius:8px;padding:0.9rem;margin-bottom:0.9rem">
            <div style="font-size:0.75rem;color:#6b7280;margin-bottom:0.2rem">담당자</div>
            <div style="font-weight:800;font-size:1rem;margin-bottom:0.25rem">${escapeHtml(j.contact_name)}</div>
            <a href="tel:${escapeHtml(j.contact_phone)}" style="color:#1e40af;font-weight:700;font-size:0.95rem;text-decoration:none">
              <i class="fas fa-phone"></i> ${escapeHtml(j.contact_phone)}
            </a>
            ${j.contact_kakao ? `<div style="margin-top:0.5rem;background:#FEE500;color:#1c1c1c;font-weight:700;font-size:0.82rem;padding:0.3rem 0.7rem;border-radius:5px;display:inline-block">
              💬 카카오 ID: ${escapeHtml(j.contact_kakao)}
            </div>` : ''}
          </div>

          <form onsubmit="submitJobInquiry(event, ${j.id})">
            <div class="form-group">
              <input class="form-input" name="name" placeholder="이름 *" required value="${state.user ? escapeHtml(state.user.name) : ''}">
            </div>
            <div class="form-group">
              <input class="form-input" name="phone" placeholder="연락처 *" required value="${state.user ? escapeHtml(state.user.phone||'') : ''}">
            </div>
            <div class="form-group">
              <textarea class="form-textarea" name="message" placeholder="지원 내용 (경력, 희망 조건 등)" style="min-height:75px"></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;font-size:0.92rem">
              <i class="fas fa-paper-plane"></i> 지원 문의 접수
            </button>
          </form>
          <div id="job-inquiry-result" style="margin-top:0.5rem"></div>

          <div style="margin-top:0.85rem;padding-top:0.75rem;border-top:1px solid #e5e7eb;font-size:0.78rem;color:#9ca3af;line-height:1.6">
            공유 URL<br>
            <span style="font-size:0.72rem;color:#6b7280;word-break:break-all">${shareUrl}</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
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
