// 히트분양 - 현장찾기(/sites) + 구인구직 통합 페이지

async function renderSitesPageContent(container) {
  const params = new URLSearchParams(location.search);
  const tab = params.get('tab') || 'sites'; // 'sites' | 'jobs'

  // ── 공통 헤더 ──
  container.innerHTML = `
  <div class="sites-page">
    <!-- 페이지 헤더 -->
    <div class="sites-page-header">
      <div class="container">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <i class="fas fa-search-location" style="font-size:1.4rem;color:white;opacity:0.9"></i>
          <div>
            <h1 class="sites-page-title">현장찾기</h1>
            <p class="sites-page-subtitle">분양 현장 정보와 현장별 구인구직을 한눈에</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 탭 전환 -->
    <div style="background:white;border-bottom:2px solid var(--border);">
      <div class="container">
        <div style="display:flex;gap:0">
          <button id="tab-btn-sites" onclick="switchSitesTab('sites')"
            style="padding:0.85rem 1.4rem;border:none;background:none;font-size:0.92rem;font-weight:700;
              cursor:pointer;font-family:inherit;border-bottom:3px solid ${tab==='sites'?'var(--primary)':'transparent'};
              color:${tab==='sites'?'var(--primary)':'var(--text-secondary)'};margin-bottom:-2px;transition:all 0.15s">
            <i class="fas fa-building" style="margin-right:0.4rem"></i>분양 현장
          </button>
          <button id="tab-btn-jobs" onclick="switchSitesTab('jobs')"
            style="padding:0.85rem 1.4rem;border:none;background:none;font-size:0.92rem;font-weight:700;
              cursor:pointer;font-family:inherit;border-bottom:3px solid ${tab==='jobs'?'var(--primary)':'transparent'};
              color:${tab==='jobs'?'var(--primary)':'var(--text-secondary)'};margin-bottom:-2px;transition:all 0.15s">
            <i class="fas fa-briefcase" style="margin-right:0.4rem"></i>구인구직
          </button>
        </div>
      </div>
    </div>

    <!-- 탭 콘텐츠 영역 -->
    <div id="sites-tab-content"></div>
  </div>`;

  if (tab === 'jobs') {
    renderJobsTabContent();
  } else {
    renderSitesTabContent();
  }
}

// ============================================================
// 탭 전환
// ============================================================
window.switchSitesTab = function(tab) {
  const p = new URLSearchParams(location.search);
  p.set('tab', tab);
  // 탭 전환 시 필터 초기화
  ['region','type','sort','search','page','status','rank_type','region_job'].forEach(k => p.delete(k));
  navigate('/sites?' + p.toString());
};

