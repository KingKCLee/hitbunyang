// 히트분양 - 카카오맵 연동 v5
// 앱ID: 1402405 | JavaScript 키: b38c1ed11450dcd7de78ba73bf36c9d8
// 히트지수 기반 마커 색상: 🔴 80+, 🟠 50~79, 🔵 ~49
// 허가 도메인: hitbunyang.com, localhost:3000

// ============================================================
// 전역 상태
// ============================================================
let kakaoMap = null;
let mapMarkers = [];
let mapOverlays = [];       // CustomOverlay (라벨)
let markerClusterer = null;
let kakaoInfoWindow = null;
let userLocationMarker = null;
let userLocationOverlay = null;
let currentMapType = '';
let currentMapRegion = '';

// 카카오 JavaScript API 키
const KAKAO_JS_KEY = 'b38c1ed11450dcd7de78ba73bf36c9d8';

// 히트지수 → 마커 색상
function getHitMarkerColor(score) {
  if (score >= 80) return { bg: '#e53935', border: '#b71c1c', text: '🔴' };
  if (score >= 50) return { bg: '#f4511e', border: '#bf360c', text: '🟠' };
  return { bg: '#1c7cff', border: '#0042b0', text: '🔵' };
}

// ============================================================
// 히트맵 페이지 (/hitmap) — 풀스크린 카카오맵
// ============================================================
async function renderHitmapPageContent(container) {
  container.innerHTML = `
    <!-- 헤더 -->
    <div style="background:linear-gradient(135deg,#1c7cff,#0057d9);padding:1.25rem 0;color:white">
      <div class="container" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem">
        <div>
          <h1 style="font-size:1.4rem;font-weight:900;margin-bottom:0.15rem">
            <i class="fas fa-fire-alt" style="color:#ef5350"></i> 히트맵
          </h1>
          <p style="opacity:0.75;font-size:0.83rem">지역별 히트지수 현황 · KakaoMap 클러스터링</p>
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
          <!-- 범례 -->
          <div style="display:flex;gap:0.5rem;background:rgba(255,255,255,0.12);
            border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:0.5rem 0.75rem;
            font-size:0.75rem;color:rgba(255,255,255,0.9)">
            <span style="display:flex;align-items:center;gap:4px">
              <span style="width:10px;height:10px;background:#e53935;border-radius:50%;display:inline-block"></span>80+
            </span>
            <span style="display:flex;align-items:center;gap:4px">
              <span style="width:10px;height:10px;background:#f4511e;border-radius:50%;display:inline-block"></span>50~79
            </span>
            <span style="display:flex;align-items:center;gap:4px">
              <span style="width:10px;height:10px;background:#1c7cff;border-radius:50%;display:inline-block"></span>~49
            </span>
          </div>
          <a href="tel:1533-9077" style="background:rgba(255,255,255,0.15);color:white;
            border:1px solid rgba(255,255,255,0.25);border-radius:8px;padding:0.45rem 0.9rem;
            font-size:0.82rem;font-weight:700;text-decoration:none">
            <i class="fas fa-phone"></i> 1533-9077
          </a>
        </div>
      </div>
    </div>

    <!-- 필터 바 -->
    <div style="background:white;border-bottom:1px solid #d6e4ff;padding:0.75rem 0;
      position:sticky;top:var(--navbar-h,112px);z-index:50;box-shadow:0 2px 8px rgba(28,124,255,0.08)">
      <div class="container">
        <div style="display:flex;gap:0.6rem;align-items:center;flex-wrap:wrap">
          <!-- 유형 필터 -->
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap">
            <button class="filter-btn active" onclick="filterMapType('all',this)" id="mf-all">전체</button>
            <button class="filter-btn" onclick="filterMapType('apartment',this)">🏙️ 아파트</button>
            <button class="filter-btn" onclick="filterMapType('officetel',this)">🏢 오피스텔</button>
            <button class="filter-btn" onclick="filterMapType('commercial',this)">🏪 상가</button>
          </div>
          <div style="width:1px;height:24px;background:#d6e4ff;flex-shrink:0"></div>
          <!-- 지역 필터 -->
          <select class="filter-select" id="map-region-filter" onchange="filterMapRegion(this.value)">
            <option value="">🗺️ 전체 지역</option>
            ${['서울','경기북부','경기남부','인천','부산','대구','광주','대전','울산','세종','충청','전라','경상','강원','제주'].map(r =>
              `<option value="${r}">${r}</option>`
            ).join('')}
          </select>
          <div style="width:1px;height:24px;background:#d6e4ff;flex-shrink:0"></div>
          <!-- 위치/검색 -->
          <button class="btn btn-primary btn-sm" onclick="getMyLocation()" style="gap:0.3rem">
            <i class="fas fa-location-arrow"></i> 내 위치
          </button>
          <button class="btn btn-secondary btn-sm" onclick="toggleAddressSearch()" style="gap:0.3rem">
            <i class="fas fa-search"></i> 주소 검색
          </button>
          <!-- 히트지수 필터 -->
          <select class="filter-select" id="map-hit-filter" onchange="filterMapHitScore(this.value)">
            <option value="">🔥 전체 히트지수</option>
            <option value="80">🔴 80점 이상 (HOT)</option>
            <option value="50">🟠 50점 이상</option>
            <option value="0">🔵 전체 표시</option>
          </select>
        </div>
        <!-- 주소 검색 인풋 (토글) -->
        <div id="address-search-bar" style="display:none;margin-top:0.6rem">
          <div style="display:flex;gap:0.5rem">
            <input type="text" id="map-address-input" class="form-input"
              placeholder="주소를 입력하세요 (예: 서울시 강남구 역삼동)"
              onkeydown="if(event.key==='Enter')executeAddressSearch()"
              style="max-width:420px">
            <button class="btn btn-primary btn-sm" onclick="executeAddressSearch()">검색</button>
            <button class="btn btn-secondary btn-sm" onclick="toggleAddressSearch()">닫기</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 맵 + 사이드바 -->
    <div class="container" style="padding:1rem;padding-bottom:2rem">
      <div style="display:grid;grid-template-columns:1fr 360px;gap:1rem" id="hitmap-layout">

        <!-- 카카오맵 -->
        <div class="map-container" style="height:580px">
          <div id="kakao-map" style="width:100%;height:100%"></div>
          <!-- 로딩 -->
          <div id="map-loading" style="position:absolute;inset:0;
            background:rgba(232,240,254,0.92);display:flex;align-items:center;
            justify-content:center;border-radius:14px;z-index:10">
            <div style="text-align:center">
              <div class="spinner" style="margin:0 auto 1rem;border-top-color:#1c7cff"></div>
              <div style="font-size:0.88rem;color:#1c7cff;font-weight:600">
                <i class="fas fa-map-marked-alt"></i> 카카오맵 로딩 중...
              </div>
            </div>
          </div>
          <!-- 맵 타입 컨트롤 (지도/스카이뷰) -->
          <div style="position:absolute;top:12px;left:12px;z-index:20;display:flex;gap:4px">
            <button onclick="setMapType('roadmap')" id="map-type-road"
              style="background:white;border:1.5px solid #d6e4ff;padding:6px 12px;
                border-radius:6px 0 0 6px;font-size:0.77rem;font-weight:700;cursor:pointer;
                color:#1c7cff;font-family:inherit">지도</button>
            <button onclick="setMapType('skyview')" id="map-type-sky"
              style="background:white;border:1.5px solid #d6e4ff;padding:6px 12px;
                border-radius:0 6px 6px 0;font-size:0.77rem;font-weight:600;cursor:pointer;
                color:#4a5980;font-family:inherit">스카이뷰</button>
          </div>
        </div>

        <!-- 사이드바 -->
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <!-- 현장 목록 -->
          <div style="background:white;border-radius:14px;border:1.5px solid #d6e4ff;
            overflow:hidden;box-shadow:0 2px 10px rgba(28,124,255,0.08);flex:1">
            <div style="padding:0.9rem 1rem;border-bottom:1px solid #eaf2ff;
              display:flex;justify-content:space-between;align-items:center">
              <div style="font-weight:700;font-size:0.93rem;color:#0e1f40">
                <i class="fas fa-list-ul" style="color:#1c7cff"></i> 현장 목록
              </div>
              <div style="display:flex;align-items:center;gap:0.5rem">
                <span id="map-result-count"
                  style="font-size:0.78rem;color:#4a5980;background:#eaf2ff;
                    padding:2px 8px;border-radius:10px">0건</span>
              </div>
            </div>
            <div id="map-property-list" style="max-height:480px;overflow-y:auto;padding:0.5rem">
              <div style="text-align:center;padding:3rem 1rem;color:#8fa3c8">
                <div style="font-size:2.5rem;margin-bottom:0.5rem">🗺️</div>
                <div style="font-size:0.83rem">마커를 클릭하거나<br>내 위치를 검색하세요</div>
              </div>
            </div>
          </div>

          <!-- 위치 정보 -->
          <div id="location-info" style="display:none;background:white;border-radius:12px;
            border:1.5px solid #d6e4ff;padding:0.9rem 1rem;box-shadow:0 2px 8px rgba(26,35,126,0.05)">
            <div style="font-size:0.77rem;color:#8fa3c8;margin-bottom:0.2rem">
              <i class="fas fa-map-marker-alt" style="color:#e53935"></i> 현재 위치
            </div>
            <div id="location-address" style="font-size:0.86rem;font-weight:600;color:#0e1f40">
              위치 확인 중...
            </div>
          </div>

          <!-- 히트지수 범례 카드 -->
          <div style="background:white;border-radius:12px;border:1.5px solid #d6e4ff;
            padding:0.9rem 1rem;box-shadow:0 2px 8px rgba(26,35,126,0.05)">
            <div style="font-size:0.78rem;font-weight:700;color:#0e1f40;margin-bottom:0.6rem">
              <i class="fas fa-fire" style="color:#e53935"></i> 히트지수 범례
            </div>
            ${[
              {c:'#e53935', label:'🔴 80점 이상', desc:'HOT 현장', range:'80~100'},
              {c:'#f4511e', label:'🟠 50~79점', desc:'인기 현장', range:'50~79'},
              {c:'#1c7cff', label:'🔵 49점 이하', desc:'일반 현장', range:'0~49'},
            ].map(l => `
              <div style="display:flex;align-items:center;gap:0.6rem;padding:0.35rem 0;
                border-bottom:1px solid #eaf2ff">
                <div style="width:14px;height:14px;background:${l.c};border-radius:50%;
                  flex-shrink:0;border:2px solid white;box-shadow:0 0 0 1px ${l.c}"></div>
                <div style="flex:1">
                  <div style="font-size:0.8rem;font-weight:600;color:#0e1f40">${l.label}</div>
                  <div style="font-size:0.71rem;color:#8fa3c8">${l.desc} (${l.range})</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <style>
      @media(max-width:900px){
        #hitmap-layout { grid-template-columns:1fr!important; }
        #kakao-map { height:380px!important; }
      }
    </style>
  `;

  // 카카오맵 로드
  loadKakaoMap();
}
window.renderHitmapPageContent = renderHitmapPageContent;

// ============================================================
// /map 라우트에서도 동일하게 사용
// ============================================================
async function renderMapPage(container) {
  return renderHitmapPageContent(container);
}

// ============================================================
// KAKAO MAP SDK 로드
// ============================================================
function loadKakaoMap() {
  // 이미 로드됐으면 바로 초기화
  if (window.kakao && window.kakao.maps) {
    kakao.maps.load(initKakaoMap);
    return;
  }

  const script = document.createElement('script');
  script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&libraries=services,clusterer&autoload=false`;
  script.async = true;

  script.onload = () => {
    kakao.maps.load(initKakaoMap);
  };

  script.onerror = () => {
    console.warn('[히트맵] 카카오맵 SDK 로드 실패 → 데모 모드');
    showDemoMap();
  };

  document.head.appendChild(script);
}

