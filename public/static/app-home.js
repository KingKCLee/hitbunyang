// 분양라인 - Part 2: 홈페이지 (배너 슬라이더, 베스트 Top10, 통계 위젯)

// ============================================================
// HOME PAGE
// ============================================================
async function renderHomePage(container) {
  container.innerHTML = `
    ${renderHeroSection()}
    <div class="container" style="padding-top:1.5rem;padding-bottom:2rem">
      <div id="home-content"><div class="loading-overlay"><div class="spinner"></div></div></div>
    </div>`;
  
  // Track visitor & get home data simultaneously
  const [visitorRes, homeRes] = await Promise.all([
    api.get('/visitors'),
    api.get('/home'),
  ]);
  
  if (visitorRes.ok) {
    const todayEl = document.getElementById('visitor-count-today');
    if (todayEl) {
      animateNumber(todayEl, visitorRes.data.today || 0, 1000);
    }
  }
  
  if (!homeRes.ok) {
    document.getElementById('home-content').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div>데이터를 불러오는데 실패했습니다.</div></div>';
    return;
  }
  
  const { bestProperties, newProperties, featuredJobs, latestNews, banners, stats } = homeRes.data;
  const topBanners = banners.filter(b => b.position === 'top');
  const midBanners = banners.filter(b => b.position === 'middle');
  
  document.getElementById('home-content').innerHTML = `
    ${renderBannerSlider(topBanners)}
    ${renderStatsWidget(stats, visitorRes.data?.today || 0)}
    ${renderBestProperties(bestProperties)}
    ${renderMiddleBanners(midBanners)}
    ${renderNewProperties(newProperties)}
    <div class="two-col-section">
      <div>${renderFeaturedJobs(featuredJobs)}</div>
      <div>${renderLatestNews(latestNews)}</div>
    </div>
    <style>
      .two-col-section{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2rem}
      @media(max-width:768px){.two-col-section{grid-template-columns:1fr!important}}
    </style>
  `;
  
  // Animate stat numbers
  if (stats) {
    const statMap = {
      'stat-total-props': stats.total_properties || 314124,
      'stat-total-jobs': stats.total_jobs || 52381,
      'stat-total-members': stats.total_members || 128456,
      'stat-today-visitors': visitorRes.data?.today || 0,
    };
    Object.entries(statMap).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) animateNumber(el, val, 1800);
    });
  }
  
  initBannerSlider();
}

// ============================================================
// HERO
// ============================================================
function renderHeroSection() {
  const regions = ['서울','경기','인천','부산','대구','광주','대전','충청','전라','경상','강원','제주'];
  return `
  <section class="hero-section">
    <div class="container" style="position:relative;z-index:1">
      <div style="text-align:center;margin-bottom:1.5rem">
        <div style="display:inline-block;background:rgba(251,191,36,0.2);border:1px solid rgba(251,191,36,0.4);
          color:#fbbf24;font-size:0.78rem;font-weight:700;padding:0.3rem 1rem;border-radius:20px;margin-bottom:1rem;letter-spacing:0.05em">
          🏆 대한민국 NO.1 분양 정보 플랫폼
        </div>
        <h1 style="font-size:clamp(1.5rem,4vw,2.4rem);font-weight:900;margin-bottom:0.5rem;line-height:1.25">
          전국 <span style="color:#fbbf24">분양 현장</span> 정보를<br>
          <span style="color:#34d399">한눈에</span> 확인하세요
        </h1>
        <p style="font-size:0.95rem;opacity:0.8;margin-bottom:1.5rem">
          아파트 · 오피스텔 · 상가 분양 | 팀장 · 팀원 구인
        </p>
        <div style="max-width:580px;margin:0 auto 1.25rem" class="hero-search-box">
          <input type="text" id="hero-search" placeholder="지역명, 현장명으로 검색..."
            onkeydown="if(event.key==='Enter')doHeroSearch()">
          <button onclick="doHeroSearch()"><i class="fas fa-search"></i> 검색</button>
        </div>
        <div style="display:flex;justify-content:center;gap:0.4rem;flex-wrap:wrap">
          ${regions.map(r =>
            `<button onclick="navigate('/region?r=${encodeURIComponent(r)}')"
              style="background:rgba(255,255,255,0.13);color:rgba(255,255,255,0.9);
              border:1px solid rgba(255,255,255,0.25);padding:0.3rem 0.7rem;border-radius:20px;
              font-size:0.78rem;cursor:pointer;transition:background 0.2s"
              onmouseover="this.style.background='rgba(255,255,255,0.22)'"
              onmouseout="this.style.background='rgba(255,255,255,0.13)'">${r}</button>`
          ).join('')}
        </div>
      </div>
      <!-- Visitor stats -->
      <div style="display:flex;justify-content:center;gap:0.75rem;flex-wrap:wrap">
        <div class="visitor-bar">
          <i class="fas fa-users" style="color:#34d399"></i> 오늘 방문자
          <span class="visitor-count" id="visitor-count-today">-</span>명
        </div>
        <div class="visitor-bar">
          <i class="fas fa-building" style="color:#fbbf24"></i> 등록 현장
          <span class="visitor-count" id="stat-total-props-hero">314,124</span>개
        </div>
        <div class="visitor-bar">
          <i class="fas fa-briefcase" style="color:#a78bfa"></i> 구인 공고
          <span class="visitor-count" id="stat-total-jobs-hero">52,381</span>개
        </div>
      </div>
    </div>
  </section>`;
}

