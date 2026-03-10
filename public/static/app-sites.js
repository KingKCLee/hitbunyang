// 히트분양 - 현장찾기(/sites) 페이지 - 사이드바 필터 + 히트지수 카드

async function renderSitesPageContent(container) {
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

  container.innerHTML = `
  <div class="sites-page">
    <!-- 페이지 헤더 -->
    <div class="sites-page-header">
      <div class="container">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <i class="fas fa-search-location" style="font-size:1.4rem;color:white;opacity:0.9"></i>
          <div>
            <h1 class="sites-page-title">현장찾기</h1>
            <p class="sites-page-subtitle">히트지수 기반으로 최고의 분양 현장을 찾아보세요</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="sites-layout">
        <!-- 사이드바 필터 -->
        <aside class="sites-sidebar">
          <div class="sidebar-section">
            <div class="sidebar-section-title">
              <i class="fas fa-search"></i> 키워드 검색
            </div>
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
            <div class="sidebar-section-title">
              <i class="fas fa-map-marker-alt"></i> 지역 선택
            </div>
            <div class="sidebar-region-list">
              <button class="sidebar-region-btn ${region==='all'?'active':''}" 
                onclick="updateSitesFilter('region','all')">🗺️ 전체 지역</button>
              ${regionList.map(r => `
                <button class="sidebar-region-btn ${region===r?'active':''}" 
                  onclick="updateSitesFilter('region','${r}')"
                  style="${region===r?`border-color:${getRegionColor(r)};background:${getRegionColor(r)}15;color:${getRegionColor(r)}`:''}">
                  <span class="region-dot" style="background:${getRegionColor(r)}"></span>
                  ${r}
                </button>`).join('')}
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section-title">
              <i class="fas fa-building"></i> 유형
            </div>
            <div class="sidebar-chip-list">
              ${typeList.map(([v,l]) => `
                <button class="sidebar-chip ${type===v?'active':''}" 
                  onclick="updateSitesFilter('type','${v}')">${l}</button>`).join('')}
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section-title">
              <i class="fas fa-flag"></i> 분양 상태
            </div>
            <div class="sidebar-chip-list">
              ${statusList.map(([v,l]) => `
                <button class="sidebar-chip ${status===v?'active':''}" 
                  onclick="updateSitesFilter('status','${v}')">${l}</button>`).join('')}
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section-title">
              <i class="fas fa-sort-amount-down"></i> 정렬
            </div>
            <div class="sidebar-chip-list">
              ${sortList.map(([v,l]) => `
                <button class="sidebar-chip ${sort===v?'active':''}" 
                  onclick="updateSitesFilter('sort','${v}')">${l}</button>`).join('')}
            </div>
          </div>

          <div class="sidebar-section">
            <button class="sidebar-reset-btn" onclick="navigate('/sites')">
              <i class="fas fa-undo"></i> 필터 초기화
            </button>
            <button class="sidebar-map-btn" onclick="navigate('/hitmap')">
              <i class="fas fa-map"></i> 히트맵으로 보기
            </button>
          </div>

          <!-- 광고 배너 -->
          <div class="sidebar-ad-box">
            <div class="sidebar-ad-badge">광고</div>
            <div class="sidebar-ad-title">🔥 히트AD 등록</div>
            <div class="sidebar-ad-desc">히트지수 최상단<br>노출 보장</div>
            <button onclick="navigate('/ad-info')" class="sidebar-ad-btn">신청하기</button>
          </div>
        </aside>

        <!-- 메인 콘텐츠 -->
        <main class="sites-main">
          <!-- 상단 요약바 -->
          <div class="sites-top-bar">
            <div class="sites-filter-tags">
              ${region !== 'all' ? `<span class="filter-tag">${region} <button onclick="updateSitesFilter('region','all')">×</button></span>` : ''}
              ${type !== 'all' ? `<span class="filter-tag">${typeList.find(([v])=>v===type)?.[1]||type} <button onclick="updateSitesFilter('type','all')">×</button></span>` : ''}
              ${status !== 'all' ? `<span class="filter-tag">${statusList.find(([v])=>v===status)?.[1]||status} <button onclick="updateSitesFilter('status','all')">×</button></span>` : ''}
              ${search ? `<span class="filter-tag">"${escapeHtml(search)}" <button onclick="updateSitesFilter('search','')">×</button></span>` : ''}
            </div>
            <div class="sites-view-toggle">
              <button class="view-toggle-btn active" id="view-grid-btn" onclick="setViewMode('grid')">
                <i class="fas fa-th"></i>
              </button>
              <button class="view-toggle-btn" id="view-list-btn" onclick="setViewMode('list')">
                <i class="fas fa-list"></i>
              </button>
            </div>
          </div>

          <div id="sites-results">
            <div class="loading-overlay"><div class="spinner"></div></div>
          </div>
        </main>
      </div>
    </div>
  </div>`;

  await loadSites(region, type, sort, search, page, status);
}

window.updateSitesFilter = function(key, value) {
  const params = new URLSearchParams(location.search);
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
  if (grid) {
    grid.className = mode === 'list' ? 'sites-results-list' : 'sites-results-grid';
  }
};

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
    <span>총 <strong>${total.toLocaleString()}</strong>개 현장 (히트지수순 정렬)</span>
  </div>
  <div class="sites-results-grid">
    ${data.map(p => renderSiteCard(p)).join('')}
  </div>
  ${renderPagination(page, pages, (p) => updateSitesFilter('page', p))}`;
}

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
      <!-- 히트지수 오버레이 -->
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