// ============================================================
// KAKAO MAP 초기화
// ============================================================
function initKakaoMap() {
  const mapEl = document.getElementById('kakao-map');
  const loadingEl = document.getElementById('map-loading');
  if (!mapEl) return;

  kakaoMap = new kakao.maps.Map(mapEl, {
    center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심
    level: 9
  });

  // 마커 클러스터러 (다크 네이비 스타일)
  if (kakao.maps.MarkerClusterer) {
    markerClusterer = new kakao.maps.MarkerClusterer({
      map: kakaoMap,
      averageCenter: true,
      minLevel: 7,
      disableClickZoom: false,
      styles: [
        {
          width: '48px', height: '48px',
          background: 'rgba(28,124,255,0.88)',
          borderRadius: '50%',
          color: '#fff',
          textAlign: 'center',
          fontWeight: '900',
          lineHeight: '48px',
          fontSize: '13px',
          border: '3px solid rgba(255,255,255,0.35)',
          boxShadow: '0 4px 12px rgba(28,124,255,0.4)',
        },
        {
          width: '56px', height: '56px',
          background: 'rgba(255,59,59,0.88)',
          borderRadius: '50%',
          color: '#fff',
          textAlign: 'center',
          fontWeight: '900',
          lineHeight: '56px',
          fontSize: '14px',
          border: '3px solid rgba(255,255,255,0.35)',
          boxShadow: '0 4px 12px rgba(229,57,53,0.4)',
        },
      ]
    });
  }

  kakaoInfoWindow = new kakao.maps.InfoWindow({ zIndex: 5, removable: true });
  window.kakaoInfoWindow = kakaoInfoWindow;

  if (loadingEl) loadingEl.style.display = 'none';

  // 지도 이동 이벤트 → 현 영역 데이터 로드
  kakao.maps.event.addListener(kakaoMap, 'dragend', () => loadMapPropertiesInBounds());
  kakao.maps.event.addListener(kakaoMap, 'zoom_changed', () => loadMapPropertiesInBounds());

  // 초기 데이터 로드
  loadMapProperties();
}