// ============================================================
// 탭 1: 분양 현장
// ============================================================
function renderSitesTabContent() {
  const params = new URLSearchParams(location.search);
  const region = params.get('region') || 'all';
  const type = params.get('type') || 'all';
  const sort = params.get('sort') || 'hot';
  const search = params.get('search') || '';
  const page = parseInt(params.get('page') || '1');
  const status = params.get('status') || 'all';

  const regionList = ['서울','경기북부','경기남부','인천','부산','대구','광주','대전','울산','세종','충청','전라','경상','강원','제주'];
  const typeList = [['all','전체'],['apartment','아파트'],['officetel','오피스텔'],['commercial','상가'],['villa','빌라/연립'],['land','토지']];
  const sortList = [['hot','히트지수순'],['latest','최신순'],['views','조회수순'],['price_asc','가격낮은순'],['price_desc','가격높은순']];
  const statusList = [['all','전체'],['active','분양중'],['upcoming','분양예정'],['completed','분양완료']];

  const el = document.getElementById('sites-tab-content');
  if (!el) return;

  el.innerHTML = `
  <div class="container">
    <div class="sites-layout">
      <!-- 사이드바 필터 -->
      <aside class="sites-sidebar">
        <div class="sidebar-section">
          <div class="sidebar-section-title"><i class="fas fa-search"></i> 키워드 검색</div>
          <div class="sidebar-search-wrap">
            <input type="text" id="sites-search-input" value="${escapeHtml(search)}"
              placeholder="현장명, 지역 검색..."
              onkeydown="if(event.key==='Enter')updateSitesFilter('search',this.value)"
              class="sidebar-search-input">
            <button onclick="updateSitesFilter('search',document.getElementById('sites-search-input').value)"
              class="sidebar-search-btn"><i class="fas fa-search"></i></button>
          </div>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-section-title"><i class="fas fa-map-marker-alt"></i> 지역 선택</div>
          <div class="sidebar-region-list">
            <button class="sidebar-region-btn ${region==='all'?'active':''}"
              onclick="updateSitesFilter('region','all')">🗺️ 전체 지역</button>
            ${regionList.map(r => `
              <button class="sidebar-region-btn ${region===r?'active':''}"
                onclick="updateSitesFilter('region','${r}')"
                style="${region===r?`border-color:${getRegionColor(r)};background:${getRegionColor(r)}15;color:${getRegionColor(r)}`:''}">
                <span class="region-dot" style="background:${getRegionColor(r)}"></span>${r}
              </button>`).join('')}
          </div>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-section-title"><i class="fas fa-building"></i> 유형</div>
          <div class="sidebar-chip-list">
            ${typeList.map(([v,l]) => `<button class="sidebar-chip ${type===v?'active':''}" onclick="updateSitesFilter('type','${v}')">${l}</button>`).join('')}
          </div>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-section-title"><i class="fas fa-flag"></i> 분양 상태</div>
          <div class="sidebar-chip-list">
            ${statusList.map(([v,l]) => `<button class="sidebar-chip ${status===v?'active':''}" onclick="updateSitesFilter('status','${v}')">${l}</button>`).join('')}
          </div>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-section-title"><i class="fas fa-sort-amount-down"></i> 정렬</div>
          <div class="sidebar-chip-list">
            ${sortList.map(([v,l]) => `<button class="sidebar-chip ${sort===v?'active':''}" onclick="updateSitesFilter('sort','${v}')">${l}</button>`).join('')}
          </div>
        </div>
        <div class="sidebar-section">
          <button class="sidebar-reset-btn" onclick="navigate('/sites')"><i class="fas fa-undo"></i> 필터 초기화</button>
          <button class="sidebar-map-btn" onclick="navigate('/hitmap')"><i class="fas fa-map"></i> 히트맵으로 보기</button>
        </div>
        <div class="sidebar-ad-box">
          <div class="sidebar-ad-badge">광고</div>
          <div class="sidebar-ad-title">🔥 히트AD 등록</div>
          <div class="sidebar-ad-desc">히트지수 최상단<br>노출 보장</div>
          <button onclick="navigate('/ad-info')" class="sidebar-ad-btn">신청하기</button>
        </div>
      </aside>

      <!-- 메인 콘텐츠 -->
      <main class="sites-main">
        <div class="sites-top-bar">
          <div class="sites-filter-tags">
            ${region !== 'all' ? `<span class="filter-tag">${region} <button onclick="updateSitesFilter('region','all')">×</button></span>` : ''}
            ${type !== 'all' ? `<span class="filter-tag">${typeList.find(([v])=>v===type)?.[1]||type} <button onclick="updateSitesFilter('type','all')">×</button></span>` : ''}
            ${status !== 'all' ? `<span class="filter-tag">${statusList.find(([v])=>v===status)?.[1]||status} <button onclick="updateSitesFilter('status','all')">×</button></span>` : ''}
            ${search ? `<span class="filter-tag">"${escapeHtml(search)}" <button onclick="updateSitesFilter('search','')">×</button></span>` : ''}
          </div>
          <div class="sites-view-toggle">
            <button class="view-toggle-btn active" id="view-grid-btn" onclick="setViewMode('grid')"><i class="fas fa-th"></i></button>
            <button class="view-toggle-btn" id="view-list-btn" onclick="setViewMode('list')"><i class="fas fa-list"></i></button>
          </div>
        </div>
        <div id="sites-results">
          <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
      </main>
    </div>
  </div>`;

  loadSites(region, type, sort, search, page, status);
}

