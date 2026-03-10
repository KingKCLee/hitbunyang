// 분양라인 - Part 2: 홈페이지

// ============================================================
// HOME PAGE
// ============================================================
async function renderHomePage(container) {
  container.innerHTML = `
    ${renderHeroSection()}
    <div class="container" style="padding-top:2rem;padding-bottom:2rem">
      <div id="home-content"><div class="loading-overlay"><div class="spinner"></div></div></div>
    </div>`;
  
  // Track visitor
  api.get('/visitors').then(r => {
    if (r.ok) {
      const el = document.getElementById('visitor-count');
      if (el) el.textContent = r.data.today?.toLocaleString() || '0';
    }
  });
  
  const r = await api.get('/home');
  if (!r.ok) return;
  
  const { bestProperties, newProperties, featuredJobs, latestNews, banners } = r.data;
  
  document.getElementById('home-content').innerHTML = `
    ${renderTopBanners(banners.filter(b => b.position === 'top'))}
    ${renderBestProperties(bestProperties)}
    ${renderMiddleBanners(banners.filter(b => b.position === 'middle'))}
    ${renderNewProperties(newProperties)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem" class="two-col-grid">
      <div>${renderFeaturedJobs(featuredJobs)}</div>
      <div>${renderLatestNews(latestNews)}</div>
    </div>
    <style>@media(max-width:768px){.two-col-grid{grid-template-columns:1fr!important}}</style>
  `;
}

function renderHeroSection() {
  return `
  <section class="hero-section">
    <div class="container">
      <div style="text-align:center;margin-bottom:1.5rem">
        <h1 style="font-size:clamp(1.5rem,4vw,2.2rem);font-weight:900;margin-bottom:0.5rem;line-height:1.3">
          전국 <span style="color:#fbbf24">분양 현장</span> & <span style="color:#34d399">구인 정보</span><br>한곳에서 확인하세요!
        </h1>
        <p style="font-size:1rem;opacity:0.85;margin-bottom:1.5rem">아파트·오피스텔·상가 분양 정보 | 팀장·팀원 구인 게시판</p>
        <div style="max-width:560px;margin:0 auto 1rem" class="hero-search-box">
          <input type="text" id="hero-search" placeholder="지역명, 현장명으로 검색..." 
            onkeydown="if(event.key==='Enter')doHeroSearch()">
          <button onclick="doHeroSearch()"><i class="fas fa-search"></i> 검색</button>
        </div>
        <div style="display:flex;justify-content:center;gap:0.5rem;flex-wrap:wrap">
          ${['서울','경기','인천','부산','충청','전라','경상'].map(r => 
            `<button onclick="navigate('/properties?region=${r}')" 
              style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);
              padding:0.3rem 0.75rem;border-radius:20px;font-size:0.8rem;cursor:pointer;transition:background 0.2s"
              onmouseover="this.style.background='rgba(255,255,255,0.25)'" 
              onmouseout="this.style.background='rgba(255,255,255,0.15)'">${r}</button>`
          ).join('')}
        </div>
      </div>
      <div style="display:flex;justify-content:center;gap:1rem;flex-wrap:wrap">
        <div class="visitor-bar">
          <i class="fas fa-eye"></i> 오늘 방문자
          <span class="visitor-count" id="visitor-count">-</span>명
        </div>
        <div class="visitor-bar">
          <i class="fas fa-building"></i> 등록 현장
          <span class="visitor-count">7</span>개
        </div>
        <div class="visitor-bar">
          <i class="fas fa-briefcase"></i> 구인 공고
          <span class="visitor-count">6</span>개
        </div>
      </div>
    </div>
  </section>`;
}

function doHeroSearch() {
  const q = document.getElementById('hero-search')?.value.trim();
  if (q) navigate('/properties?search=' + encodeURIComponent(q));
}

