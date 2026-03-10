// 히트분양 - Part 2: 홈페이지 리뉴얼 (A-F 6섹션)
// A: 풀스크린 히어로 + 실시간 카운터
// B: 히트 TOP 5 히트지수 카드
// C: 히트AD 3×2 그리드
// D: 신규 등록 12개 + 히트지수 게이지
// E: 히트맵 미니위젯 + 히트분양TV
// F: 뉴스 + 커뮤니티 + 푸터

// ============================================================
// HOME PAGE
// ============================================================
async function renderHomePage(container) {
  container.innerHTML = `
    ${renderHeroSection()}
    <div id="home-content">
      <div class="loading-overlay" style="min-height:400px"><div class="spinner"></div></div>
    </div>`;
  
  const [visitorRes, homeRes] = await Promise.all([
    api.get('/visitors'),
    api.get('/home'),
  ]);
  
  if (visitorRes.ok) {
    const todayEl = document.getElementById('visitor-count-today');
    if (todayEl) animateNumber(todayEl, visitorRes.data.today || 0, 1000);
  }
  
  if (!homeRes.ok) {
    document.getElementById('home-content').innerHTML = `
      <div class="container" style="padding:3rem 1rem">
        <div class="empty-state"><div class="empty-state-icon">⚠️</div><div>데이터를 불러오는데 실패했습니다.</div></div>
      </div>`;
    return;
  }
  
  const { bestProperties, newProperties, featuredJobs, latestNews, banners, stats } = homeRes.data;
  const topBanners = (banners || []).filter(b => b.position === 'top');
  
  document.getElementById('home-content').innerHTML = `
    <!-- B: 히트 TOP 5 -->
    ${renderHitTop5(bestProperties)}
    <!-- C: 히트AD 캐러셀 + 배너 슬라이더 -->
    <div class="container" style="padding-top:0;padding-bottom:1rem">
      ${renderBannerSlider(topBanners)}
    </div>
    <!-- stats -->
    <div class="container" style="padding-bottom:1.5rem">
      ${renderStatsWidget(stats, visitorRes.data?.today || 0)}
    </div>
    <!-- D: 신규 등록 단지 12개 -->
    <div class="container" style="padding-bottom:2rem">
      ${renderNewProperties(newProperties)}
    </div>
    <!-- E: 히트맵 미니 + TV -->
    <div class="container" style="padding-bottom:2rem">
      ${renderHomeMiniWidgets()}
    </div>
    <!-- F: 뉴스 + 커뮤니티 + 채용 -->
    <div class="container" style="padding-bottom:3rem">
      ${renderHomeBottomSection(latestNews, featuredJobs)}
    </div>
    <!-- 광고 CTA -->
    <div class="container" style="padding-bottom:2.5rem">
      ${renderAdCta()}
    </div>
  `;
  
  // Animate numbers
  const statMap = {
    'stat-total-props': stats?.total_properties || 314124,
    'stat-total-jobs': stats?.total_jobs || 52381,
    'stat-total-members': stats?.total_members || 128456,
    'stat-today-visitors': visitorRes.data?.today || 0,
  };
  Object.entries(statMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) animateNumber(el, val, 1800);
  });
  
  initBannerSlider();
}