// ============================================================
// 탭 2: 구인구직 (분양현장 구인공고)
// ============================================================
function renderJobsTabContent() {
  const params = new URLSearchParams(location.search);
  const region = params.get('region_job') || 'all';
  const rankType = params.get('rank_type') || 'all';
  const search = params.get('search') || '';
  const page = parseInt(params.get('page') || '1');

  const regionList = ['서울','경기북부','경기남부','인천','부산','대구','광주','대전','울산','세종','충청','전라','경상','강원','제주'];
  const rankList = [
    ['all','전체 직급'],
    ['director','소장'],
    ['team_leader','팀장'],
    ['member','팀원'],
    ['part_timer','단기/파트'],
  ];

  const el = document.getElementById('sites-tab-content');
  if (!el) return;

  el.innerHTML = `
  <div class="container">
    <div class="sites-layout">
      <!-- 사이드바 필터 -->
      <aside class="sites-sidebar">
        <div class="sidebar-section">
          <div class="sidebar-section-title"><i class="fas fa-search"></i> 공고 검색</div>
          <div class="sidebar-search-wrap">
            <input type="text" id="jobs-search-input" value="${escapeHtml(search)}"
              placeholder="현장명, 지역 검색..."
              onkeydown="if(event.key==='Enter')updateJobsFilter('search',this.value)"
              class="sidebar-search-input">
            <button onclick="updateJobsFilter('search',document.getElementById('jobs-search-input').value)"
              class="sidebar-search-btn"><i class="fas fa-search"></i></button>
          </div>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-section-title"><i class="fas fa-map-marker-alt"></i> 지역 선택</div>
          <div class="sidebar-region-list">
            <button class="sidebar-region-btn ${region==='all'?'active':''}"
              onclick="updateJobsFilter('region_job','all')">🗺️ 전체 지역</button>
            ${regionList.map(r => `
              <button class="sidebar-region-btn ${region===r?'active':''}"
                onclick="updateJobsFilter('region_job','${r}')"
                style="${region===r?`border-color:${getRegionColor(r)};background:${getRegionColor(r)}15;color:${getRegionColor(r)}`:''}">
                <span class="region-dot" style="background:${getRegionColor(r)}"></span>${r}
              </button>`).join('')}
          </div>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-section-title"><i class="fas fa-user-tie"></i> 모집 직급</div>
          <div class="sidebar-chip-list">
            ${rankList.map(([v,l]) => `<button class="sidebar-chip ${rankType===v?'active':''}" onclick="updateJobsFilter('rank_type','${v}')">${l}</button>`).join('')}
          </div>
        </div>
        <div class="sidebar-section">
          <button class="sidebar-reset-btn" onclick="navigate('/sites?tab=jobs')"><i class="fas fa-undo"></i> 필터 초기화</button>
          <button class="sidebar-map-btn" onclick="navigate('/sites?tab=jobs&is_urgent=1')" style="background:var(--accent-red);color:white;border-color:var(--accent-red)">
            <i class="fas fa-fire"></i> 급구만 보기
          </button>
        </div>
        <div class="sidebar-section" style="background:#fff7ed;border-radius:10px;padding:0.85rem;text-align:center">
          <div style="font-size:0.82rem;font-weight:700;color:#92400e;margin-bottom:0.4rem">💼 구인 공고 등록</div>
          <div style="font-size:0.75rem;color:#b45309;line-height:1.5;margin-bottom:0.6rem">분양 현장 구인 정보를<br>무료로 등록하세요</div>
          <button onclick="navigate('/jobs/new')"
            style="background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;
              border-radius:8px;padding:0.45rem 1rem;font-size:0.8rem;font-weight:700;cursor:pointer;font-family:inherit">
            공고 등록하기
          </button>
        </div>
      </aside>

      <!-- 메인 콘텐츠 -->
      <main class="sites-main">
        <div class="sites-top-bar">
          <div class="sites-filter-tags">
            ${region !== 'all' ? `<span class="filter-tag">${region} <button onclick="updateJobsFilter('region_job','all')">×</button></span>` : ''}
            ${rankType !== 'all' ? `<span class="filter-tag">${rankList.find(([v])=>v===rankType)?.[1]||rankType} <button onclick="updateJobsFilter('rank_type','all')">×</button></span>` : ''}
            ${search ? `<span class="filter-tag">"${escapeHtml(search)}" <button onclick="updateJobsFilter('search','')">×</button></span>` : ''}
          </div>
          <button class="btn btn-primary btn-sm" onclick="navigate('/jobs/new')">
            <i class="fas fa-plus"></i> 공고 등록
          </button>
        </div>
        <div id="jobs-results">
          <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
      </main>
    </div>
  </div>`;

  loadJobsInSites(region, rankType, search, page);
}