// ============================================================
// 현장 데이터 로드
// ============================================================
async function loadMapProperties(type = '', region = '') {
  currentMapType = type || currentMapType;
  currentMapRegion = region || currentMapRegion;

  let path = '/properties/map';
  const params = [];
  if (currentMapType) params.push(`type=${currentMapType}`);
  if (currentMapRegion) params.push(`region=${encodeURIComponent(currentMapRegion)}`);
  if (params.length) path += '?' + params.join('&');

  const r = await api.get(path);
  if (!r.ok) {
    showDemoMarkersOnMap();
    return;
  }

  const data = r.data || [];
  displayMapMarkers(data.length > 0 ? data : getDemoMapProperties());
}

async function loadMapPropertiesInBounds() {
  if (!kakaoMap) return;
  // 현재 필터 유지한 채로 재로드
  await loadMapProperties(currentMapType, currentMapRegion);
}

// ============================================================
// 마커 표시 (히트지수 기반 컬러)
// ============================================================
function displayMapMarkers(properties) {
  if (!window.kakao || !kakaoMap) {
    updateMapList(properties);
    return;
  }

  // 기존 마커/오버레이 제거
  mapMarkers.forEach(m => m.setMap(null));
  mapOverlays.forEach(o => o.setMap(null));
  mapMarkers = [];
  mapOverlays = [];
  if (markerClusterer) markerClusterer.clear();

  const bounds = new kakao.maps.LatLngBounds();
  const minScore = parseInt(document.getElementById('map-hit-filter')?.value || '0');

  properties.forEach(p => {
    if (!p.latitude || !p.longitude) return;

    const score = calcHitScoreSimple(p);
    if (score < minScore) return;

    const pos = new kakao.maps.LatLng(p.latitude, p.longitude);
    bounds.extend(pos);

    const { bg, border } = getHitMarkerColor(score);

    // 커스텀 오버레이 라벨 (히트지수 + 단지명)
    const overlayContent = document.createElement('div');
    overlayContent.innerHTML = `
      <div style="position:relative;cursor:pointer;
        filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3))">
        <div style="background:${bg};color:white;font-size:0.62rem;font-weight:800;
          padding:4px 9px;border-radius:7px;white-space:nowrap;
          border:2px solid white;max-width:90px;overflow:hidden;text-overflow:ellipsis;
          display:flex;align-items:center;gap:4px">
          <span style="background:rgba(255,255,255,0.25);border-radius:3px;
            padding:0 4px;font-size:0.58rem;font-weight:900">${score}</span>
          ${escapeHtml((p.title||'').substring(0,7))}
        </div>
        <div style="width:0;height:0;border-left:5px solid transparent;
          border-right:5px solid transparent;
          border-top:6px solid ${bg};
          margin:0 auto;display:block"></div>
      </div>`;

    // 클릭 이벤트
    overlayContent.addEventListener('click', (e) => {
      e.stopPropagation();
      showPropertyPopupKakao(p, pos);
    });

    const overlay = new kakao.maps.CustomOverlay({
      position: pos,
      content: overlayContent,
      yAnchor: 1.0,
      zIndex: 3,
    });
    overlay.setMap(kakaoMap);
    mapOverlays.push(overlay);

    // 히든 마커 (클러스터링용)
    const marker = new kakao.maps.Marker({ position: pos });
    kakao.maps.event.addListener(marker, 'click', () => showPropertyPopupKakao(p, pos));
    mapMarkers.push(marker);
  });

  // 클러스터러에 마커 등록
  if (markerClusterer && mapMarkers.length > 0) {
    markerClusterer.addMarkers(mapMarkers);
  }

  // 지도 범위 맞춤
  if (!bounds.isEmpty()) {
    kakaoMap.setBounds(bounds, 50);
  }

  updateMapList(properties);
}