// ============================================================
// A: HERO SECTION
// ============================================================
function renderHeroSection() {
  const regions = ['전국','서울','경기북부','경기남부','인천','부산','대구','광주','대전','충청','전라','경상','강원','제주','울산','세종'];
  return `
  <section class="hero-section">
    <div class="hero-bg-pattern"></div>
    <div class="container hero-container">
      <div class="hero-left">
        <div class="hero-badge-row">
          <span class="hero-live-badge">
            <span class="hero-live-dot"></span> LIVE
          </span>
          <span class="hero-label-badge">🔥 대한민국 분양정보 히트 플랫폼</span>
        </div>
        <h1 class="hero-title">
          전국 신규 분양단지<br>
          <span class="hero-title-hit">히트지수</span>로 한눈에!
        </h1>
        <p class="hero-subtitle">아파트 · 오피스텔 · 상가 분양 | 팀장 · 팀원 채용</p>
        
        <!-- 검색바 -->
        <div class="hero-search-wrap">
          <div class="hero-search-box">
            <select class="hero-search-region" id="hero-region-sel">
              <option value="">전체 지역</option>
              ${['서울','경기북부','경기남부','인천','부산','대구','광주','대전','울산','세종','충청','전라','경상','강원','제주'].map(r =>
                `<option value="${r}">${r}</option>`).join('')}
            </select>
            <div class="hero-search-divider"></div>
            <input type="text" id="hero-search" placeholder="현장명, 지역명으로 검색..."
              onkeydown="if(event.key==='Enter')doHeroSearch()">
            <button onclick="doHeroSearch()" class="hero-search-btn">
              <i class="fas fa-search"></i> 검색
            </button>
          </div>
        </div>
        
        <!-- 지역 바로가기 -->
        <div class="hero-region-chips">
          ${regions.map(r =>
            `<button class="hero-region-chip" onclick="navigate('/sites?region=${encodeURIComponent(r)}')">${r}</button>`
          ).join('')}
        </div>
      </div>
      
      <div class="hero-right">
        <!-- 실시간 카운터 -->
        <div class="hero-stats-card">
          <div class="hero-stats-title"><i class="fas fa-chart-line"></i> 실시간 현황</div>
          <div class="hero-stat-row">
            <div class="hero-stat-item">
              <span class="hero-stat-icon">👁️</span>
              <div>
                <div class="hero-stat-num" id="visitor-count-today">-</div>
                <div class="hero-stat-label">오늘 방문자</div>
              </div>
            </div>
            <div class="hero-stat-item">
              <span class="hero-stat-icon">🏢</span>
              <div>
                <div class="hero-stat-num" id="stat-total-props-hero">314,124</div>
                <div class="hero-stat-label">등록 단지</div>
              </div>
            </div>
            <div class="hero-stat-item">
              <span class="hero-stat-icon">💼</span>
              <div>
                <div class="hero-stat-num" id="stat-total-jobs-hero">52,381</div>
                <div class="hero-stat-label">채용 공고</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 히트지수 설명 -->
        <div class="hero-hit-card">
          <div class="hero-hit-title"><i class="fas fa-fire" style="color:#fcd34d"></i> 히트지수란?</div>
          <div class="hero-hit-desc">
            <div class="hero-hit-meter">
              <div class="hero-hit-meter-bar" style="width:85%"></div>
            </div>
            <div class="hero-hit-items">
              <span>📊 조회수</span><span>💬 문의수</span><span>🔗 공유수</span>
              <span>⭐ 광고등급</span><span>🏢 대행사평점</span>
            </div>
          </div>
          <button class="hero-hit-btn" onclick="navigate('/ranking')">랭킹 보러가기 →</button>
        </div>
      </div>
    </div>
  </section>`;
}

function doHeroSearch() {
  const q = document.getElementById('hero-search')?.value?.trim();
  const r = document.getElementById('hero-region-sel')?.value;
  let url = '/sites';
  const params = new URLSearchParams();
  if (q) params.set('search', q);
  if (r) params.set('region', r);
  navigate(url + (params.toString() ? '?' + params.toString() : ''));
}

window.doHeroSearch = doHeroSearch;

// ============================================================
// B: 히트 TOP 5 (히트지수 게이지 카드)
// ============================================================
function renderHitTop5(properties) {
  if (!properties || !properties.length) return '';
  const top5 = properties.slice(0, 5);
  
  return `
  <section class="home-section bg-section-alt">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">
          <span class="section-title-icon">🔥</span>
          히트 TOP 5
          <span class="section-title-sub">히트지수 최고 현장</span>
        </h2>
        <a class="section-link" href="/ranking" onclick="navigate('/ranking');return false">
          전체 랭킹 <i class="fas fa-chevron-right"></i>
        </a>
      </div>
      <div class="hit-top5-grid">
        ${top5.map((p, i) => renderHitTop5Card(p, i)).join('')}
      </div>
    </div>
  </section>`;
}

