// 분양라인 - 지도현장 페이지 (카카오맵 연동)

let kakaoMap = null;
let mapMarkers = [];
let markerClusterer = null;
let infoWindow = null;
let userLocationMarker = null;

// ============================================================
// MAP PAGE
// ============================================================
async function renderMapPage(container) {
  container.innerHTML = `
    <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:1.5rem 0;color:white;margin-bottom:1.5rem">
      <div class="container">
        <h1 style="font-size:1.5rem;font-weight:900;margin-bottom:0.25rem"><i class="fas fa-map"></i> 지도현장</h1>
        <p style="opacity:0.8;font-size:0.88rem">지도에서 내 주변 분양 현장을 확인하세요</p>
      </div>
    </div>
    <div class="container" style="padding-bottom:2rem">
      <!-- Filters -->
      <div class="filter-bar" style="margin-bottom:1rem">
        <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap">
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
            <button class="filter-btn active" onclick="filterMapType('all',this)">전체</button>
            <button class="filter-btn" onclick="filterMapType('apartment',this)">아파트</button>
            <button class="filter-btn" onclick="filterMapType('officetel',this)">오피스텔</button>
            <button class="filter-btn" onclick="filterMapType('commercial',this)">상가</button>
          </div>
          <select class="filter-select" id="map-region-filter" onchange="filterMapRegion(this.value)">
            <option value="">전체 지역</option>
            ${['서울','경기','인천','부산','대구','광주','대전','울산','세종','충청','전라','경상','강원','제주'].map(r =>
              `<option value="${r}">${r}</option>`
            ).join('')}
          </select>
          <button class="btn btn-primary btn-sm" onclick="getMyLocation()">
            <i class="fas fa-location-arrow"></i> 내 위치
          </button>
          <button class="btn btn-secondary btn-sm" onclick="searchByAddress()">
            <i class="fas fa-search"></i> 주소 검색
          </button>
        </div>
      </div>
      
      <!-- Address search bar -->
      <div id="address-search-bar" style="display:none;margin-bottom:1rem">
        <div style="display:flex;gap:0.5rem">
          <input type="text" id="map-address-input" class="form-input" placeholder="주소를 입력하세요 (예: 서울시 강남구 역삼동)"
            onkeydown="if(event.key==='Enter')executeAddressSearch()">
          <button class="btn btn-primary" onclick="executeAddressSearch()">검색</button>
          <button class="btn btn-secondary" onclick="document.getElementById('address-search-bar').style.display='none'">취소</button>
        </div>
      </div>

      <!-- Map + Sidebar -->
      <div style="display:grid;grid-template-columns:1fr 340px;gap:1rem" id="map-layout">
        <!-- Map -->
        <div class="map-container">
          <div id="kakao-map"></div>
          <div id="map-loading" style="position:absolute;inset:0;background:rgba(241,245,249,0.9);
            display:flex;align-items:center;justify-content:center;border-radius:14px;z-index:5">
            <div style="text-align:center">
              <div class="spinner" style="margin:0 auto 1rem"></div>
              <div style="font-size:0.9rem;color:#6b7280">지도를 불러오는 중...</div>
            </div>
          </div>
        </div>
        
        <!-- Sidebar: nearby list -->
        <div>
          <div style="background:white;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07)">
            <div style="padding:1rem;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;align-items:center">
              <div style="font-weight:700;font-size:0.95rem"><i class="fas fa-list"></i> 현장 목록</div>
              <span id="map-result-count" style="font-size:0.8rem;color:#6b7280">0건</span>
            </div>
            <div id="map-property-list" style="max-height:460px;overflow-y:auto;padding:0.5rem">
              <div class="empty-state" style="padding:2rem">
                <div class="empty-state-icon">🗺️</div>
                <div style="font-size:0.85rem">지도에서 마커를 클릭하거나<br>내 위치를 검색하세요</div>
              </div>
            </div>
          </div>
          
          <!-- Location info -->
          <div id="location-info" style="display:none;background:white;border-radius:12px;border:1px solid #e5e7eb;padding:1rem;margin-top:0.75rem">
            <div style="font-size:0.82rem;color:#6b7280;margin-bottom:0.25rem">📍 현재 위치</div>
            <div id="location-address" style="font-size:0.88rem;font-weight:600">위치 확인 중...</div>
          </div>
        </div>
      </div>
      
      <style>
        @media(max-width:768px){
          #map-layout{grid-template-columns:1fr!important}
          #kakao-map{height:350px!important}
        }
      </style>
    </div>
  `;
  
  loadKakaoMap();
}