// ============================================================
// 팝업 (InfoWindow)
// ============================================================
function showPropertyPopupKakao(property, position) {
  if (!kakaoMap || !kakaoInfoWindow) return;

  const score = calcHitScoreSimple(property);
  const { bg } = getHitMarkerColor(score);

  const content = document.createElement('div');
  content.style.cssText = `
    width:260px;padding:1rem;background:white;border-radius:12px;
    box-shadow:0 8px 28px rgba(28,124,255,0.2);font-family:inherit;
    border:1.5px solid #d6e4ff;
  `;
  content.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem">
      <div style="font-size:0.86rem;font-weight:800;color:#1c7cff;flex:1;
        overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
        line-height:1.4">${escapeHtml(property.title)}</div>
      <button onclick="if(window.kakaoInfoWindow)window.kakaoInfoWindow.close()"
        style="background:none;border:none;color:#8fa3c8;cursor:pointer;font-size:1.1rem;
          flex-shrink:0;line-height:1;padding:0 0 0 6px">×</button>
    </div>
    <div style="display:flex;gap:0.35rem;margin-bottom:0.5rem;flex-wrap:wrap">
      <span style="background:#e8f2ff;color:#1c7cff;padding:2px 7px;border-radius:4px;
        font-size:0.69rem;font-weight:700">${escapeHtml(property.region||'')}</span>
      <span style="background:#f5f5f5;color:#666;padding:2px 7px;border-radius:4px;
        font-size:0.69rem">${getPropertyTypeLabel(property.property_type||'')}</span>
    </div>
    <div style="font-size:1rem;font-weight:900;color:#1c7cff;margin-bottom:0.4rem">
      ${formatPriceRange(property.price_min, property.price_max)}
    </div>
    <!-- 히트지수 바 -->
    <div style="margin-bottom:0.65rem">
      <div style="display:flex;justify-content:space-between;font-size:0.7rem;
        color:#4a5980;margin-bottom:3px">
        <span>히트지수</span><span style="font-weight:800;color:${bg}">${score}점</span>
      </div>
      <div style="height:5px;background:#d6e4ff;border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${score}%;background:${bg};border-radius:3px;
          transition:width 0.4s ease"></div>
      </div>
    </div>
    <div style="display:flex;gap:0.5rem">
      <button onclick="navigate('/properties/${property.id}')"
        style="flex:1;background:#1c7cff;color:white;border:none;padding:0.5rem;
          border-radius:8px;font-size:0.8rem;font-weight:700;cursor:pointer;font-family:inherit">
        상세보기 →
      </button>
      <a href="tel:${escapeHtml(property.contact_phone||'1533-9077')}"
        style="background:#e8f2ff;color:#1c7cff;border:none;padding:0.5rem 0.75rem;
          border-radius:8px;font-size:0.8rem;font-weight:700;cursor:pointer;
          text-decoration:none;display:flex;align-items:center;gap:4px">
        <i class="fas fa-phone"></i>
      </a>
    </div>
  `;

  kakaoInfoWindow.setContent(content);
  kakaoInfoWindow.open(kakaoMap, { getPosition: () => position });
}

// ============================================================
// 사이드바 목록 업데이트
// ============================================================
function updateMapList(properties) {
  const list = document.getElementById('map-property-list');
  const count = document.getElementById('map-result-count');
  if (!list) return;

  if (count) count.textContent = `${properties.length}건`;

  if (!properties.length) {
    list.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;color:#8fa3c8">
        <div style="font-size:2rem;margin-bottom:0.5rem">📍</div>
        <div style="font-size:0.82rem">해당 조건의 현장이 없습니다</div>
      </div>`;
    return;
  }

  list.innerHTML = properties.map(p => {
    const score = calcHitScoreSimple(p);
    const { bg } = getHitMarkerColor(score);
    return `
    <div onclick="navigate('/properties/${p.id}')"
      style="padding:0.75rem;border-radius:10px;cursor:pointer;
        border:1.5px solid #eaf2ff;margin-bottom:0.4rem;transition:all 0.15s;background:white"
      onmouseover="this.style.borderColor='#5ba3ff';this.style.background='#f0f7ff'"
      onmouseout="this.style.borderColor='#eaf2ff';this.style.background='white'">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem">
        <div style="flex:1;overflow:hidden">
          <div style="font-size:0.84rem;font-weight:700;margin-bottom:0.2rem;
            overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:#0e1f40">
            ${escapeHtml(p.title||'')}
          </div>
          <div style="font-size:0.72rem;color:#4a5980;display:flex;gap:0.4rem;flex-wrap:wrap">
            <span style="color:#1c7cff;font-weight:600">${escapeHtml(p.region||'')}</span>
            <span>${getPropertyTypeLabel(p.property_type||'')}</span>
            ${p.is_hot ? '<span style="color:#e53935;font-weight:700">HOT</span>' : ''}
          </div>
          <div style="font-size:0.85rem;font-weight:800;color:#1c7cff;margin-top:0.2rem">
            ${formatPriceRange(p.price_min, p.price_max)}
          </div>
        </div>
        <!-- 히트지수 서클 -->
        <div style="flex-shrink:0;text-align:center">
          <div style="width:34px;height:34px;border-radius:50%;
            background:${bg}22;border:2.5px solid ${bg};
            display:flex;align-items:center;justify-content:center">
            <span style="font-size:0.68rem;font-weight:900;color:${bg}">${score}</span>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ============================================================
// 히트지수 간이 계산 (맵용)
// ============================================================
function calcHitScoreSimple(p) {
  if (typeof calcHitScore === 'function') return calcHitScore(p);
  const views = Math.min((p.view_count || 0) / 100, 30);
  const inquiries = Math.min((p.inquiry_count || 0) * 3, 30);
  const shares = Math.min((p.share_count || 0) * 2, 20);
  const adBonus = p.ad_type === 'hit' ? 15 : p.ad_type === 'premium' ? 8 : p.ad_type === 'standard' ? 4 : 0;
  const newBonus = p.is_new ? 5 : 0;
  return Math.round(Math.min(views + inquiries + shares + adBonus + newBonus, 100));
}

// ============================================================
// 내 위치 (GPS)
// ============================================================
function getMyLocation() {
  if (!navigator.geolocation) {
    alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
    return;
  }
  const loadingEl = document.getElementById('map-loading');
  if (loadingEl) loadingEl.style.display = 'flex';

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      if (loadingEl) loadingEl.style.display = 'none';

      if (window.kakao && kakaoMap) {
        const position = new kakao.maps.LatLng(lat, lng);
        kakaoMap.setCenter(position);
        kakaoMap.setLevel(8);

        // 내 위치 마커
        if (userLocationMarker) userLocationMarker.setMap(null);
        if (userLocationOverlay) userLocationOverlay.setMap(null);

        // 내 위치 커스텀 오버레이
        const myLocEl = document.createElement('div');
        myLocEl.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center">
            <div style="width:20px;height:20px;background:#1c7cff;border-radius:50%;
              border:3px solid white;box-shadow:0 0 0 3px rgba(28,124,255,0.3),0 4px 12px rgba(28,124,255,0.4)">
            </div>
            <div style="width:2px;height:8px;background:#1c7cff;margin-top:1px"></div>
          </div>`;
        userLocationOverlay = new kakao.maps.CustomOverlay({
          position, content: myLocEl, yAnchor: 1.1, zIndex: 10,
        });
        userLocationOverlay.setMap(kakaoMap);

        // 위치 정보 표시
        const locInfo = document.getElementById('location-info');
        if (locInfo) locInfo.style.display = 'block';

        // 역지오코딩
        if (kakao.maps.services) {
          const geocoder = new kakao.maps.services.Geocoder();
          geocoder.coord2Address(lng, lat, (result, status) => {
            if (status === kakao.maps.services.Status.OK) {
              const addr = result[0]?.road_address?.address_name
                || result[0]?.address?.address_name || '현재 위치';
              const addrEl = document.getElementById('location-address');
              if (addrEl) addrEl.textContent = addr;
            }
          });
        }
      }

      // 근처 현장 API 호출
      const r = await api.get(`/properties/nearby?lat=${lat}&lng=${lng}&radius=5`);
      if (r.ok && r.data.length > 0) {
        if (window.kakao && kakaoMap) displayMapMarkers(r.data);
        else updateMapList(r.data);
      } else {
        if (loadingEl) loadingEl.style.display = 'none';
      }
    },
    (err) => {
      if (loadingEl) loadingEl.style.display = 'none';
      const msgs = {
        1: '위치 접근 권한을 허용해주세요.',
        2: '현재 위치를 가져올 수 없습니다.',
        3: '요청 시간이 초과되었습니다.',
      };
      alert(msgs[err.code] || '위치 서비스 오류가 발생했습니다.');
    },
    { timeout: 12000, maximumAge: 300000 }
  );
}