function renderHitTop5Card(p, rank) {
  const score = calcHitScore(p);
  const color = getHitScoreColor(score);
  const label = getHitScoreLabel(score);
  const rankIcons = ['🥇', '🥈', '🥉', '4', '5'];
  const rankLabels = ['1위', '2위', '3위', '4위', '5위'];
  
  return `
  <div class="hit-top5-card ${rank === 0 ? 'hit-top5-first' : ''}" onclick="navigate('/properties/${p.id}')">
    <div class="hit-top5-rank">${rankIcons[rank]}</div>
    <div class="hit-top5-img" style="background:${getPropertyBgImage(p.property_type)}">
      <i class="fas fa-building" style="color:rgba(255,255,255,0.5);font-size:2rem"></i>
      <!-- 히트지수 게이지 (라지) -->
      <div class="hit-gauge-overlay">
        <div class="hit-gauge-circle-sm">
          <svg viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
            <circle cx="18" cy="18" r="14" fill="none" stroke="${color}" stroke-width="3"
              stroke-dasharray="${score} ${100 - score}"
              stroke-dashoffset="25" stroke-linecap="round"/>
          </svg>
          <span style="color:white;font-weight:900;font-size:0.75rem">${score}</span>
        </div>
        <span class="hit-label-badge" style="background:${color}">${label}</span>
      </div>
    </div>
    <div class="hit-top5-body">
      <div class="hit-top5-tags">
        <span class="region-tag" style="background:${getRegionColor(p.region)}22;color:${getRegionColor(p.region)};border:1px solid ${getRegionColor(p.region)}44">
          ${escapeHtml(p.region)}
        </span>
        <span class="badge badge-gray">${getPropertyTypeLabel(p.property_type)}</span>
      </div>
      <div class="hit-top5-title">${escapeHtml(p.title)}</div>
      <div class="hit-top5-price">${formatPriceRange(p.price_min, p.price_max)}</div>
      <div class="hit-top5-meta">
        <span><i class="fas fa-eye"></i> ${(p.view_count||0).toLocaleString()}</span>
        <span><i class="fas fa-comment"></i> ${(p.inquiry_count||0).toLocaleString()}</span>
      </div>
      <!-- 히트지수 바 -->
      <div class="hit-score-full">
        <div class="hit-score-full-label">히트지수</div>
        <div class="hit-score-full-track">
          <div class="hit-score-full-fill" style="width:${score}%;background:${color}"></div>
        </div>
        <span class="hit-score-full-num" style="color:${color}">${score}</span>
      </div>
    </div>
  </div>`;
}

// ============================================================
// BANNER SLIDER
// ============================================================
let bannerTimer = null;
let currentBannerIndex = 0;
let totalBanners = 0;

const BANNER_COLORS = [
  'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
  'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #713f12 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',
  'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)',
  'linear-gradient(135deg, #831843 0%, #ec4899 100%)',
  'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
  'linear-gradient(135deg, #312e81 0%, #6366f1 100%)',
  'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
];

