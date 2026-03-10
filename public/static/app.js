// 히트분양 - 메인 앱 (상태관리, 유틸, 라우터)

// ============================================================
// STATE MANAGEMENT
// ============================================================
const state = {
  user: null,
  token: null,
  currentPage: '/',
  loading: false,
  visitorCount: 0,
};

function loadState() {
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('auth_user');
  if (token && user) {
    try {
      state.token = token;
      state.user = JSON.parse(user);
    } catch(e) { clearAuth(); }
  }
}

function saveAuth(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

function clearAuth() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

// ============================================================
// API CLIENT
// ============================================================
const api = {
  async request(method, path, data) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    const options = { method, headers };
    if (data) options.body = JSON.stringify(data);
    try {
      const res = await fetch(`/api${path}`, options);
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) { clearAuth(); renderApp(); }
      return { ok: res.ok, status: res.status, data: json };
    } catch(e) {
      return { ok: false, status: 0, data: { error: '네트워크 오류' } };
    }
  },
  get: (path) => api.request('GET', path),
  post: (path, data) => api.request('POST', path, data),
  put: (path, data) => api.request('PUT', path, data),
  delete: (path) => api.request('DELETE', path),
};

// ============================================================
// UTILITIES
// ============================================================
function formatPrice(price) {
  if (!price) return '협의';
  if (price >= 100000000) {
    const eok = Math.floor(price / 100000000);
    const man = Math.floor((price % 100000000) / 10000);
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
  }
  return `${Math.floor(price / 10000).toLocaleString()}만원`;
}