// ============================================================
// KAKAO MAP
// ============================================================
function loadKakaoMap() {
  // Check if Kakao SDK is already loaded
  if (window.kakao && window.kakao.maps) {
    initKakaoMap();
    return;
  }
  
  // Load Kakao Map SDK (demo mode - without API key, shows placeholder)
  // In production, replace APP_KEY with actual Kakao Map API key
  const KAKAO_APP_KEY = 'YOUR_KAKAO_APP_KEY';
  
  if (KAKAO_APP_KEY === 'YOUR_KAKAO_APP_KEY') {
    // Demo mode: show placeholder map with simulated markers
    showDemoMap();
    return;
  }
  
  const script = document.createElement('script');
  script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services,clusterer&autoload=false`;
  script.onload = () => {
    kakao.maps.load(initKakaoMap);
  };
  script.onerror = () => {
    showDemoMap();
  };
  document.head.appendChild(script);
}

function initKakaoMap() {
  const mapEl = document.getElementById('kakao-map');
  const loadingEl = document.getElementById('map-loading');
  if (!mapEl) return;
  
  const options = {
    center: new kakao.maps.LatLng(37.5665, 126.9780), // Seoul
    level: 10
  };
  
  kakaoMap = new kakao.maps.Map(mapEl, options);
  
  // Marker clusterer
  if (kakao.maps.MarkerClusterer) {
    markerClusterer = new kakao.maps.MarkerClusterer({
      map: kakaoMap,
      averageCenter: true,
      minLevel: 8,
      styles: [{
        width: '50px', height: '50px',
        background: 'rgba(30,64,175,0.85)',
        borderRadius: '50%',
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
        lineHeight: '50px',
        fontSize: '14px',
      }]
    });
  }
  
  infoWindow = new kakao.maps.InfoWindow({ zIndex: 1 });
  
  if (loadingEl) loadingEl.style.display = 'none';
  
  // Load all properties with coordinates
  loadMapProperties();
}

async function loadMapProperties(type = '', region = '') {
  let path = '/properties/map';
  const params = [];
  if (type) params.push(`type=${type}`);
  if (region) params.push(`region=${encodeURIComponent(region)}`);
  if (params.length) path += '?' + params.join('&');
  
  const r = await api.get(path);
  if (!r.ok) return;
  
  displayMapMarkers(r.data || []);
}

function displayMapMarkers(properties) {
  if (!window.kakao || !kakaoMap) return;
  
  // Clear existing markers
  mapMarkers.forEach(m => m.setMap(null));
  mapMarkers = [];
  if (markerClusterer) markerClusterer.clear();
  
  const bounds = new kakao.maps.LatLngBounds();
  
  properties.forEach(p => {
    if (!p.latitude || !p.longitude) return;
    
    const position = new kakao.maps.LatLng(p.latitude, p.longitude);
    bounds.extend(position);
    
    // Custom marker image
    const markerColor = p.ad_type === 'premium' ? '#f59e0b' : p.is_hot ? '#ef4444' : '#1e40af';
    const markerContent = `
      <div style="
        background:${markerColor};color:white;font-size:0.65rem;font-weight:800;
        padding:4px 8px;border-radius:6px;white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;
        border:2px solid white;max-width:80px;overflow:hidden;text-overflow:ellipsis
      ">${escapeHtml(p.title.substring(0,8))}...</div>
    `;
    
    const customOverlay = new kakao.maps.CustomOverlay({
      position,
      content: markerContent,
      yAnchor: 1.2
    });
    
    customOverlay.setMap(kakaoMap);
    
    // Click event - show popup
    const marker = new kakao.maps.Marker({ position });
    kakao.maps.event.addListener(marker, 'click', () => showPropertyPopup(p, position));
    
    mapMarkers.push(marker);
  });
  
  if (markerClusterer && mapMarkers.length > 0) {
    markerClusterer.addMarkers(mapMarkers);
  }
  
  if (!bounds.isEmpty()) {
    kakaoMap.setBounds(bounds);
  }
  
  updateMapList(properties);
}

function showPropertyPopup(property, position) {
  if (!kakaoMap || !infoWindow) return;
  
  const content = `
    <div style="width:240px;padding:1rem;background:white;border-radius:10px;
      box-shadow:0 4px 20px rgba(0,0,0,0.15);font-family:inherit;">
      <div style="font-size:0.85rem;font-weight:800;margin-bottom:0.4rem;color:#1e3a8a;
        overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${escapeHtml(property.title)}</div>
      <div style="font-size:0.75rem;color:#6b7280;margin-bottom:0.5rem">
        ${escapeHtml(property.region)} · ${getPropertyTypeLabel(property.property_type)}
      </div>
      <div style="font-size:0.95rem;font-weight:900;color:#1e40af;margin-bottom:0.5rem">
        ${formatPriceRange(property.price_min, property.price_max)}
      </div>
      <button onclick="navigate('/properties/${property.id}')" 
        style="width:100%;background:#1e40af;color:white;border:none;padding:0.45rem;
          border-radius:6px;font-size:0.8rem;font-weight:600;cursor:pointer">
        상세보기 →
      </button>
      <button onclick="if(window.infoWindow)window.infoWindow.close()" 
        style="position:absolute;top:6px;right:8px;background:none;border:none;cursor:pointer;color:#9ca3af;font-size:1rem">×</button>
    </div>
  `;
  
  infoWindow.setContent(content);
  infoWindow.open(kakaoMap, { getPosition: () => position });
}
window.infoWindow = null;

function updateMapList(properties) {
  const list = document.getElementById('map-property-list');
  const count = document.getElementById('map-result-count');
  if (!list) return;
  
  if (count) count.textContent = `${properties.length}건`;
  
  if (!properties.length) {
    list.innerHTML = '<div class="empty-state" style="padding:2rem"><div class="empty-state-icon">📍</div><div style="font-size:0.85rem">해당 조건의 현장이 없습니다</div></div>';
    return;
  }
  
  list.innerHTML = properties.map(p => `
    <div onclick="navigate('/properties/${p.id}')" style="
      padding:0.75rem;border-radius:10px;cursor:pointer;border:1px solid #f3f4f6;
      margin-bottom:0.4rem;transition:all 0.15s;background:white
    " onmouseover="this.style.borderColor='#3b82f6';this.style.background='#f8fafc'"
      onmouseout="this.style.borderColor='#f3f4f6';this.style.background='white'">
      <div style="font-size:0.85rem;font-weight:700;margin-bottom:0.2rem;
        overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${escapeHtml(p.title)}</div>
      <div style="font-size:0.75rem;color:#6b7280;display:flex;gap:0.5rem;flex-wrap:wrap">
        <span style="color:${getRegionColor(p.region)};font-weight:600">${escapeHtml(p.region)}</span>
        <span>${getPropertyTypeLabel(p.property_type)}</span>
        ${p.is_hot ? '<span style="color:#ef4444;font-weight:700">HOT</span>' : ''}
      </div>
      <div style="font-size:0.85rem;font-weight:800;color:#1e40af;margin-top:0.2rem">
        ${formatPriceRange(p.price_min, p.price_max)}
      </div>
    </div>
  `).join('');
}

function getMyLocation() {
  if (!navigator.geolocation) {
    alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
    return;
  }
  
  const loadingEl = document.getElementById('map-loading');
  if (loadingEl) { loadingEl.style.display = 'flex'; }
  
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      
      if (loadingEl) loadingEl.style.display = 'none';
      
      if (window.kakao && kakaoMap) {
        const position = new kakao.maps.LatLng(lat, lng);
        kakaoMap.setCenter(position);
        kakaoMap.setLevel(8);
        
        // User location marker
        if (userLocationMarker) userLocationMarker.setMap(null);
        userLocationMarker = new kakao.maps.Marker({
          position,
          map: kakaoMap,
          image: new kakao.maps.MarkerImage(
            'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
            new kakao.maps.Size(24, 35)
          )
        });
        
        // Show location info
        const locInfo = document.getElementById('location-info');
        if (locInfo) locInfo.style.display = 'block';
        
        // Reverse geocode
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.coord2Address(lng, lat, (result, status) => {
          if (status === kakao.maps.services.Status.OK) {
            const addr = result[0].road_address?.address_name || result[0].address?.address_name || '위치 확인됨';
            const addrEl = document.getElementById('location-address');
            if (addrEl) addrEl.textContent = addr;
          }
        });
      } else {
        // Demo mode
        showDemoNearby(lat, lng);
      }
      
      // Load nearby properties from API
      const r = await api.get(`/properties/nearby?lat=${lat}&lng=${lng}&radius=5`);
      if (r.ok && r.data.length > 0) {
        if (window.kakao && kakaoMap) displayMapMarkers(r.data);
        else updateMapList(r.data);
      }
    },
    (err) => {
      if (loadingEl) loadingEl.style.display = 'none';
      const msgs = { 1: '위치 접근 권한을 허용해주세요.', 2: '위치를 가져올 수 없습니다.', 3: '요청 시간이 초과되었습니다.' };
      alert(msgs[err.code] || '위치를 가져오는데 실패했습니다.');
    },
    { timeout: 10000, maximumAge: 300000 }
  );
}

function searchByAddress() {
  const bar = document.getElementById('address-search-bar');
  if (bar) { bar.style.display = bar.style.display === 'none' ? 'block' : 'none'; }
}

function executeAddressSearch() {
  const addr = document.getElementById('map-address-input')?.value?.trim();
  if (!addr) return;
  
  if (window.kakao && kakao.maps.services) {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(addr, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
        kakaoMap.setCenter(coords);
        kakaoMap.setLevel(8);
        loadMapProperties();
        document.getElementById('address-search-bar').style.display = 'none';
      } else {
        alert('주소를 찾을 수 없습니다. 다시 입력해주세요.');
      }
    });
  } else {
    // Demo: filter by keyword
    alert(`"${addr}" 검색 기능은 카카오맵 API 키 설정 후 사용 가능합니다.`);
  }
}

function filterMapType(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const region = document.getElementById('map-region-filter')?.value || '';
  loadMapProperties(type === 'all' ? '' : type, region);
}

function filterMapRegion(region) {
  const activeTypeBtn = document.querySelector('.filter-btn.active');
  const type = activeTypeBtn?.textContent?.trim();
  const typeMap = { '아파트': 'apartment', '오피스텔': 'officetel', '상가': 'commercial' };
  loadMapProperties(typeMap[type] || '', region);
}

// Demo map without Kakao API key
function showDemoMap() {
  const mapEl = document.getElementById('kakao-map');
  const loadingEl = document.getElementById('map-loading');
  if (loadingEl) loadingEl.style.display = 'none';
  
  if (!mapEl) return;
  
  // Show demo SVG map
  mapEl.innerHTML = `
    <div style="width:100%;height:100%;background:linear-gradient(135deg,#e8f4fd,#cce7f5);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      position:relative;overflow:hidden">
      <!-- Grid lines (map-like) -->
      <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.15" xmlns="http://www.w3.org/2000/svg">
        ${Array.from({length:10},(_,i)=>`<line x1="${i*10}%" y1="0" x2="${i*10}%" y2="100%" stroke="#1e40af" stroke-width="1"/>`).join('')}
        ${Array.from({length:10},(_,i)=>`<line x1="0" y1="${i*10}%" x2="100%" y2="${i*10}%" stroke="#1e40af" stroke-width="1"/>`).join('')}
      </svg>
      
      <!-- Demo markers -->
      ${[
        {x:50,y:45,color:'#f59e0b',label:'힐스테이트 판교역',id:1},
        {x:35,y:40,color:'#ef4444',label:'래미안 원펜타스',id:2},
        {x:55,y:55,color:'#1e40af',label:'DMC SK뷰',id:3},
        {x:65,y:35,color:'#10b981',label:'더샵 하남',id:4},
        {x:40,y:60,color:'#6366f1',label:'롯데캐슬',id:5},
        {x:70,y:50,color:'#8b5cf6',label:'광교 아이파크',id:6},
        {x:30,y:55,color:'#f97316',label:'e편한세상',id:7},
      ].map(m=>`
        <div onclick="navigate('/properties/${m.id}')" style="
          position:absolute;left:${m.x}%;top:${m.y}%;transform:translate(-50%,-100%);
          background:${m.color};color:white;font-size:0.6rem;font-weight:800;
          padding:3px 7px;border-radius:5px;white-space:nowrap;cursor:pointer;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;z-index:2;
          transition:transform 0.2s
        " onmouseover="this.style.transform='translate(-50%,-100%) scale(1.1)'"
          onmouseout="this.style.transform='translate(-50%,-100%)'">
          ${m.label}
          <div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);
            width:8px;height:5px;background:${m.color};clip-path:polygon(0 0,100% 0,50% 100%)"></div>
        </div>
      `).join('')}
      
      <div style="text-align:center;z-index:1;background:rgba(255,255,255,0.85);
        padding:1rem 1.5rem;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
        <div style="font-size:2rem;margin-bottom:0.5rem">🗺️</div>
        <div style="font-weight:700;font-size:0.9rem;color:#1e3a8a;margin-bottom:0.25rem">
          카카오맵 연동 준비 완료
        </div>
        <div style="font-size:0.78rem;color:#6b7280;max-width:220px">
          관리자 페이지에서 카카오 API 키를 설정하면<br>실제 지도가 표시됩니다
        </div>
        <button onclick="navigate('/properties')" class="btn btn-primary btn-sm" style="margin-top:0.75rem">
          목록으로 보기
        </button>
      </div>
    </div>
  `;
  
  // Load DB properties for sidebar list
  loadAndShowDemoList();
}

async function showDemoNearby(lat, lng) {
  const r = await api.get(`/properties/nearby?lat=${lat}&lng=${lng}&radius=5`);
  if (r.ok) updateMapList(r.data || []);
}

async function loadAndShowDemoList() {
  const r = await api.get('/properties/map');
  if (r.ok) updateMapList(r.data || []);
}

// Global exports
window.filterMapType = filterMapType;
window.filterMapRegion = filterMapRegion;
window.getMyLocation = getMyLocation;
window.searchByAddress = searchByAddress;
window.executeAddressSearch = executeAddressSearch;