// ============================================================
// 필터 업데이트 함수들
// ============================================================
window.updateSitesFilter = function(key, value) {
  const params = new URLSearchParams(location.search);
  params.set('tab', 'sites');
  params.set(key, value);
  if (key !== 'page') params.set('page', '1');
  navigate('/sites?' + params.toString());
};

window.updateJobsFilter = function(key, value) {
  const params = new URLSearchParams(location.search);
  params.set('tab', 'jobs');
  params.set(key, value);
  if (key !== 'page') params.set('page', '1');
  navigate('/sites?' + params.toString());
};

let sitesViewMode = 'grid';
window.setViewMode = function(mode) {
  sitesViewMode = mode;
  document.getElementById('view-grid-btn')?.classList.toggle('active', mode === 'grid');
  document.getElementById('view-list-btn')?.classList.toggle('active', mode === 'list');
  const grid = document.querySelector('.sites-results-grid');
  if (grid) grid.className = mode === 'list' ? 'sites-results-list' : 'sites-results-grid';
};

// ============================================================
// 현장 목록 로드
// ============================================================
async function loadSites(region, type, sort, search, page, status) {
  const params = new URLSearchParams();
  if (region !== 'all') params.set('region', region);
  if (type !== 'all') params.set('type', type);
  if (status !== 'all') params.set('status', status);
  if (sort) params.set('sort', sort);
  if (search) params.set('search', search);
  params.set('page', page);
  params.set('limit', '12');

  const r = await api.get('/properties?' + params.toString());
  const el = document.getElementById('sites-results');
  if (!el) return;

  if (!r.ok) {
    el.innerHTML = `<div class="alert alert-error">데이터를 불러오는데 실패했습니다.</div>`;
    return;
  }

  const { data, total, pages } = r.data;

  if (!data || !data.length) {
    el.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">🏢</div>
      <div class="empty-state-text">조건에 맞는 현장이 없습니다.</div>
      <button class="btn btn-primary" style="margin-top:1rem" onclick="navigate('/sites')">전체 현장 보기</button>
    </div>`;
    return;
  }

  el.innerHTML = `
  <div class="sites-result-meta">
    <span>총 <strong>${total.toLocaleString()}</strong>개 현장</span>
  </div>
  <div class="sites-results-grid">
    ${data.map(p => renderSiteCard(p)).join('')}
  </div>
  ${renderPagination(page, pages, (p) => updateSitesFilter('page', p))}`;
}

// ============================================================
// 구인구직 목록 로드
// ============================================================
async function loadJobsInSites(region, rankType, search, page) {
  const params = new URLSearchParams();
  if (region !== 'all') params.set('region', region);
  if (rankType !== 'all') params.set('rank_type', rankType);
  if (search) params.set('search', search);
  params.set('page', page);
  params.set('limit', '15');

  const r = await api.get('/jobs?' + params.toString());
  const el = document.getElementById('jobs-results');
  if (!el) return;

  if (!r.ok) {
    // 데모 데이터
    el.innerHTML = renderDemoJobs();
    return;
  }

  const { data, total, pages } = r.data;

  if (!data || !data.length) {
    el.innerHTML = renderDemoJobs();
    return;
  }

  el.innerHTML = `
  <div class="sites-result-meta">
    <span>총 <strong>${total.toLocaleString()}</strong>개 구인 공고</span>
  </div>
  <div class="jobs-list">
    ${data.map(j => renderJobCardInSites(j)).join('')}
  </div>
  ${renderPagination(page, pages, (p) => updateJobsFilter('page', p))}`;
}

// ============================================================
// 구인 카드 (현장찾기 탭 내 스타일)
// ============================================================
function renderJobCardInSites(j) {
  const badges = [];
  if (j.is_urgent) badges.push('<span class="badge badge-urgent">🚨 급구</span>');
  if (j.is_hot)   badges.push('<span class="badge badge-hot">🔥 HOT</span>');
  if (j.is_best)  badges.push('<span class="badge badge-best">💰 대박</span>');
  if (j.ad_type === 'premium') badges.push('<span class="badge badge-premium-ad">★ 프리미엄</span>');

  const rankColors = { director:'#7c3aed', team_leader:'#1c7cff', member:'#059669', part_timer:'#d97706' };
  const rankColor = rankColors[j.rank_type] || '#6b7280';

  return `
  <div class="job-card-sites" onclick="navigate('/jobs/${j.id}')">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.75rem">
      <div style="flex:1;min-width:0">
        <div style="display:flex;gap:0.35rem;flex-wrap:wrap;margin-bottom:0.45rem">${badges.join('')}</div>
        <div style="font-size:0.97rem;font-weight:800;color:var(--text-primary);margin-bottom:0.3rem;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(j.title)}</div>
        <div style="font-size:0.82rem;color:var(--primary);font-weight:700;margin-bottom:0.4rem">
          <i class="fas fa-map-pin" style="opacity:0.7"></i> ${escapeHtml(j.site_name)}
        </div>
        <div style="display:flex;gap:0.6rem;flex-wrap:wrap;font-size:0.8rem;color:var(--text-secondary)">
          <span><i class="fas fa-map-marker-alt" style="color:#3b82f6"></i> ${escapeHtml(j.region)}</span>
          <span style="background:${rankColor}15;color:${rankColor};border:1px solid ${rankColor}30;
            border-radius:4px;padding:1px 6px;font-weight:700">${getRankLabel(j.rank_type)}</span>
          ${j.experience_required ? `<span style="color:#9ca3af">${escapeHtml(j.experience_required)}</span>` : ''}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:0.72rem;color:#9ca3af;margin-bottom:0.3rem">${timeAgo(j.created_at)}</div>
        ${j.commission_rate ? `<div style="font-size:0.82rem;font-weight:800;color:#92400e">
          수수료 ${j.commission_rate}%
        </div>` : ''}
        ${j.daily_pay > 0 ? `<div style="font-size:0.78rem;color:#166534;font-weight:700">
          일비 ${j.daily_pay.toLocaleString()}원
        </div>` : ''}
      </div>
    </div>
    ${j.contact_name ? `
    <div style="margin-top:0.6rem;padding-top:0.6rem;border-top:1px solid var(--border-light);
      display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:0.78rem;color:#6b7280">담당: ${escapeHtml(j.contact_name)}</span>
      <span style="font-size:0.78rem;color:var(--primary);font-weight:700">
        <i class="fas fa-phone"></i> ${escapeHtml(j.contact_phone)}
      </span>
    </div>` : ''}
  </div>`;
}

// ============================================================
// 데모 구인 데이터 (API 미연동 시)
// ============================================================
function renderDemoJobs() {
  const demos = [
    { id:1, title:'래미안 원펜타스 팀장 모집', site_name:'래미안 원펜타스', region:'서울', rank_type:'team_leader',
      commission_rate:1.5, daily_pay:100000, experience_required:'아파트 경력 2년 이상',
      contact_name:'김팀장', contact_phone:'010-1234-5678', is_urgent:true, is_hot:false, is_best:false, ad_type:'',
      created_at: new Date(Date.now()-3600000).toISOString() },
    { id:2, title:'힐스테이트 판교역 소장 구인', site_name:'힐스테이트 판교역', region:'경기남부', rank_type:'director',
      commission_rate:2.0, daily_pay:150000, experience_required:'소장 경력 5년 이상',
      contact_name:'이소장', contact_phone:'010-2345-6789', is_urgent:false, is_hot:true, is_best:false, ad_type:'premium',
      created_at: new Date(Date.now()-7200000).toISOString() },
    { id:3, title:'e편한세상 강남 팀원 다수 모집', site_name:'e편한세상 강남', region:'서울', rank_type:'member',
      commission_rate:1.0, daily_pay:80000, experience_required:'무관 (신입 가능)',
      contact_name:'박팀장', contact_phone:'010-3456-7890', is_urgent:true, is_hot:true, is_best:true, ad_type:'',
      created_at: new Date(Date.now()-10800000).toISOString() },
    { id:4, title:'부산 오션뷰 단지 단기 파트 모집', site_name:'오션뷰 레지던스', region:'부산', rank_type:'part_timer',
      commission_rate:0.8, daily_pay:70000, experience_required:'무관',
      contact_name:'최담당', contact_phone:'010-4567-8901', is_urgent:false, is_hot:false, is_best:false, ad_type:'',
      created_at: new Date(Date.now()-86400000).toISOString() },
    { id:5, title:'대전 트리플시티 팀장 모집', site_name:'대전 트리플시티', region:'대전', rank_type:'team_leader',
      commission_rate:1.8, daily_pay:120000, experience_required:'오피스텔 경력 1년 이상',
      contact_name:'정팀장', contact_phone:'010-5678-9012', is_urgent:false, is_hot:true, is_best:false, ad_type:'',
      created_at: new Date(Date.now()-172800000).toISOString() },
  ];

  return `
  <div class="sites-result-meta">
    <span>총 <strong>${demos.length}</strong>개 구인 공고 <span style="color:#9ca3af;font-size:0.78rem">(데모)</span></span>
  </div>
  <div class="jobs-list">
    ${demos.map(j => renderJobCardInSites(j)).join('')}
  </div>`;
}

// ============================================================
// 현장 카드
// ============================================================
function renderSiteCard(p) {
  const score = calcHitScore(p);
  const color = getHitScoreColor(score);

  const badges = [];
  if (p.ad_type === 'hit') badges.push('<span class="badge badge-hit-ad">🔥 히트</span>');
  else if (p.ad_type === 'premium') badges.push('<span class="badge badge-premium-ad">⭐</span>');
  if (p.is_hot) badges.push('<span class="badge badge-hot">HOT</span>');
  if (p.is_new) badges.push('<span class="badge badge-new">NEW</span>');
  if (p.status === 'upcoming') badges.push('<span class="badge badge-upcoming">예정</span>');

  return `
  <div class="site-card ${p.ad_type === 'hit' ? 'site-card-hit' : p.ad_type === 'premium' ? 'site-card-premium' : ''}"
    onclick="navigate('/properties/${p.id}')">
    <div class="site-card-img" style="background:${getPropertyBgImage(p.property_type)}">
      <div class="site-card-badges">${badges.join('')}</div>
      <i class="fas fa-building" style="color:rgba(255,255,255,0.4);font-size:2.5rem"></i>
      <div class="site-hit-overlay">
        <div class="site-hit-ring" style="border-color:${color}">
          <span style="color:${color};font-weight:900;font-size:0.9rem">${score}</span>
        </div>
        <span class="site-hit-label" style="background:${color}">${getHitScoreLabel(score)}</span>
      </div>
    </div>
    <div class="site-card-body">
      <div class="site-card-tags">
        <span class="region-tag" style="background:${getRegionColor(p.region)}15;color:${getRegionColor(p.region)};border:1px solid ${getRegionColor(p.region)}30">
          ${escapeHtml(p.region)}
        </span>
        <span class="badge badge-gray">${getPropertyTypeLabel(p.property_type)}</span>
      </div>
      <div class="site-card-title">${escapeHtml(p.title)}</div>
      ${p.subtitle ? `<div class="site-card-sub">${escapeHtml(p.subtitle)}</div>` : ''}
      <div class="site-card-price">${formatPriceRange(p.price_min, p.price_max)}</div>
      <div class="site-hit-bar-row">
        <span style="font-size:0.72rem;color:#6b7280">히트지수</span>
        <div class="site-hit-bar-track">
          <div class="site-hit-bar-fill" style="width:${score}%;background:${color}"></div>
        </div>
        <span style="font-size:0.72rem;font-weight:700;color:${color}">${score}</span>
      </div>
      <div class="site-card-meta">
        ${p.supply_area_min ? `<span><i class="fas fa-ruler-combined"></i> ${p.supply_area_min}㎡~</span>` : ''}
        ${p.total_units ? `<span><i class="fas fa-home"></i> ${p.total_units.toLocaleString()}세대</span>` : ''}
        ${p.completion_date ? `<span><i class="fas fa-calendar"></i> ${p.completion_date}</span>` : ''}
      </div>
    </div>
    <div class="site-card-footer">
      <span><i class="fas fa-eye"></i> ${(p.view_count||0).toLocaleString()}</span>
      <span><i class="fas fa-comment"></i> ${(p.inquiry_count||0).toLocaleString()}</span>
      <span>${timeAgo(p.created_at)}</span>
    </div>
  </div>`;
}

// Window bindings
window.renderSitesPageContent = renderSitesPageContent;