function formatPriceRange(min, max) {
  if (!min && !max) return '가격 협의';
  if (!max || min === max) return formatPrice(min);
  return `${formatPrice(min)} ~ ${formatPrice(max)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return formatDate(dateStr);
}

function getPropertyTypeLabel(type) {
  const map = { apartment: '아파트', officetel: '오피스텔', commercial: '상가', villa: '빌라/연립', land: '토지', other: '기타' };
  return map[type] || type;
}

function getRankLabel(rank) {
  const map = { team_leader: '팀장', team_member: '팀원', any: '팀장/팀원' };
  return map[rank] || rank;
}

function getRegionColor(region) {
  const map = {
    '서울': '#dc2626', '경기북부': '#1d4ed8', '경기남부': '#0369a1',
    '인천': '#0891b2', '부산': '#ea580c', '충청': '#7c3aed',
    '전라': '#059669', '경상': '#b45309', '강원': '#6366f1',
    '대구': '#d97706', '광주': '#10b981', '대전': '#8b5cf6',
    '울산': '#2563eb', '세종': '#0284c7', '전국': '#374151',
  };
  return map[region] || '#374151';
}

function getPropertyBgImage(type) {
  const colors = {
    apartment: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    officetel: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    commercial: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    villa: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    land: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    other: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  };
  return colors[type] || colors.other;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function nl2br(str) {
  if (!str) return '';
  return escapeHtml(str).replace(/\n/g, '<br>');
}

function animateNumber(el, target, duration = 1500) {
  const start = 0;
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * eased);
    el.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ============================================================
// ROUTER
// ============================================================
function getRoutes() {
  return {
    '/': renderHomePage,
    '/properties': renderPropertiesPage,
    '/properties/new': renderPropertyFormPage,
    '/properties/:id': renderPropertyDetailPage,
    '/jobs': renderJobsPage,
    '/jobs/new': renderJobFormPage,
    '/jobs/:id': renderJobDetailPage,
    '/news': renderNewsPage,
    '/news/:id': renderNewsDetailPage,
    '/login': renderLoginPage,
    '/register': renderRegisterPage,
    '/mypage': renderMyPage,
    '/admin': renderAdminPage,
    // 6 main menus
    '/region': renderRegionPage,
    '/custom': renderCustomPage,
    '/map': renderMapPage,
    '/favorites': renderFavoritesPage,
    '/supporters': renderSupportersPage,
    '/faq': renderFaqPage,
  };
}

function matchRoute(path) {
  const routes = getRoutes();
  // exact match first
  if (routes[path]) return { fn: routes[path], params: {} };
  for (const [pattern, fn] of Object.entries(routes)) {
    if (pattern === path) return { fn, params: {} };
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    if (patternParts.length !== pathParts.length) continue;
    const params = {};
    let match = true;
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        match = false; break;
      }
    }
    if (match) return { fn, params };
  }
  return null;
}

function navigate(path) {
  history.pushState({}, '', path);
  state.currentPage = path;
  renderApp();
  window.scrollTo(0, 0);
}

window.navigate = navigate;

window.addEventListener('popstate', () => {
  state.currentPage = location.pathname;
  renderApp();
});

// ============================================================
// RENDER APP
// ============================================================
function renderApp() {
  const appEl = document.getElementById('app');
  if (!appEl) return;
  const path = location.pathname;
  
  appEl.innerHTML = renderNavbar() + '<main id="main-content"></main>' + renderFooter();
  
  const route = matchRoute(path);
  const main = document.getElementById('main-content');
  if (!main) return;
  
  if (route) {
    route.fn(main, route.params);
  } else {
    main.innerHTML = `<div class="container" style="padding:4rem 1rem;text-align:center">
      <div style="font-size:5rem;margin-bottom:1rem">😕</div>
      <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:0.5rem">페이지를 찾을 수 없습니다</h2>
      <p style="color:#6b7280;margin-bottom:1.5rem">요청하신 페이지가 존재하지 않습니다.</p>
      <button class="btn btn-primary" onclick="navigate('/')">홈으로 돌아가기</button>
    </div>`;
  }
  
  // Update active nav
  document.querySelectorAll('[data-nav-path]').forEach(el => {
    const navPath = el.getAttribute('data-nav-path');
    const isActive = navPath === '/' ? path === '/' : path.startsWith(navPath);
    el.classList.toggle('active', isActive);
  });
}

// ============================================================
// NAVBAR
// ============================================================
function renderNavbar() {
  const user = state.user;
  const path = location.pathname;
  
  const mainMenus = [
    { label: 'HOME', path: '/', icon: 'fa-home' },
    { label: '지역현장', path: '/region', icon: 'fa-map-marker-alt' },
    { label: '맞춤현장', path: '/custom', icon: 'fa-sliders-h' },
    { label: '지도현장', path: '/map', icon: 'fa-map' },
    { label: '관심현장', path: '/favorites', icon: 'fa-heart' },
    { label: '서포터즈', path: '/supporters', icon: 'fa-users' },
  ];

  return `
  <nav class="navbar">
    <div class="navbar-inner">
      <div class="navbar-top">
        <a class="navbar-brand" href="/" onclick="navigate('/');return false">HIT<span>분양</span></a>
        <div class="navbar-search desktop-only">
          <input type="text" id="nav-search-input" placeholder="단지명, 지역으로 검색..." 
            onkeydown="if(event.key==='Enter'){doNavSearch();}" autocomplete="off">
          <button onclick="doNavSearch()"><i class="fas fa-search"></i></button>
        </div>
        <div class="navbar-actions">
          ${user ? `
            <span class="user-name-badge">${escapeHtml(user.name)}님</span>
            ${user.user_type === 'admin' ? `<a class="nav-action-btn" onclick="navigate('/admin');return false" href="/admin">관리자</a>` : ''}
            <a class="nav-action-btn" onclick="navigate('/mypage');return false" href="/mypage">마이페이지</a>
            <button class="nav-action-btn" onclick="handleLogout()">로그아웃</button>
          ` : `
            <a class="nav-action-btn" onclick="navigate('/login');return false" href="/login">로그인</a>
            <a class="nav-action-btn accent" onclick="navigate('/register');return false" href="/register">회원가입</a>
          `}
          <button id="mobile-toggle" class="mobile-toggle-btn" onclick="toggleMobileMenu()" aria-label="메뉴">
            <i class="fas fa-bars"></i>
          </button>
        </div>
      </div>
      <div class="navbar-bottom desktop-only">
        ${mainMenus.map(m => `
          <a class="main-nav-item ${(m.path === '/' ? path === '/' : path.startsWith(m.path)) ? 'active' : ''}" 
            href="${m.path}" onclick="navigate('${m.path}');return false" data-nav-path="${m.path}">
            <i class="fas ${m.icon}"></i> ${m.label}
          </a>
        `).join('')}
        <a class="main-nav-item" href="/jobs" onclick="navigate('/jobs');return false" data-nav-path="/jobs">
          <i class="fas fa-briefcase"></i> 채용정보
        </a>
        <a class="main-nav-item" href="/news" onclick="navigate('/news');return false" data-nav-path="/news">
          <i class="fas fa-newspaper"></i> 뉴스/공지
        </a>
        <a class="main-nav-item" href="/faq" onclick="navigate('/faq');return false" data-nav-path="/faq">
          <i class="fas fa-headset"></i> 고객지원
        </a>
      </div>
    </div>
    <!-- Mobile menu -->
    <div id="mobile-menu" class="mobile-menu">
      <div class="mobile-search">
        <input type="text" id="mobile-search-input" placeholder="단지명, 지역으로 검색..." 
          onkeydown="if(event.key==='Enter'){doMobileSearch();}">
        <button onclick="doMobileSearch()"><i class="fas fa-search"></i></button>
      </div>
      <div class="mobile-menu-grid">
        ${mainMenus.map(m => `
          <a class="mobile-menu-item ${(m.path === '/' ? path === '/' : path.startsWith(m.path)) ? 'active' : ''}"
            href="${m.path}" onclick="navigate('${m.path}');toggleMobileMenu();return false">
            <i class="fas ${m.icon}"></i>
            <span>${m.label}</span>
          </a>
        `).join('')}
        <a class="mobile-menu-item ${path.startsWith('/jobs') ? 'active' : ''}" 
          href="/jobs" onclick="navigate('/jobs');toggleMobileMenu();return false">
          <i class="fas fa-briefcase"></i><span>채용정보</span>
        </a>
        <a class="mobile-menu-item ${path.startsWith('/news') ? 'active' : ''}"
          href="/news" onclick="navigate('/news');toggleMobileMenu();return false">
          <i class="fas fa-newspaper"></i><span>뉴스/공지</span>
        </a>
        <a class="mobile-menu-item ${path.startsWith('/faq') ? 'active' : ''}"
          href="/faq" onclick="navigate('/faq');toggleMobileMenu();return false">
          <i class="fas fa-headset"></i><span>고객지원</span>
        </a>
      </div>
    </div>
  </nav>`;
}

function doNavSearch() {
  const q = document.getElementById('nav-search-input')?.value?.trim();
  if (q) navigate('/properties?search=' + encodeURIComponent(q));
}

function doMobileSearch() {
  const q = document.getElementById('mobile-search-input')?.value?.trim();
  if (q) { navigate('/properties?search=' + encodeURIComponent(q)); toggleMobileMenu(); }
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('open');
}

function handleLogout() {
  clearAuth();
  navigate('/');
}

// ============================================================
// FOOTER
// ============================================================
function renderFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <div class="footer-brand">HIT<span>분양</span></div>
          <p class="footer-desc">전국 신규 분양 단지 정보와<br>채용 정보를 한곳에서 확인하세요.</p>
          <div class="footer-contact">
            <div><i class="fas fa-phone"></i> 분양라인: <strong>1533-9077</strong></div>
            <div><i class="fas fa-fax"></i> FAX: 02-000-0000</div>
            <div><i class="fas fa-envelope"></i> info@hitbunyang.com</div>
            <div style="font-size:0.78rem;color:rgba(255,255,255,0.4);margin-top:0.5rem">평일 09:00 ~ 18:00 (점심 12:00~13:00)</div>
          </div>
        </div>
        <div class="footer-col">
          <div class="footer-section-title">서비스</div>
          <div class="footer-links">
            <a class="footer-link" href="/" onclick="navigate('/');return false">HOME</a>
            <a class="footer-link" href="/region" onclick="navigate('/region');return false">지역현장</a>
            <a class="footer-link" href="/custom" onclick="navigate('/custom');return false">맞춤현장</a>
            <a class="footer-link" href="/map" onclick="navigate('/map');return false">지도현장</a>
            <a class="footer-link" href="/favorites" onclick="navigate('/favorites');return false">관심현장</a>
            <a class="footer-link" href="/supporters" onclick="navigate('/supporters');return false">서포터즈</a>
          </div>
        </div>
        <div class="footer-col">
          <div class="footer-section-title">정보</div>
          <div class="footer-links">
            <a class="footer-link" href="/jobs" onclick="navigate('/jobs');return false">채용정보</a>
            <a class="footer-link" href="/news" onclick="navigate('/news');return false">뉴스/공지</a>
            <a class="footer-link" href="/faq" onclick="navigate('/faq');return false">고객지원/FAQ</a>
          </div>
        </div>
        <div class="footer-col">
          <div class="footer-section-title">광고 상품</div>
          <div class="footer-ad-tiers">
            <div class="footer-ad-tier premium">🥇 프리미엄<span>최상단 고정 노출</span></div>
            <div class="footer-ad-tier superior">🥈 슈페리어<span>상위 노출 보장</span></div>
            <div class="footer-ad-tier basic">🥉 베이직<span>일반 우선 노출</span></div>
          </div>
          <button class="footer-ad-btn" onclick="navigate('/faq')">광고 문의하기 →</button>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-bottom-left">
          <span>© 2025 히트분양(HIT분양). All rights reserved.</span>
          <span>사업자등록번호: 000-00-00000</span>
          <span>대표: 홍길동</span>
        </div>
        <div class="footer-bottom-right">
          <a class="footer-link" href="#">이용약관</a>
          <a class="footer-link" href="#">개인정보처리방침</a>
          <a class="footer-link" href="/faq" onclick="navigate('/faq');return false">광고문의</a>
        </div>
      </div>
    </div>
  </footer>`;
}