function renderBannerSlider(banners) {
  const items = banners && banners.length >= 3 ? banners : getDemoBanners();
  totalBanners = items.length;
  
  const slides = items.map((b, i) => {
    const bg = BANNER_COLORS[i % BANNER_COLORS.length];
    return `
    <div class="banner-slide" style="background:${bg}" onclick="navigate('${escapeHtml(b.link_url || '/sites')}')">
      <div class="banner-slide-content">
        ${b.badge_text ? `<div class="banner-slide-badge">${escapeHtml(b.badge_text)}</div>` : ''}
        <div class="banner-slide-title">${escapeHtml(b.title)}</div>
        ${b.subtitle ? `<div class="banner-slide-subtitle">${escapeHtml(b.subtitle)}</div>` : ''}
      </div>
      <button class="banner-slide-arrow">자세히 보기 →</button>
    </div>`;
  }).join('');
  
  const dots = items.map((_, i) => 
    `<button class="banner-dot ${i===0?'active':''}" onclick="goToBanner(${i})"></button>`
  ).join('');
  
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
    <h2 class="section-title"><span class="section-title-icon">📢</span> 히트AD 현장</h2>
    <a class="section-link" href="/sites?sort=hot" onclick="navigate('/sites?sort=hot');return false">전체보기 <i class="fas fa-chevron-right"></i></a>
  </div>
  <div class="banner-slider-wrap" id="banner-slider-wrap">
    <div class="banner-slides" id="banner-slides">${slides}</div>
    <button class="banner-prev" onclick="prevBanner()">‹</button>
    <button class="banner-next" onclick="nextBanner()">›</button>
    <div class="banner-controls">${dots}</div>
    <div class="banner-counter" id="banner-counter">1 / ${totalBanners}</div>
  </div>`;
}

function getDemoBanners() {
  return [
    { title: '힐스테이트 판교역 퍼스트', subtitle: '판교 중심 프리미엄 아파트 분양', badge_text: '🔥 히트AD', link_url: '/sites' },
    { title: '래미안 원펜타스', subtitle: '서초구 반포동 한강뷰 랜드마크', badge_text: '⭐ 프리미엄', link_url: '/sites' },
    { title: 'DMC SK뷰아이파크', subtitle: '수도권 광역교통 핵심 요지', badge_text: '📌 스탠다드', link_url: '/sites' },
    { title: '더샵 퍼스트파크 하남', subtitle: '경기 하남 친환경 주거단지', badge_text: '🔥 HOT', link_url: '/sites' },
    { title: '롯데캐슬 시그니처', subtitle: '인천 송도 국제업무지구', badge_text: '특별공급', link_url: '/sites' },
    { title: '광교 아이파크', subtitle: '수원 광교 신도시 프리미엄', badge_text: '잔여세대', link_url: '/sites' },
    { title: '힐스테이트 용인 둔전역', subtitle: '용인시 처인구 역세권 아파트', badge_text: 'NEW', link_url: '/sites' },
    { title: '포레나 부산 두구동', subtitle: '부산 기장 해운대 근접 단지', badge_text: 'NEW', link_url: '/sites' },
    { title: '자이 더 엘리언트', subtitle: '강남 청담 럭셔리 오피스텔', badge_text: '⭐ 프리미엄', link_url: '/sites' },
    { title: 'SK뷰 위례신도시', subtitle: '위례신도시 역세권 대단지', badge_text: 'BEST', link_url: '/sites' },
  ];
}

function initBannerSlider() {
  if (bannerTimer) clearInterval(bannerTimer);
  bannerTimer = setInterval(() => nextBanner(false), 4000);
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

function goToBanner(idx) { currentBannerIndex = idx; updateBannerSlider(); }
function nextBanner(reset = true) {
  currentBannerIndex = (currentBannerIndex + 1) % totalBanners;
  updateBannerSlider();
  if (reset) { clearInterval(bannerTimer); bannerTimer = setInterval(() => nextBanner(false), 4000); }
}
function prevBanner() {
  currentBannerIndex = (currentBannerIndex - 1 + totalBanners) % totalBanners;
  updateBannerSlider();
  clearInterval(bannerTimer); bannerTimer = setInterval(() => nextBanner(false), 4000);
}
function updateBannerSlider() {
  const slides = document.getElementById('banner-slides');
  if (slides) slides.style.transform = `translateX(-${currentBannerIndex * 100}%)`;
  document.querySelectorAll('.banner-dot').forEach((d, i) => d.classList.toggle('active', i === currentBannerIndex));
  const counter = document.getElementById('banner-counter');
  if (counter) counter.textContent = `${currentBannerIndex + 1} / ${totalBanners}`;
}

window.goToBanner = goToBanner;
window.nextBanner = nextBanner;
window.prevBanner = prevBanner;

// ============================================================
// STATS WIDGET
// ============================================================
function renderStatsWidget(stats, todayVisitors) {
  const items = [
    { id: 'stat-total-props', icon: '🏢', label: '총 등록 단지', val: stats?.total_properties || 314124, color: '#fef3c7', border: '#fde68a' },
    { id: 'stat-total-jobs', icon: '💼', label: '채용 공고', val: stats?.total_jobs || 52381, color: '#dbeafe', border: '#93c5fd' },
    { id: 'stat-total-members', icon: '👥', label: '회원 수', val: stats?.total_members || 128456, color: '#fce7f3', border: '#f9a8d4' },
    { id: 'stat-today-visitors', icon: '👁️', label: '오늘 방문자', val: todayVisitors || 0, color: '#d1fae5', border: '#6ee7b7' },
  ];
  return `
  <div class="stats-widget">
    <div class="stats-grid">
      ${items.map(item => `
        <div class="stats-item" style="background:${item.color};border-color:${item.border}">
          <div class="stats-item-icon">${item.icon}</div>
          <div class="stats-item-value" id="${item.id}">0</div>
          <div class="stats-item-label">${item.label}</div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

// ============================================================
// D: NEW PROPERTIES (12개, 히트지수 게이지 포함)
// ============================================================
function renderNewProperties(properties) {
  if (!properties || !properties.length) return '';
  return `
  <div class="section-header">
    <h2 class="section-title"><span class="section-title-icon">🆕</span> 신규 등록 단지</h2>
    <a class="section-link" href="/sites" onclick="navigate('/sites');return false">전체보기 <i class="fas fa-chevron-right"></i></a>
  </div>
  <div class="properties-grid">
    ${properties.slice(0,12).map(p => renderPropertyCard(p)).join('')}
  </div>`;
}

// ============================================================
// E: 미니 위젯 (히트맵 + TV)
// ============================================================
function renderHomeMiniWidgets() {
  return `
  <div class="home-mini-widgets">
    <!-- 히트맵 미니 -->
    <div class="mini-widget mini-widget-map" onclick="navigate('/hitmap')">
      <div class="mini-widget-icon"><i class="fas fa-fire-alt"></i></div>
      <div class="mini-widget-body">
        <div class="mini-widget-title">히트맵</div>
        <div class="mini-widget-desc">지역별 히트지수 시각화<br>KakaoMap 연동 클러스터링</div>
        <div class="mini-widget-preview">
          <div class="hitmap-preview-dots">
            ${Array.from({length:12}, (_,i) => {
              const colors = ['#dc2626','#f97316','#3b82f6','#dc2626','#f97316','#10b981','#3b82f6','#dc2626','#f97316','#3b82f6','#dc2626','#f97316'];
              const sizes = [12,8,14,10,9,11,8,13,10,9,12,8];
              return `<div class="hmap-dot" style="background:${colors[i]};width:${sizes[i]}px;height:${sizes[i]}px;top:${Math.random()*60+10}%;left:${Math.random()*80+5}%"></div>`;
            }).join('')}
          </div>
        </div>
        <button class="mini-widget-btn">히트맵 열기 →</button>
      </div>
    </div>
    <!-- 히트분양TV 미니 -->
    <div class="mini-widget mini-widget-tv" onclick="navigate('/tv')">
      <div class="mini-widget-icon" style="background:linear-gradient(135deg,#dc2626,#991b1b)"><i class="fab fa-youtube"></i></div>
      <div class="mini-widget-body">
        <div class="mini-widget-title">히트분양TV</div>
        <div class="mini-widget-desc">분양 현장 리뷰 · 시장분석<br>가이드 · 인터뷰 영상</div>
        <div class="tv-thumb-list">
          ${[
            {title:'[리뷰] 힐스테이트 판교역 현장 방문기', views:'12.4만'},
            {title:'2025 수도권 분양시장 전망 분석', views:'8.9만'},
            {title:'분양 팀장 되는 법 A to Z', views:'6.2만'},
          ].map(v => `
            <div class="tv-thumb-item">
              <div class="tv-thumb-img"><i class="fas fa-play-circle"></i></div>
              <div class="tv-thumb-info">
                <div class="tv-thumb-title">${v.title}</div>
                <div class="tv-thumb-views"><i class="fas fa-eye"></i> ${v.views}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="mini-widget-btn" style="background:rgba(220,38,38,0.15);color:#dc2626;border-color:rgba(220,38,38,0.3)">히트TV 보기 →</button>
      </div>
    </div>
  </div>`;
}

// ============================================================
// F: 뉴스 + 커뮤니티 + 채용
// ============================================================
function renderHomeBottomSection(newsList, jobs) {
  return `
  <div class="home-bottom-grid">
    <div>
      <div class="section-header">
        <h2 class="section-title"><span class="section-title-icon">📰</span> 뉴스/공지</h2>
        <a class="section-link" href="/news" onclick="navigate('/news');return false">더보기 <i class="fas fa-chevron-right"></i></a>
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
          : `<div style="text-align:center;padding:2rem;color:#9ca3af;font-size:0.88rem">공지사항이 없습니다</div>`
        }
      </div>
    </div>
    <div>
      <div class="section-header">
        <h2 class="section-title"><span class="section-title-icon">💬</span> 커뮤니티 HOT</h2>
        <a class="section-link" href="/community" onclick="navigate('/community');return false">더보기 <i class="fas fa-chevron-right"></i></a>
      </div>
      <div class="community-home-list">
        ${[
          {cat:'현장후기', title:'래미안 원펜타스 계약 후기 공유합니다', likes:24, comments:8},
          {cat:'정보공유', title:'2025년 하반기 분양 일정 총정리', likes:51, comments:15},
          {cat:'자유게시판', title:'팀장 첫 달 수입 공개 (솔직 후기)', likes:38, comments:22},
          {cat:'Q&A', title:'계약금 환급 조건이 어떻게 되나요?', likes:12, comments:6},
        ].map(p => `
          <div class="community-home-item">
            <span class="community-cat-badge">${p.cat}</span>
            <span class="community-title">${p.title}</span>
            <div class="community-meta">
              <span><i class="fas fa-heart"></i> ${p.likes}</span>
              <span><i class="fas fa-comment"></i> ${p.comments}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <div>
      <div class="section-header">
        <h2 class="section-title"><span class="section-title-icon">🔥</span> HOT 채용</h2>
        <a class="section-link" href="/jobs" onclick="navigate('/jobs');return false">더보기 <i class="fas fa-chevron-right"></i></a>
      </div>
      ${!jobs || !jobs.length 
        ? '<div class="empty-state"><div class="empty-state-icon">💼</div><div>채용 공고가 없습니다</div></div>'
        : `<div style="display:flex;flex-direction:column;gap:0.5rem">
            ${jobs.map(j => renderJobCardMini(j)).join('')}
           </div>`
      }
    </div>
  </div>`;
}

function renderJobCardMini(job) {
  const badges = [];
  if (job.is_urgent) badges.push('<span class="badge badge-urgent">급구</span>');
  if (job.is_hot) badges.push('<span class="badge badge-hot">HOT</span>');
  if (job.is_best) badges.push('<span class="badge badge-best">대박</span>');
  return `
  <div class="job-card ${job.ad_type==='premium'?'ad-premium':''}" onclick="navigate('/jobs/${job.id}')">
    <div style="display:flex;gap:0.3rem;margin-bottom:0.25rem">${badges.join('')}</div>
    <div class="job-title text-clamp-2">${escapeHtml(job.title)}</div>
    <div style="display:flex;gap:0.5rem;margin-top:0.3rem;font-size:0.75rem;color:#6b7280;flex-wrap:wrap">
      <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(job.region)}</span>
      ${job.commission_rate ? `<span><i class="fas fa-percent"></i> ${job.commission_rate}%</span>` : ''}
    </div>
  </div>`;
}

// ============================================================
// AD CTA
// ============================================================
function renderAdCta() {
  return `
  <div class="ad-cta-banner">
    <div class="ad-cta-left">
      <div class="ad-cta-badge">💰 광고 안내</div>
      <div class="ad-cta-title">내 분양단지를 히트지수 최상단에!</div>
      <div class="ad-cta-tiers">
        <span class="ad-cta-tier hit">🔥 히트AD <small>50만원/월</small></span>
        <span class="ad-cta-tier premium">⭐ 프리미엄 <small>30만원/월</small></span>
        <span class="ad-cta-tier standard">📌 스탠다드 <small>10만원/월</small></span>
        <span class="ad-cta-tier free">🆓 무료 <small>2건/일</small></span>
      </div>
    </div>
    <div class="ad-cta-actions">
      <button class="btn" style="background:white;color:#dc2626;font-weight:700" onclick="navigate('/ad-info')">
        <i class="fas fa-info-circle"></i> 광고 상품 보기
      </button>
      <button class="btn" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.4)" onclick="navigate('/sites/new')">
        <i class="fas fa-plus"></i> 단지 등록
      </button>
    </div>
  </div>`;
}
