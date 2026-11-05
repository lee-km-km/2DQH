
/* LabStock v1. Configure SUPABASE_URL and SUPABASE_ANON_KEY below. */
const SUPABASE_URL = 'https://nngownhoxrtymzvwscyc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ijsPGWswYcZKdhrjoy4hSw_9jRaQGbv';
const configured = SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('YOUR_') && !SUPABASE_ANON_KEY.includes('YOUR_');
let db = (configured && typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function ensureDb(){
  if(!db && configured && typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function'){
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return db;
}
const $ = function(id){ return document.getElementById(id); };

// ==========================================
// [기능 스위치 & 로컬 Mock 데이터 스토리지]
// ==========================================
// 소모품/재고품 및 구매요청 기능 ON/OFF (현재: 비품 대여/반납에만 집중하기 위해 비활성화)
const ENABLE_CONSUMABLES = false;
let isLocalMode = false;

// 프로덕션 모드: 로컬 목 데이터 비활성화 (Supabase DB 전용)
const DEFAULT_MOCK_ASSETS = [];

function loadLocalStorage(forceReset){
  isLocalMode = false;
  const storedAssets = localStorage.getItem('labstock_local_assets');
  const storedLoans = localStorage.getItem('labstock_local_loans');

  if(!forceReset && storedAssets){
    try {
      const parsed = JSON.parse(storedAssets);
      assets = Array.isArray(parsed) ? parsed : [];
    } catch(e){
      assets = [];
    }
  } else {
    assets = [];
  }

  if(!forceReset && storedLoans){
    try {
      const parsed = JSON.parse(storedLoans);
      loans = Array.isArray(parsed) ? parsed : [];
    } catch(e){
      loans = [];
    }
  } else {
    loans = [];
  }

  borrowedAssetIds = new Set();
  activeLoanMap = new Map();
  for(let i=0; i<loans.length; i++){
    if(!loans[i].returned_at){
      borrowedAssetIds.add(loans[i].asset_id);
      activeLoanMap.set(loans[i].asset_id, loans[i]);
    }
  }

  render();
}

function saveLocalStorage(){
  localStorage.setItem('labstock_local_assets', JSON.stringify(assets));
  localStorage.setItem('labstock_local_loans', JSON.stringify(loans));
  
  borrowedAssetIds = new Set();
  activeLoanMap = new Map();
  for(let i=0; i<loans.length; i++){
    if(!loans[i].returned_at){
      borrowedAssetIds.add(loans[i].asset_id);
      activeLoanMap.set(loans[i].asset_id, loans[i]);
    }
  }
  render();
}

let assets = [];
let loans = [];
let consumables = [];
let reorderRequests = [];
let stockMovements = [];
let consumablesAvailable = true;
let session = null;
let admin = false;
let borrowedAssetIds = new Set();
let activeLoanMap = new Map();
let lastFocusedElement = null;

function debounce(fn, delay){
  let timer = null;
  return function(){
    const context = this;
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function(){
      fn.apply(context, args);
    }, delay || 180);
  };
}
let selectedInventoryCategory = 'all';
let selectedBorrowCategory = 'all';
let modalMode = '';
let modalId = null;

function today(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return y + '-' + m + '-' + day;
}

function dateText(d){
  if(!d) return '—';
  return String(d).replace(/-/g, '.');
}

function safe(v){
  if(v === null || v === undefined) return '';
  return String(v).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function assetFor(id){
  for(let i=0; i<assets.length; i++){
    if(assets[i].id === id) return assets[i];
  }
  return null;
}

function activeLoanFor(id){
  return activeLoanMap.get(id) || null;
}

function isAdmin(){
  return admin;
}

function statusFor(a){
  if(borrowedAssetIds.has(a.id)) return 'borrowed';
  if(activeLoanFor(a.id)) return 'borrowed';
  if(a.status === 'maintenance') return 'maintenance';
  return 'available';
}

function statusLabel(s){
  if(s === 'available') return '사용 가능';
  if(s === 'borrowed') return '대여 중';
  if(s === 'maintenance') return '수리 중';
  return s;
}

function toast(msg){
  $('toast').textContent = msg;
  $('toast').classList.add('show');
  setTimeout(function(){
    $('toast').classList.remove('show');
  }, 2600);
}

function fmtName(id){
  const a = assetFor(id);
  if(a && a.name) return a.name;
  return id;
}

function setAdminUI(){
  $('loginBtn').classList.toggle('hidden', isAdmin());
  $('logoutBtn').classList.toggle('hidden', !isAdmin());

  const adminEls = document.querySelectorAll('.admin-only');
  for(let i=0; i<adminEls.length; i++){
    adminEls[i].classList.toggle('hidden', !isAdmin());
  }

  const activeView = document.querySelector('.view.active');
  if(!isAdmin() && activeView && activeView.classList.contains('admin-only')){
    showView('inventory');
  }
}

async function refreshAdminState(){
  admin = false;

  if(db && session && session.user && !session.user.is_anonymous){
    const res = await db.rpc('is_admin');
    if(res.error) console.error('관리자 권한 확인 실패:', res.error);
    admin = !res.error && res.data === true;
  }

  setAdminUI();
}

async function loadData(){
  if(!db){
    loadLocalStorage();
    return;
  }

  try{
    const results = await Promise.all([
      db.from('assets').select('*').order('name'),
      db.from('loans').select('*').order('borrowed_at', {ascending: false})
    ]);

    let hasRemoteSuccess = false;

    if(!results[0].error && Array.isArray(results[0].data)){
      assets = results[0].data;
      hasRemoteSuccess = true;
      try {
        localStorage.setItem('labstock_real_cache_assets', JSON.stringify(assets));
      } catch(e){}
    } else if(results[0].error){
      console.warn('Supabase assets 조회 실패:', results[0].error);
    }

    if(!results[1].error && Array.isArray(results[1].data)){
      loans = results[1].data;
      hasRemoteSuccess = true;
      try {
        localStorage.setItem('labstock_real_cache_loans', JSON.stringify(loans));
      } catch(e){}
    } else if(results[1].error){
      console.warn('Supabase loans 조회 실패 (빈 목록 유지):', results[1].error);
      loans = [];
    }

    if(!hasRemoteSuccess){
      console.warn('Supabase DB 연결 실패, 캐시된 실제 데이터를 로드합니다.');
      const cachedAssets = localStorage.getItem('labstock_real_cache_assets');
      if(cachedAssets){
        try {
          assets = JSON.parse(cachedAssets);
          loans = JSON.parse(localStorage.getItem('labstock_real_cache_loans') || '[]');
          const conn = $('connection');
          if(conn) { conn.textContent = '오프라인 (읽기 전용)'; conn.style.color = '#b45309'; }
        } catch(e){}
      }
      return;
    }

    // 원격 Supabase 정상 연동 확인 -> 로컬 모드 해제
    isLocalMode = false;

    borrowedAssetIds = new Set();
    activeLoanMap = new Map();
    for(let i=0; i<loans.length; i++){
      if(!loans[i].returned_at){
        borrowedAssetIds.add(loans[i].asset_id);
        activeLoanMap.set(loans[i].asset_id, loans[i]);
      }
    }

    const conn = $('connection');
    if(conn){
      conn.textContent = '공용 DB 연결됨 (' + assets.length + '개 비품)';
      conn.style.color = '#0284c7';
    }
    render();
  }catch(e){
    // 예외 발생 시 로컬 캐시로 자동 전환 및 배지 갱신
    console.warn('DB 통신 예외 발생, 로컬 모드로 전환합니다:', e);
    const conn = $('connection');
    if(conn){
      conn.textContent = '연결 지연 (로컬 캐시)';
      conn.style.color = '#b45309';
    }
    loadLocalStorage();
  }
}

function applyFeatureToggles(){
  document.querySelectorAll('[data-view="consumables"], [data-goto="consumables"]').forEach(function(el){
    el.classList.toggle('hidden', !ENABLE_CONSUMABLES);
  });
  
  const reorderBtn = $('homeReorder');
  if(reorderBtn) reorderBtn.classList.toggle('hidden', !ENABLE_CONSUMABLES);
  
  const mobileReorder = $('mobileReorder');
  if(mobileReorder) mobileReorder.classList.toggle('hidden', !ENABLE_CONSUMABLES);
  
  const reorderPanel = $('reorderPanel');
  if(reorderPanel) reorderPanel.classList.toggle('hidden', !ENABLE_CONSUMABLES);
  
  const lowStockNotice = $('lowStockNotice');
  if(lowStockNotice && !ENABLE_CONSUMABLES) lowStockNotice.innerHTML = '';
}

function render(){
  applyFeatureToggles();
  renderHome();
  renderMetrics();
  renderDashboard();
  renderInventory();
  renderLoans();
  renderHistory();
  if(ENABLE_CONSUMABLES) renderConsumables();
  setAdminUI();
}

function renderHome(){
  const loanEl = $('homeLoanCount');
  const lowEl = $('homeLowCount');
  if(!loanEl || !lowEl) return;

  const active = loans.filter(function(l){
    return !l.returned_at;
  }).length;

  loanEl.textContent = active + '건 대여 중';

  const low = consumables.filter(function(c){
    return Number(c.quantity) <= Number(c.min_quantity);
  }).length;

  lowEl.textContent = isAdmin() && low ? ('최소 보유량 이하 ' + low + '개') : '';
  lowEl.classList.toggle('warn', isAdmin() && low > 0);
}

function renderMetrics(){
  const active = loans.filter(function(l){
    return !l.returned_at;
  });

  const overdue = active.filter(function(l){
    if(!l.due_date) return false;
    return l.due_date < today();
  });

  const items = [
    ['전체 비품', assets.length, '등록된 품목'],
    ['대여 중', active.length, '현재 사용 중'],
    ['사용 가능', assets.filter(function(a){
      return statusFor(a) === 'available';
    }).length, '바로 대여 가능'],
    ['반납 기한 초과', overdue.length, '확인이 필요한 품목']
  ];

  // 소모품 부족 현황은 소모품 활성화 시 관리자에게만 표시
  if(ENABLE_CONSUMABLES && isAdmin()){
    items.push([
      '소모품 부족',
      consumables.filter(function(c){
        return Number(c.quantity) <= Number(c.min_quantity);
      }).length,
      '재주문 확인 필요'
    ]);
  }

  let html = '';
  for(let i=0; i<items.length; i++){
    html += '<div class="metric"><div class="label">' + items[i][0] +
      '</div><div class="value">' + items[i][1] +
      '</div><div class="foot">' + items[i][2] + '</div></div>';
  }

  $('metrics').innerHTML = html;
}

function renderDashboard(){
  const lowStockItems = consumables.filter(function(c){
    return Number(c.quantity) <= Number(c.min_quantity);
  });

  const notice = $('lowStockNotice');

  if(notice){
    // 비로그인 사용자이거나 소모품 비활성화 상태에서는 알림 숨김
    if(!isAdmin() || !ENABLE_CONSUMABLES){
      notice.innerHTML = '';
    } else if(lowStockItems.length){
      const preview = lowStockItems.slice(0,4).map(function(c){
        const out = Number(c.quantity) <= 0;
        const label = out ? '재고 0 · 구매요청' : '구매요청';

        return '<button class="low-stock-chip" type="button" data-reorder="' +
          safe(c.id) + '"><b>' + safe(c.name) +
          '</b><small>' + safe(c.quantity) + ' ' + safe(c.unit || '개') +
          ' 남음 · ' + safe(c.location || '위치 미등록') +
          ' · ' + label + '</small></button>';
      }).join('');

      notice.innerHTML = '<section class="stock-alert"><div class="stock-alert-icon">!</div><div class="stock-alert-content"><b>소모품 재고 확인이 필요합니다</b><p>' +
        lowStockItems.length + '개 품목이 최소 보유량 이하입니다.</p><div class="low-stock-list">' +
        preview + '</div></div><button class="btn" data-goto="consumables">소모품 확인</button></section>';
    } else if(consumablesAvailable && consumables.length){
      notice.innerHTML = '<section class="stock-ok"><span>✓</span><div><b>소모품 재고 양호</b><p>현재 최소 보유량 이하인 품목이 없습니다.</p></div><button class="text-btn" data-goto="consumables">재고 보기</button></section>';
    } else {
      notice.innerHTML = '';
    }
  }

  const active = loans.filter(function(l){
    return !l.returned_at;
  }).sort(function(a,b){
    const da = a.due_date ? a.due_date : '';
    const dbDate = b.due_date ? b.due_date : '';
    return da.localeCompare(dbDate);
  });

  if(active.length > 0){
    let rowsHtml = '';
    const limit = Math.min(active.length, 7);

    for(let i=0; i<limit; i++){
      const l = active[i];
      const isOverdue = l.due_date && l.due_date < today();

      rowsHtml += '<tr><td><b>' + safe(fmtName(l.asset_id)) +
        '</b><div class="asset-id">' + safe(l.asset_id) +
        '</div></td><td>' + safe(l.borrower_name) +
        '</td><td>' + dateText(l.due_date) +
        '</td><td><span class="status ' +
        (isOverdue ? 'borrowed' : 'available') + '">' +
        (isOverdue ? '기한 초과' : '대여 중') +
        '</span></td></tr>';
    }

    $('dashboardLoans').innerHTML = '<table><thead><tr><th>비품</th><th>대여자</th><th>반납 예정</th><th>상태</th></tr></thead><tbody>' +
      rowsHtml + '</tbody></table>';
  } else {
    $('dashboardLoans').innerHTML = '<div class="empty">현재 대여 중인 비품이 없습니다.</div>';
  }

  const getTime = function(item){
    if(item.updated_at) return item.updated_at;
    if(item.borrowed_at) return item.borrowed_at;
    return '';
  };

  const recent = [].concat(loans).sort(function(a,b){
    return getTime(b).localeCompare(getTime(a));
  }).slice(0,5);

  let recentHtml = '';
  for(let i=0; i<recent.length; i++){
    const l = recent[i];
    const targetDate = l.returned_at ? l.returned_at : l.borrowed_at;
    const labelText = l.returned_at ? '반납 완료' : '대여 등록';

    recentHtml += '<div class="activity-item"><b>' +
      safe(l.borrower_name) + '</b> · ' + safe(fmtName(l.asset_id)) +
      '<small>' + dateText(targetDate) + ' · ' + labelText +
      '</small></div>';
  }

  $('recentActivity').innerHTML = recentHtml || '<div class="empty">아직 활동이 없습니다.</div>';

  // 통계 분석 차트 렌더링
  renderTopAssetsChart();
}

const TOP_LEVEL_CATEGORIES = ['공구','측정공구','실험장비','전기·전자','안전용품','기타'];

function topLevelCategory(asset){
  const raw = String((asset && asset.category) || '').trim();
  const text = (raw + ' ' + String((asset && asset.name) || '')).toLowerCase();

  if(/측정|캘리퍼|마이크로미터|게이지|버니어|멀티미터|테스터/.test(text)) return '측정공구';
  if(/안전|보안경|장갑|마스크|소화기|구급|보호구/.test(text)) return '안전용품';
  if(/전기|전자|전원|회로|납땜|인두|아두이노|센서|케이블/.test(text)) return '전기·전자';
  if(/실험|피펫|비커|플라스크|시험관|원심|현미경|배양|시약/.test(text)) return '실험장비';
  if(/공구|드라이버|렌치|펜치|플라이어|망치|톱|드릴|니퍼|스패너/.test(text)) return '공구';
  if(TOP_LEVEL_CATEGORIES.includes(raw)) return raw;

  return '기타';
}

function categoryTabsHtml(selected, actionAttr){
  const cats = ['all'].concat(TOP_LEVEL_CATEGORIES);

  return '<div class="category-tabs" aria-label="대분류">' +
    cats.map(function(cat){
      const label = cat === 'all' ? '전체' : cat;

      return '<button type="button" class="category-tab' +
        (selected === cat ? ' active' : '') + '" ' +
        actionAttr + '="' + safe(cat) +
        '" aria-pressed="' + (selected === cat ? 'true' : 'false') +
        '">' + label + '</button>';
    }).join('') + '</div>';
}

function renderInventory(){
  const searchEl = $('assetSearch');
  const filterEl = $('assetFilter');
  const q = searchEl ? searchEl.value.trim().toLowerCase() : '';
  const f = filterEl ? filterEl.value : 'all';

  const list = assets.filter(function(a){
    const matchCategory = selectedInventoryCategory === 'all' ||
      topLevelCategory(a) === selectedInventoryCategory;

    const matchFilter = f === 'all' ? true : statusFor(a) === f;
    const textTarget = [a.id, a.name, a.category, a.location, a.note].join(' ').toLowerCase();
    const matchSearch = textTarget.includes(q);

    return matchCategory && matchFilter && matchSearch;
  });

  const categoryHost = $('inventoryCategories');
  if(categoryHost){
    categoryHost.innerHTML = categoryTabsHtml(selectedInventoryCategory, 'data-inventory-category');
  }

  const countBadge = $('inventoryCountBadge');
  if(countBadge) countBadge.textContent = list.length;

  if(list.length > 0){
    let listHtml = '';

    for(let i=0; i<list.length; i++){
      const a = list[i];
      const l = activeLoanFor(a.id);
      const st = statusFor(a);
      const bName = l && l.borrower_name ? l.borrower_name : '—';
      const loc = a.location ? a.location : '—';

      let actionBtn = '';

      if(st === 'available'){
        actionBtn += '<button class="text-btn btn-action-borrow" data-borrow="' + safe(a.id) + '">⚡ 대여 신청</button>';
      } else if(st === 'borrowed'){
        actionBtn += '<span class="status-chip borrowed-chip">대여 중 (' + safe(bName) + ')</span>';
      }

      if(isAdmin()){
        actionBtn += '<button class="text-btn btn-action-edit" data-edit="' + safe(a.id) + '">수정</button>';
      }

      listHtml += '<tr data-status="' + st + '">' +
        '<td data-label="비품명"><b>' + safe(a.name) + '</b><div class="asset-id">' + safe(a.id) + '</div></td>' +
        '<td data-label="분류">' + safe(a.category) + '</td>' +
        '<td data-label="보관 위치">' + safe(loc) + '</td>' +
        '<td data-label="상태"><span class="status ' + st + '">' + statusLabel(st) + '</span></td>' +
        '<td data-label="현재 대여자">' + safe(bName) + '</td>' +
        '<td data-label="작업">' + actionBtn + '</td></tr>';
    }

    // 본인이 현재 대여 중인 비품이 있는 경우, 최상단에 원클릭 반납 리마인드 배너 노출
    let personalBannerHtml = '';
    const myActiveLoans = loans.filter(function(l){
      return !l.returned_at && isMyLoan(l);
    });

    if(myActiveLoans.length > 0){
      const l = myActiveLoans[0];
      personalBannerHtml = '<div class="my-active-loan-banner">' +
        '<div class="banner-info">' +
          '<span class="banner-icon">💡</span>' +
          '<div>' +
            '<b>' + safe(l.borrower_name || '연구원') + '님, 현재 [' + safe(fmtName(l.asset_id)) + '] 대여 중입니다</b>' +
            '<small>사용이 끝나셨다면 다른 연구원을 위해 반납해 주세요 :)</small>' +
          '</div>' +
        '</div>' +
        '<button class="text-btn btn-banner-return" data-return="' + l.id + '">✓ 지금 반납하기</button>' +
      '</div>';
    }

    $('inventoryRows').innerHTML = personalBannerHtml + '<table aria-label="비품 목록"><thead><tr><th scope="col">비품명 / 식별번호</th><th scope="col">분류</th><th scope="col">보관 위치</th><th scope="col">상태</th><th scope="col">현재 대여자</th><th scope="col">작업</th></tr></thead><tbody>' +
      listHtml + '</tbody></table>';
  } else {
    $('inventoryRows').innerHTML = '<div class="empty">검색 결과가 없습니다.</div>';
  }
}

function updateBorrowCategory(category){
  selectedBorrowCategory = category;

  const select = $('modalBody').querySelector('[name="asset_id"]');
  if(!select) return;

  const previous = select.value;
  const available = assets.filter(function(a){
    return statusFor(a) === 'available' &&
      (category === 'all' || topLevelCategory(a) === category);
  });

  if(available.length > 0){
    select.innerHTML = available.map(function(a){
      return '<option value="' + safe(a.id) + '">' +
        safe(a.id) + ' · ' + safe(a.name) + ' (' + safe(a.location || '위치 미지정') + ')' + '</option>';
    }).join('');
    select.disabled = false;
    $('saveModal').disabled = false;
  } else {
    select.innerHTML = '<option value="" disabled selected>선택한 분류에 대여 가능한 비품이 없습니다 ("전체" 탭 권장)</option>';
    select.disabled = true;
    $('saveModal').disabled = true;
  }

  if(available.some(function(a){ return a.id === previous; })){
    select.value = previous;
  }

  const tabs = $('modalBody').querySelectorAll('[data-borrow-category]');
  tabs.forEach(function(tab){
    const active = tab.dataset.borrowCategory === category;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function getClientId(){
  let cid = localStorage.getItem('labstock_client_id');
  if(!cid){
    cid = 'client_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    localStorage.setItem('labstock_client_id', cid);
  }
  return cid;
}

function getMyLoanIds(){
  try {
    const raw = localStorage.getItem('labstock_my_loan_ids');
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch(e){
    return new Set();
  }
}

function recordMyLoanId(id){
  if(!id) return;
  const set = getMyLoanIds();
  set.add(String(id));
  localStorage.setItem('labstock_my_loan_ids', JSON.stringify(Array.from(set)));
}

function isMyLoan(l){
  if(!l) return false;
  // 1. Supabase 익명 세션 UID 비교 (같은 익명 세션일 때)
  if(l.user_id && session && session.user && l.user_id === session.user.id) return true;
  // 2. 브라우저 client_id 비교 (로컬 모드)
  if(l.client_id && l.client_id === getClientId()) return true;
  // 3. 이 기기/브라우저에서 대여 신청했던 loan_id 목록 대조
  if(getMyLoanIds().has(String(l.id))) return true;
  return false;
}

// 관리자 또는 해당 대여를 등록한 본인(대여한 브라우저)만 반납/수정 가능
function canManageLoan(l){
  return isAdmin() || isMyLoan(l);
}

// 본인 기기(client_id) 또는 지정한 이름 기준 3일 이상 미반납(연체) 비품 탐지
function getMyOverdueLoan(inputName = null){
  const now = Date.now();
  const myClientId = getClientId();
  const myIds = getMyLoanIds();
  const normName = inputName ? inputName.trim().toLowerCase() : '';

  for(let i=0; i<loans.length; i++){
    const l = loans[i];
    if(l.returned_at) continue;

    const isMyDevice = (l.client_id && l.client_id === myClientId) || myIds.has(String(l.id));
    const isSameName = normName && l.borrower_name && l.borrower_name.trim().toLowerCase() === normName;

    if(isMyDevice || isSameName){
      const borrowedTime = new Date(l.borrowed_at).getTime();
      const dueTime = l.due_date ? new Date(l.due_date).getTime() : (borrowedTime + 3 * 86400000);
      const isOverdue = (now > dueTime) || (now - borrowedTime > 3 * 86400000);

      if(isOverdue){
        const days = Math.max(1, Math.floor((now - borrowedTime) / 86400000));
        return { isLocked: true, loan: l, days: days };
      }
    }
  }
  return { isLocked: false, loan: null, days: 0 };
}

function renderLoans(){
  const searchEl = $('loanSearch');
  const filterEl = $('loanFilter');
  const q = searchEl ? searchEl.value.trim().toLowerCase() : '';
  const f = filterEl ? filterEl.value : 'all';

  const list = loans.filter(function(l){
    let matchFilter = false;

    if(f === 'all') matchFilter = true;
    else if(f === 'active') matchFilter = !l.returned_at;
    else if(f === 'returned') matchFilter = !!l.returned_at;

    const textTarget = [l.asset_id, l.borrower_name, fmtName(l.asset_id)].join(' ').toLowerCase();
    return matchFilter && textTarget.includes(q);
  });

  if(list.length > 0){
    let loanHtml = '';

    for(let i=0; i<list.length; i++){
      const l = list[i];
      let action = '';

      if(canManageLoan(l)){
        if(isAdmin()){
          action += '<button class="text-btn btn-action-edit" data-edit-loan="' + l.id + '">수정</button> ';
        }

        if(!l.returned_at){
          action += '<button class="text-btn btn-action-return" data-return="' + l.id + '">✓ 반납하기</button>';
        } else {
          action += '<span class="status available">반납 완료</span>';
        }
      } else {
        if(!l.returned_at){
          action = '<span class="status-chip locked-chip">대여 중 (타인 대여)</span>';
        } else {
          action = '<span class="status available">반납 완료</span>';
        }
      }

      loanHtml += '<tr data-status="' + (l.returned_at ? 'returned' : 'active') + '">' +
        '<td data-label="비품"><b>' + safe(fmtName(l.asset_id)) + '</b><div class="asset-id">' + safe(l.asset_id) + '</div></td>' +
        '<td data-label="대여자">' + safe(l.borrower_name) + '</td>' +
        '<td data-label="대여 시작일">' + dateText(l.borrowed_at) + '</td>' +
        '<td data-label="반납 예정일">' + dateText(l.due_date) + '</td>' +
        '<td data-label="실제 반납일">' + dateText(l.returned_at) + '</td>' +
        '<td data-label="처리">' + action + '</td></tr>';
    }

    $('loanRows').innerHTML = '<table aria-label="대여 현황"><thead><tr><th scope="col">비품</th><th scope="col">대여자</th><th scope="col">대여 시작일</th><th scope="col">반납 예정일</th><th scope="col">실제 반납일</th><th scope="col">처리</th></tr></thead><tbody>' +
      loanHtml + '</tbody></table>';
  } else {
    $('loanRows').innerHTML = '<div class="empty">표시할 기록이 없습니다.</div>';
  }

  const activeCountBadge = $('activeLoansCountBadge');
  if(activeCountBadge){
    const activeCount = loans.filter(function(l){ return !l.returned_at; }).length;
    activeCountBadge.textContent = activeCount;
  }
}

function renderConsumables(){
  const searchEl = $('consumableSearch');
  if(!searchEl) return;

  const q = searchEl.value.trim().toLowerCase();
  const filterEl = $('consumableFilter');

  if(!isAdmin() && (filterEl.value === 'low' || filterEl.value === 'ok')){
    filterEl.value = 'all';
  }

  const f = filterEl.value;

  const low = consumables.filter(function(c){
    return Number(c.quantity) <= Number(c.min_quantity);
  });

  const outOfStock = consumables.filter(function(c){
    return Number(c.quantity) <= 0;
  });

  const rows = consumables.filter(function(c){
    const quantity = Number(c.quantity);
    const isLow = quantity <= Number(c.min_quantity);
    const isOut = quantity <= 0;
    const target = [c.name, c.category, c.location, c.note].join(' ').toLowerCase();

    const filterMatch =
      f === 'all' ||
      (f === 'available' && !isOut) ||
      (f === 'out' && isOut) ||
      (isAdmin() && f === 'low' && isLow) ||
      (isAdmin() && f === 'ok' && !isLow);

    return target.includes(q) && filterMatch;
  });

  // 요약 카드는 관리자에게만 표시
  const summary = $('consumableSummary');

  if(summary){
    if(isAdmin()){
      summary.innerHTML = [
        ['등록 품목', consumables.length, '등록된 소모품'],
        ['재고 없음', outOfStock.length, '현재 수량이 0인 품목'],
        ['최소 보유량 이하', low.length, '관리자 확인 및 재주문 필요'],
        ['재주문 요청', reorderRequests.filter(function(r){
          return r.status !== 'received';
        }).length, '처리 중인 요청']
      ].map(function(x){
        return '<div class="metric"><div class="label">' + x[0] +
          '</div><div class="value">' + x[1] +
          '</div><div class="foot">' + x[2] + '</div></div>';
      }).join('');
    } else {
      summary.innerHTML = '';
    }
  }

  const rowsHost = $('consumableRows');

  if(!consumablesAvailable){
    // 기능 미설정 안내는 관리자에게만 표시
    rowsHost.innerHTML = isAdmin()
      ? '<div class="empty">소모품 기능을 시작하려면 프로젝트 ZIP에 포함된 <b>consumables_migration.sql</b>을 Supabase SQL Editor에서 실행하세요.</div>'
      : '';
  } else if(rows.length){
    let html = '';

    rows.forEach(function(c){
      const quantity = Number(c.quantity);
      const isLow = quantity <= Number(c.min_quantity);
      const isOut = quantity <= 0;

      const status = isOut
        ? '<span class="status low">재고 없음</span>'
        : (isAdmin() && isLow
          ? '<span class="status low">최소 보유량 이하</span>'
          : '<span class="status available">재고 있음</span>');

let actions = '';

// 재주문 요청과 사용 기록은 비로그인 사용자도 가능
actions += '<button class="text-btn" data-reorder="' +
  safe(c.id) + '">' +
  (isOut ? '구매 요청' : '재주문 요청') +
  '</button>';

actions += '<button class="text-btn" data-movement="' +
  safe(c.id) + '" data-movement-type="use">사용 기록</button>';

// 입고 및 품목 정보 수정은 관리자 전용
if (isAdmin()) {
  actions += '<button class="text-btn" data-movement="' +
    safe(c.id) + '" data-movement-type="in">입고 기록</button>';

  actions += '<button class="text-btn" data-edit-consumable="' +
    safe(c.id) + '">정보 수정</button>';
}

const rowClass = isOut
  ? 'out-of-stock'
  : (isAdmin() && isLow ? 'low-row' : '');

      html += '<tr class="' + rowClass + '">' +
        '<td><b>' + safe(c.name) +
        '</b><div class="asset-id">' + safe(c.category || '기타') +
        '</div></td>' +
        '<td><b>' + safe(c.quantity) + ' ' + safe(c.unit || '개') + '</b></td>' +
        (isAdmin()
          ? '<td class="admin-only"><b>' + safe(c.min_quantity) + ' ' +
            safe(c.unit || '개') + '</b></td>'
          : '') +
        '<td><span class="location-text">' + safe(c.location || '위치 미등록') +
        '</span></td>' +
        '<td>' + status + '</td>' +
        '<td>' + actions + '</td></tr>';
    });

    rowsHost.innerHTML = '<table><thead><tr><th>소모품 / 분류</th><th>현재 수량</th>' +
      (isAdmin() ? '<th class="admin-only">최소 보유량</th>' : '') +
      '<th>보관 위치</th><th>상태</th><th>작업</th></tr></thead><tbody>' +
      html + '</tbody></table>';
  } else if(!isAdmin() && consumables.length === 0){
    // 비로그인 화면에서는 등록 품목이 없다는 빈 상태 안내를 표시하지 않음
    rowsHost.innerHTML = '';
  } else if(!isAdmin()){
    // 검색 결과가 없는 경우에만 안내 표시
    rowsHost.innerHTML = '<div class="empty">검색 결과가 없습니다.</div>';
  } else {
    rowsHost.innerHTML = '<div class="empty">등록된 소모품이 없습니다. 오른쪽 위에서 첫 소모품을 등록하세요.</div>';
  }

  // 재주문 상태 관리 영역은 관리자 전용
  document.querySelectorAll('.admin-consumables-only').forEach(function(el){
    el.classList.toggle('hidden', !isAdmin());
  });

  if(!isAdmin()){
    $('reorderRows').innerHTML = '';
  } else if(!consumablesAvailable){
    $('reorderRows').innerHTML = '<div class="empty">소모품 데이터베이스 설정이 필요합니다.</div>';
  } else if(!reorderRequests.length){
    $('reorderRows').innerHTML = '<div class="empty">아직 재주문 요청이 없습니다.</div>';
  } else {
    let requestHtml = '';

    reorderRequests.forEach(function(r){
      const name = (r.consumables && r.consumables.name) ||
        consumableFor(r.consumable_id)?.name || '삭제된 품목';

      const label = r.status === 'received'
        ? '입고 완료'
        : r.status === 'ordered' ? '주문 진행 중' : '요청됨';

      let action = '';

      if(r.status !== 'received'){
        action = '<button class="text-btn" data-request-status="' +
          safe(r.id) + '" data-status="' +
          (r.status === 'pending' ? 'ordered' : 'received') + '">' +
          (r.status === 'pending' ? '주문 진행' : '입고 완료') + '</button>';
      }

      requestHtml += '<tr><td><b>' + safe(name) +
        '</b><div class="asset-id">' + safe(r.requester || '요청자 미입력') +
        ' · ' + dateText(String(r.created_at || '').slice(0,10)) +
        '</div></td><td>' + safe(r.requested_quantity) + ' ' +
        safe((r.consumables && r.consumables.unit) || '개') +
        '</td><td><span class="status ' +
        (r.status === 'received' ? 'available' : r.status === 'ordered' ? 'ordered' : 'pending') +
        '">' + label + '</span></td><td>' + safe(r.note || '—') +
        '</td><td>' + action + '</td></tr>';
    });

    $('reorderRows').innerHTML = '<table><thead><tr><th>품목 / 요청자</th><th>요청 수량</th><th>진행 상태</th><th>메모</th><th>관리</th></tr></thead><tbody>' +
      requestHtml + '</tbody></table>';
  }

  if(!consumablesAvailable){
    $('movementRows').innerHTML = '<div class="empty">소모품 데이터베이스 설정이 필요합니다.</div>';
  } else if(!stockMovements.length){
    $('movementRows').innerHTML = '<div class="empty">아직 재고 변동 기록이 없습니다.</div>';
  } else {
    let movementHtml = '';

    stockMovements.forEach(function(m){
      const isIn = m.movement_type === 'in';

      movementHtml += '<tr><td><b>' +
        safe((m.consumables && m.consumables.name) ||
          consumableFor(m.consumable_id)?.name || '소모품') +
        '</b><div class="asset-id">' + safe(m.actor || '사용자 미입력') +
        ' · ' + dateText(String(m.created_at || '').slice(0,10)) +
        '</div></td><td><span class="status ' +
        (isIn ? 'available' : 'borrowed') + '">' +
        (isIn ? '입고' : '사용') +
        '</span></td><td><b>' + (isIn ? '+' : '−') +
        safe(m.quantity) + ' ' + safe((m.consumables && m.consumables.unit) || '개') +
        '</b></td><td>' + safe(m.note || '—') + '</td></tr>';
    });

    $('movementRows').innerHTML = '<table><thead><tr><th>품목 / 기록자</th><th>유형</th><th>변동 수량</th><th>메모</th></tr></thead><tbody>' +
      movementHtml + '</tbody></table>';
  }
}

function consumableFor(id){
  return consumables.find(function(c){
    return String(c.id) === String(id);
  }) || null;
}

function renderHistory(){
  const searchEl = $('historySearch');
  const q = searchEl ? searchEl.value.trim().toLowerCase() : '';

  const list = loans.filter(function(l){
    return [l.asset_id, l.borrower_name, fmtName(l.asset_id)]
      .join(' ').toLowerCase().includes(q);
  });

  if(list.length > 0){
    let histHtml = '';

    for(let i=0; i<list.length; i++){
      const l = list[i];
      const statClass = l.returned_at ? 'available' : 'borrowed';
      const statText = l.returned_at ? '반납 완료' : '대여 중';

      histHtml += '<tr><td><b>' + safe(fmtName(l.asset_id)) +
        '</b><div class="asset-id">' + safe(l.asset_id) +
        '</div></td><td>' + safe(l.borrower_name) +
        '</td><td>' + dateText(l.borrowed_at) +
        '</td><td>' + dateText(l.due_date) +
        '</td><td>' + dateText(l.returned_at) +
        '</td><td><span class="status ' + statClass + '">' +
        statText + '</span></td></tr>';
    }

    $('historyRows').innerHTML = '<div class="table-wrap"><table><thead><tr><th>비품 / 식별번호</th><th>대여자</th><th>시작일</th><th>예정 반납일</th><th>실제 반납일</th><th>상태</th></tr></thead><tbody>' +
      histHtml + '</tbody></table></div>';
  } else {
    $('historyRows').innerHTML = '<div class="empty">검색 결과가 없습니다.</div>';
  }
}

function openModal(mode, id){
  lastFocusedElement = document.activeElement;
  if(id === undefined) id = null;

  modalMode = mode;
  modalId = id;

  $('modalBackdrop').classList.add('open');

  const a = id ? assetFor(id) : null;

  let titleText = '관리자 로그인';

  if(mode === 'asset'){
    titleText = a ? '비품 정보 수정' : '비품 등록';
  } else if(mode === 'borrow'){
    titleText = '대여';
  } else if(mode === 'return'){
    titleText = '반납 처리';
  } else if(mode === 'editLoan'){
    titleText = '대여 기록 수정';
  } else if(mode === 'consumable'){
    titleText = id ? '소모품 정보 수정' : '소모품 등록';
  } else if(mode === 'reorder'){
    titleText = '재주문 요청';
  } else if(mode === 'movement'){
    titleText = '재고 변동 기록';
  } else if(mode === 'quickReturn'){
    titleText = '빠른 반납';
  } else if(mode === 'quickReorder'){
    titleText = '빠른 구매요청';
  }

  $('modalTitle').textContent = titleText;

  let target = null;

  for(let i=0; i<loans.length; i++){
    if(String(loans[i].id) === String(id)){
      target = loans[i];
      break;
    }
  }

  const lName = target ? (target.borrower_name || '') : '';
  const lDue = target ? (target.due_date || today()) : today();
  const lMemo = target ? (target.memo || '') : '';
  const lStart = target ? (target.borrowed_at || today()) : today();
  const assetObjName = target ? fmtName(target.asset_id) : '';

  let parts = [];

  if(mode === 'asset'){
    const aId = a && a.id ? a.id : nextAssetId();
    const aCat = a && a.category ? a.category : '';
    const aName = a && a.name ? a.name : '';
    const aLoc = a && a.location ? a.location : '';
    const aNote = a && a.note ? a.note : '';
    const isReadonly = a ? 'readonly' : '';
    const selAvail = (!a || a.status === 'available') ? 'selected' : '';
    const selMaint = (a && a.status === 'maintenance') ? 'selected' : '';

    parts.push('<div class="form-grid">');
    parts.push('<label class="field">식별번호 *<input name="id" required value="' + safe(aId) + '" ' + isReadonly + ' placeholder="EQ-001"></label>');
    parts.push('<label class="field">분류 *<input name="category" required value="' + safe(aCat) + '" placeholder="측정공구"></label>');
    parts.push('<label class="field full">비품명 *<input name="name" required value="' + safe(aName) + '"></label>');
    parts.push('<label class="field full">보관 위치<input name="location" value="' + safe(aLoc) + '" placeholder="분석실 캐비닛 A"></label>');
    parts.push('<label class="field">상태<select name="status"><option value="available" ' + selAvail + '>사용 가능</option><option value="maintenance" ' + selMaint + '>수리 중</option></select></label>');
    parts.push('<label class="field">비고<input name="note" value="' + safe(aNote) + '"></label>');
    parts.push('</div>');
  } else if(mode === 'borrow'){
    const avail = assets.filter(function(x){
      return statusFor(x) === 'available';
    });

    const preselectedAsset = id ? assetFor(id) : null;
    const lastBorrower = localStorage.getItem('labstock_last_borrower_name') || '';

    // 미반납 비품 사전 점검 (친절한 리마인드)
    const overdueCheck = getMyOverdueLoan(lastBorrower);
    if(overdueCheck.isLocked){
      toast('💡 대여 중인 [' + fmtName(overdueCheck.loan.asset_id) + '] 비품이 있어요! 사용이 끝나셨다면 먼저 반납 처리해 드릴게요 :)', 4500);
      closeModal();
      setTimeout(function(){ openModal('return', overdueCheck.loan.id); }, 350);
      return;
    }

    if(preselectedAsset){
      parts.push('<div class="selected-asset-box">');
      parts.push('<div class="selected-asset-badge"><span class="status available">대여 가능</span><span class="asset-id">' + safe(preselectedAsset.id) + '</span></div>');
      parts.push('<div class="selected-asset-title">' + safe(preselectedAsset.name) + '</div>');
      parts.push('<div class="selected-asset-sub">📍 보관 위치: ' + safe(preselectedAsset.location || '연구실 지정 장소') + '</div>');
      parts.push('</div>');
      parts.push('<input type="hidden" name="asset_id" value="' + safe(preselectedAsset.id) + '">');
    } else {
      let optHtml = '';
      if(avail.length > 0){
        for(let i=0; i<avail.length; i++){
          const x = avail[i];
          optHtml += '<option value="' + safe(x.id) + '">' + safe(x.id) + ' · ' + safe(x.name) + ' (' + safe(x.location || '위치 미지정') + ')' + '</option>';
        }
      } else {
        optHtml = '<option value="" disabled selected>대여 가능한 비품이 없습니다 (모두 대여 중)</option>';
      }
      parts.push('<div class="form-grid">');
      parts.push('<label class="field full">대여 비품 선택 *<select name="asset_id" required ' + (avail.length === 0 ? 'disabled' : '') + '>' + optHtml + '</select></label>');
      parts.push('</div>');
    }

    parts.push('<div class="form-grid" style="margin-top:10px;">');
    parts.push('<label class="field full">대여자 이름 *<input name="borrower_name" required maxlength="100" autocomplete="name" placeholder="홍길동" value="' + safe(lastBorrower) + '"></label>');
    parts.push('<label class="field full">사용 목적 / 메모 (선택)<input name="memo" maxlength="500" placeholder="예: 3층 측정실 작업 (생략 가능)"></label>');
    parts.push('</div>');
    parts.push('<div class="borrow-fast-notice">💡 연구실 비품은 다 쓰신 후 언제든 편하게 반납해 주세요 :)</div>');
  } else if(mode === 'consumable'){
    if(!isAdmin()){
      parts.push('<p>소모품 등록 및 수정은 관리자 로그인이 필요합니다.</p>');
    } else {
      const c = consumableFor(id);

      parts.push('<div class="form-grid">');
      parts.push('<label class="field full">소모품명 *<input name="name" required maxlength="160" value="' + safe(c ? c.name : '') + '" placeholder="예: 200 µL 피펫 팁"></label>');
      parts.push('<label class="field">분류<input name="category" value="' + safe(c ? c.category : '') + '" placeholder="팁·장갑·시약"></label>');
      parts.push('<label class="field">단위 *<input name="unit" required value="' + safe(c ? c.unit : '개') + '" placeholder="박스, 병, 팩"></label>');
      parts.push('<label class="field">현재 수량 *<input name="quantity" type="number" min="0" step="any" required value="' + safe(c ? c.quantity : 0) + '"></label>');
      parts.push('<label class="field">최소 보유량 *<input name="min_quantity" type="number" min="0" step="any" required value="' + safe(c ? c.min_quantity : 1) + '"></label>');
      parts.push('<label class="field full">보관 위치 *<input name="location" required maxlength="200" value="' + safe(c ? c.location : '') + '" placeholder="예: 실험실 A · 2번 캐비닛 · 3번째 서랍"></label>');
      parts.push('<label class="field full">비고<textarea name="note" rows="2" maxlength="500">' + safe(c ? c.note : '') + '</textarea></label>');
      parts.push('</div>');
    }
  } else if(mode === 'movement'){
    const c = consumableFor(id);
    const moveType = window.__labstockMovementType === 'in' ? 'in' : 'use';

    if(!isAdmin() && moveType !== 'use'){
      parts.push('<p>입고 기록은 관리자 로그인이 필요합니다.</p>');
    } else if(!c){
      parts.push('<p>소모품을 찾을 수 없습니다.</p>');
    } else {
      parts.push('<p><b>' + safe(c.name) + '</b> · 현재 재고 <b>' +
        safe(c.quantity) + ' ' + safe(c.unit || '개') +
        '</b><br><span class="sub">' + safe(c.location || '위치 미등록') + '</span></p>');

      parts.push('<div class="form-grid" style="margin-top:16px">');
      if(isAdmin()){
        parts.push('<label class="field">기록 유형<select name="movement_type"><option value="use" ' +
          (moveType === 'use' ? 'selected' : '') +
          '>사용 / 재고 차감</option><option value="in" ' +
          (moveType === 'in' ? 'selected' : '') +
          '>입고 / 재고 증가</option></select></label>');
      } else {
        parts.push('<input type="hidden" name="movement_type" value="use">');
        parts.push('<p class="field full">기록 유형: 사용 / 재고 차감</p>');
      }
      // 사용(차감)일 때만 현재 재고를 상한으로 둔다. 입고는 상한 없음 (재고 0인 품목도 입고 가능해야 함)
      parts.push('<label class="field">수량 *<input name="quantity" type="number" min="0.01" step="any"' +
        (moveType === 'use' ? ' max="' + Math.max(0, Number(c.quantity)) + '"' : '') + ' required></label>');
      parts.push('<label class="field full">기록자 *<input name="actor" required maxlength="100" placeholder="이름"></label>');
      parts.push('<label class="field full">메모<textarea name="note" rows="2" maxlength="500" placeholder="사용 목적 또는 입고 정보"></textarea></label>');
      parts.push('</div><p class="form-hint">저장 즉시 공용 재고 수량이 반영됩니다. 사용 기록으로 재고가 0 미만이 되지는 않습니다.</p>');
    }
  } else if(mode === 'reorder'){
    const c = consumableFor(id);

    if(!c){
      parts.push('<p>소모품을 찾을 수 없습니다.</p>');
    } else {
      parts.push('<p><b>' + safe(c.name) + '</b> · 현재 ' +
        safe(c.quantity) + ' ' + safe(c.unit || '개') +
        ' · ' + safe(c.location || '위치 미등록') + '</p>');

      parts.push('<div class="form-grid" style="margin-top:16px">');
      parts.push('<label class="field">요청 수량 *<input name="requested_quantity" type="number" min="0.01" step="any" required value="' +
        Math.max(1, Number(c.min_quantity) - Number(c.quantity)) + '"></label>');
      parts.push('<label class="field">요청자 *<input name="requester" required maxlength="100" placeholder="이름"></label>');
      parts.push('<label class="field full">메모<textarea name="note" rows="2" maxlength="500" placeholder="구매처, 제품번호 등 (선택)"></textarea></label></div>');
    }
  } else if(mode === 'quickReorder'){
    // 구매요청은 비로그인 사용자도 가능
    {
      const list = consumables.slice().sort(function(a,b){
        const ao = Number(a.quantity) <= 0 ? 0 : (Number(a.quantity) <= Number(a.min_quantity) ? 1 : 2);
        const bo = Number(b.quantity) <= 0 ? 0 : (Number(b.quantity) <= Number(b.min_quantity) ? 1 : 2);

        if(ao !== bo) return ao - bo;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });

      if(!list.length){
        parts.push('<p>등록된 소모품이 없습니다.</p>');
      } else {
        const opt = list.map(function(c){
          const tag = Number(c.quantity) <= 0
            ? ' (재고 0)'
            : (Number(c.quantity) <= Number(c.min_quantity) ? ' (부족)' : '');

          return '<option value="' + safe(c.id) + '">' + safe(c.name) + tag + '</option>';
        }).join('');

        const first = list[0];
        const recQty = Math.max(1, Number(first.min_quantity) - Number(first.quantity));

        parts.push('<div class="form-grid">');
        parts.push('<label class="field full">소모품 *<select name="consumable_id" required>' + opt + '</select></label>');
        parts.push('<label class="field">요청 수량 *<input name="requested_quantity" type="number" min="0.01" step="any" required value="' + recQty + '"></label>');
        parts.push('<label class="field">요청자 *<input name="requester" required maxlength="100" placeholder="이름"></label>');
        parts.push('<label class="field full">메모<textarea name="note" rows="2" maxlength="500" placeholder="구매처, 제품번호 등 (선택)"></textarea></label>');
        parts.push('</div>');
        parts.push('<p class="form-hint">재고가 0인 품목은 즉시 구매요청으로 연결됩니다.</p>');
      }
    }
  } else if(mode === 'quickReturn'){
    const active = loans.filter(function(l){
      return !l.returned_at && canManageLoan(l);
    });

    if(!active.length){
      parts.push('<p>' + (isAdmin() ? '현재 대여 중인 비품이 없습니다.' : '이 기기에서 대여한 반납 대기 비품이 없습니다.') + '</p>');
    } else {
      const opt = active.map(function(l){
        return '<option value="' + safe(l.id) + '">' +
          safe(l.asset_id) + ' · ' + safe(fmtName(l.asset_id)) +
          ' · ' + safe(l.borrower_name || '') + '</option>';
      }).join('');

      parts.push('<div class="form-grid">');
      parts.push('<label class="field full">반납할 비품 *<select name="loan_id" required>' + opt + '</select></label>');
      parts.push('<label class="field">실제 반납일 *<input name="returned_at" type="date" required value="' + today() + '"></label>');
      parts.push('<label class="field full">반납 메모<textarea name="return_memo" rows="2" maxlength="500" placeholder="파손·분실 여부 등"></textarea></label>');
      parts.push('</div>');
    }
  } else if(mode === 'editLoan'){
    parts.push('<p><b>' + safe(assetObjName) + '</b> · ' + safe(lName) + '</p>');
    parts.push('<div class="form-grid">');
    parts.push('<label class="field full">대여자 이름 *<input name="borrower_name" required maxlength="100" value="' + safe(lName) + '"></label>');
    parts.push('<label class="field full">반납 예정일 *<input name="due_date" type="date" required min="' + lStart + '" value="' + safe(lDue) + '"></label>');
    parts.push('<label class="field full">메모<textarea name="memo" rows="2" maxlength="500">' + safe(lMemo) + '</textarea></label>');
    parts.push('</div>');
  } else if(mode === 'return'){
    parts.push('<p><b>' + safe(assetObjName) + '</b> · ' + safe(lName) + '</p>');
    parts.push('<div class="form-grid">');
    parts.push('<label class="field full">실제 반납일 *<input name="returned_at" type="date" required value="' + today() + '" min="' + lStart + '"></label>');
    parts.push('<label class="field full">반납 메모<textarea name="return_memo" rows="2" maxlength="500" placeholder="파손·분실 여부 등"></textarea></label>');
    parts.push('</div>');
  } else {
    parts.push('<label class="field">관리자 이메일<input name="email" type="email" required autocomplete="username"></label>');
    parts.push('<label class="field" style="margin-top:12px">비밀번호<input name="password" type="password" required autocomplete="current-password"></label>');
    parts.push('<p class="sub" style="margin-top:12px">Supabase에서 미리 생성한 관리자 계정만 로그인할 수 있도록 회원가입은 꺼두세요.</p>');
  }

  $('modalBody').innerHTML = parts.join('');

  // 관리자가 기록 유형을 바꾸면 수량 상한(max)도 함께 바꾼다
  if(mode === 'movement'){
    const typeSel = $('modalBody').querySelector('select[name="movement_type"]');
    const qtyInput = $('modalBody').querySelector('input[name="quantity"]');
    const stockItem = consumableFor(id);

    if(typeSel && qtyInput && stockItem){
      typeSel.addEventListener('change', function(){
        if(typeSel.value === 'use') qtyInput.max = Math.max(0, Number(stockItem.quantity));
        else qtyInput.removeAttribute('max');
      });
    }
  }

  let btnText = '저장';

  if(mode === 'borrow') btnText = '대여';
  else if(mode === 'return') btnText = '반납 완료';
  else if(mode === 'login') btnText = '로그인';
  else if(mode === 'editLoan') btnText = '수정 저장';
  else if(mode === 'consumable') btnText = '소모품 저장';
  else if(mode === 'reorder') btnText = '재주문 요청';
  else if(mode === 'movement') btnText = '재고 반영';
  else if(mode === 'quickReturn') btnText = '반납 완료';
  else if(mode === 'quickReorder') btnText = '구매요청';

  $('saveModal').textContent = btnText;

  const hasAvail = assets.some(function(x){
    return statusFor(x) === 'available';
  });

  $('saveModal').disabled = mode === 'borrow' &&
    (!hasAvail || !assets.some(function(x){
      return statusFor(x) === 'available' &&
        (selectedBorrowCategory === 'all' || topLevelCategory(x) === selectedBorrowCategory);
    }));

  setTimeout(function(){
    const focusables = $('modalBackdrop').querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)');
    if(focusables.length > 0){
      let targetFocus = focusables[0];
      for(let i=0; i<focusables.length; i++){
        const tag = focusables[i].tagName.toLowerCase();
        if(tag === 'input' || tag === 'select' || tag === 'textarea'){
          targetFocus = focusables[i];
          break;
        }
      }
      targetFocus.focus();
    }
  }, 50);
}

function nextAssetId(){
  let max = 0;

  assets.forEach(function(a){
    const m = String(a.id || '').match(/^EQ-(\d+)$/i);
    if(m) max = Math.max(max, Number(m[1]));
  });

  return 'EQ-' + String(max + 1).padStart(3, '0');
}

function showView(name){
  if((name === 'dashboard' || name === 'history') && !isAdmin()){
    name = 'inventory';
  }

  document.body.classList.toggle('home-active', name === 'home');

  document.querySelectorAll('.view').forEach(function(el){
    el.classList.toggle('active', el.id === 'view-' + name);
  });

  document.querySelectorAll('.nav[data-view]').forEach(function(el){
    el.classList.toggle('active', el.dataset.view === name);
  });
}

function scrollToReorderPanel(){
  showView('consumables');

  const el = document.getElementById('reorderPanel');
  if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
}

function firstOutOfStockConsumable(){
  const out = consumables.filter(function(c){
    return Number(c.quantity) <= 0;
  });

  if(out.length) return out[0];

  const low = consumables.filter(function(c){
    return Number(c.quantity) <= Number(c.min_quantity);
  });

  return low.length ? low[0] : null;
}

function openBestReorder(){
  showView('consumables');

  const c = firstOutOfStockConsumable();
  if(c) openModal('reorder', c.id);
  else openModal('quickReorder');
}

function closeModal(){
  $('modalBackdrop').classList.remove('open');
  $('modalForm').reset();

  if(window.__labstockFromHome){
    window.__labstockFromHome = false;
    showView('home');
  }

  if(lastFocusedElement && typeof lastFocusedElement.focus === 'function'){
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

// DB 오류 코드를 사용자가 이해할 수 있는 문장으로 변환
function friendlyError(err){
  const code = err && err.code;
  const msg = err && err.message ? err.message : '';

  if(code === '23505'){
    if(modalMode === 'borrow') return '이미 다른 사람이 대여한 비품입니다. 목록을 새로고침했습니다.';
    if(modalMode === 'asset') return '이미 사용 중인 식별번호입니다.';
  }

  if(code === '42501'){
    return '권한이 없습니다. 대여한 기기에서 처리하거나 관리자 로그인 후 다시 시도하세요.';
  }

  return msg || '요청 처리에 실패했습니다.';
}

// RLS 때문에 0건이 수정되어도 Supabase는 오류를 주지 않으므로 직접 확인
function requireRows(result, message){
  if(result.error) throw result.error;
  if(!result.data || !result.data.length) throw new Error(message);
}

function formValues(form){
  return Object.fromEntries(new FormData(form).entries());
}

async function saveForm(e){
  e.preventDefault();

  const form = $('modalForm');
  if(!form.reportValidity()) return;

  const v = formValues(form);
  const btn = $('saveModal');
  btn.disabled = true;

  // [로컬 테스트 모드 처리]
  if(isLocalMode || !db){
    if(modalMode === 'borrow'){
      const newLoan = {
        id: 'loan-' + Date.now(),
        asset_id: v.asset_id,
        borrower_name: v.borrower_name.trim(),
        borrowed_at: v.borrowed_at || today(),
        due_date: v.due_date || today(),
        memo: (v.memo || '').trim(),
        client_id: getClientId(),
        created_at: new Date().toISOString()
      };
      loans.unshift(newLoan);
      recordMyLoanId(newLoan.id);
      saveLocalStorage();
      closeModal();
      toast("'" + fmtName(v.asset_id) + "' 대여가 등록되었습니다.");
      btn.disabled = false;
      return;
    } else if(modalMode === 'return' || modalMode === 'quickReturn'){
      const targetId = modalMode === 'return' ? modalId : v.loan_id;
      const target = loans.find(function(l){ return String(l.id) === String(targetId); });
      if(target){
        target.returned_at = v.returned_at || today();
        if(v.return_memo){
          target.memo = (target.memo ? target.memo + '\n' : '') + '반납 메모: ' + v.return_memo.trim();
        }
        saveLocalStorage();
        closeModal();
        toast('반납 처리되었습니다.');
      }
      btn.disabled = false;
      return;
    } else if(modalMode === 'asset'){
      if(modalId){
        const a = assets.find(function(x){ return x.id === modalId; });
        if(a){
          a.name = v.name.trim();
          a.category = v.category.trim();
          a.location = (v.location || '').trim();
          a.status = v.status || 'available';
          a.note = (v.note || '').trim();
        }
      } else {
        assets.push({
          id: v.id.trim(),
          name: v.name.trim(),
          category: v.category.trim(),
          location: (v.location || '').trim(),
          status: v.status || 'available',
          note: (v.note || '').trim()
        });
      }
      saveLocalStorage();
      closeModal();
      toast('비품이 저장되었습니다.');
      btn.disabled = false;
      return;
    } else if(modalMode === 'login'){
      admin = true;
      setAdminUI();
      closeModal();
      toast('관리자 테스트 모드로 전환되었습니다.');
      render();
      btn.disabled = false;
      return;
    }
  }

  try{
    if(modalMode === 'login'){
      const {data, error} = await db.auth.signInWithPassword({
        email: v.email,
        password: v.password
      });

      if(error) throw error;

      session = data.session;
      await refreshAdminState();

      if(!admin){
        await db.auth.signOut();
        session = null;
        await refreshAdminState();
        throw new Error('이 계정에 관리자 권한이 없습니다. Supabase user_roles에 admin 역할을 등록하세요.');
      }

      closeModal();
      toast('관리자 로그인 완료');
      await loadData();
      return;
    }

    if(modalMode === 'asset'){
      if(!isAdmin()) throw new Error('비품 등록·수정은 관리자 로그인이 필요합니다.');

      const payload = {
        id: v.id.trim(),
        name: v.name.trim(),
        category: v.category.trim(),
        location: (v.location || '').trim(),
        status: v.status || 'available',
        note: (v.note || '').trim()
      };

      const result = modalId
        ? await db.from('assets').update(payload).eq('id', modalId)
        : await db.from('assets').insert(payload);

      if(result.error) throw result.error;
    } else if(modalMode === 'consumable'){
      if(!isAdmin()) throw new Error('소모품 등록·수정은 관리자 로그인이 필요합니다.');

      const payload = {
        name: v.name.trim(),
        category: (v.category || '기타').trim(),
        unit: v.unit.trim(),
        quantity: Number(v.quantity),
        min_quantity: Number(v.min_quantity),
        location: v.location.trim(),
        note: (v.note || '').trim(),
        updated_at: new Date().toISOString()
      };

      const result = modalId
        ? await db.from('consumables').update(payload).eq('id', modalId)
        : await db.from('consumables').insert(payload);

      if(result.error) throw result.error;
    } else if(modalMode === 'movement'){
      const movementType = v.movement_type === 'in' ? 'in' : 'use';
      if(movementType === 'in' && !isAdmin()){
        throw new Error('입고 기록은 관리자 로그인이 필요합니다.');
      }

      const c = consumableFor(modalId);
      if(!c) throw new Error('소모품을 찾을 수 없습니다.');

      const {error} = await db.rpc('record_consumable_movement', {
        p_consumable_id: c.id,
        p_movement_type: movementType,
        p_quantity: Number(v.quantity),
        p_actor: v.actor.trim(),
        p_note: (v.note || '').trim()
      });

      if(error) throw error;
    } else if(modalMode === 'reorder' || modalMode === 'quickReorder'){
      const c = modalMode === 'reorder'
        ? consumableFor(modalId)
        : consumableFor(v.consumable_id);

      if(!c) throw new Error('소모품을 찾을 수 없습니다.');

      const {error} = await db.from('reorder_requests').insert({
        consumable_id: c.id,
        requested_quantity: Number(v.requested_quantity),
        requester: v.requester.trim(),
        note: (v.note || '').trim(),
        status: 'pending'
      });

      if(error) throw error;
    } else if(modalMode === 'quickReturn'){
      const target = loans.find(function(l){
        return String(l.id) === String(v.loan_id);
      });

      if(!target) throw new Error('대여 기록을 찾을 수 없습니다. 새로고침 후 다시 시도하세요.');
      if(!canManageLoan(target)) throw new Error('본인이 대여한 기록만 반납 처리할 수 있습니다.');

      const memo = [
        target.memo || '',
        v.return_memo ? '반납 메모: ' + v.return_memo.trim() : ''
      ].filter(Boolean).join('\n');

      const result = await db.from('loans').update({
        returned_at: v.returned_at,
        memo: memo,
        updated_at: new Date().toISOString()
      }).eq('id', target.id).select('id');

      requireRows(result, '반납 처리되지 않았습니다. 대여한 기기/브라우저인지 확인하거나 관리자에게 요청하세요.');
    } else if(modalMode === 'borrow'){
      let currentSession = null;
      try {
        const {data: sessionData} = await db.auth.getSession();
        currentSession = sessionData ? sessionData.session : null;

        if(!currentSession || !currentSession.user || !currentSession.user.id){
          const {data, error} = await db.auth.signInAnonymously();
          if(!error && data) currentSession = data.session;
        }
      } catch(authErr) {
        console.warn('익명 세션 생성 건너뜀 (비활성화 또는 미설정):', authErr);
      }

      session = currentSession;
      const uid = (currentSession && currentSession.user) ? currentSession.user.id : null;

      // 1. 대여자 이름 로컬 기억
      if(v.borrower_name){
        localStorage.setItem('labstock_last_borrower_name', v.borrower_name.trim());
      }

      // 2. 제출 시 기존 대여 비품 친절 안내
      const submitOverdue = getMyOverdueLoan(v.borrower_name);
      if(submitOverdue.isLocked){
        throw new Error('대여 중인 [' + fmtName(submitOverdue.loan.asset_id) + '] 비품이 아직 반납되지 않았어요. 기존 비품을 먼저 반납해 주세요 :)');
      }

      const insPayload = {
        asset_id: v.asset_id,
        borrower_name: v.borrower_name.trim(),
        borrowed_at: v.borrowed_at || today(),
        due_date: v.due_date || today(),
        memo: (v.memo || '').trim(),
        client_id: getClientId(),
        user_id: uid
      };

      const insRes = await db.from('loans').insert(insPayload).select('id');

      if(insRes.error){
        if(insRes.error.message && insRes.error.message.includes('OVERDUE_LOCKOUT')){
          const cleanMsg = insRes.error.message.replace(/^.*OVERDUE_LOCKOUT:\s*/, '');
          throw new Error(cleanMsg);
        }
        throw insRes.error;
      }
      if(insRes.data && insRes.data.length && insRes.data[0].id){
        recordMyLoanId(insRes.data[0].id);
      }
    } else if(modalMode === 'return'){
      const target = loans.find(function(l){
        return String(l.id) === String(modalId);
      });

      if(!target) throw new Error('대여 기록을 찾을 수 없습니다. 새로고침 후 다시 시도하세요.');
      if(!canManageLoan(target)) throw new Error('본인이 대여한 기록만 반납 처리할 수 있습니다.');

      const memo = [
        target.memo || '',
        v.return_memo ? '반납 메모: ' + v.return_memo.trim() : ''
      ].filter(Boolean).join('\n');

      const result = await db.from('loans').update({
        returned_at: v.returned_at,
        memo: memo,
        updated_at: new Date().toISOString()
      }).eq('id', target.id).select('id');

      requireRows(result, '반납 처리되지 않았습니다. 대여한 기기/브라우저인지 확인하거나 관리자에게 요청하세요.');
    } else if(modalMode === 'editLoan'){
      const own = loans.find(function(l){ return String(l.id) === String(modalId); });
      if(!canManageLoan(own)) throw new Error('본인이 대여한 기록만 수정할 수 있습니다.');

      const result = await db.from('loans').update({
        borrower_name: v.borrower_name.trim(),
        due_date: v.due_date,
        memo: (v.memo || '').trim(),
        updated_at: new Date().toISOString()
      }).eq('id', modalId).select('id');

      requireRows(result, '수정되지 않았습니다. 대여한 기기/브라우저인지 확인하거나 관리자에게 요청하세요.');
    } else {
      throw new Error('알 수 없는 작업입니다.');
    }

    closeModal();
    toast('저장했습니다.');
    await loadData();
  } catch(err){
    console.error('저장/인증 실패:', err);
    toast(friendlyError(err));
    if(err && err.code === '23505') loadData();
  } finally {
    btn.disabled = false;
  }
}

function exportHistoryCsv(){
  const headers = ['비품 식별번호','비품명','대여자','대여 시작일','반납 예정일','실제 반납일','메모'];

  const rows = loans.map(function(l){
    return [l.asset_id, fmtName(l.asset_id), l.borrower_name, l.borrowed_at, l.due_date, l.returned_at || '', l.memo || ''];
  });

  // 대여자 이름/메모는 누구나 입력할 수 있으므로 =,+,-,@ 로 시작하면 엑셀 수식으로 실행되지 않게 막는다
  const cell = function(v){
    let t = String(v == null ? '' : v);
    if(/^[=+\-@\t\r]/.test(t)) t = "'" + t;
    return '"' + t.replace(/"/g, '""') + '"';
  };

  const csv = '\ufeff' + [headers].concat(rows).map(function(r){
    return r.map(cell).join(',');
  }).join('\r\n');

  const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8;'}));
  const a = document.createElement('a');

  a.href = url;
  a.download = 'labstock-history-' + today() + '.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function bindEvents(){
  window.addEventListener('online', function(){
    toast('네트워크가 복구되었습니다. 최신 데이터를 동기화합니다.');
    loadData();
  });
  window.addEventListener('offline', function(){
    toast('네트워크 연결이 끊어졌습니다. 읽기 전용 캐시로 동작합니다.');
    const conn = $('connection');
    if(conn){ conn.textContent = '오프라인 (읽기 전용)'; conn.style.color = '#b45309'; }
  });

  document.querySelectorAll('.nav[data-view]').forEach(function(el){
    el.addEventListener('click', function(){
      showView(el.dataset.view);
    });
  });

  document.addEventListener('click', function(e){
    const target = e.target.closest('button');
    if(!target) return;

    if(target.dataset.goto){
      showView(target.dataset.goto);
      return;
    }

    if(target.dataset.inventoryCategory){
      selectedInventoryCategory = target.dataset.inventoryCategory;
      renderInventory();
      return;
    }

    if(target.dataset.borrowCategory){
      updateBorrowCategory(target.dataset.borrowCategory);
      return;
    }

    if(target.dataset.borrow){
      openModal('borrow', target.dataset.borrow);
      return;
    }

    if(target.dataset.edit){
      if(!isAdmin()){
        toast('비품 수정은 관리자 로그인이 필요합니다.');
        return;
      }
      openModal('asset', target.dataset.edit);
      return;
    }

    if(target.dataset.return){
      const ln = loans.find(function(x){ return String(x.id) === String(target.dataset.return); });
      if(!canManageLoan(ln)){
        toast('본인이 대여한 기록만 반납 처리할 수 있습니다.');
        return;
      }
      openModal('return', target.dataset.return);
      return;
    }

    if(target.dataset.editLoan){
      const ln = loans.find(function(x){ return String(x.id) === String(target.dataset.editLoan); });
      if(!canManageLoan(ln)){
        toast('본인이 대여한 기록만 수정할 수 있습니다.');
        return;
      }
      openModal('editLoan', target.dataset.editLoan);
      return;
    }

    if(target.dataset.resetMock){
      loadLocalStorage(true);
      toast('테스트 비품 데이터 7종이 복구되었습니다.');
      openModal('borrow');
      return;
    }

    if(target.dataset.editConsumable){
      if(!isAdmin()){
        toast('소모품 수정은 관리자 로그인이 필요합니다.');
        return;
      }
      openModal('consumable', target.dataset.editConsumable);
      return;
    }

    if(target.dataset.reorder){
      openModal('reorder', target.dataset.reorder);
      return;
    }

    if(target.dataset.movement){
      const movementType = target.dataset.movementType || 'use';
      if(movementType === 'in' && !isAdmin()){
        toast('입고 기록은 관리자 로그인이 필요합니다.');
        return;
      }
      window.__labstockMovementType = movementType;
      openModal('movement', target.dataset.movement);
      return;
    }

    if(target.dataset.requestStatus){
      updateRequestStatus(target.dataset.requestStatus, target.dataset.status);
      return;
    }

    switch(target.id){
      case 'loginBtn':
        openModal('login');
        break;

      case 'logoutBtn':
        db.auth.signOut().then(function(){
          session = null;
          admin = false;
          setAdminUI();
          toast('로그아웃했습니다.');
          loadData();
        }).catch(function(err){
          console.error(err);
          toast('로그아웃 실패: ' + err.message);
        });
        break;

      case 'addAsset':
        if(isAdmin()) openModal('asset');
        else toast('관리자 로그인이 필요합니다.');
        break;

      case 'addConsumable':
        if(isAdmin()) openModal('consumable');
        else toast('소모품 등록은 관리자 로그인이 필요합니다.');
        break;

      case 'loanAdd':
      case 'quickBorrow':
      case 'inventoryQuickBorrow':
        openModal('borrow');
        break;

      case 'homeBorrow':
        window.__labstockFromHome = true;
        openModal('borrow');
        break;

      case 'homeReturn':
        window.__labstockFromHome = true;
        openModal('quickReturn');
        break;

      case 'homeReorder':
        window.__labstockFromHome = true;
        openModal('quickReorder');
        break;

      case 'mobileBorrow':
        openModal('borrow');
        break;

      case 'mobileReturn':
        showView('loans');
        openModal('quickReturn');
        break;

      case 'mobileReorder':
        openBestReorder();
        break;

      case 'topQrScan':
      case 'btnInventoryQr':
      case 'btnHomeQr':
      case 'mobileQrScan':
        startQrScanner();
        break;

      case 'closeQrModal':
        closeQrScanner();
        break;

      case 'closeModal':
      case 'cancelModal':
        closeModal();
        break;

      case 'exportCsv':
        if(isAdmin()) exportHistoryCsv();
        else toast('관리자 로그인이 필요합니다.');
        break;
    }
  });

  const addEvt = function(id, evt, handler){
    const el = $(id);
    if(el) el.addEventListener(evt, handler);
  };

  addEvt('modalForm', 'submit', saveForm);

  const mBackdrop = $('modalBackdrop');
  if(mBackdrop){
    mBackdrop.addEventListener('click', function(e){
      if(e.target === mBackdrop) closeModal();
    });
  }

  const qrBackdrop = $('qrModalBackdrop');
  if(qrBackdrop){
    qrBackdrop.addEventListener('click', function(e){
      if(e.target === qrBackdrop) closeQrScanner();
    });
  }

  addEvt('assetSearch', 'input', debounce(renderInventory, 180));
  addEvt('assetFilter', 'change', renderInventory);
  addEvt('consumableSearch', 'input', debounce(renderConsumables, 180));
  addEvt('consumableFilter', 'change', renderConsumables);
  addEvt('loanSearch', 'input', debounce(renderLoans, 180));
  addEvt('loanFilter', 'change', renderLoans);
  addEvt('historySearch', 'input', debounce(renderHistory, 180));

  // 접근성 키보드 제어: ESC로 닫기 및 포커스 트랩(Focus Trap)
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      const qrB = $('qrModalBackdrop');
      if(qrB && qrB.classList.contains('open')){
        e.preventDefault();
        closeQrScanner();
        return;
      }
      const backdrop = $('modalBackdrop');
      if(backdrop && backdrop.classList.contains('open')){
        e.preventDefault();
        closeModal();
        return;
      }
    }

    const backdrop = $('modalBackdrop');
    if(!backdrop || !backdrop.classList.contains('open')) return;

    if(e.key === 'Tab'){
      const focusables = Array.from(backdrop.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'));
      if(focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if(e.shiftKey && document.activeElement === first){
        e.preventDefault();
        last.focus();
      } else if(!e.shiftKey && document.activeElement === last){
        e.preventDefault();
        first.focus();
      }
    }
  });
}

// ==========================================
// [QR 코드 카메라 스캐너 컴포넌트]
// ==========================================
let html5QrScanner = null;

async function startQrScanner(){
  const backdrop = $('qrModalBackdrop');
  if(!backdrop) return;
  backdrop.classList.add('open');

  try {
    if(!html5QrScanner && window.Html5Qrcode){
      html5QrScanner = new Html5Qrcode("qrReader");
    }

    if(!html5QrScanner){
      toast('QR 스캐너 모듈을 초기화하는 중입니다.');
      closeQrScanner();
      return;
    }

    const config = {
      fps: 10,
      qrbox: { width: 220, height: 220 },
      aspectRatio: 1.0
    };

    await html5QrScanner.start(
      { facingMode: "environment" },
      config,
      onQrCodeSuccess,
      function(err){ /* 무시 */ }
    );
  } catch(err){
    console.error('카메라 시작 실패:', err);
    closeQrScanner();
    toast('카메라 접근 권한이 필요합니다.');
  }
}

async function closeQrScanner(){
  const backdrop = $('qrModalBackdrop');
  if(backdrop) backdrop.classList.remove('open');

  if(html5QrScanner && html5QrScanner.isScanning){
    try {
      await html5QrScanner.stop();
    } catch(e){
      console.warn('QR 스캐너 정지 경고:', e);
    }
  }
}

function onQrCodeSuccess(decodedText){
  if(navigator.vibrate) navigator.vibrate(100);

  closeQrScanner();

  let assetId = decodedText.trim();
  if(assetId.includes('=')) assetId = assetId.split('=').pop();
  else if(assetId.includes('#')) assetId = assetId.split('#').pop();

  const a = assets.find(function(x){
    return String(x.id).toLowerCase() === assetId.toLowerCase();
  });

  if(!a){
    toast('인식된 비품[' + assetId + ']을 목록에서 찾을 수 없습니다.');
    return;
  }

  const l = activeLoanFor(a.id);
  if(l){
    toast("'" + a.name + "' 반납 화면으로 이동합니다.");
    openModal('return', l.id);
  } else if(a.status === 'maintenance'){
    toast("'" + a.name + "'은(는) 현재 수리 중인 비품입니다.");
  } else {
    toast("'" + a.name + "' 대여를 진행합니다.");
    openModal('borrow', a.id);
  }
}

// ==========================================
// [대여 통계 및 수명 주기 분석 차트 위젯]
// ==========================================
let topAssetsChartInstance = null;

function calculateLoanStats(){
  const stats = {};

  loans.forEach(function(l){
    const aid = l.asset_id;
    if(!stats[aid]) stats[aid] = { count: 0, totalDays: 0 };
    stats[aid].count += 1;

    const start = new Date(l.borrowed_at || l.created_at || today());
    const end = l.returned_at ? new Date(l.returned_at) : new Date();
    const diff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    stats[aid].totalDays += diff;
  });

  const arr = Object.keys(stats).map(function(aid){
    const a = assetFor(aid);
    const cnt = stats[aid].count;
    const avg = (stats[aid].totalDays / cnt).toFixed(1);
    return {
      id: aid,
      name: a ? a.name : ('미등록 (' + aid + ')'),
      count: cnt,
      avgDays: avg
    };
  }).sort(function(a, b){ return b.count - a.count; });

  return arr.slice(0, 5);
}

function renderTopAssetsChart(){
  const canvas = $('topAssetsChart');
  if(!canvas || !window.Chart) return;

  const totalBadge = $('statTotalLoans');
  if(totalBadge) totalBadge.textContent = '총 대여 ' + loans.length + '건';

  const top5 = calculateLoanStats();
  if(top5.length === 0){
    canvas.parentElement.innerHTML = '<div class="empty">대여 기록이 충분하지 않습니다.</div>';
    return;
  }

  if(topAssetsChartInstance){
    topAssetsChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  topAssetsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top5.map(function(x){ return x.name; }),
      datasets: [{
        label: '대여 횟수',
        data: top5.map(function(x){ return x.count; }),
        backgroundColor: '#0f172a',
        borderRadius: 4,
        barThickness: 16
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          padding: 8,
          cornerRadius: 4,
          callbacks: {
            afterLabel: function(ctx){
              const idx = ctx.dataIndex;
              return '평균 대여 기간: ' + top5[idx].avgDays + '일';
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#64748b', font: { family: 'Pretendard Variable' } },
          grid: { color: '#e2e8f0' }
        },
        y: {
          ticks: { color: '#0f172a', font: { family: 'Pretendard Variable', weight: '500' } },
          grid: { display: false }
        }
      }
    }
  });
}

async function updateRequestStatus(id, status){
  if(!isAdmin()){
    toast('관리자 로그인이 필요합니다.');
    return;
  }

  const result = await db.from('reorder_requests').update({
    status: status,
    updated_at: new Date().toISOString()
  }).eq('id', id).select('id');

  if(result.error || !result.data || !result.data.length){
    console.error(result.error);
    toast('요청 상태 변경 실패: ' + (result.error ? result.error.message : '권한이 없거나 이미 삭제된 요청입니다.'));
    return;
  }

  toast(status === 'received'
    ? '입고 완료로 변경했습니다.'
    : '주문 진행 중으로 변경했습니다.');

  await loadData();
}

let realtimeChannel = null;

function subscribeRealtime(){
  if(!db || realtimeChannel) return;

  try {
    realtimeChannel = db.channel('labstock-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, function(){
        console.log('실시간 대여 변동 감지 -> 데이터 갱신');
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, function(){
        console.log('실시간 비품 변동 감지 -> 데이터 갱신');
        loadData();
      })
      .subscribe(function(status){
        if(status === 'SUBSCRIBED'){
          console.log('Supabase Realtime 실시간 동기화 활성화됨');
        }
      });
  } catch(e){
    console.warn('Realtime 구독 실패 (비활성화 상태):', e);
  }
}

async function initApp(){
  bindEvents();

  showView('inventory');

  // 이전 로컬 테스트 잔여 목 데이터 캐시 제거 (Supabase DB 전용)
  localStorage.removeItem('labstock_local_assets');
  localStorage.removeItem('labstock_local_loans');

  // 1. 초기 렌더링
  loadLocalStorage();

  // Supabase 클라이언트 확인 및 초기화
  ensureDb();

  // 2. Supabase가 설정되지 않은 경우 로컬 테스트 모드로 유지
  if(!db){
    const conn = $('connection');
    if(conn){
      conn.textContent = '로컬 테스트 모드';
      conn.style.color = '#15803d';
    }
    return;
  }

  // 3. Supabase가 설정된 경우에만 원격 연결 시도
  try{
    const {data, error} = await db.auth.getSession();
    if(!error && data && data.session){
      session = data.session;
      await refreshAdminState();
    }
  } catch(err){
    console.warn('세션 확인 실패. 로컬 테스트 모드를 유지합니다.');
  }

  await loadData();
  subscribeRealtime();
}

document.addEventListener('DOMContentLoaded', initApp);