// ============================================================
// PROPERTY CARD
// ============================================================
function renderPropertyCard(p, rank) {
  const badges = [];
  if (p.ad_type === 'premium') badges.push('<span class="badge badge-premium-ad">★ 프리미엄</span>');
  if (p.is_hot) badges.push('<span class="badge badge-hot">HOT</span>');
  if (p.is_new) badges.push('<span class="badge badge-new">NEW</span>');
  if (p.is_featured) badges.push('<span class="badge badge-featured">추천</span>');
  if (p.status === 'upcoming') badges.push('<span class="badge badge-upcoming">분양예정</span>');
  
  const adClass = p.ad_type === 'premium' ? 'ad-premium' : p.ad_type === 'superior' ? 'ad-superior' : '';
  const rankBadge = rank ? `<div class="rank-badge">${rank}</div>` : '';
  
  return `
  <div class="property-card ${adClass}" onclick="navigate('/properties/${p.id}')">
    <div class="card-image" style="background:${getPropertyBgImage(p.property_type)}">
      ${rankBadge}
      <div class="card-badges">${badges.join('')}</div>
      <i class="fas fa-building placeholder-icon"></i>
    </div>
    <div class="card-body">
      <div class="card-tags">
        <span class="region-tag" style="background:${getRegionColor(p.region)}22;color:${getRegionColor(p.region)};border:1px solid ${getRegionColor(p.region)}44">
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
      <span><i class="fas fa-comment"></i> 상담 ${(p.inquiry_count||0).toLocaleString()}</span>
      <span>${timeAgo(p.created_at)}</span>
    </div>
  </div>`;
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderApp();
  
  // Intercept all internal link clicks
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (a && a.href && a.href.startsWith(location.origin) && !a.href.includes('#') && !a.target) {
      const href = new URL(a.href).pathname + new URL(a.href).search;
      if (!href.startsWith('/api/') && !href.startsWith('/static/')) {
        e.preventDefault();
        navigate(href);
      }
    }
  });
});