function doHeroSearch() {
  const q = document.getElementById('hero-search')?.value?.trim();
  if (q) navigate('/properties?search=' + encodeURIComponent(q));
}

// ============================================================
// BANNER SLIDER (15+ slides, auto + manual)
// ============================================================
let bannerTimer = null;
let currentBannerIndex = 0;
let totalBanners = 0;

const BANNER_COLORS = [
  'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
  'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
  'linear-gradient(135deg, #7c2d12 0%, #ef4444 100%)',
  'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 100%)',
  'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #1e1b4b 0%, #6366f1 100%)',
  'linear-gradient(135deg, #881337 0%, #f43f5e 100%)',
  'linear-gradient(135deg, #14532d 0%, #22c55e 100%)',
  'linear-gradient(135deg, #0f172a 0%, #475569 100%)',
  'linear-gradient(135deg, #3b0764 0%, #a855f7 100%)',
  'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)',
  'linear-gradient(135deg, #166534 0%, #4ade80 100%)',
  'linear-gradient(135deg, #b45309 0%, #fbbf24 100%)',
  'linear-gradient(135deg, #9d174d 0%, #ec4899 100%)',
  'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
];

function renderBannerSlider(banners) {
  // If no banners from DB, use demo banners
  const items = banners && banners.length >= 3 ? banners : getDemoBanners();
  totalBanners = items.length;
  
  const slides = items.map((b, i) => {
    const bg = BANNER_COLORS[i % BANNER_COLORS.length];
    return `
    <div class="banner-slide" style="background:${bg}" onclick="navigate('${escapeHtml(b.link_url || '/properties')}')">
      <div class="banner-slide-content">
        ${b.badge_text ? `<div class="banner-slide-badge">${escapeHtml(b.badge_text)}</div>` : ''}
        <div class="banner-slide-title">${escapeHtml(b.title)}</div>
        ${b.subtitle ? `<div class="banner-slide-subtitle">${escapeHtml(b.subtitle)}</div>` : ''}
      </div>
      <button class="banner-slide-arrow">상세보기 →</button>
    </div>`;
  }).join('');
  
  const dots = items.map((_, i) => 
    `<button class="banner-dot ${i===0?'active':''}" onclick="goToBanner(${i})" aria-label="배너 ${i+1}"></button>`
  ).join('');
  
  return `
  <div class="banner-slider-wrap" id="banner-slider-wrap">
    <div class="banner-slides" id="banner-slides">${slides}</div>
    <button class="banner-prev" onclick="prevBanner()" aria-label="이전">‹</button>
    <button class="banner-next" onclick="nextBanner()" aria-label="다음">›</button>
    <div class="banner-controls">${dots}</div>
    <div class="banner-counter" id="banner-counter">1 / ${totalBanners}</div>
  </div>`;
}

