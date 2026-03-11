// 히트분양 - 홈페이지 v5 (다방 톤앤매너 리뉴얼)
// A: 히어로 (네이비 그라디언트 + 검색 + 지역칩)
// B: 카테고리 그리드 (다방 메인 스타일)
// C: 히트 TOP 5
// D: 배너 슬라이더 (히트AD)
// E: 통계 위젯
// F: 신규 등록 단지
// G: 히트맵 + TV 미니 위젯
// H: 뉴스 + 커뮤니티 + 채용

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
    <!-- 카테고리 그리드 -->
    <div class="home-section" style="background:#fff;padding:2rem 0 1.5rem;border-bottom:1px solid #eaf2ff">
      <div class="container">
        ${renderCategoryGrid()}
      </div>
    </div>
    <!-- 히트 TOP 5 -->
    ${renderHitTop5(bestProperties)}
    <!-- 배너 슬라이더 -->
    <div class="home-section" style="background:#f4f8ff;padding:2rem 0">
      <div class="container">
        ${renderBannerSlider(topBanners)}
      </div>
    </div>
    <!-- 통계 위젯 -->
    <div class="container" style="padding-top:2rem;padding-bottom:1rem">
      ${renderStatsWidget(stats, visitorRes.data?.today || 0)}
    </div>
    <!-- 신규 등록 단지 -->
    <div class="container" style="padding-bottom:2rem">
      ${renderNewProperties(newProperties)}
    </div>
    <!-- 히트맵 + TV 미니 위젯 -->
    <div class="home-section" style="background:#f4f8ff;padding:2rem 0">
      <div class="container">
        ${renderHomeMiniWidgets()}
      </div>
    </div>
    <!-- 뉴스 + 커뮤니티 + 채용 -->
    <div class="container" style="padding:2rem 0 3rem">
      ${renderHomeBottomSection(latestNews, featuredJobs)}
    </div>
    <!-- 광고 CTA -->
    <div class="container" style="padding-bottom:2.5rem">
      ${renderAdCta()}
    </div>
  `;
  
  // 숫자 애니메이션
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
// A: HERO SECTION — 다방 스타일 네이비
// ============================================================
function renderHeroSection() {
  const regions = ['전국','서울','경기북부','경기남부','인천','부산','대구','광주','대전','충청','전라','경상','강원','제주','울산','세종'];
  return `
  <section class="hero-section">
    <div class="container" style="position:relative;z-index:1">
      <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:2.5rem;align-items:center">
        <div>
          <!-- 뱃지 -->
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap">
            <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.15);
              border:1px solid rgba(255,255,255,0.25);border-radius:20px;padding:4px 12px;
              font-size:0.78rem;color:white;font-weight:700">
              <span style="width:7px;height:7px;border-radius:50%;background:#5ba3ff;animation:pulse 1.5s infinite"></span>
              LIVE
            </span>
            <span style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);
              border-radius:20px;padding:4px 12px;font-size:0.78rem;color:rgba(255,255,255,0.9);font-weight:600">
              🏆 대한민국 NO.1 분양정보 플랫폼
            </span>
          </div>
          
          <!-- 타이틀 -->
          <h1 style="font-size:2.4rem;font-weight:900;color:white;line-height:1.25;letter-spacing:-1.5px;margin-bottom:0.75rem">
            전국 신규 분양단지<br>
            <span style="color:#90caf9">히트지수</span>로 한눈에!
          </h1>
          <p style="font-size:1rem;color:rgba(255,255,255,0.75);margin-bottom:1.75rem;font-weight:400">
            아파트 · 오피스텔 · 상가 분양 | 팀장 · 팀원 채용
          </p>
          
          <!-- 검색바 -->
          <div style="background:white;border-radius:14px;padding:5px;display:flex;align-items:center;
            gap:5px;box-shadow:0 8px 32px rgba(0,0,0,0.2);margin-bottom:1rem">
            <select id="hero-region-sel" style="border:none;outline:none;padding:0.65rem 0.75rem;
              font-size:0.88rem;color:#0e1f40;background:transparent;cursor:pointer;font-family:inherit;
              border-right:1px solid #d6e4ff;min-width:90px">
              <option value="">전체 지역</option>
              ${['서울','경기북부','경기남부','인천','부산','대구','광주','대전','울산','세종','충청','전라','경상','강원','제주'].map(r =>
                `<option value="${r}">${r}</option>`).join('')}
            </select>
            <input type="text" id="hero-search" placeholder="현장명, 지역명으로 검색..."
              onkeydown="if(event.key==='Enter')doHeroSearch()"
              style="flex:1;border:none;outline:none;padding:0.65rem 1rem;
                font-size:0.9rem;color:#0e1f40;background:transparent">
            <button onclick="doHeroSearch()" style="background:#1c7cff;color:white;border:none;
              padding:0.65rem 1.5rem;border-radius:10px;cursor:pointer;font-weight:700;
              font-size:0.9rem;white-space:nowrap;transition:background 0.2s;font-family:inherit">
              <i class="fas fa-search"></i> 검색
            </button>
          </div>
          
          <!-- 지역 빠른 선택 -->
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
            ${regions.map(r => `
              <button onclick="navigate('/sites?region=${encodeURIComponent(r)}')"
                style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);
                  color:rgba(255,255,255,0.85);padding:5px 12px;border-radius:20px;
                  font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:inherit"
                onmouseover="this.style.background='rgba(255,255,255,0.22)'"
                onmouseout="this.style.background='rgba(255,255,255,0.12)'">${r}</button>
            `).join('')}
          </div>
        </div>
        
        <!-- 우측: 실시간 카드 -->
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <!-- 실시간 현황 -->
          <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);
            border-radius:16px;padding:1.25rem;backdrop-filter:blur(10px)">
            <div style="font-size:0.82rem;font-weight:700;color:rgba(255,255,255,0.7);
              margin-bottom:1rem;display:flex;align-items:center;gap:0.4rem">
              <i class="fas fa-chart-line"></i> 실시간 현황
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem">
              ${[
                {icon:'👁️', label:'오늘 방문자', id:'visitor-count-today', val:'-'},
                {icon:'🏢', label:'등록 단지', id:'stat-total-props-hero', val:'314,124'},
                {icon:'💼', label:'채용 공고', id:'stat-total-jobs-hero', val:'52,381'},
              ].map(s => `
                <div style="text-align:center">
                  <div style="font-size:1.1rem;margin-bottom:0.25rem">${s.icon}</div>
                  <div id="${s.id}" style="font-size:1.3rem;font-weight:900;color:white;line-height:1">${s.val}</div>
                  <div style="font-size:0.72rem;color:rgba(255,255,255,0.6);margin-top:3px">${s.label}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- 히트지수 카드 -->
          <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
            border-radius:16px;padding:1.25rem">
            <div style="font-size:0.82rem;font-weight:700;color:rgba(255,255,255,0.7);
              margin-bottom:0.75rem;display:flex;align-items:center;gap:0.4rem">
              <i class="fas fa-fire" style="color:#e57373"></i> 히트지수란?
            </div>
            <div style="height:6px;background:rgba(255,255,255,0.15);border-radius:3px;margin-bottom:0.75rem;overflow:hidden">
              <div style="height:100%;width:85%;background:linear-gradient(90deg,#1c7cff,#ff3b3b);border-radius:3px"></div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.75rem">
              ${['📊 조회수','💬 문의수','🔗 공유수','⭐ 광고등급','🏢 대행사평점'].map(t =>
                `<span style="background:rgba(255,255,255,0.1);padding:3px 10px;border-radius:20px;
                  font-size:0.73rem;color:rgba(255,255,255,0.8)">${t}</span>`
              ).join('')}
            </div>
            <button onclick="navigate('/ranking')" style="background:rgba(255,255,255,0.15);
              color:white;border:1px solid rgba(255,255,255,0.25);padding:0.5rem 1rem;
              border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;
              transition:all 0.2s;font-family:inherit"
              onmouseover="this.style.background='rgba(255,255,255,0.25)'"
              onmouseout="this.style.background='rgba(255,255,255,0.15)'">
              랭킹 보러가기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
  <style>
    @media(max-width:768px){
      .hero-section .container > div { grid-template-columns:1fr!important; }
      .hero-section .container > div > div:last-child { display:none!important; }
      h1.hero-h1 { font-size:1.8rem!important; }
    }
  </style>`;
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
// 카테고리 그리드 — 다방 메인 스타일
// ============================================================
function renderCategoryGrid() {
  const cats = [
    { icon: '🏙️', name: '아파트', sub: '분양/입주', color: '#e8f2ff', route: '/sites?type=apartment' },
    { icon: '🏢', name: '오피스텔', sub: '주거형/업무형', color: '#fce4ec', route: '/sites?type=officetel', badge: '인기' },
    { icon: '🏪', name: '상가', sub: '근린/복합', color: '#fff9c4', route: '/sites?type=commercial' },
    { icon: '🏭', name: '지식산업센터', sub: '업무/공장', color: '#e8f5e9', route: '/sites?type=industrial' },
    { icon: '🏨', name: '생활숙박', sub: '레지던스', color: '#ede7f6', route: '/sites?type=hotel' },
    { icon: '🗺️', name: '히트맵', sub: '지도로 찾기', color: '#e1f5fe', route: '/hitmap', badge: 'NEW' },
    { icon: '🏆', name: '히트랭킹', sub: 'TOP 50', color: '#fff3e0', route: '/ranking', badge: 'HOT' },
    { icon: '✨', name: '맞춤현장', sub: 'AI 매칭', color: '#f3e5f5', route: '/match', badge: 'AI' },
  ];
  return `
  <div style="margin-bottom:0.5rem;display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:0.82rem;color:#4a5980;font-weight:500">
      <i class="fas fa-fire" style="color:#e53935;margin-right:4px"></i>
      전국 <strong style="color:#1c7cff">314,124개</strong> 분양 단지 정보
    </div>
    <a style="font-size:0.82rem;color:#1c7cff;font-weight:600;cursor:pointer"
      onclick="navigate('/sites')">전체보기 →</a>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.85rem">
    ${cats.map(c => `
      <div onclick="navigate('${c.route}')"
        style="background:${c.color};border-radius:14px;padding:1.2rem 0.75rem;text-align:center;
          cursor:pointer;border:1.5px solid transparent;transition:all 0.2s;position:relative;
          box-shadow:0 1px 4px rgba(28,124,255,0.08)"
        onmouseover="this.style.borderColor='#5ba3ff';this.style.transform='translateY(-3px)';this.style.boxShadow='0 6px 18px rgba(28,124,255,0.14)'"
        onmouseout="this.style.borderColor='transparent';this.style.transform='translateY(0)';this.style.boxShadow='0 1px 4px rgba(28,124,255,0.08)'">
        ${c.badge ? `<span style="position:absolute;top:7px;right:7px;background:#e53935;color:white;
          font-size:0.58rem;font-weight:800;padding:2px 5px;border-radius:4px">${c.badge}</span>` : ''}
        <div style="font-size:1.8rem;margin-bottom:0.4rem">${c.icon}</div>
        <div style="font-size:0.88rem;font-weight:700;color:#0e1f40;margin-bottom:2px">${c.name}</div>
        <div style="font-size:0.72rem;color:#4a5980">${c.sub}</div>
      </div>
    `).join('')}
  </div>`;
}

// ============================================================
// B: 히트 TOP 5
// ============================================================
function renderHitTop5(properties) {
  if (!properties || !properties.length) return '';
  const top5 = properties.slice(0, 5);
  
  return `
  <div class="home-section" style="background:#fff;padding:2rem 0">
    <div class="container">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
        <h2 class="section-title">🔥 히트 TOP 5 <span style="font-size:0.82rem;font-weight:500;color:#4a5980;margin-left:0.5rem">히트지수 최고 현장</span></h2>
        <a class="section-link" href="/ranking" onclick="navigate('/ranking');return false">전체 랭킹 <i class="fas fa-chevron-right"></i></a>
      </div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.85rem">
        ${top5.map((p, i) => renderHitTop5Card(p, i)).join('')}
      </div>
    </div>
  </div>`;
}

function renderHitTop5Card(p, rank) {
  const score = calcHitScore(p);
  const color = getHitScoreColor(score);
  const label = getHitScoreLabel(score);
  const rankMedals = ['🥇', '🥈', '🥉', '4위', '5위'];
  
  return `
  <div onclick="navigate('/properties/${p.id}')"
    style="background:white;border-radius:14px;overflow:hidden;border:1.5px solid #d6e4ff;
      cursor:pointer;transition:all 0.22s;box-shadow:0 2px 8px rgba(28,124,255,0.08);
      ${rank === 0 ? 'border-color:#1c7cff;box-shadow:0 4px 20px rgba(26,35,126,0.15)' : ''}"
    onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 28px rgba(28,124,255,0.18)'"
    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='${rank===0?'0 4px 20px rgba(26,35,126,0.15)':'0 2px 8px rgba(28,124,255,0.08)'}'">
    <!-- 이미지 영역 -->
    <div style="height:120px;background:${getPropertyBgImage(p.property_type)};
      display:flex;align-items:center;justify-content:center;position:relative">
      <i class="fas fa-building" style="color:rgba(255,255,255,0.45);font-size:2rem"></i>
      <!-- 순위 배지 -->
      <div style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.5);
        color:${rank<3?'#ffd54f':'white'};font-size:${rank<3?'1.1':'0.8'}rem;
        font-weight:800;padding:3px 8px;border-radius:6px">
        ${rankMedals[rank]}
      </div>
      <!-- 히트지수 서클 -->
      <div style="position:absolute;top:8px;right:8px">
        <div style="position:relative;width:38px;height:38px">
          <svg viewBox="0 0 36 36" style="width:100%;height:100%;transform:rotate(-90deg)">
            <circle cx="18" cy="18" r="14" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
            <circle cx="18" cy="18" r="14" fill="none" stroke="${color}" stroke-width="3"
              stroke-dasharray="${score} ${100-score}" stroke-linecap="round"/>
          </svg>
          <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
            color:white;font-size:0.68rem;font-weight:900">${score}</span>
        </div>
      </div>
    </div>
    <div style="padding:0.8rem">
      <div style="display:flex;gap:0.3rem;margin-bottom:0.4rem;flex-wrap:wrap">
        <span style="background:rgba(26,35,126,0.08);color:#1c7cff;padding:2px 7px;
          border-radius:4px;font-size:0.68rem;font-weight:700">${escapeHtml(p.region)}</span>
        <span style="background:#f5f5f5;color:#666;padding:2px 7px;
          border-radius:4px;font-size:0.68rem">${getPropertyTypeLabel(p.property_type)}</span>
      </div>
      <div style="font-size:0.85rem;font-weight:700;color:#0e1f40;line-height:1.35;
        overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
        margin-bottom:0.4rem">${escapeHtml(p.title)}</div>
      <div style="font-size:0.9rem;font-weight:900;color:#1c7cff;margin-bottom:0.5rem">
        ${formatPriceRange(p.price_min, p.price_max)}
      </div>
      <!-- 히트지수 바 -->
      <div style="display:flex;align-items:center;gap:6px">
        <div style="flex:1;height:4px;background:#d6e4ff;border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${score}%;background:${color};border-radius:2px;
            transition:width 0.6s ease"></div>
        </div>
        <span style="font-size:0.7rem;font-weight:800;color:${color}">${label}</span>
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
  'linear-gradient(135deg, #1c7cff 0%, #0057d9 100%)',
  'linear-gradient(135deg, #0057d9 0%, #0042b0 100%)',
  'linear-gradient(135deg, #004d40 0%, #00897b 100%)',
  'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)',
  'linear-gradient(135deg, #b71c1c 0%, #e53935 100%)',
  'linear-gradient(135deg, #e65100 0%, #f4511e 100%)',
  'linear-gradient(135deg, #006064 0%, #0097a7 100%)',
  'linear-gradient(135deg, #1b5e20 0%, #388e3c 100%)',
  'linear-gradient(135deg, #311b92 0%, #512da8 100%)',
  'linear-gradient(135deg, #bf360c 0%, #f4511e 100%)',
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
    <h2 class="section-title">📢 히트AD 현장</h2>
    <a class="section-link" href="/sites?sort=hot" onclick="navigate('/sites?sort=hot');return false">
      전체보기 <i class="fas fa-chevron-right"></i>
    </a>
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
  bannerTimer = setInterval(() => nextBanner(false), 4500);
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
    bannerTimer = setInterval(() => nextBanner(false), 4500);
  });
}

function goToBanner(idx) { currentBannerIndex = idx; updateBannerSlider(); }
function nextBanner(reset = true) {
  currentBannerIndex = (currentBannerIndex + 1) % totalBanners;
  updateBannerSlider();
  if (reset) { clearInterval(bannerTimer); bannerTimer = setInterval(() => nextBanner(false), 4500); }
}
function prevBanner() {
  currentBannerIndex = (currentBannerIndex - 1 + totalBanners) % totalBanners;
  updateBannerSlider();
  clearInterval(bannerTimer); bannerTimer = setInterval(() => nextBanner(false), 4500);
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
    { id: 'stat-total-props', icon: '🏢', label: '총 등록 단지', val: stats?.total_properties || 314124, bg: '#e8f2ff', border: '#c5cbe8' },
    { id: 'stat-total-jobs', icon: '💼', label: '채용 공고', val: stats?.total_jobs || 52381, bg: '#e8f5e9', border: '#a5d6a7' },
    { id: 'stat-total-members', icon: '👥', label: '누적 회원수', val: stats?.total_members || 128456, bg: '#ede7f6', border: '#ce93d8' },
    { id: 'stat-today-visitors', icon: '👁️', label: '오늘 방문자', val: todayVisitors || 0, bg: '#e1f5fe', border: '#81d4fa' },
  ];
  return `
  <div class="stats-widget">
    <div class="stats-grid">
      ${items.map(item => `
        <div class="stats-item" style="background:${item.bg};border:1.5px solid ${item.border}">
          <div class="stats-item-icon">${item.icon}</div>
          <div class="stats-item-value" id="${item.id}">0</div>
          <div class="stats-item-label">${item.label}</div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

// ============================================================
// D: NEW PROPERTIES
// ============================================================
function renderNewProperties(properties) {
  if (!properties || !properties.length) return '';
  return `
  <div class="section-header">
    <h2 class="section-title">🆕 신규 등록 단지</h2>
    <a class="section-link" href="/sites" onclick="navigate('/sites');return false">전체보기 <i class="fas fa-chevron-right"></i></a>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem">
    ${properties.slice(0,8).map(p => renderPropertyCard(p)).join('')}
  </div>
  <style>
    @media(max-width:1024px){
      .properties-grid-home { grid-template-columns:repeat(3,1fr)!important; }
    }
    @media(max-width:768px){
      .properties-grid-home { grid-template-columns:repeat(2,1fr)!important; }
    }
    @media(max-width:480px){
      .properties-grid-home { grid-template-columns:1fr!important; }
    }
  </style>`;
}

// ============================================================
// E: 미니 위젯 (히트맵 + TV)
// ============================================================
function renderHomeMiniWidgets() {
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
    <h2 class="section-title">🗺️ 히트맵 & 📺 히트TV</h2>
  </div>
  <div style="display:grid;grid-template-columns:3fr 2fr;gap:1rem">
    <!-- 히트맵 위젯 -->
    <div onclick="navigate('/hitmap')"
      style="background:linear-gradient(135deg,#1c7cff,#0057d9);border-radius:16px;
        padding:1.5rem;cursor:pointer;transition:transform 0.2s;min-height:200px;
        display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden"
      onmouseover="this.style.transform='translateY(-3px)'"
      onmouseout="this.style.transform='translateY(0)'">
      <!-- 배경 패턴 -->
      <div style="position:absolute;inset:0;opacity:0.06">
        ${Array.from({length:10}, (_,i) => `
          <div style="position:absolute;border-radius:50%;background:white;
            width:${[60,40,80,30,50,70,45,35,55,65][i]}px;
            height:${[60,40,80,30,50,70,45,35,55,65][i]}px;
            top:${[10,40,20,60,80,5,55,75,35,50][i]}%;
            left:${[15,60,80,20,45,70,35,85,55,10][i]}%"></div>
        `).join('')}
      </div>
      <div style="position:relative;z-index:1">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
          <span style="background:rgba(255,255,255,0.15);border-radius:10px;padding:0.5rem 0.75rem;
            font-size:1.2rem">🗺️</span>
          <div>
            <div style="font-size:1rem;font-weight:800;color:white">히트맵</div>
            <div style="font-size:0.78rem;color:rgba(255,255,255,0.65)">지역별 히트지수 시각화</div>
          </div>
        </div>
        <!-- 가상 마커 -->
        <div style="position:relative;height:80px;background:rgba(255,255,255,0.07);
          border-radius:10px;overflow:hidden;margin-bottom:0.75rem">
          ${[
            {c:'#ef5350',s:14,t:20,l:30},{c:'#ff7043',s:10,t:50,l:55},{c:'#42a5f5',s:12,t:30,l:75},
            {c:'#ef5350',s:9,t:65,l:20},{c:'#ff7043',s:11,t:15,l:60},{c:'#42a5f5',s:8,t:55,l:85},
          ].map(m => `
            <div style="position:absolute;width:${m.s}px;height:${m.s}px;background:${m.c};
              border-radius:50%;top:${m.t}%;left:${m.l}%;border:2px solid rgba(255,255,255,0.4);
              box-shadow:0 0 6px ${m.c}80"></div>
          `).join('')}
          <div style="position:absolute;bottom:6px;right:8px;font-size:0.65rem;color:rgba(255,255,255,0.5)">
            🔴 80+ &nbsp; 🟠 50~79 &nbsp; 🔵 ~49
          </div>
        </div>
      </div>
      <button style="background:rgba(255,255,255,0.18);color:white;border:1px solid rgba(255,255,255,0.25);
        padding:0.5rem 1rem;border-radius:8px;font-size:0.83rem;font-weight:600;cursor:pointer;
        width:fit-content;font-family:inherit;position:relative;z-index:1">
        히트맵 열기 →
      </button>
    </div>
    
    <!-- 히트TV 위젯 -->
    <div onclick="navigate('/tv')"
      style="background:white;border-radius:16px;border:1.5px solid #d6e4ff;
        padding:1.25rem;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(28,124,255,0.08)"
      onmouseover="this.style.borderColor='#5ba3ff';this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(28,124,255,0.14)'"
      onmouseout="this.style.borderColor='#d6e4ff';this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(28,124,255,0.08)'">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem">
        <span style="background:#ffebee;border-radius:10px;padding:0.45rem 0.65rem;font-size:1.1rem">📺</span>
        <div>
          <div style="font-size:0.95rem;font-weight:800;color:#0e1f40">히트분양TV</div>
          <div style="font-size:0.75rem;color:#4a5980">분양 현장 유튜브 채널</div>
        </div>
      </div>
      ${[
        {title:'[리뷰] 힐스테이트 판교역 현장 방문기', views:'12.4만'},
        {title:'2025 수도권 분양시장 전망 분석', views:'8.9만'},
        {title:'분양 팀장 되는 법 A to Z', views:'6.2만'},
      ].map(v => `
        <div style="display:flex;align-items:center;gap:0.65rem;padding:0.55rem 0;
          border-bottom:1px solid #eaf2ff">
          <div style="width:42px;height:32px;background:#ffebee;border-radius:6px;
            display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="fab fa-youtube" style="color:#e53935;font-size:0.9rem"></i>
          </div>
          <div style="flex:1;overflow:hidden">
            <div style="font-size:0.8rem;font-weight:600;overflow:hidden;white-space:nowrap;
              text-overflow:ellipsis;color:#0e1f40">${v.title}</div>
            <div style="font-size:0.71rem;color:#8fa3c8;margin-top:1px">
              <i class="fas fa-eye"></i> ${v.views}
            </div>
          </div>
        </div>
      `).join('')}
      <div style="text-align:center;margin-top:0.75rem">
        <button style="background:#ffebee;color:#e53935;border:1.5px solid #ffcdd2;
          padding:0.45rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;
          cursor:pointer;font-family:inherit">
          <i class="fab fa-youtube"></i> 채널 방문하기
        </button>
      </div>
    </div>
  </div>`;
}

// ============================================================
// F: 뉴스 + 커뮤니티 + 채용
// ============================================================
function renderHomeBottomSection(newsList, jobs) {
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5rem">
    <!-- 뉴스 -->
    <div>
      <div class="section-header">
        <h2 class="section-title">📰 뉴스/공지</h2>
        <a class="section-link" href="/news" onclick="navigate('/news');return false">더보기 <i class="fas fa-chevron-right"></i></a>
      </div>
      <div style="background:white;border-radius:14px;border:1.5px solid #d6e4ff;overflow:hidden;box-shadow:0 2px 8px rgba(26,35,126,0.05)">
        ${newsList && newsList.length 
          ? newsList.map(n => `
            <div class="news-row" onclick="navigate('/news/${n.id}')" style="padding:0.75rem 1rem">
              <span class="news-type-badge news-type-${n.news_type}">${n.news_type==='notice'?'공지':n.news_type==='event'?'이벤트':'뉴스'}</span>
              ${n.is_pinned ? '<i class="fas fa-thumbtack" style="color:#f9a825;font-size:0.7rem"></i>' : ''}
              <span style="flex:1;font-size:0.85rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${escapeHtml(n.title)}</span>
              <span style="font-size:0.72rem;color:#8fa3c8;white-space:nowrap">${timeAgo(n.created_at)}</span>
            </div>`).join('')
          : `<div style="text-align:center;padding:2.5rem;color:#8fa3c8;font-size:0.85rem">
              <div style="font-size:2rem;margin-bottom:0.5rem">📋</div>
              공지사항이 없습니다
            </div>`
        }
      </div>
    </div>
    
    <!-- 커뮤니티 -->
    <div>
      <div class="section-header">
        <h2 class="section-title">💬 커뮤니티 HOT</h2>
        <a class="section-link" href="/community" onclick="navigate('/community');return false">더보기 <i class="fas fa-chevron-right"></i></a>
      </div>
      <div style="background:white;border-radius:14px;border:1.5px solid #d6e4ff;overflow:hidden;box-shadow:0 2px 8px rgba(26,35,126,0.05)">
        ${[
          {cat:'현장후기', catColor:'#1c7cff', catBg:'#e8f2ff', title:'래미안 원펜타스 계약 후기 공유합니다', likes:24, comments:8},
          {cat:'정보공유', catColor:'#2e7d32', catBg:'#e8f5e9', title:'2025년 하반기 분양 일정 총정리', likes:51, comments:15},
          {cat:'자유게시판', catColor:'#6a1b9a', catBg:'#ede7f6', title:'팀장 첫 달 수입 공개 (솔직 후기)', likes:38, comments:22},
          {cat:'Q&A', catColor:'#c62828', catBg:'#ffebee', title:'계약금 환급 조건이 어떻게 되나요?', likes:12, comments:6},
        ].map(p => `
          <div onclick="navigate('/community')"
            style="padding:0.8rem 1rem;border-bottom:1px solid #eaf2ff;cursor:pointer;
              transition:background 0.15s"
            onmouseover="this.style.background='#f4f8ff'"
            onmouseout="this.style.background='white'">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem">
              <span style="background:${p.catBg};color:${p.catColor};padding:2px 7px;
                border-radius:4px;font-size:0.69rem;font-weight:700;white-space:nowrap">${p.cat}</span>
              <span style="flex:1;font-size:0.83rem;font-weight:600;overflow:hidden;
                white-space:nowrap;text-overflow:ellipsis;color:#0e1f40">${p.title}</span>
            </div>
            <div style="display:flex;gap:0.75rem;font-size:0.72rem;color:#8fa3c8">
              <span><i class="fas fa-heart" style="color:#e57373"></i> ${p.likes}</span>
              <span><i class="fas fa-comment" style="color:#64b5f6"></i> ${p.comments}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <!-- 채용 -->
    <div>
      <div class="section-header">
        <h2 class="section-title">🔥 HOT 채용</h2>
        <a class="section-link" href="/sites?tab=jobs" onclick="navigate('/sites?tab=jobs');return false">더보기 <i class="fas fa-chevron-right"></i></a>
      </div>
      ${!jobs || !jobs.length 
        ? `<div style="background:white;border-radius:14px;border:1.5px solid #d6e4ff;
              padding:2.5rem;text-align:center;color:#8fa3c8">
            <div style="font-size:2rem;margin-bottom:0.5rem">💼</div>채용 공고가 없습니다
          </div>`
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
    <div style="display:flex;gap:0.5rem;margin-top:0.3rem;font-size:0.75rem;color:#4a5980;flex-wrap:wrap">
      <span><i class="fas fa-map-marker-alt" style="color:#1c7cff"></i> ${escapeHtml(job.region)}</span>
      ${job.commission_rate ? `<span><i class="fas fa-percent" style="color:#f9a825"></i> ${job.commission_rate}%</span>` : ''}
    </div>
  </div>`;
}

// ============================================================
// AD CTA BANNER
// ============================================================
function renderAdCta() {
  return `
  <div style="background:linear-gradient(135deg,#1c7cff,#0057d9);border-radius:16px;
    padding:2rem 2.5rem;display:flex;align-items:center;justify-content:space-between;
    box-shadow:0 8px 32px rgba(28,124,255,0.28);flex-wrap:wrap;gap:1.5rem">
    <div>
      <div style="background:rgba(255,255,255,0.15);color:white;padding:3px 12px;
        border-radius:20px;font-size:0.75rem;font-weight:700;
        display:inline-block;margin-bottom:0.6rem;border:1px solid rgba(255,255,255,0.2)">
        💰 광고 안내
      </div>
      <div style="font-size:1.4rem;font-weight:900;color:white;margin-bottom:0.5rem;letter-spacing:-0.5px">
        내 분양단지를 히트지수 최상단에!
      </div>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
        ${[
          {t:'🔥 히트AD', sub:'50만원/월', c:'#ef5350'},
          {t:'⭐ 프리미엄', sub:'30만원/월', c:'#ffa726'},
          {t:'📌 스탠다드', sub:'10만원/월', c:'#66bb6a'},
          {t:'🆓 무료', sub:'2건/일', c:'#78909c'},
        ].map(a => `
          <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);
            border-radius:8px;padding:6px 14px;text-align:center">
            <div style="font-size:0.82rem;font-weight:700;color:white">${a.t}</div>
            <div style="font-size:0.72rem;color:rgba(255,255,255,0.6)">${a.sub}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.5rem">
      <button onclick="navigate('/ad-info')"
        style="background:white;color:#1c7cff;border:none;padding:0.75rem 1.75rem;
          border-radius:10px;font-size:0.92rem;font-weight:700;cursor:pointer;
          box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:all 0.2s;font-family:inherit"
        onmouseover="this.style.transform='translateY(-2px)'"
        onmouseout="this.style.transform='translateY(0)'">
        <i class="fas fa-info-circle"></i> 광고 상품 보기
      </button>
      <button onclick="navigate('/sites/new')"
        style="background:rgba(255,255,255,0.15);color:white;
          border:1px solid rgba(255,255,255,0.3);padding:0.65rem 1.75rem;
          border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;
          transition:background 0.2s;font-family:inherit"
        onmouseover="this.style.background='rgba(255,255,255,0.25)'"
        onmouseout="this.style.background='rgba(255,255,255,0.15)'">
        <i class="fas fa-plus"></i> 단지 등록
      </button>
    </div>
  </div>`;
}