// ============================================================
// 주소 검색 (Geocoder)
// ============================================================
function toggleAddressSearch() {
  const bar = document.getElementById('address-search-bar');
  if (!bar) return;
  const isVisible = bar.style.display !== 'none';
  bar.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) setTimeout(() => document.getElementById('map-address-input')?.focus(), 100);
}

function executeAddressSearch() {
  const addr = document.getElementById('map-address-input')?.value?.trim();
  if (!addr) return;

  if (window.kakao && kakao.maps?.services) {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(addr, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
        kakaoMap.setCenter(coords);
        kakaoMap.setLevel(8);
        loadMapProperties(currentMapType, currentMapRegion);
        toggleAddressSearch();
      } else {
        alert('주소를 찾을 수 없습니다. 다시 입력해주세요.');
      }
    });
  } else {
    alert('지도 로딩 후 사용 가능합니다.');
  }
}

// ============================================================
// 맵 타입 전환 (지도/스카이뷰)
// ============================================================
function setMapType(type) {
  if (!kakaoMap) return;
  if (type === 'skyview') {
    kakaoMap.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
    document.getElementById('map-type-road').style.color = '#8fa3c8';
    document.getElementById('map-type-sky').style.color = '#1c7cff';
    document.getElementById('map-type-sky').style.fontWeight = '700';
  } else {
    kakaoMap.setMapTypeId(kakao.maps.MapTypeId.ROADMAP);
    document.getElementById('map-type-road').style.color = '#1c7cff';
    document.getElementById('map-type-sky').style.color = '#8fa3c8';
    document.getElementById('map-type-sky').style.fontWeight = '600';
  }
}