function renderTopBanners(banners) {
  if (!banners.length) return '';
  const items = banners.length > 0 ? banners : [{ title: '광고 문의 환영합니다', id: null }];
  
  return `
  <div style="margin-bottom:1.5rem">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem">
      ${items.slice(0,3).map((b, i) => {
        const colors = ['linear-gradient(135deg,#667eea,#764ba2)', 'linear-gradient(135deg,#11998e,#38ef7d)', 'linear-gradient(135deg,#f093fb,#f5576c)'];
        return `<div style="height:90px;background:${colors[i%colors.length]};border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:1rem;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.1)"
          onclick="${b.link_url ? `navigate('${b.link_url}')` : "navigate('/properties')"}">
          <i class="fas fa-ad" style="margin-right:0.5rem;opacity:0.7"></i>${escapeHtml(b.title)}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function renderMiddleBanners(banners) {
  if (!banners.length) return '';
  return `
  <div style="margin:1.5rem 0;background:linear-gradient(135deg,#1e3a8a,#2563eb);border-radius:12px;padding:1.5rem;color:white;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
    <div>
      <div style="font-size:1.1rem;font-weight:800;margin-bottom:0.25rem">💰 광고 상품 안내</div>
      <div style="opacity:0.85;font-size:0.9rem">프리미엄 광고로 내 현장을 상단에 노출하세요!</div>
    </div>
    <button class="btn" style="background:white;color:#1e40af;font-weight:700" onclick="navigate('/contact')">
      광고 문의하기 →
    </button>
  </div>`;
}

function renderBestProperties(properties) {
  if (!properties.length) return '';
  return `
  <div style="margin-bottom:2rem">
    <div class="section-header">
      <h2 class="section-title">🏆 베스트 현장</h2>
      <a class="section-link" href="/properties" onclick="navigate('/properties?sort=hot');return false">전체보기 <i class="fas fa-chevron-right"></i></a>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem">
      ${properties.map(p => renderPropertyCard(p)).join('')}
    </div>
  </div>`;
}

function renderNewProperties(properties) {
  if (!properties.length) return '';
  return `
  <div style="margin-bottom:2rem">
    <div class="section-header">
      <h2 class="section-title">🆕 신규 현장</h2>
      <a class="section-link" href="/properties" onclick="navigate('/properties');return false">전체보기 <i class="fas fa-chevron-right"></i></a>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem">
      ${properties.slice(0, 6).map(p => renderPropertyCard(p)).join('')}
    </div>
  </div>`;
}

function renderFeaturedJobs(jobs) {
  if (!jobs.length) return `<div class="empty-state"><div class="empty-state-icon">💼</div><div>구인 공고가 없습니다</div></div>`;
  return `
  <div>
    <div class="section-header">
      <h2 class="section-title">💼 HOT 구인</h2>
      <a class="section-link" href="/jobs" onclick="navigate('/jobs');return false">전체보기 <i class="fas fa-chevron-right"></i></a>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.75rem">
      ${jobs.map(j => renderJobCardMini(j)).join('')}
    </div>
  </div>`;
}

function renderJobCardMini(job) {
  const badges = [];
  if (job.is_urgent) badges.push('<span class="badge badge-urgent">급구</span>');
  if (job.is_hot) badges.push('<span class="badge badge-hot">HOT</span>');
  if (job.is_best) badges.push('<span class="badge badge-best">대박</span>');
  
  return `
  <div class="job-card ${job.ad_type === 'premium' ? 'ad-premium' : job.ad_type === 'superior' ? 'ad-superior' : ''}" 
    onclick="navigate('/jobs/${job.id}')">
    <div style="display:flex;gap:0.4rem;margin-bottom:0.4rem">${badges.join('')}</div>
    <div class="job-title text-clamp-2">${escapeHtml(job.title)}</div>
    <div style="display:flex;gap:0.75rem;margin-top:0.4rem;font-size:0.78rem;color:#6b7280">
      <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(job.region)}</span>
      <span><i class="fas fa-users"></i> ${getRankLabel(job.rank_type)}</span>
      ${job.commission_rate ? `<span><i class="fas fa-percent"></i> ${job.commission_rate}%</span>` : ''}
    </div>
  </div>`;
}

function renderLatestNews(newsList) {
  return `
  <div>
    <div class="section-header">
      <h2 class="section-title">📰 뉴스/공지</h2>
      <a class="section-link" href="/news" onclick="navigate('/news');return false">전체보기 <i class="fas fa-chevron-right"></i></a>
    </div>
    <div class="news-table">
      ${newsList.length ? newsList.map(n => `
        <div class="news-row" onclick="navigate('/news/${n.id}')">
          <span class="news-type-badge news-type-${n.news_type}">${n.news_type === 'notice' ? '공지' : n.news_type === 'event' ? '이벤트' : '뉴스'}</span>
          ${n.is_pinned ? '<i class="fas fa-thumbtack" style="color:#f59e0b;font-size:0.75rem"></i>' : ''}
          <span style="flex:1;font-size:0.88rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${escapeHtml(n.title)}</span>
          <span style="font-size:0.75rem;color:#9ca3af;white-space:nowrap">${timeAgo(n.created_at)}</span>
        </div>`).join('') 
      : '<div style="text-align:center;padding:2rem;color:#9ca3af">등록된 공지사항이 없습니다</div>'}
    </div>
  </div>`;
}

// ============================================================
// PROPERTY CARD
// ============================================================
function renderPropertyCard(p) {
  const badges = [];
  if (p.ad_type === 'premium') badges.push('<span class="badge badge-premium-ad">★ 프리미엄</span>');
  if (p.is_hot) badges.push('<span class="badge badge-hot">HOT</span>');
  if (p.is_new) badges.push('<span class="badge badge-new">NEW</span>');
  if (p.is_featured) badges.push('<span class="badge badge-featured">추천</span>');
  if (p.status === 'upcoming') badges.push('<span class="badge badge-upcoming">예정</span>');
  
  const adClass = p.ad_type === 'premium' ? 'ad-premium' : p.ad_type === 'superior' ? 'ad-superior' : '';
  
  return `
  <div class="property-card ${adClass}" style="position:relative" onclick="navigate('/properties/${p.id}')">
    <div class="card-image" style="background:${getPropertyBgImage(p.property_type)}">
      <div class="card-badges">${badges.join('')}</div>
      <i class="fas fa-building placeholder-icon"></i>
    </div>
    <div class="card-body">
      <div style="display:flex;gap:0.4rem;margin-bottom:0.4rem;flex-wrap:wrap">
        <span class="badge" style="background:${getRegionColor(p.region)}22;color:${getRegionColor(p.region)};border:1px solid ${getRegionColor(p.region)}44">
          ${escapeHtml(p.region)}
        </span>
        <span class="badge badge-gray">${getPropertyTypeLabel(p.property_type)}</span>
      </div>
      <div class="card-title">${escapeHtml(p.title)}</div>
      ${p.subtitle ? `<div class="card-subtitle">${escapeHtml(p.subtitle)}</div>` : ''}
      <div class="card-price">${formatPriceRange(p.price_min, p.price_max)}</div>
      <div class="card-meta">
        ${p.supply_area_min ? `<span class="card-meta-item"><i class="fas fa-ruler-combined"></i> ${p.supply_area_min}㎡~</span>` : ''}
        ${p.total_units ? `<span class="card-meta-item"><i class="fas fa-home"></i> ${p.total_units.toLocaleString()}세대</span>` : ''}
        ${p.completion_date ? `<span class="card-meta-item"><i class="fas fa-calendar"></i> ${p.completion_date}</span>` : ''}
      </div>
    </div>
    <div class="card-footer">
      <span><i class="fas fa-eye"></i> ${(p.view_count||0).toLocaleString()}</span>
      <span><i class="fas fa-comment"></i> 문의 ${(p.inquiry_count||0).toLocaleString()}</span>
      <span>${timeAgo(p.created_at)}</span>
    </div>
  </div>`;
}