function getDemoBanners() {
  return [
    { title: '힐스테이트 판교역 퍼스트', subtitle: '판교 중심 프리미엄 아파트 분양', badge_text: '프리미엄', link_url: '/properties/1' },
    { title: '래미안 원펜타스', subtitle: '서초구 반포동 한강뷰 랜드마크', badge_text: '신규분양', link_url: '/properties/2' },
    { title: 'DMC SK뷰아이파크', subtitle: '수도권 광역교통 핵심 요지', badge_text: '분양중', link_url: '/properties/3' },
    { title: '더샵 퍼스트파크 하남', subtitle: '경기 하남 친환경 주거단지', badge_text: 'HOT', link_url: '/properties' },
    { title: '롯데캐슬 시그니처', subtitle: '인천 송도 국제업무지구', badge_text: '특별공급', link_url: '/properties' },
    { title: '광교 아이파크', subtitle: '수원 광교 신도시 프리미엄', badge_text: '잔여세대', link_url: '/properties' },
    { title: '힐스테이트 용인 둔전역', subtitle: '용인시 처인구 역세권 아파트', badge_text: '신규', link_url: '/properties' },
    { title: '포레나 부산 두구동', subtitle: '부산 기장 해운대 근접 단지', badge_text: 'NEW', link_url: '/properties' },
    { title: '자이 더 엘리언트', subtitle: '강남 청담 럭셔리 오피스텔', badge_text: '프리미엄', link_url: '/properties' },
    { title: 'SK뷰 위례신도시', subtitle: '위례신도시 역세권 대단지', badge_text: 'BEST', link_url: '/properties' },
    { title: '브리즈힐 위스테이', subtitle: '제주 서귀포 프리미엄 리조트', badge_text: '특가', link_url: '/properties' },
    { title: '대우 푸르지오 어반피스', subtitle: '대전 유성 트리플역세권', badge_text: '분양중', link_url: '/properties' },
    { title: 'e편한세상 파크센트럴', subtitle: '광주 첨단 3지구 대단지', badge_text: '신규', link_url: '/properties' },
    { title: '아이파크 시티 천안', subtitle: '충남 천안 1만세대 신도시', badge_text: 'HOT', link_url: '/properties' },
    { title: '두산위브더제니스 울산', subtitle: '울산 중구 핵심입지 타워', badge_text: '잔여세대', link_url: '/properties' },
    { title: '서해그랑블 인천 검단', subtitle: '인천 서구 검단 신도시', badge_text: 'NEW', link_url: '/properties' },
  ];
}

function initBannerSlider() {
  if (bannerTimer) clearInterval(bannerTimer);
  bannerTimer = setInterval(() => nextBanner(false), 4000);
  
  // Touch/swipe support
  const wrap = document.getElementById('banner-slider-wrap');
  if (!wrap) return;
  let startX = 0;
  wrap.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  wrap.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 50) prevBanner();
    else if (dx < -50) nextBanner();
  }, { passive: true });
  
  wrap.addEventListener('mouseenter', () => clearInterval(bannerTimer));
  wrap.addEventListener('mouseleave', () => {
    bannerTimer = setInterval(() => nextBanner(false), 4000);
  });
}

function goToBanner(idx) {
  currentBannerIndex = idx;
  updateBannerSlider();
}
function nextBanner(resetTimer = true) {
  currentBannerIndex = (currentBannerIndex + 1) % totalBanners;
  updateBannerSlider();
  if (resetTimer) { clearInterval(bannerTimer); bannerTimer = setInterval(() => nextBanner(false), 4000); }
}
function prevBanner() {
  currentBannerIndex = (currentBannerIndex - 1 + totalBanners) % totalBanners;
  updateBannerSlider();
  clearInterval(bannerTimer);
  bannerTimer = setInterval(() => nextBanner(false), 4000);
}
function updateBannerSlider() {
  const slides = document.getElementById('banner-slides');
  if (slides) slides.style.transform = `translateX(-${currentBannerIndex * 100}%)`;
  document.querySelectorAll('.banner-dot').forEach((dot, i) => dot.classList.toggle('active', i === currentBannerIndex));
  const counter = document.getElementById('banner-counter');
  if (counter) counter.textContent = `${currentBannerIndex + 1} / ${totalBanners}`;
}

// Make global
window.goToBanner = goToBanner;
window.nextBanner = nextBanner;
window.prevBanner = prevBanner;