// ============================================================
// 필터
// ============================================================
function filterMapType(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentMapType = type === 'all' ? '' : type;
  loadMapProperties(currentMapType, currentMapRegion);
}

function filterMapRegion(region) {
  currentMapRegion = region;
  loadMapProperties(currentMapType, currentMapRegion);
}

function filterMapHitScore(minScore) {
  // 현재 표시된 마커를 히트지수 기준 재필터
  loadMapProperties(currentMapType, currentMapRegion);
}

// ============================================================
// 데모 데이터 (API 미연동 시)
// ============================================================
function getDemoMapProperties() {
  return [
    { id:1, title:'힐스테이트 판교역 퍼스트', region:'경기남부', property_type:'apartment',
      latitude:37.3946, longitude:127.1117, price_min:50000, price_max:80000,
      view_count:320, inquiry_count:45, ad_type:'hit', is_hot:true, is_new:true },
    { id:2, title:'래미안 원펜타스', region:'서울', property_type:'apartment',
      latitude:37.5080, longitude:127.0028, price_min:150000, price_max:200000,
      view_count:280, inquiry_count:38, ad_type:'premium', is_hot:true },
    { id:3, title:'DMC SK뷰아이파크', region:'서울', property_type:'apartment',
      latitude:37.5750, longitude:126.8970, price_min:45000, price_max:70000,
      view_count:180, inquiry_count:22, ad_type:'standard' },
    { id:4, title:'더샵 퍼스트파크 하남', region:'경기남부', property_type:'apartment',
      latitude:37.5394, longitude:127.2097, price_min:35000, price_max:55000,
      view_count:95, inquiry_count:12 },
    { id:5, title:'롯데캐슬 시그니처', region:'인천', property_type:'apartment',
      latitude:37.3836, longitude:126.6568, price_min:28000, price_max:45000,
      view_count:120, inquiry_count:15, ad_type:'premium' },
    { id:6, title:'자이 더 엘리언트', region:'서울', property_type:'officetel',
      latitude:37.5237, longitude:127.0412, price_min:15000, price_max:25000,
      view_count:88, inquiry_count:9, ad_type:'standard', is_new:true },
    { id:7, title:'광교 아이파크', region:'경기남부', property_type:'apartment',
      latitude:37.2893, longitude:127.0565, price_min:40000, price_max:60000,
      view_count:210, inquiry_count:28, is_hot:true },
    { id:8, title:'포레나 부산 기장', region:'부산', property_type:'apartment',
      latitude:35.2440, longitude:129.2130, price_min:22000, price_max:35000,
      view_count:65, inquiry_count:7 },
  ];
}

