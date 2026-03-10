// 분양라인 - 메인 앱 (Part 1: 상태관리, 유틸, 라우터)

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

// Load from localStorage
function loadState() {
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('auth_user');
  if (token && user) {
    state.token = token;
    state.user = JSON.parse(user);
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
  async request(method, path, data, requireToken = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    
    const options = { method, headers };
    if (data) options.body = JSON.stringify(data);
    
    const res = await fetch(`/api${path}`, options);
    const json = await res.json().catch(() => ({}));
    
    if (res.status === 401) { clearAuth(); renderApp(); }
    
    return { ok: res.ok, status: res.status, data: json };
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
    '서울': '#1d4ed8', '경기': '#065f46', '인천': '#0f766e',
    '부산': '#c2410c', '충청': '#6d28d9', '전라': '#92400e',
    '경상': '#991b1b', '강원': '#3730a3', '제주': '#9d174d',
  };
  return map[region] || '#374151';
}

function getPropertyBgImage(type) {
  const colors = {
    apartment: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    officetel: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    commercial: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    villa: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    land: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    other: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
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

// ============================================================
// ROUTER
// ============================================================
const routes = {
  '/': renderHomePage,
  '/properties': renderPropertiesPage,
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
  '/properties/new': renderPropertyFormPage,
};

function matchRoute(path) {
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

window.addEventListener('popstate', () => {
  state.currentPage = location.pathname;
  renderApp();
});

// ============================================================
// RENDER APP
// ============================================================
function renderApp() {
  const app = document.getElementById('app');
  const path = location.pathname;
  
  app.innerHTML = renderNavbar() + '<main id="main-content"></main>' + renderFooter();
  
  const route = matchRoute(path);
  const main = document.getElementById('main-content');
  
  if (route) {
    route.fn(main, route.params);
  } else {
    main.innerHTML = `<div class="container" style="padding:4rem 1rem;text-align:center">
      <div style="font-size:4rem;margin-bottom:1rem">😕</div>
      <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:0.5rem">페이지를 찾을 수 없습니다</h2>
      <p style="color:#6b7280;margin-bottom:1.5rem">요청하신 페이지가 존재하지 않습니다.</p>
      <button class="btn btn-primary" onclick="navigate('/')">홈으로 돌아가기</button>
    </div>`;
  }
  
  // Update active nav
  document.querySelectorAll('.nav-link[data-path]').forEach(el => {
    el.classList.toggle('active', el.dataset.path === path.split('/')[1] ? path.includes(el.dataset.path) || (el.dataset.path === '' && path === '/') : false);
  });
}

// ============================================================
// NAVBAR
// ============================================================
function renderNavbar() {
  const user = state.user;
  return `
  <nav class="navbar">
    <div class="container" style="display:flex;align-items:center;justify-content:space-between;padding-top:0.75rem;padding-bottom:0.75rem">
      <div style="display:flex;align-items:center;gap:2rem">
        <a class="navbar-brand" href="/" onclick="navigate('/');return false">분양<span>라인</span></a>
        <div style="display:flex;gap:0.25rem" class="hidden-mobile">
          <a class="nav-link" href="/properties" onclick="navigate('/properties');return false" data-path="properties">분양현장</a>
          <a class="nav-link" href="/jobs" onclick="navigate('/jobs');return false" data-path="jobs">구인게시판</a>
          <a class="nav-link" href="/news" onclick="navigate('/news');return false" data-path="news">뉴스/공지</a>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem">
        ${user ? `
          <span style="color:rgba(255,255,255,0.8);font-size:0.85rem">${escapeHtml(user.name)}님</span>
          ${user.user_type === 'admin' ? `<button class="nav-link" onclick="navigate('/admin')">관리자</button>` : ''}
          <button class="nav-link" onclick="navigate('/mypage')">마이페이지</button>
          <button class="nav-link" onclick="handleLogout()">로그아웃</button>
        ` : `
          <button class="nav-link" onclick="navigate('/login')">로그인</button>
          <button class="btn btn-sm" style="background:#fbbf24;color:#1e3a8a;font-weight:700" onclick="navigate('/register')">회원가입</button>
        `}
        <button id="mobile-toggle" style="display:none;background:none;border:none;color:white;font-size:1.25rem;cursor:pointer" onclick="toggleMobileMenu()">
          <i class="fas fa-bars"></i>
        </button>
      </div>
    </div>
    <div id="mobile-menu" class="mobile-menu">
      <div style="display:flex;flex-direction:column;gap:0.25rem">
        <a class="nav-link" href="/properties" onclick="navigate('/properties');toggleMobileMenu();return false">🏢 분양현장</a>
        <a class="nav-link" href="/jobs" onclick="navigate('/jobs');toggleMobileMenu();return false">💼 구인게시판</a>
        <a class="nav-link" href="/news" onclick="navigate('/news');toggleMobileMenu();return false">📰 뉴스/공지</a>
      </div>
    </div>
  </nav>
  <style>
    @media(max-width:768px){
      .hidden-mobile{display:none!important}
      #mobile-toggle{display:flex!important}
    }
  </style>`;
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
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2rem;margin-bottom:1.5rem">
        <div>
          <div class="footer-brand">분양<span>라인</span></div>
          <p style="font-size:0.85rem;line-height:1.7;margin-bottom:0.75rem">전국 분양 현장 정보와 구인 정보를<br>한곳에서 확인하세요.</p>
          <div style="font-size:0.8rem">📞 고객센터: 1588-0000</div>
          <div style="font-size:0.8rem">✉️ info@bunyang.com</div>
        </div>
        <div>
          <div style="font-weight:600;color:white;margin-bottom:0.75rem;font-size:0.9rem">빠른 메뉴</div>
          <div style="display:flex;flex-direction:column;gap:0.35rem">
            <a class="footer-link" href="/" onclick="navigate('/');return false">홈</a>
            <a class="footer-link" href="/properties" onclick="navigate('/properties');return false">분양현장 목록</a>
            <a class="footer-link" href="/jobs" onclick="navigate('/jobs');return false">구인게시판</a>
            <a class="footer-link" href="/news" onclick="navigate('/news');return false">뉴스/공지</a>
          </div>
        </div>
        <div>
          <div style="font-weight:600;color:white;margin-bottom:0.75rem;font-size:0.9rem">광고 상품</div>
          <div style="font-size:0.83rem;line-height:1.8;color:rgba(255,255,255,0.6)">
            <div>🥇 프리미엄 - 최상단 고정 노출</div>
            <div>🥈 슈페리어 - 상위 노출 보장</div>
            <div>🥉 베이직 - 일반 우선 노출</div>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem">
          <span>© 2025 분양라인. All rights reserved.</span>
          <div style="display:flex;gap:1rem">
            <a class="footer-link" href="#">이용약관</a>
            <a class="footer-link" href="#">개인정보처리방침</a>
            <a class="footer-link" href="#">광고문의</a>
          </div>
        </div>
      </div>
    </div>
  </footer>`;
}