// ============================================================
// STATS WIDGET
// ============================================================
function renderStatsWidget(stats, todayVisitors) {
  const items = [
    { id: 'stat-total-props', icon: '🏢', label: '총 등록 현장', val: stats?.total_properties || 314124, color: '#dbeafe' },
    { id: 'stat-total-jobs', icon: '💼', label: '구인 공고', val: stats?.total_jobs || 52381, color: '#d1fae5' },
    { id: 'stat-total-members', icon: '👥', label: '회원 수', val: stats?.total_members || 128456, color: '#ede9fe' },
    { id: 'stat-today-visitors', icon: '👁️', label: '오늘 방문자', val: todayVisitors || 0, color: '#fef3c7' },
  ];
  
  return `
  <div class="stats-widget">
    <div class="stats-grid">
      ${items.map(item => `
        <div class="stats-item" style="background:${item.color}20;border:1px solid ${item.color}">
          <div class="stats-item-icon">${item.icon}</div>
          <div class="stats-item-value" id="${item.id}">0</div>
          <div class="stats-item-label">${item.label}</div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

// ============================================================
// BEST PROPERTIES (Top 10 ranked)
// ============================================================
function renderBestProperties(properties) {
  if (!properties || !properties.length) return '';
  
  return `
  <div style="margin-bottom:2rem">
    <div class="section-header">
      <h2 class="section-title">🏆 베스트 현장 TOP 10</h2>
      <a class="section-link" href="/properties" onclick="navigate('/properties?sort=hot');return false">전체보기 <i class="fas fa-chevron-right"></i></a>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem" class="best-layout">
      <!-- Left: Top 3 cards -->
      <div style="display:flex;flex-direction:column;gap:1rem">
        <div style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);padding:0 0.25rem">
          🥇 TOP 3 현장 상세
        </div>
        ${properties.slice(0,3).map((p, i) => renderPropertyCard(p, ['🥇','🥈','🥉'][i])).join('')}
      </div>
      <!-- Right: Full Top 10 list -->
      <div>
        <div style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);padding:0 0.25rem;margin-bottom:0.75rem">
          📊 전체 순위 (조회+공유+문의 기준)
        </div>
        <div class="best-list">
          ${properties.map((p, i) => {
            const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal';
            const rankNum = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`;
            const score = (p.view_count||0) + (p.inquiry_count||0)*3 + (p.share_count||0)*2;
            return `
            <div class="best-item" onclick="navigate('/properties/${p.id}')">
              <div class="best-rank ${rankClass}">${rankNum}</div>
              <div class="best-info">
                <div class="best-title">${escapeHtml(p.title)}</div>
                <div class="best-meta">
                  <span style="color:${getRegionColor(p.region)}">${escapeHtml(p.region)}</span>
                  · ${getPropertyTypeLabel(p.property_type)}
                  · ${formatPriceRange(p.price_min, p.price_max)}
                </div>
              </div>
              <div class="best-score">
                <div><i class="fas fa-eye" style="font-size:0.65rem"></i> ${(p.view_count||0).toLocaleString()}</div>
                <div><i class="fas fa-comment" style="font-size:0.65rem"></i> ${(p.inquiry_count||0).toLocaleString()}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
    <style>@media(max-width:768px){.best-layout{grid-template-columns:1fr!important}}</style>
  </div>`;
}

// ============================================================
// MIDDLE BANNERS
// ============================================================
function renderMiddleBanners(banners) {
  return `
  <div style="margin:1.5rem 0;border-radius:14px;overflow:hidden;
    background:linear-gradient(135deg,#1e3a8a,#2563eb);
    padding:1.5rem 2rem;color:white;
    display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;
    box-shadow:0 4px 20px rgba(30,64,175,0.25)">
    <div>
      <div style="font-size:0.78rem;font-weight:700;color:#fbbf24;letter-spacing:0.1em;margin-bottom:0.4rem">💰 광고 안내</div>
      <div style="font-size:1.2rem;font-weight:900;margin-bottom:0.25rem">내 현장을 최상단에 노출하세요!</div>
      <div style="opacity:0.8;font-size:0.88rem">프리미엄 · 슈페리어 · 베이직 광고 상품 운영 중</div>
    </div>
    <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
      <button class="btn" style="background:white;color:#1e40af;font-weight:700" onclick="navigate('/faq')">
        <i class="fas fa-ad"></i> 광고 문의
      </button>
      <button class="btn btn-outline" style="border-color:rgba(255,255,255,0.4);color:white" onclick="navigate('/properties')">
        현장 등록
      </button>
    </div>
  </div>`;
}

// ============================================================
// NEW PROPERTIES
// ============================================================
function renderNewProperties(properties) {
  if (!properties || !properties.length) return '';
  return `
  <div style="margin-bottom:2rem">
    <div class="section-header">
      <h2 class="section-title">🆕 신규 현장</h2>
      <a class="section-link" href="/properties" onclick="navigate('/properties');return false">전체보기 <i class="fas fa-chevron-right"></i></a>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:1.25rem">
      ${properties.slice(0,6).map(p => renderPropertyCard(p)).join('')}
    </div>
  </div>`;
}

// ============================================================
// FEATURED JOBS
// ============================================================
function renderFeaturedJobs(jobs) {
  return `
  <div>
    <div class="section-header">
      <h2 class="section-title">💼 HOT 구인</h2>
      <a class="section-link" href="/jobs" onclick="navigate('/jobs');return false">전체보기 <i class="fas fa-chevron-right"></i></a>
    </div>
    ${!jobs || !jobs.length 
      ? '<div class="empty-state"><div class="empty-state-icon">💼</div><div>구인 공고가 없습니다</div></div>'
      : `<div style="display:flex;flex-direction:column;gap:0.6rem">
          ${jobs.map(j => renderJobCardMini(j)).join('')}
         </div>`
    }
  </div>`;
}

function renderJobCardMini(job) {
  const badges = [];
  if (job.is_urgent) badges.push('<span class="badge badge-urgent">급구</span>');
  if (job.is_hot) badges.push('<span class="badge badge-hot">HOT</span>');
  if (job.is_best) badges.push('<span class="badge badge-best">대박</span>');
  
  return `
  <div class="job-card ${job.ad_type==='premium'?'ad-premium':job.ad_type==='superior'?'ad-superior':''}" 
    onclick="navigate('/jobs/${job.id}')">
    <div style="display:flex;gap:0.4rem;margin-bottom:0.35rem">${badges.join('')}</div>
    <div class="job-title text-clamp-2">${escapeHtml(job.title)}</div>
    <div style="display:flex;gap:0.75rem;margin-top:0.4rem;font-size:0.77rem;color:#6b7280;flex-wrap:wrap">
      <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(job.region)}</span>
      <span><i class="fas fa-users"></i> ${getRankLabel(job.rank_type)}</span>
      ${job.commission_rate ? `<span><i class="fas fa-percent"></i> ${job.commission_rate}%</span>` : ''}
      ${job.daily_allowance ? `<span><i class="fas fa-won-sign"></i> 일당있음</span>` : ''}
    </div>
  </div>`;
}

// ============================================================
// LATEST NEWS
// ============================================================
function renderLatestNews(newsList) {
  return `
  <div>
    <div class="section-header">
      <h2 class="section-title">📰 뉴스/공지</h2>
      <a class="section-link" href="/news" onclick="navigate('/news');return false">전체보기 <i class="fas fa-chevron-right"></i></a>
    </div>
    <div class="news-table">
      ${newsList && newsList.length 
        ? newsList.map(n => `
          <div class="news-row" onclick="navigate('/news/${n.id}')">
            <span class="news-type-badge news-type-${n.news_type}">${n.news_type==='notice'?'공지':n.news_type==='event'?'이벤트':'뉴스'}</span>
            ${n.is_pinned ? '<i class="fas fa-thumbtack" style="color:#f59e0b;font-size:0.7rem"></i>' : ''}
            <span style="flex:1;font-size:0.88rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${escapeHtml(n.title)}</span>
            <span style="font-size:0.73rem;color:#9ca3af;white-space:nowrap">${timeAgo(n.created_at)}</span>
          </div>`).join('')
        : '<div style="text-align:center;padding:2rem;color:#9ca3af">등록된 공지사항이 없습니다</div>'
      }
    </div>
  </div>`;
}