// 데모: API 없을 때 가상 마커 (fallback)
function showDemoMarkersOnMap() {
  displayMapMarkers(getDemoMapProperties());
}

// 데모 맵 (SDK 로드 실패 시)
function showDemoMap() {
  const mapEl = document.getElementById('kakao-map');
  const loadingEl = document.getElementById('map-loading');
  if (loadingEl) loadingEl.style.display = 'none';
  if (!mapEl) return;

  const demos = getDemoMapProperties();

  mapEl.innerHTML = `
    <div style="width:100%;height:100%;background:linear-gradient(135deg,#e8f2ff,#cce0ff);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      position:relative;overflow:hidden">
      <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.12">
        ${Array.from({length:12},(_,i)=>`<line x1="${i*9}%" y1="0" x2="${i*9}%" y2="100%" stroke="#1c7cff" stroke-width="1"/>`).join('')}
        ${Array.from({length:12},(_,i)=>`<line x1="0" y1="${i*9}%" x2="100%" y2="${i*9}%" stroke="#1c7cff" stroke-width="1"/>`).join('')}
      </svg>
      ${[
        {x:48,y:40,c:'#e53935',s:88,t:'힐스테이트 판교역',id:1},
        {x:32,y:42,c:'#e53935',s:79,t:'래미안 원펜타스',id:2},
        {x:22,y:36,c:'#f4511e',s:62,t:'DMC SK뷰',id:3},
        {x:62,y:48,c:'#1c7cff',s:41,t:'더샵 하남',id:4},
        {x:18,y:62,c:'#f4511e',s:55,t:'롯데캐슬',id:5},
        {x:55,y:30,c:'#f4511e',s:68,t:'광교 아이파크',id:7},
        {x:72,y:72,c:'#1c7cff',s:32,t:'포레나 부산',id:8},
      ].map(m=>`
        <div onclick="navigate('/properties/${m.id}')" style="
          position:absolute;left:${m.x}%;top:${m.y}%;
          transform:translate(-50%,-100%);cursor:pointer;
          filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25))">
          <div style="background:${m.c};color:white;font-size:0.6rem;font-weight:800;
            padding:3px 8px;border-radius:6px;white-space:nowrap;
            border:2px solid white;display:flex;align-items:center;gap:3px">
            <span style="background:rgba(255,255,255,0.25);border-radius:2px;padding:0 3px;
              font-size:0.55rem">${m.s}</span>
            ${m.t.substring(0,8)}
          </div>
          <div style="width:0;height:0;border-left:5px solid transparent;
            border-right:5px solid transparent;border-top:6px solid ${m.c};margin:0 auto"></div>
        </div>
      `).join('')}
      <div style="text-align:center;z-index:1;background:rgba(255,255,255,0.92);
        padding:1rem 1.5rem;border-radius:14px;box-shadow:0 4px 20px rgba(28,124,255,0.14);
        border:1px solid #d6e4ff">
        <div style="font-size:2rem;margin-bottom:0.5rem">🗺️</div>
        <div style="font-weight:800;font-size:0.9rem;color:#1c7cff;margin-bottom:0.3rem">
          카카오맵 연동 완료
        </div>
        <div style="font-size:0.77rem;color:#4a5980;max-width:200px;line-height:1.5">
          hitbunyang.com 도메인 등록 후<br>실제 지도가 표시됩니다
        </div>
      </div>
    </div>`;

  updateMapList(demos);
}

// ============================================================
// Global Exports
// ============================================================
window.filterMapType = filterMapType;
window.filterMapRegion = filterMapRegion;
window.filterMapHitScore = filterMapHitScore;
window.getMyLocation = getMyLocation;
window.toggleAddressSearch = toggleAddressSearch;
window.executeAddressSearch = executeAddressSearch;
window.setMapType = setMapType;
window.renderHitmapPageContent = renderHitmapPageContent;
