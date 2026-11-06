
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
function $(id){
  return document.getElementById(id);
}

function addEvt(id, evt, handler){
  const el = $(id);
  if(el) el.addEventListener(evt, handler);
}

// ==========================================
// [기능 스위치 & 로컬 Mock 데이터 스토리지]
// ==========================================
// 소모품 위치 안내 도감 기능 활성화
const ENABLE_CONSUMABLES = true;
// 연구장비 전자 로그북(사용일지) 기능 활성화 (독립 모듈 스위치 / 백도어 플래그)
const ENABLE_EQUIPMENT_LOGBOOK = true;
let isLocalMode = false;

// [연구장비 독립 관리] 비품(일반 공구/소모성 도구)과 완전히 분리된 전용 연구장비 목록 (HR-XRD 단독 등록)
const DEFAULT_RESEARCH_EQUIPMENTS = [
  { id: 'EQ-XRD-01', code: 'HR-XRD', name: 'HR-XRD (고분해능 X선 회절분석기)', model: 'SmartLab / Rigaku', location: 'IBS 2DQH XRD실', manager: '이강민 / 신현석 교수님', type: 'xrd' }
];
let researchEquipments = [];
let currentSelectedEquipment = 'EQ-XRD-01';

// [2DQH-XRD_log 공식 동기화 상수 및 상태]
const XRD_SCAN_CHIPS = ['θ/2θ','2θ/ω','2θ','ω','χ','φ'];
const XRD_WORK_START = 10 * 60; // 10:00 (Set min. after use 필수 기준 시작시각)
const XRD_WORK_END = 17 * 60;   // 17:00 (Set min. after use 필수 기준 종료시각)
const XRD_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
let xrdLogs = [];
let xrdMode = 'start'; // 'start', 'full', 'active'
let xrdFinishing = false;
let xrdEditId = null;
let xrdChk = { xray_max_ok: false, xray_min_ok: false, position_ok: false };
let xrdAlign = 'PB';
let xrdScanSel = new Set();
let xrdControlsInitialized = false;

// 2DQH 이차원양자헤테로구조체연구단 대표 연구장비 및 공구 표준 카탈로그
const DEFAULT_2DQH_ASSETS = [
  {
    id: 'EQ-001',
    name: '디지털 멀티미터',
    category: '측정공구',
    location: '분석실 캐비넷 A',
    status: 'available',
    note: 'Fluke 87V 트루 RMS 정밀 멀티미터'
  },
  {
    id: 'EQ-002',
    name: '버니어 캘리퍼스',
    category: '측정공구',
    location: '분석실 캐비넷 B',
    status: 'available',
    note: 'Mitutoyo 500-196-30 150mm 디지털 캘리퍼스'
  },
  {
    id: 'EQ-003',
    name: '육각렌치 세트',
    category: '공구',
    location: '공용 공구함',
    status: 'available',
    note: 'PB Swiss Tools 볼포인트 L형 육각렌치 9종 세트 (1.5-10mm)'
  },
  {
    id: 'EQ-004',
    name: '토크 드라이버 세트',
    category: '공구',
    location: '장비실 서랍 2',
    status: 'available',
    note: 'Wera 7440/41/42 정밀 가변 토크 스크루드라이버 & 비트 세트 (0.3-3.0 N·m)'
  },
  {
    id: 'EQ-005',
    name: '고정밀 ESD 핀셋 세트',
    category: '공구',
    location: '클린룸 글러브박스 앞',
    status: 'available',
    note: 'Dumont 스위스제 정밀 비자성 핀셋 5종 (2D 플레이크 전사용)'
  },
  {
    id: 'EQ-006',
    name: '디지털 오실로스코프',
    category: '실험장비',
    location: '3층 측정실 작업대 1',
    status: 'available',
    note: 'Tektronix MDO34 1GHz 4채널 혼합신호 오실로스코프'
  },
  {
    id: 'EQ-007',
    name: 'DC 프로그래머블 전원공급기',
    category: '실험장비',
    location: '3층 측정실 작업대 2',
    status: 'available',
    note: 'Keithley 2230G-30-1 삼중출력 DC 파워서플라이 (30V/1.5A x 2, 6V/5A x 1)'
  },
  {
    id: 'EQ-008',
    name: '정밀 광학현미경',
    category: '실험장비',
    location: '클린룸 광학실 1',
    status: 'available',
    note: 'Olympus BX53M 명시야/암시야 2D 헤테로구조 검사용 현미경'
  },
  {
    id: 'EQ-009',
    name: '핫플레이트 가열교반기',
    category: '실험장비',
    location: '화학실험실 흄후드 3',
    status: 'available',
    note: 'Corning PC-420D 디지털 세라믹 가열교반기'
  },
  {
    id: 'EQ-010',
    name: '초음파 세척기',
    category: '실험장비',
    location: '세척실 싱크대 B',
    status: 'available',
    note: 'Branson 2800 2.8L 정밀 탈기 초음파 배스 세척기'
  },
  {
    id: 'EQ-011',
    name: '정밀 분석 전자저울',
    category: '측정공구',
    location: '칭량실 제진대',
    status: 'available',
    note: 'Mettler Toledo MS105DU 0.01mg 세미마이크로 분석저울'
  },
  {
    id: 'EQ-012',
    name: '온도조절형 납땜 스테이션',
    category: '공구',
    location: '전자작업대 4',
    status: 'available',
    note: 'Hakko FX-888D 디지털 ESD 세이프 납땜 인두기'
  },
  {
    id: 'EQ-013',
    name: '진공 척 스핀코터',
    category: '실험장비',
    location: '소자공정 클린룸 B',
    status: 'available',
    note: 'Laurell WS-650Mz 진공척 포토레지스트/폴리머 박막 코터'
  },
  {
    id: 'EQ-014',
    name: '로터리 진공펌프',
    category: '실험장비',
    location: '진공챔버 라인 1',
    status: 'available',
    note: 'Edwards RV8 듀얼스테이지 오일 씰 로터리 펌프'
  },
  {
    id: 'EQ-015',
    name: '비접촉 적외선 레이저 온도계',
    category: '측정공구',
    location: '분석실 캐비넷 B',
    status: 'available',
    note: 'Fluke 62 MAX+ 듀얼 레이저 적외선 온도계 (-30°C~650°C)'
  },
  {
    id: 'EQ-016',
    name: '순환식 저온 냉각 칠러',
    category: '실험장비',
    location: '챔버 냉각라인',
    status: 'available',
    note: 'Thermo Scientific ThermoFlex 900 재순환 냉각 칠러'
  }
];

const DEFAULT_MOCK_ASSETS = DEFAULT_2DQH_ASSETS;

// 2DQH 이차원양자헤테로구조체연구단 시약 도감 표준 카탈로그 (외부 consumables_catalog.js 연동)
const DEFAULT_2DQH_CONSUMABLES = (typeof window !== 'undefined' && Array.isArray(window.DEFAULT_2DQH_CONSUMABLES) && window.DEFAULT_2DQH_CONSUMABLES.length > 0)
  ? window.DEFAULT_2DQH_CONSUMABLES
  : [];

function loadLocalStorage(forceReset){
  isLocalMode = false;
  const storedAssets = localStorage.getItem('labstock_local_assets');
  const storedLoans = localStorage.getItem('labstock_local_loans');
  const storedConsumables = localStorage.getItem('labstock_local_consumables');

  if(!forceReset && storedAssets){
    try {
      const parsed = JSON.parse(storedAssets);
      assets = Array.isArray(parsed) && parsed.length ? parsed : [...DEFAULT_2DQH_ASSETS];
    } catch(e){
      assets = [...DEFAULT_2DQH_ASSETS];
    }
  } else {
    assets = [...DEFAULT_2DQH_ASSETS];
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

  if(!forceReset && storedConsumables){
    try {
      let parsed = JSON.parse(storedConsumables);
      if(Array.isArray(parsed) && parsed.length > 0){
        // 일상 소모품(CS-001 ~ CS-010) 최신 규격(라텍스 S/M/L, 킴테크 등) 동기화
        const dailyMap = new Map(DEFAULT_2DQH_CONSUMABLES.slice(0, 10).map(function(d){ return [d.id, d]; }));
        parsed = parsed.map(function(c){
          if(dailyMap.has(c.id)) return Object.assign({}, dailyMap.get(c.id));
          return c;
        });

        const existingIds = new Set(parsed.map(function(c){ return c.id; }));
        const additions = DEFAULT_2DQH_CONSUMABLES.filter(function(c){ return !existingIds.has(c.id); });
        consumables = parsed.concat(additions);
        try { localStorage.setItem('labstock_local_consumables', JSON.stringify(consumables)); } catch(_) {}
      } else {
        consumables = [...DEFAULT_2DQH_CONSUMABLES];
      }
    } catch(e){
      consumables = [...DEFAULT_2DQH_CONSUMABLES];
    }
  } else {
    consumables = [...DEFAULT_2DQH_CONSUMABLES];
  }

  try {
    researchEquipments = JSON.parse(localStorage.getItem('labstock_research_equipments') || 'null');
    // 사용자 요구: HR-XRD 단독 등록 유지
    if(!Array.isArray(researchEquipments) || researchEquipments.length === 0 || researchEquipments.some(function(e){ return e.id !== 'EQ-XRD-01'; })){
      researchEquipments = [...DEFAULT_RESEARCH_EQUIPMENTS];
      try { localStorage.setItem('labstock_research_equipments', JSON.stringify(researchEquipments)); } catch(_) {}
    }
  } catch(e){
    researchEquipments = [...DEFAULT_RESEARCH_EQUIPMENTS];
  }

  try {
    xrdLogs = JSON.parse(localStorage.getItem('labstock_xrd_logs') || 'null');
    if(!Array.isArray(xrdLogs) || xrdLogs.length === 0){
      xrdLogs = [
        {
          id: 1,
          reservation_no: '255236',
          used_on: today(),
          start_time: '10:00',
          end_time: '11:30',
          duration_min: 90,
          status: 'done',
          chiller_start: 22.1,
          chiller_end: 22.3,
          vacuum_start: 92,
          vacuum_end: 185,
          xray_max_ok: true,
          xray_min_ok: false,
          position_ok: true,
          align: 'PB',
          scan_type: '2θ/ω, φ',
          sample_name: 'MoS2 monolayer on sapphire',
          meas_info: 'Rocking curve & in-plane scan',
          sample_count: 2,
          affiliation: '2DQH',
          user_name: '이강민',
          professor: '신현석 교수님',
          memo: '정상 측정 완료',
          created_at: new Date(Date.now() - 3600000 * 3).toISOString()
        }
      ];
    }
  } catch(e){
    xrdLogs = [];
  }

  try {
    equipmentLogs = JSON.parse(localStorage.getItem('labstock_equipment_logs') || '[]');
  } catch(e){
    equipmentLogs = [];
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
  localStorage.setItem('labstock_local_consumables', JSON.stringify(consumables));
  localStorage.setItem('labstock_equipment_logs', JSON.stringify(equipmentLogs));
  localStorage.setItem('labstock_research_equipments', JSON.stringify(researchEquipments));
  localStorage.setItem('labstock_xrd_logs', JSON.stringify(xrdLogs));
  
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

// ==========================================
// 애플리케이션 상태 저장소 (AppState Store)
// ==========================================
let assets = [];
let loans = [];
let consumables = [];
let equipmentLogs = [];
let reorderRequests = [];
let stockMovements = [];
let consumablesAvailable = true;
let session = null;
let admin = false;
let borrowedAssetIds = new Set();
let activeLoanMap = new Map();
let lastFocusedElement = null;
let selectedInventoryCategory = 'all';
let selectedBorrowCategory = 'all';
let selectedConsumableCategory = '자주찾는 소모품';
let showOnlyControlledReagents = false;
let modalMode = '';
let modalId = null;

const AppState = {
  get assets(){ return assets; },
  set assets(v){ assets = v; },
  get loans(){ return loans; },
  set loans(v){ loans = v; },
  get consumables(){ return consumables; },
  set consumables(v){ consumables = v; },
  get reorderRequests(){ return reorderRequests; },
  set reorderRequests(v){ reorderRequests = v; },
  get stockMovements(){ return stockMovements; },
  set stockMovements(v){ stockMovements = v; },
  get consumablesAvailable(){ return consumablesAvailable; },
  set consumablesAvailable(v){ consumablesAvailable = v; },
  get session(){ return session; },
  set session(v){ session = v; },
  get admin(){ return admin; },
  set admin(v){ admin = v; },
  get borrowedAssetIds(){ return borrowedAssetIds; },
  set borrowedAssetIds(v){ borrowedAssetIds = v; },
  get activeLoanMap(){ return activeLoanMap; },
  set activeLoanMap(v){ activeLoanMap = v; },
  get selectedInventoryCategory(){ return selectedInventoryCategory; },
  set selectedInventoryCategory(v){ selectedInventoryCategory = v; },
  get selectedBorrowCategory(){ return selectedBorrowCategory; },
  set selectedBorrowCategory(v){ selectedBorrowCategory = v; },
  get selectedConsumableCategory(){ return selectedConsumableCategory; },
  set selectedConsumableCategory(v){ selectedConsumableCategory = v; },
  get modalMode(){ return modalMode; },
  set modalMode(v){ modalMode = v; },
  get modalId(){ return modalId; },
  set modalId(v){ modalId = v; }
};
window.AppState = AppState;

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

function today(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return y + '-' + m + '-' + day;
}

function calcPastDate(days = 1){
  const d = new Date();
  d.setDate(d.getDate() - Number(days));
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return y + '-' + m + '-' + day;
}

function dateText(d){
  if(!d) return '—';
  return String(d).replace(/-/g, '.');
}

// 스마트 반납 예정일 계산 (기본 24시간 / 주말 토·일은 연구실 휴무 감안하여 월요일로 보정)
function calcSmartDueDate(days = 1){
  return calcSmartDueDateFor(today(), days);
}

function calcSmartDueDateFor(baseDateStr, days = 1){
  const base = baseDateStr ? new Date(baseDateStr + 'T00:00:00') : new Date();
  base.setDate(base.getDate() + Number(days));
  const dayOfWeek = base.getDay();
  if(dayOfWeek === 6){ // 토요일 -> 월요일 (+2일)
    base.setDate(base.getDate() + 2);
  } else if(dayOfWeek === 0){ // 일요일 -> 월요일 (+1일)
    base.setDate(base.getDate() + 1);
  }
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

// 사용자 요청에 따라 짜치는 D-Day / 기한 압박 배지 표기를 완전히 제거
function getDDayBadge(){
  return '';
}

// 대여 기한 및 24시간 미만 잔여 여부 판정 함수
function getLoanDeadlineInfo(l){
  if(!l) return { isOverdue: false, canExtend: false, hoursLeft: 0, text: '' };
  if(l.returned_at) return { isOverdue: false, canExtend: false, hoursLeft: 0, text: '반납 완료' };

  const now = Date.now();
  let deadlineMs = 0;

  if(l.due_date){
    if(/^\d{4}-\d{2}-\d{2}$/.test(l.due_date)){
      let timePart = '18:00:00';
      if(l.created_at && l.created_at.includes('T')){
        try {
          const cDate = new Date(l.created_at);
          if(!isNaN(cDate.getTime())){
            const hh = String(cDate.getHours()).padStart(2, '0');
            const mm = String(cDate.getMinutes()).padStart(2, '0');
            const ss = String(cDate.getSeconds()).padStart(2, '0');
            timePart = hh + ':' + mm + ':' + ss;
          }
        } catch(e){}
      }
      deadlineMs = new Date(l.due_date + 'T' + timePart).getTime();
    } else {
      deadlineMs = new Date(l.due_date).getTime();
    }
  } else if(l.created_at || l.borrowed_at){
    const startMs = new Date(l.created_at || (l.borrowed_at + 'T09:00:00')).getTime();
    deadlineMs = startMs + 24 * 60 * 60 * 1000;
  }

  if(!deadlineMs || isNaN(deadlineMs)){
    return { isOverdue: false, canExtend: true, hoursLeft: 24, text: '24시간' };
  }

  const diffMs = deadlineMs - now;
  const hoursLeft = diffMs / (1000 * 60 * 60);

  if(diffMs < 0){
    const overdueHours = Math.abs(Math.floor(hoursLeft));
    const overdueText = overdueHours >= 24
      ? Math.floor(overdueHours / 24) + '일 지남'
      : (overdueHours || 1) + '시간 지남';
    return {
      isOverdue: true,
      canExtend: true,
      hoursLeft: hoursLeft,
      text: overdueText
    };
  }

  const canExtend = hoursLeft < 24;
  let text = '';
  if(hoursLeft < 1){
    const minsLeft = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    text = minsLeft + '분 남음';
  } else if(hoursLeft < 24){
    text = Math.floor(hoursLeft) + '시간 남음';
  } else {
    const daysLeft = Math.floor(hoursLeft / 24);
    text = daysLeft + '일 남음';
  }

  return {
    isOverdue: false,
    canExtend: canExtend,
    hoursLeft: hoursLeft,
    text: text
  };
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
      db.from('loans').select('*').order('borrowed_at', {ascending: false}),
      db.from('consumables').select('*').order('name')
    ]);

    let hasRemoteSuccess = false;

    if(!results[0].error && Array.isArray(results[0].data)){
      const remoteAssets = results[0].data;
      const remoteMap = new Map();
      remoteAssets.forEach(function(a){
        if(a.id) remoteMap.set(a.id, a);
      });

      // DB에 없는 표준 2DQH 연구장비 및 공구를 클라이언트 카탈로그에 보강
      const merged = [...remoteAssets];
      DEFAULT_2DQH_ASSETS.forEach(function(def){
        if(!remoteMap.has(def.id)){
          merged.push(def);
        }
      });

      assets = merged;
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

    if(results[2] && !results[2].error && Array.isArray(results[2].data)){
      const remoteConsumables = results[2].data;
      const remoteCMap = new Map();
      remoteConsumables.forEach(function(c){
        if(c.id) remoteCMap.set(c.id, c);
      });
      const mergedC = [...remoteConsumables];
      DEFAULT_2DQH_CONSUMABLES.forEach(function(def){
        if(!remoteCMap.has(def.id)){
          mergedC.push(def);
        }
      });
      consumables = mergedC;
      try {
        localStorage.setItem('labstock_real_cache_consumables', JSON.stringify(consumables));
      } catch(e){}
    } else {
      const cachedC = localStorage.getItem('labstock_real_cache_consumables');
      if(cachedC){
        try {
          const parsedC = JSON.parse(cachedC);
          if(Array.isArray(parsedC) && parsedC.length > 0){
            if(parsedC.length < DEFAULT_2DQH_CONSUMABLES.length){
              const cMap = new Map(parsedC.map(c => [c.id, c]));
              const merged = [...parsedC];
              DEFAULT_2DQH_CONSUMABLES.forEach(c => {
                if(!cMap.has(c.id)) merged.push(c);
              });
              consumables = merged;
              try { localStorage.setItem('labstock_real_cache_consumables', JSON.stringify(consumables)); } catch(_) {}
            } else {
              consumables = parsedC;
            }
          } else {
            consumables = [...DEFAULT_2DQH_CONSUMABLES];
          }
        } catch(e){
          consumables = [...DEFAULT_2DQH_CONSUMABLES];
        }
      } else {
        consumables = [...DEFAULT_2DQH_CONSUMABLES];
      }
    }

    if(ENABLE_EQUIPMENT_LOGBOOK){
      try {
        const { data: remoteLogs, error: logErr } = await db.from('equipment_logs').select('*').order('created_at', { ascending: false });
        if(!logErr && Array.isArray(remoteLogs)){
          equipmentLogs = remoteLogs;
          localStorage.setItem('labstock_equipment_logs', JSON.stringify(equipmentLogs));
  localStorage.setItem('labstock_research_equipments', JSON.stringify(researchEquipments));
  localStorage.setItem('labstock_xrd_logs', JSON.stringify(xrdLogs));
        }
      } catch(e){
        console.warn('Supabase equipment_logs 로드 건너뜀 (로컬 스토리지 유지):', e);
      }
    }

    if(!hasRemoteSuccess){
      console.warn('Supabase DB 연결 실패, 캐시된 실제 데이터를 로드합니다.');
      const cachedAssets = localStorage.getItem('labstock_real_cache_assets');
      if(cachedAssets){
        try {
          const parsed = JSON.parse(cachedAssets);
          assets = Array.isArray(parsed) && parsed.length ? parsed : [...DEFAULT_2DQH_ASSETS];
          loans = JSON.parse(localStorage.getItem('labstock_real_cache_loans') || '[]');
          const conn = $('connection');
          if(conn) { conn.textContent = '오프라인 (읽기 전용)'; conn.style.color = '#b45309'; }
        } catch(e){
          assets = [...DEFAULT_2DQH_ASSETS];
        }
      } else {
        assets = [...DEFAULT_2DQH_ASSETS];
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
    return getLoanDeadlineInfo(l).isOverdue;
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
        '</td><td>' + dateText(l.borrowed_at) +
        '</td><td><span class="status borrowed">대여 중</span></td></tr>';
    }

    $('dashboardLoans').innerHTML = '<table aria-label="현재 대여 중인 비품"><thead><tr><th scope="col">비품</th><th scope="col">대여자</th><th scope="col">대여일</th><th scope="col">상태</th></tr></thead><tbody>' +
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

function isEquipmentForLogbook(asset){
  if(!asset) return false;
  const cat = topLevelCategory(asset);
  if(cat === '실험장비' || cat === '측정공구') return true;
  const text = (String(asset.name || '') + ' ' + String(asset.category || '')).toLowerCase();
  return /장비|현미경|측정|스코프|스테이션|chamber|glovebox|chiller|oven|balance|analyzer|tester|펌프|laser|레이저|오실로스코프|전원|source|meter/i.test(text);
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

// 연구실 비품 스마트 영문/이니셜 검색 사전 (한글 비품명을 영문 약어로 빠른 검색)
const LAB_EQUIPMENT_ALIASES = {
  '멀티미터': ['multimeter', 'multi', 'dmm', 'tester', 'meter', 'm', 'd'],
  '디지털 멀티미터': ['digital multimeter', 'multimeter', 'multi', 'dmm', 'tester', 'meter', 'm', 'd'],
  '오실로스코프': ['oscilloscope', 'scope', 'dso', 'oscillo', 'o', 's'],
  '파워서플라이': ['power supply', 'powersupply', 'psu', 'power', 'p'],
  '전원공급기': ['power supply', 'powersupply', 'psu', 'power', 'p'],
  '캘리퍼스': ['calipers', 'caliper', 'vernier', 'c'],
  '버니어 캘리퍼스': ['calipers', 'caliper', 'vernier', 'c'],
  '육각렌치': ['hex wrench', 'allen key', 'allen wrench', 'hex', 'wrench', 'h', 'w'],
  '육각렌치 세트': ['hex wrench set', 'hex wrench', 'allen wrench', 'allen key', 'hex', 'wrench', 'h', 'w'],
  '토크 드라이버': ['torque driver', 'torque screwdriver', 'torque', 'driver', 't', 'd'],
  '토크 드라이버 세트': ['torque driver set', 'torque driver', 'torque screwdriver', 'torque', 'driver', 't', 'd'],
  '토크드라이버': ['torque driver', 'torque screwdriver', 'torque', 'driver', 't', 'd'],
  '고정밀 esd 핀셋 세트': ['tweezers', 'tweezer', 'esd tweezers', 'pinset', 't', 'p'],
  '핀셋': ['tweezers', 'tweezer', 'esd tweezers', 'pinset', 't', 'p'],
  '광학현미경': ['microscope', 'optical microscope', 'om', 'scope', 'm'],
  '현미경': ['microscope', 'optical microscope', 'om', 'scope', 'm'],
  '가열교반기': ['hotplate', 'stirrer', 'heater', 'h', 's'],
  '핫플레이트': ['hotplate', 'stirrer', 'heater', 'h'],
  '핫플레이트 가열교반기': ['hotplate', 'stirrer', 'heater', 'h'],
  '스핀코터': ['spin coater', 'spincoater', 'spin', 'coater', 's'],
  '진공 척 스핀코터': ['spin coater', 'spincoater', 'spin', 'coater', 's'],
  '전자저울': ['balance', 'electronic balance', 'scale', 'b', 's'],
  '정밀 분석 전자저울': ['balance', 'electronic balance', 'scale', 'b', 's'],
  '저울': ['balance', 'electronic balance', 'scale', 'b', 's'],
  '글러브박스': ['glovebox', 'glove box', 'gb', 'g'],
  '초음파세척기': ['sonicator', 'ultrasonic', 'cleaner', 'sonic', 'u', 's'],
  '초음파': ['sonicator', 'ultrasonic', 'sonic', 'u', 's'],
  '초음파 세척기': ['sonicator', 'ultrasonic', 'cleaner', 'sonic', 'u', 's'],
  '인두기': ['soldering iron', 'soldering', 'solder', 'iron', 's'],
  '납땜': ['soldering iron', 'soldering station', 'soldering', 'solder', 's'],
  '온도조절형 납땜 스테이션': ['soldering iron', 'soldering station', 'soldering', 'solder', 's'],
  '진공펌프': ['vacuum pump', 'pump', 'vacuum', 'p', 'v'],
  '로터리 진공펌프': ['vacuum pump', 'pump', 'vacuum', 'p', 'v'],
  '펌프': ['pump', 'p'],
  '온도계': ['thermometer', 'ir thermometer', 'temperature', 'fluke 62', 't'],
  '비접촉 적외선 레이저 온도계': ['thermometer', 'ir thermometer', 'temperature', 'fluke 62', 't'],
  '칠러': ['chiller', 'cooler', 'c'],
  '순환식 저온 냉각 칠러': ['chiller', 'cooler', 'c']
};

// 사전 컴파일된 알리아스 리스트 (Object.entries 반복 호출 방지)
const PRECOMPILED_ALIASES = Object.keys(LAB_EQUIPMENT_ALIASES).map(function(k){
  return {
    key: k.toLowerCase(),
    aliases: LAB_EQUIPMENT_ALIASES[k].map(function(a){ return a.toLowerCase(); })
  };
});

// 비품별 스마트 검색 프로필 캐시 생성 (초고속 O(1) 인덱스 매칭)
function getAssetSearchProfile(asset){
  if(asset._searchProfile) return asset._searchProfile;
  const id = (asset.id || '').toLowerCase();
  const name = (asset.name || '').toLowerCase();
  const category = (asset.category || '').toLowerCase();
  const location = (asset.location || '').toLowerCase();
  const note = (asset.note || '').toLowerCase();
  const textTarget = id + ' ' + name + ' ' + category + ' ' + location + ' ' + note;

  // 비품명에 해당하는 알리아스 사전 추출
  const matchedAliases = [];
  for(let i = 0; i < PRECOMPILED_ALIASES.length; i++){
    const entry = PRECOMPILED_ALIASES[i];
    if(name.includes(entry.key)){
      for(let j = 0; j < entry.aliases.length; j++){
        matchedAliases.push(entry.aliases[j]);
      }
    }
  }

  // 비품명 단어별 이니셜
  const words = name.split(/\s+/).filter(Boolean);
  const initials = words.map(function(w){ return w.charAt(0); }).join('');

  const profile = {
    textTarget: textTarget,
    aliases: matchedAliases,
    initials: initials
  };
  asset._searchProfile = profile;
  return profile;
}

function matchesSmartSearch(asset, query){
  if(!query) return true;
  const q = query.toLowerCase().trim();
  if(!q) return true;

  const profile = getAssetSearchProfile(asset);

  // 1. 기본 필드 직접 매칭 (ID, 이름, 카테고리, 보관 위치, 비고)
  if(profile.textTarget.includes(q)) return true;

  // 2. 영문 알리아스 및 약어 매칭 (캐시된 배열 직접 순회)
  const aliases = profile.aliases;
  for(let i = 0; i < aliases.length; i++){
    const alias = aliases[i];
    if(alias.startsWith(q) || alias.includes(q) || q.startsWith(alias)){
      return true;
    }
  }

  // 3. 비품명 단어별 이니셜 매칭
  if(profile.initials && profile.initials.startsWith(q)) return true;

  return false;
}

// 연구실 비품 3D 아이소메트릭 벡터 일러스트 에셋 라이브러리 (2DQH 톤앤매너 테마)
const EQUIPMENT_ICONS = {
  multimeter: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><rect x="15" y="8" width="34" height="48" rx="8" fill="#F59E0B"/><rect x="18" y="11" width="28" height="42" rx="5" fill="#1E293B"/><rect x="21" y="14" width="22" height="12" rx="3" fill="#E0F2FE"/><rect x="23" y="17" width="10" height="2" rx="1" fill="#0284C7"/><rect x="23" y="21" width="14" height="2" rx="1" fill="#0284C7"/><circle cx="32" cy="35" r="7" fill="#334155" stroke="#475569" stroke-width="1.5"/><line x1="32" y1="35" x2="32" y2="30" stroke="#C2272D" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="46" r="2" fill="#C2272D"/><circle cx="32" cy="46" r="2" fill="#0F172A"/><circle cx="40" cy="46" r="2" fill="#F59E0B"/></svg>',

  oscilloscope: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><rect x="10" y="13" width="44" height="38" rx="6" fill="#1E293B"/><rect x="12" y="15" width="40" height="34" rx="4" fill="#334155"/><rect x="15" y="18" width="26" height="26" rx="3" fill="#0F172A"/><line x1="15" y1="31" x2="41" y2="31" stroke="#1E293B" stroke-width="0.8" stroke-dasharray="1 1"/><line x1="28" y1="18" x2="28" y2="44" stroke="#1E293B" stroke-width="0.8" stroke-dasharray="1 1"/><path d="M16 31 Q20 20 24 31 T32 31 T40 31" stroke="#06B6D4" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="46" cy="22" r="3" fill="#94A3B8"/><circle cx="46" cy="30" r="3" fill="#94A3B8"/><circle cx="46" cy="38" r="2" fill="#C2272D"/><circle cx="46" cy="44" r="2" fill="#38BDF8"/></svg>',

  powersupply: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><rect x="11" y="11" width="42" height="42" rx="6" fill="#1E293B"/><rect x="13" y="13" width="38" height="38" rx="4" fill="#334155"/><rect x="16" y="16" width="15" height="10" rx="2" fill="#0F172A"/><text x="17.5" y="24" font-family="monospace" font-size="6.5" font-weight="bold" fill="#EF4444">30V</text><rect x="33" y="16" width="15" height="10" rx="2" fill="#0F172A"/><text x="34.5" y="24" font-family="monospace" font-size="6.5" font-weight="bold" fill="#10B981">5.0A</text><circle cx="23" cy="34" r="4" fill="#64748B" stroke="#94A3B8" stroke-width="1"/><circle cx="41" cy="34" r="4" fill="#64748B" stroke="#94A3B8" stroke-width="1"/><circle cx="20" cy="45" r="2.5" fill="#EF4444"/><circle cx="32" cy="45" r="2.5" fill="#10B981"/><circle cx="44" cy="45" r="2.5" fill="#0F172A"/></svg>',

  caliper: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><rect x="8" y="27" width="48" height="8" rx="1.5" fill="#94A3B8"/><line x1="16" y1="27" x2="16" y2="30" stroke="#64748B" stroke-width="1"/><line x1="20" y1="27" x2="20" y2="29" stroke="#64748B" stroke-width="0.8"/><line x1="24" y1="27" x2="24" y2="30" stroke="#64748B" stroke-width="1"/><line x1="28" y1="27" x2="28" y2="29" stroke="#64748B" stroke-width="0.8"/><line x1="32" y1="27" x2="32" y2="30" stroke="#64748B" stroke-width="1"/><path d="M8 27 L8 46 Q10 49 13 46 L13 35 L17 35 L17 27 Z" fill="#64748B"/><path d="M8 27 L8 14 Q10 12 12 14 L13 22 L16 27 Z" fill="#64748B"/><rect x="24" y="23" width="18" height="16" rx="3" fill="#1E293B"/><rect x="27" y="26" width="12" height="6" rx="1" fill="#BAE6FD"/><rect x="29" y="28" width="7" height="2" rx="0.5" fill="#0284C7"/><path d="M24 39 L24 47 Q26 50 28 47 L30 39 Z" fill="#475569"/></svg>',

  hex_wrench: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><rect x="18" y="24" width="28" height="26" rx="4" fill="#C2272D"/><rect x="20" y="26" width="24" height="22" rx="2" fill="#991B1B"/><polygon points="32,30 38,33.5 38,40.5 32,44 26,40.5 26,33.5" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2"/><polygon points="32,32.5 36,35 36,39.5 32,42 28,39.5 28,35" fill="#1E293B"/><path d="M23 24 L23 16 L27 16" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M29 24 L29 13 L35 13" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M35 24 L35 10 L43 10" stroke="#94A3B8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M41 24 L41 7 L51 7" stroke="#64748B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="51" cy="7" r="2.2" fill="#334155"/><polygon points="51,5.5 52.3,6.3 52.3,7.7 51,8.5 49.7,7.7 49.7,6.3" fill="#F8FAFC"/><line x1="23" y1="50" x2="23" y2="54" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round"/><line x1="29" y1="50" x2="29" y2="56" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/><line x1="35" y1="50" x2="35" y2="58" stroke="#94A3B8" stroke-width="3.5" stroke-linecap="round"/><line x1="41" y1="50" x2="41" y2="60" stroke="#64748B" stroke-width="4" stroke-linecap="round"/></svg>',

  torque_driver: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><path d="M10 27 C10 23 13 21 17 21 L27 21 C30 21 32 23 33 26 L33 38 C32 41 30 43 27 43 L17 43 C13 43 10 41 10 37 Z" fill="#1E293B"/><ellipse cx="12" cy="32" rx="3" ry="7" fill="#334155"/><rect x="18" y="23" width="9" height="18" rx="2" fill="#C2272D"/><rect x="19.5" y="27" width="6" height="10" rx="1" fill="#FEF2F2" stroke="#991B1B" stroke-width="0.8"/><line x1="22.5" y1="28" x2="22.5" y2="36" stroke="#C2272D" stroke-width="1"/><text x="20.5" y="34" font-family="monospace" font-size="4" font-weight="bold" fill="#0F172A">1.2</text><rect x="33" y="25" width="4" height="14" rx="1" fill="#64748B"/><line x1="35" y1="25" x2="35" y2="39" stroke="#334155" stroke-width="0.8" stroke-dasharray="1 1"/><rect x="37" y="29.5" width="13" height="5" fill="#94A3B8"/><line x1="37" y1="31" x2="50" y2="31" stroke="#E2E8F0" stroke-width="1"/><rect x="49" y="28" width="5" height="8" rx="1" fill="#475569"/><path d="M54 30 L59 31 L60 32 L59 33 L54 34 Z" fill="#334155"/><rect x="18" y="47" width="10" height="3" rx="0.8" fill="#64748B"/><polygon points="28,47 31,48.5 28,50" fill="#334155"/><rect x="32" y="47" width="10" height="3" rx="0.8" fill="#64748B"/><polygon points="42,47 45,48.5 42,50" fill="#334155"/></svg>',

  tweezers: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><path d="M12 18 C12 14 16 12 20 12 L24 12 C26 12 28 14 28 17 L22 46 C21 52 19 54 18 54 C17 54 16 52 16 48 Z" fill="#64748B"/><path d="M36 18 C36 14 32 12 28 12 L24 12 C22 12 20 14 20 17 L26 46 C27 52 29 54 30 54 C31 54 32 52 32 48 Z" fill="#94A3B8"/><line x1="18" y1="28" x2="22" y2="28" stroke="#334155" stroke-width="1"/><line x1="18" y1="31" x2="23" y2="31" stroke="#334155" stroke-width="1"/><line x1="19" y1="34" x2="24" y2="34" stroke="#334155" stroke-width="1"/><rect x="18" y="14" width="12" height="6" rx="2" fill="#1E293B"/><circle cx="24" cy="52" r="1.5" fill="#C2272D"/><text x="36" y="32" font-family="sans-serif" font-size="6.5" font-weight="bold" fill="#0284C7">ESD</text><text x="36" y="40" font-family="monospace" font-size="5" fill="#64748B">#5</text></svg>',

  microscope: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><ellipse cx="32" cy="53" rx="18" ry="4" fill="#334155"/><rect x="28" y="47" width="8" height="4" rx="1.5" fill="#E2E8F0"/><circle cx="32" cy="46" r="2.5" fill="#F59E0B"/><rect x="20" y="36" width="24" height="3" rx="1.5" fill="#1E293B"/><path d="M38 52 C46 52 48 30 40 22 C37 19 33 21 33 24" stroke="#475569" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="41" cy="38" r="4.5" fill="#94A3B8" stroke="#334155" stroke-width="1.5"/><circle cx="28" cy="27" r="4" fill="#334155"/><rect x="25" y="29" width="3" height="6" rx="1" fill="#C2272D"/><rect x="29" y="29" width="3" height="4.5" rx="1" fill="#F59E0B"/><path d="M28 25 L23 13" stroke="#64748B" stroke-width="4.5" stroke-linecap="round"/><rect x="20" y="9" width="6" height="4" rx="1.5" fill="#1E293B"/></svg>',

  hotplate: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><rect x="12" y="22" width="40" height="32" rx="6" fill="#334155"/><rect x="14" y="14" width="36" height="16" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/><ellipse cx="32" cy="22" rx="12" ry="4" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/><rect x="18" y="34" width="13" height="8" rx="2" fill="#0F172A"/><rect x="20" y="37" width="8" height="2" rx="0.5" fill="#EF4444"/><circle cx="34" cy="38" r="2" fill="#DC2626"/><circle cx="43" cy="38" r="4" fill="#64748B" stroke="#94A3B8" stroke-width="1"/></svg>',

  spincoater: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><rect x="12" y="22" width="40" height="32" rx="6" fill="#1E293B"/><ellipse cx="32" cy="22" rx="16" ry="7" fill="#334155" stroke="#64748B" stroke-width="1.5"/><ellipse cx="32" cy="22" rx="7" ry="3" fill="#0F172A"/><circle cx="32" cy="22" r="3" fill="#C2272D"/><path d="M16 22 C16 11 48 11 48 22 Z" fill="#38BDF8" fill-opacity="0.25" stroke="#38BDF8" stroke-width="1.5"/><rect x="18" y="36" width="16" height="8" rx="2" fill="#0F172A"/><rect x="21" y="39" width="10" height="2" rx="0.5" fill="#06B6D4"/><circle cx="41" cy="40" r="3.5" fill="#10B981"/></svg>',

  scale: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><rect x="12" y="36" width="40" height="18" rx="4" fill="#334155"/><rect x="16" y="12" width="32" height="24" rx="2" fill="#E0F2FE" fill-opacity="0.35" stroke="#94A3B8" stroke-width="1.5"/><rect x="30" y="27" width="4" height="9" fill="#64748B"/><ellipse cx="32" cy="27" rx="9" ry="2.5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1"/><rect x="18" y="42" width="18" height="7" rx="2" fill="#0F172A"/><rect x="20" y="44" width="12" height="2" rx="0.5" fill="#38BDF8"/><rect x="39" y="42" width="7" height="7" rx="1.5" fill="#C2272D"/></svg>',

  sonicator: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><rect x="13" y="16" width="38" height="36" rx="5" fill="#475569"/><rect x="9" y="24" width="4" height="8" rx="1.5" fill="#334155"/><rect x="51" y="24" width="4" height="8" rx="1.5" fill="#334155"/><rect x="15" y="14" width="34" height="5" rx="1.5" fill="#94A3B8"/><ellipse cx="32" cy="19" rx="12" ry="2.5" fill="#38BDF8" fill-opacity="0.4"/><path d="M27 28 Q32 25 37 28" stroke="#38BDF8" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M25 32 Q32 28 39 32" stroke="#38BDF8" stroke-width="1.5" fill="none" stroke-linecap="round"/><rect x="23" y="38" width="18" height="8" rx="2" fill="#0F172A"/><rect x="26" y="41" width="11" height="2" rx="0.5" fill="#10B981"/></svg>',

  soldering: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><rect x="11" y="22" width="28" height="30" rx="5" fill="#1E293B"/><rect x="16" y="27" width="16" height="8" rx="2" fill="#0F172A"/><rect x="19" y="30" width="10" height="2" rx="0.5" fill="#EF4444"/><circle cx="24" cy="42" r="3.5" fill="#475569" stroke="#64748B" stroke-width="1"/><rect x="42" y="36" width="12" height="16" rx="3" fill="#334155"/><path d="M47 36 L39 12" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/><path d="M39 12 L36 7" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/><path d="M48 48 C44 54 28 54 24 50" stroke="#0F172A" stroke-width="2" fill="none"/></svg>',

  pump: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><rect x="12" y="24" width="26" height="24" rx="4" fill="#334155"/><line x1="16" y1="28" x2="16" y2="44" stroke="#475569" stroke-width="1.5"/><line x1="21" y1="28" x2="21" y2="44" stroke="#475569" stroke-width="1.5"/><line x1="26" y1="28" x2="26" y2="44" stroke="#475569" stroke-width="1.5"/><line x1="31" y1="28" x2="31" y2="44" stroke="#475569" stroke-width="1.5"/><rect x="36" y="28" width="16" height="18" rx="3" fill="#1E293B"/><circle cx="44" cy="20" r="6" fill="#F8FAFC" stroke="#334155" stroke-width="1.5"/><line x1="44" y1="20" x2="46" y2="17" stroke="#C2272D" stroke-width="1.2" stroke-linecap="round"/><path d="M20 24 L20 17 L34 17 L34 24" stroke="#64748B" stroke-width="3" stroke-linecap="round" fill="none"/></svg>',

  chiller: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><rect x="14" y="16" width="36" height="38" rx="6" fill="#1E293B"/><rect x="16" y="18" width="32" height="34" rx="4" fill="#334155"/><rect x="19" y="21" width="16" height="10" rx="2" fill="#0F172A"/><text x="21" y="28.5" font-family="monospace" font-size="6.5" font-weight="bold" fill="#38BDF8">4.0°C</text><circle cx="41" cy="26" r="3" fill="#10B981"/><line x1="19" y1="36" x2="45" y2="36" stroke="#475569" stroke-width="1.5"/><line x1="19" y1="40" x2="45" y2="40" stroke="#475569" stroke-width="1.5"/><line x1="19" y1="44" x2="45" y2="44" stroke="#475569" stroke-width="1.5"/><rect x="22" y="10" width="5" height="7" rx="1.5" fill="#0284C7"/><rect x="37" y="10" width="5" height="7" rx="1.5" fill="#EF4444"/><circle cx="21" cy="54" r="2.5" fill="#0F172A"/><circle cx="43" cy="54" r="2.5" fill="#0F172A"/></svg>',

  thermometer: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><path d="M18 20 C18 16 21 14 25 14 L42 14 C46 14 48 16 48 20 L48 30 C48 34 45 36 41 36 L34 36 L31 52 C30 55 27 57 24 56 C21 55 20 52 21 48 L25 36 L22 36 C19 36 18 33 18 30 Z" fill="#F59E0B"/><rect x="26" y="18" width="15" height="12" rx="2" fill="#0F172A"/><text x="28" y="26.5" font-family="monospace" font-size="6" font-weight="bold" fill="#EF4444">24.5°</text><circle cx="48" cy="22" r="3" fill="#1E293B"/><circle cx="48" cy="22" r="1.2" fill="#EF4444"/><line x1="51" y1="22" x2="57" y2="22" stroke="#EF4444" stroke-width="1.2" stroke-dasharray="1 1"/><circle cx="58" cy="22" r="1" fill="#EF4444"/></svg>',

  tool: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><path d="M16 48 L28 36" stroke="#C2272D" stroke-width="7" stroke-linecap="round"/><path d="M28 36 L44 20" stroke="#94A3B8" stroke-width="3.5" stroke-linecap="round"/><path d="M44 20 L48 16" stroke="#475569" stroke-width="2" stroke-linecap="round"/><path d="M20 18 L42 40 L38 46" stroke="#475569" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',

  default: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="#F8FAFC"/><polygon points="32,14 46,22 46,38 32,46 18,38 18,22" fill="#FEF2F2" stroke="#C2272D" stroke-width="2"/><circle cx="32" cy="14" r="3" fill="#C2272D"/><circle cx="46" cy="22" r="3" fill="#58595B"/><circle cx="46" cy="38" r="3" fill="#C2272D"/><circle cx="32" cy="46" r="3" fill="#58595B"/><circle cx="18" cy="38" r="3" fill="#C2272D"/><circle cx="18" cy="22" r="3" fill="#58595B"/><circle cx="32" cy="30" r="5" fill="#C2272D"/><path d="M32 20 L32 25 M32 35 L32 40 M23 25 L27 28 M37 32 L41 35 M41 25 L37 28 M27 32 L23 35" stroke="#94A3B8" stroke-width="1.2"/></svg>'
};

function getEquipmentCategoryKey(assetName, category){
  const text = ((assetName || '') + ' ' + (category || '')).toLowerCase();
  if(/육각|allen|hex.*wrench|l.*렌치/.test(text)) return 'hex_wrench';
  if(/토크|torque|드라이버|driver/.test(text)) return 'torque_driver';
  if(/핀셋|tweezer|esd/.test(text)) return 'tweezers';
  if(/멀티미터|multimeter|dmm|테스터|tester|전압계/.test(text)) return 'multimeter';
  if(/오실로스코프|oscilloscope|scope|dso/.test(text)) return 'oscilloscope';
  if(/파워서플라이|전원공급기|power\s*supply|psu/.test(text)) return 'powersupply';
  if(/캘리퍼스|caliper|버니어/.test(text)) return 'caliper';
  if(/현미경|microscope/.test(text)) return 'microscope';
  if(/핫플레이트|가열교반기|교반기|stirrer|hotplate|히터/.test(text)) return 'hotplate';
  if(/스핀코터|spin\s*coater/.test(text)) return 'spincoater';
  if(/저울|balance|scale/.test(text)) return 'scale';
  if(/초음파|세척기|sonicator|ultrasonic/.test(text)) return 'sonicator';
  if(/인두기|납땜|soldering/.test(text)) return 'soldering';
  if(/진공펌프|로터리|펌프|pump|vacuum/.test(text)) return 'pump';
  if(/칠러|chiller|냉각/.test(text)) return 'chiller';
  if(/온도계|thermometer|fluke 62|적외선/.test(text)) return 'thermometer';
  if(/렌치|공구|wrench|pliers/.test(text)) return 'tool';
  return 'default';
}

function getEquipmentImageHtml(asset, sizeVariant = 'thumb'){
  if(!asset) return '';
  if(asset.image_url && typeof asset.image_url === 'string' && asset.image_url.trim()){
    const safeUrl = safe(asset.image_url.trim());
    return '<img src="' + safeUrl + '" class="asset-img" alt="' + safe(asset.name) + '" loading="lazy">';
  }
  const key = getEquipmentCategoryKey(asset.name, asset.category);
  return EQUIPMENT_ICONS[key] || EQUIPMENT_ICONS['default'];
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
    const matchSearch = matchesSmartSearch(a, q);

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
        const info = getLoanDeadlineInfo(l);
        if(info.isOverdue){
          actionBtn += '<span class="status-chip overdue-chip">⚠️ 기간 지남 (' + safe(bName) + ')</span>';
        } else {
          actionBtn += '<span class="status-chip borrowed-chip">대여 중 (' + safe(bName) + ')</span>';
        }

        if(l && canManageLoan(l)){
          // 24시간 미만 남았거나 기한 지난 경우에만 24시간 연장 버튼 노출
          if(info.canExtend){
            actionBtn += ' <button class="text-btn btn-action-extend" data-extend-loan="' + l.id + '" title="대여 기한을 24시간 연장합니다">⏰ 24시간 연장</button>';
          }
          actionBtn += ' <button class="text-btn btn-action-return" data-return="' + l.id + '">✓ 반납</button>';
        }
      }

      if(isAdmin()){
        actionBtn += '<button class="text-btn btn-action-edit" data-edit="' + safe(a.id) + '">수정</button>';
      }

      // 모바일 비품 카드: [좌측 56px 썸네일] + [중앙: 상태점, 비품명 16px Bold, 📍위치] + [우측 대여 신청 버튼]
      listHtml += '<tr data-status="' + st + '" class="quick-row">' +
        '<td class="col-main">' +
          '<div class="asset-thumb-box" aria-hidden="true">' +
            getEquipmentImageHtml(a, 'thumb') +
          '</div>' +
          '<div class="asset-info-col">' +
            '<div class="card-meta">' +
              '<span class="status ' + st + '">' + statusLabel(st) + '</span>' +
            '</div>' +
            '<b class="asset-name">' + safe(a.name) + '</b>' +
            '<span class="asset-id hide-mobile">' + safe(a.id) + '</span>' +
            '<div class="asset-loc">📍 ' + safe(loc) + '</div>' +
          '</div>' +
        '</td>' +
        '<td class="col-meta hide-mobile">' + safe(a.category) + '</td>' +
        '<td class="col-meta hide-mobile">' + safe(loc) + '</td>' +
        '<td class="col-meta hide-mobile"><span class="status ' + st + '">' + statusLabel(st) + '</span></td>' +
        '<td class="col-meta hide-mobile">' + safe(bName) + '</td>' +
        '<td class="col-action">' + actionBtn + '</td></tr>';
    }

    // 본인이 현재 대여 중인 비품이 있는 경우, 최상단에 원클릭 반납 리마인드 배너 노출
    let personalBannerHtml = '';
    const myActiveLoans = loans.filter(function(l){
      return !l.returned_at && isMyLoan(l);
    });

    if(myActiveLoans.length > 0){
      const l = myActiveLoans[0];
      const info = getLoanDeadlineInfo(l);
      let bannerTitle = '';
      let bannerSub = '';
      let bannerExtendBtn = '';

      if(info.isOverdue){
        bannerTitle = safe(l.borrower_name || '연구원') + '님, [' + safe(fmtName(l.asset_id)) + '] 반납 기한이 지났습니다';
        bannerSub = '반납 기한이 <b>' + safe(info.text) + '</b> (지금 반납하거나 24시간 연장해 주세요)';
        bannerExtendBtn = '<button class="text-btn btn-banner-extend" data-extend-loan="' + l.id + '" title="대여 기한을 24시간 연장합니다">⏰ 24시간 연장</button>';
      } else if(info.canExtend){
        bannerTitle = safe(l.borrower_name || '연구원') + '님, [' + safe(fmtName(l.asset_id)) + '] 대여 중입니다';
        bannerSub = '반납 기한까지 <b>' + safe(info.text) + '</b> (계속 사용하시려면 24시간 연장해 주세요)';
        bannerExtendBtn = '<button class="text-btn btn-banner-extend" data-extend-loan="' + l.id + '" title="대여 기한을 24시간 연장합니다">⏰ 24시간 연장</button>';
      } else {
        bannerTitle = safe(l.borrower_name || '연구원') + '님, [' + safe(fmtName(l.asset_id)) + '] 대여 중입니다';
        bannerSub = '반납 기한까지 <b>' + safe(info.text) + '</b> (24시간 미만 시 연장 버튼 활성화)';
        bannerExtendBtn = '';
      }

      personalBannerHtml = '<div class="my-active-loan-banner' + (info.isOverdue ? ' is-overdue-banner' : '') + '">' +
        '<div class="banner-info">' +
          '<span class="banner-icon">' + (info.isOverdue ? '⚠️' : '💡') + '</span>' +
          '<div>' +
            '<b>' + bannerTitle + '</b>' +
            '<small>' + bannerSub + '</small>' +
          '</div>' +
        '</div>' +
        '<div class="banner-actions">' +
          bannerExtendBtn +
          '<button class="text-btn btn-banner-return" data-return="' + l.id + '">✓ 반납하기</button>' +
        '</div>' +
      '</div>';
    }

    const bannerSlot = $('inventoryBannerSlot');
    if(bannerSlot){
      bannerSlot.innerHTML = personalBannerHtml;
      $('inventoryRows').innerHTML = '<table aria-label="비품 목록"><thead><tr><th scope="col">비품명 / 식별번호</th><th scope="col">분류</th><th scope="col">보관 위치</th><th scope="col">상태</th><th scope="col">현재 대여자</th><th scope="col">작업</th></tr></thead><tbody>' +
        listHtml + '</tbody></table>';
    } else {
      $('inventoryRows').innerHTML = personalBannerHtml + '<table aria-label="비품 목록"><thead><tr><th scope="col">비품명 / 식별번호</th><th scope="col">분류</th><th scope="col">보관 위치</th><th scope="col">상태</th><th scope="col">현재 대여자</th><th scope="col">작업</th></tr></thead><tbody>' +
        listHtml + '</tbody></table>';
    }
  } else {
    const bannerSlot = $('inventoryBannerSlot');
    if(bannerSlot) bannerSlot.innerHTML = '';
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
  // 4. 이 브라우저에서 마지막으로 입력한 대여자 이름과 일치하는 경우
  const lastName = localStorage.getItem('labstock_last_borrower_name');
  if(lastName && l.borrower_name && l.borrower_name.trim().toLowerCase() === lastName.trim().toLowerCase()) return true;
  return false;
}

// 관리자 또는 해당 대여를 등록한 본인(대여한 브라우저)만 반납/수정/연장 가능
function canManageLoan(l){
  return isAdmin() || isMyLoan(l);
}

// 대여 자율 24시간 연장 (원클릭)
async function extendLoan(loanId, days = 1){
  const target = loans.find(function(l){ return String(l.id) === String(loanId); });
  if(!target){
    toast('대여 기록을 찾을 수 없습니다.');
    return;
  }
  if(!canManageLoan(target)){
    toast('본인이 대여한 비품만 연장할 수 있습니다.');
    return;
  }
  if(target.returned_at){
    toast('이미 반납 완료된 비품은 연장할 수 없습니다.');
    return;
  }

  const todayStr = today();
  // 기준일: 만약 기존 due_date가 오늘보다 이전이거나 오늘이면 오늘 기준, 미래이면 기존 due_date 기준
  const baseDate = (!target.due_date || target.due_date < todayStr) ? todayStr : target.due_date;
  const newDueDate = calcSmartDueDateFor(baseDate, days);

  // 연장 횟수 추적
  const allMatches = Array.from((target.memo || '').matchAll(/(\d+)회 연장됨/g));
  const extCount = allMatches.length > 0 ? (Number(allMatches[allMatches.length - 1][1]) + 1) : 1;
  const extMemoTag = '[' + todayStr + ' ' + extCount + '회 연장됨 (24시간)]';
  const updatedMemo = target.memo ? (target.memo + ' ' + extMemoTag) : extMemoTag;

  // 1. 로컬 상태 즉시 갱신
  target.due_date = newDueDate;
  target.memo = updatedMemo;
  saveLocalStorage();

  // 2. Supabase 연동 시 DB 업데이트
  if(db && !isLocalMode){
    try {
      const { error } = await db.from('loans').update({
        due_date: newDueDate,
        memo: updatedMemo,
        updated_at: new Date().toISOString()
      }).eq('id', target.id);
      if(error) console.warn('Supabase loan extend update warning:', error);
    } catch(err){
      console.warn('Supabase sync skipped:', err);
    }
  }

  toast('✓ [' + fmtName(target.asset_id) + '] 대여가 24시간 연장되었습니다.');
  render();
}

// 현재 사용자/기기 기준 활성 대여(미반납) 목록 조회
function getMyActiveLoans(borrowerName = null){
  const myClientId = getClientId();
  const myIds = getMyLoanIds();
  const lastName = localStorage.getItem('labstock_last_borrower_name') || '';
  const searchName = (borrowerName || lastName).trim().toLowerCase();

  return loans.filter(function(l){
    if(l.returned_at) return false;
    if(myIds.has(String(l.id))) return true;
    if(l.client_id && l.client_id === myClientId) return true;
    if(l.user_id && session && session.user && l.user_id === session.user.id) return true;
    if(searchName && l.borrower_name && l.borrower_name.trim().toLowerCase() === searchName){
      return true;
    }
    return false;
  });
}

// 24시간 이상 경과한 미반납 비품 목록 조회 (오래된 순 정렬)
function getMy24hOverdueLoans(borrowerName = null){
  const active = getMyActiveLoans(borrowerName);
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  return active.filter(function(l){
    const dateStr = l.borrowed_at || l.created_at;
    if(!dateStr) return false;
    const bTime = new Date(dateStr).getTime();
    if(isNaN(bTime)) return false;
    return (now - bTime) >= ONE_DAY_MS;
  }).sort(function(a, b){
    const tA = new Date(a.borrowed_at || a.created_at).getTime() || 0;
    const tB = new Date(b.borrowed_at || b.created_at).getTime() || 0;
    return tA - tB;
  });
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
      const info = getLoanDeadlineInfo(l);
      let action = '';

      if(canManageLoan(l)){
        if(!l.returned_at){
          // 24시간 미만 남았거나 기한 지난 경우에만 기간 연장 버튼 표시
          if(info.canExtend){
            action += '<button class="text-btn btn-action-extend-custom" data-extend-custom="' + l.id + '" title="원하는 기간을 정해서 연장합니다">📅 기간 연장</button> ';
          }
          action += '<button class="text-btn btn-action-return" data-return="' + l.id + '">✓ 반납</button>';
        } else {
          action += '<span class="status available">반납 완료</span>';
        }

        if(isAdmin()){
          action += ' <button class="text-btn btn-action-edit" data-edit-loan="' + l.id + '">수정</button>';
        }
      } else {
        if(!l.returned_at){
          action = '<span class="status-chip locked-chip">대여 중 (타인 대여)</span>';
        } else {
          action = '<span class="status available">반납 완료</span>';
        }
      }

      const isReturned = !!l.returned_at;
      let statusCell = '';
      if(isReturned){
        statusCell = '<span class="status available">반납 완료</span>';
      } else if(info.isOverdue){
        statusCell = '<span class="status-chip overdue-chip">⚠️ 기간 지남</span>';
      } else {
        statusCell = '<span class="status borrowed">대여 중</span>';
      }

      const returnOrDueCell = isReturned
        ? dateText(l.returned_at)
        : (info.isOverdue
            ? '<span style="color:#b91c1c;font-weight:700;">' + dateText(l.due_date) + ' (지남)</span>'
            : dateText(l.due_date));

      loanHtml += '<tr data-status="' + (isReturned ? 'returned' : (info.isOverdue ? 'overdue' : 'active')) + '"' + (info.isOverdue && !isReturned ? ' class="row-overdue"' : '') + '>' +
        '<td data-label="비품"><b>' + safe(fmtName(l.asset_id)) + '</b><div class="asset-id">' + safe(l.asset_id) + '</div></td>' +
        '<td data-label="대여자">' + safe(l.borrower_name) + '</td>' +
        '<td data-label="대여일">' + dateText(l.borrowed_at) + '</td>' +
        '<td data-label="상태">' + statusCell + '</td>' +
        '<td data-label="반납(예정)일">' + returnOrDueCell + '</td>' +
        '<td data-label="처리">' + action + '</td></tr>';
    }

    $('loanRows').innerHTML = '<table aria-label="대여 현황"><thead><tr><th scope="col">비품</th><th scope="col">대여자</th><th scope="col">대여일</th><th scope="col">상태</th><th scope="col">반납(예정)일</th><th scope="col">처리</th></tr></thead><tbody>' +
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

// ==========================================
// [소모품 및 시약 도감 모듈]
// ==========================================
const CONSUMABLE_CATEGORIES = [
  '자주찾는 소모품',
  '보호·클린룸',
  '배관·테이프',
  '시약·화학'
];

function consumableCategoryTabsHtml(selected){
  return '<div class="category-tabs" aria-label="소모품 카테고리">' +
    CONSUMABLE_CATEGORIES.map(function(cat){
      const icon = (
        cat === '자주찾는 소모품' ? '⭐' :
        cat === '보호·클린룸' ? '🧤' :
        cat === '배관·테이프' ? '🔧' :
        cat === '시약·화학' ? '🧪' : '📦'
      );
      const isReagent = cat === '시약·화학';
      return '<button type="button" class="category-tab' +
        (isReagent ? ' tab-reagent' : '') +
        (selected === cat ? ' active' : '') + '" data-consumable-category="' + safe(cat) +
        '" aria-pressed="' + (selected === cat ? 'true' : 'false') +
        '">' + icon + ' ' + safe(cat) + '</button>';
    }).join('') + '</div>';
}

// 산업안전보건기준에 관한 규칙 제420조 [별표 12] 특별관리물질 44종 법정 기준 테이블
const STATUTORY_CONTROLLED_TABLE = [
  { no: 1, nameKo: '디니트로톨루엔', nameEn: 'Dinitrotoluene', cas: ['25321-14-6', '121-14-2', '606-20-2'], threshold: '0.1% 이상' },
  { no: 2, nameKo: 'N,N-디메틸아세트아미드', nameEn: 'N,N-Dimethylacetamide', cas: ['127-19-5'], threshold: '0.3% 이상' },
  { no: 3, nameKo: '디메틸포름아미드', nameEn: 'Dimethylformamide', cas: ['68-12-2'], threshold: '0.3% 이상' },
  { no: 4, nameKo: '1,2-디클로로에탄', nameEn: '1,2-Dichloroethane', cas: ['107-06-2'], threshold: '0.1% 이상' },
  { no: 5, nameKo: '1,2-디클로로프로판', nameEn: '1,2-Dichloropropane', cas: ['78-87-5'], threshold: '0.1% 이상' },
  { no: 6, nameKo: '2-메톡시에탄올', nameEn: '2-Methoxyethanol', cas: ['109-86-4'], threshold: '0.3% 이상' },
  { no: 7, nameKo: '2-메톡시에틸 아세테이트', nameEn: '2-Methoxyethyl acetate', cas: ['110-49-6'], threshold: '0.3% 이상' },
  { no: 8, nameKo: '벤젠', nameEn: 'Benzene', cas: ['71-43-2'], threshold: '0.1% 이상' },
  { no: 9, nameKo: '1,3-부타디엔', nameEn: '1,3-Butadiene', cas: ['106-99-0'], threshold: '0.1% 이상' },
  { no: 10, nameKo: '1-브로모프로판', nameEn: '1-Bromopropane', cas: ['106-94-5'], threshold: '0.3% 이상' },
  { no: 11, nameKo: '2-브로모프로판', nameEn: '2-Bromopropane', cas: ['75-26-3'], threshold: '0.3% 이상' },
  { no: 12, nameKo: '사염화탄소', nameEn: 'Carbon tetrachloride', cas: ['56-23-5'], threshold: '0.1% 이상' },
  { no: 13, nameKo: '스토다드 솔벤트', nameEn: 'Stoddard solvent', cas: ['8052-41-3'], threshold: '0.1% 이상' },
  { no: 14, nameKo: '아크릴로니트릴', nameEn: 'Acrylonitrile', cas: ['107-13-1'], threshold: '0.1% 이상' },
  { no: 15, nameKo: '아크릴아미드', nameEn: 'Acrylamide', cas: ['79-06-1'], threshold: '0.1% 이상' },
  { no: 16, nameKo: '2-에톡시에탄올', nameEn: '2-Ethoxyethanol', cas: ['110-80-5'], threshold: '0.3% 이상' },
  { no: 17, nameKo: '2-에톡시에틸 아세테이트', nameEn: '2-Ethoxyethyl acetate', cas: ['111-15-9'], threshold: '0.3% 이상' },
  { no: 18, nameKo: '에틸렌이민', nameEn: 'Ethyleneimine', cas: ['151-56-4'], threshold: '0.1% 이상' },
  { no: 19, nameKo: '2,3-에폭시-1-프로판올', nameEn: '2,3-Epoxy-1-propanol', cas: ['556-52-5', '57044-25-4'], threshold: '0.1% 이상' },
  { no: 20, nameKo: '1,2-에폭시프로판', nameEn: '1,2-Epoxypropane', cas: ['75-56-9'], threshold: '0.1% 이상' },
  { no: 21, nameKo: '에피클로로히드린', nameEn: 'Epichlorohydrin', cas: ['106-89-8'], threshold: '0.1% 이상' },
  { no: 22, nameKo: '트리클로로에틸렌', nameEn: 'Trichloroethylene', cas: ['79-01-6'], threshold: '0.1% 이상' },
  { no: 23, nameKo: '1,2,3-트리클로로프로판', nameEn: '1,2,3-Trichloropropane', cas: ['96-18-4'], threshold: '0.1% 이상' },
  { no: 24, nameKo: '퍼클로로에틸렌', nameEn: 'Perchloroethylene (Tetrachloroethylene)', cas: ['127-18-4'], threshold: '0.1% 이상' },
  { no: 25, nameKo: '페놀', nameEn: 'Phenol', cas: ['108-95-2'], threshold: '0.3% 이상' },
  { no: 26, nameKo: '포름알데히드', nameEn: 'Formaldehyde', cas: ['50-00-0'], threshold: '0.1% 이상' },
  { no: 27, nameKo: '프로필렌이민', nameEn: 'Propyleneimine', cas: ['75-55-8'], threshold: '0.1% 이상' },
  { no: 28, nameKo: '황산 디메틸', nameEn: 'Dimethyl sulfate', cas: ['77-78-1'], threshold: '0.1% 이상' },
  { no: 29, nameKo: '히드라진 및 그 수화물', nameEn: 'Hydrazine and its hydrates', cas: ['302-01-2', '10217-52-4', '7803-57-8'], threshold: '0.1% 이상' },
  { no: 30, nameKo: '납 및 그 무기화합물', nameEn: 'Lead and its inorganic compounds', cas: ['7439-92-1', '10101-63-0', '1317-36-8', '1344-37-2', '7758-95-4'], threshold: '0.3% 이상' },
  { no: 31, nameKo: '니켈 및 그 무기화합물', nameEn: 'Nickel and its inorganic compounds', cas: ['7440-02-0', '7791-20-0', '10101-97-0', '13478-00-7', '1313-99-1', '7718-54-9'], threshold: '0.1% 이상' },
  { no: 32, nameKo: '수은 및 그 화합물', nameEn: 'Mercury and its compounds', cas: ['7439-97-6'], threshold: '0.3% 이상' },
  { no: 33, nameKo: '삼산화안티몬', nameEn: 'Antimony trioxide', cas: ['1309-64-4'], threshold: '0.1% 이상' },
  { no: 34, nameKo: '카드뮴 및 그 화합물', nameEn: 'Cadmium and its compounds', cas: ['7440-43-9', '543-90-8', '10108-64-2', '10124-36-4', '1306-19-0'], threshold: '0.1% 이상' },
  { no: 35, nameKo: '6가크롬 및 그 화합물', nameEn: 'Chromium(VI) compounds', cas: ['18540-29-9', '1333-82-0', '7778-50-9', '7789-00-6', '13765-19-0', '26299-14-9'], threshold: '0.1% 이상' },
  { no: 36, nameKo: '황산 (pH 2.0 이하)', nameEn: 'Sulfuric acid', cas: ['7664-93-9'], threshold: '0.1% 이상' },
  { no: 37, nameKo: '산화에틸렌', nameEn: 'Ethylene oxide', cas: ['75-21-8'], threshold: '0.1% 이상' },
  { no: 38, nameKo: '2-니트로톨루엔', nameEn: '2-Nitrotoluene', cas: ['88-72-2'], threshold: '0.1% 이상' },
  { no: 39, nameKo: '디부틸 프탈레이트', nameEn: 'Dibutyl phthalate', cas: ['84-74-2'], threshold: '0.3% 이상' },
  { no: 40, nameKo: '벤조(a)피렌', nameEn: 'Benzo(a)pyrene', cas: ['50-32-8'], threshold: '0.1% 이상' },
  { no: 41, nameKo: '와파린', nameEn: 'Warfarin', cas: ['81-81-2'], threshold: '0.3% 이상' },
  { no: 42, nameKo: '포름아미드', nameEn: 'Formamide', cas: ['75-12-7'], threshold: '0.3% 이상' },
  { no: 43, nameKo: '산화붕소', nameEn: 'Boron oxide', cas: ['1303-86-2'], threshold: '0.3% 이상' },
  { no: 44, nameKo: '사붕소산 나트륨', nameEn: 'Sodium tetraborate', cas: ['1330-43-4', '12179-04-3', '1303-96-4'], threshold: '0.3% 이상' }
];

// 법정 특별관리물질 정보 조회 (고용노동부 법정 44종과 1:1 대조)
function getControlledSubstanceInfo(c){
  if(!c) return null;
  if(c.is_controlled && c.controlled_no){
    const found = STATUTORY_CONTROLLED_TABLE.find(function(s){ return s.no === c.controlled_no; });
    return found || {
      no: c.controlled_no,
      nameKo: c.controlled_name || '',
      nameEn: '',
      threshold: c.controlled_threshold || '0.1% 이상'
    };
  }
  const spec = c.specification || '';
  const casMatch = spec.match(/CAS:\s*([0-9\-]+)/i);
  const cas = casMatch ? casMatch[1].trim() : '';
  const name = (c.name || '').trim();

  for(let i = 0; i < STATUTORY_CONTROLLED_TABLE.length; i++){
    const s = STATUTORY_CONTROLLED_TABLE[i];
    if(cas && s.cas.includes(cas)){
      return s;
    }
  }
  if(/^Benzene(\b|,)/i.test(name) && !/hexaphenyl|boronic/i.test(name)){
    return STATUTORY_CONTROLLED_TABLE[7]; // #8 벤젠
  }
  if(/tetrachloroethylene|perchloroethylene/i.test(name)){
    return STATUTORY_CONTROLLED_TABLE[23]; // #24 퍼클로로에틸렌
  }
  if(/^Sulfuric acid/i.test(name)){
    return STATUTORY_CONTROLLED_TABLE[35]; // #36 황산
  }
  if(/dimethylformamide|\bDMF\b/i.test(name)){
    return STATUTORY_CONTROLLED_TABLE[2]; // #3 디메틸포름아미드
  }
  if(/hydrazine.*hydrate/i.test(name)){
    return STATUTORY_CONTROLLED_TABLE[28]; // #29 히드라진 및 그 수화물
  }
  if(/benzo\[?a\]?pyrene/i.test(name)){
    return STATUTORY_CONTROLLED_TABLE[39]; // #40 벤조(a)피렌
  }
  if(/^(Boron oxide|Boric anhydride)/i.test(name)){
    return STATUTORY_CONTROLLED_TABLE[42]; // #43 산화붕소
  }
  return null;
}

// 산업안전보건기준에 관한 규칙 제420조 및 [별표 12] 특별관리물질 엄밀 판별
function isControlledSubstance(c){
  if(!c) return false;
  if(c.is_controlled === true) return true;
  if(c.is_controlled === false) return false;
  return getControlledSubstanceInfo(c) !== null;
}

const CONSUMABLE_ALIASES = {
  '웨이퍼': ['wafer', 'si', 'sio2', 'silicon', 'oxide', 'substrate', 'w', 's'],
  '4인치 si/sio2 웨이퍼': ['wafer', 'si', 'sio2', 'silicon', 'oxide', 'substrate', 'w', 's'],
  '그래파이트': ['graphite', 'hopg', 'graphene', 'bulk', 'g'],
  '고품위 벌크 그래파이트': ['graphite', 'hopg', 'graphene', 'bulk', 'g'],
  '테이프': ['tape', 'scotch', '3m', 'magic', 'kapton', 't'],
  '스카치': ['tape', 'scotch', '3m', 'magic', 't'],
  '매직테이프': ['tape', 'scotch', '3m', 'magic', 't'],
  '장갑': ['glove', 'nitrile', 'latex', 'gloves', 'g', 'n'],
  '니트릴 장갑': ['glove', 'nitrile', 'latex', 'gloves', 'g', 'n'],
  '와이퍼': ['wiper', 'wipes', 'tx1009', 'cleanroom wiper', 'w'],
  '클린룸 와이퍼': ['wiper', 'wipes', 'tx1009', 'cleanroom wiper', 'w'],
  '아세톤': ['acetone', 'ace', 'solvent', 'a'],
  '이소프로필알코올': ['ipa', 'isopropanol', 'alcohol', 'solvent', 'i'],
  'ipa': ['ipa', 'isopropanol', 'alcohol', 'solvent', 'i'],
  '오링': ['o-ring', 'oring', 'ring', 'viton', 'fkm', 'o', 'r'],
  'kf25': ['kf25', 'kf', 'nw', 'flange', 'clamp', 'centering', 'f'],
  '플랜지': ['flange', 'kf', 'nw', 'clamp', 'centering', 'f'],
  '테프론': ['teflon', 'ptfe', 'sealing', 'tape', 't'],
  '킴와이프스': ['kimwipes', 'kimwipe', 'kw', 'k', 'w'],
  '호일': ['foil', 'aluminum', 'al', 'f'],
  '알루미늄': ['foil', 'aluminum', 'al', 'f']
};

const PRECOMPILED_CONSUMABLE_ALIASES = Object.keys(CONSUMABLE_ALIASES).map(function(k){
  return {
    key: k.toLowerCase(),
    aliases: CONSUMABLE_ALIASES[k].map(function(a){ return a.toLowerCase(); })
  };
});

function getConsumableSearchProfile(c){
  if(c._searchProfile) return c._searchProfile;
  const id = (c.id || '').toLowerCase();
  const name = (c.name || '').toLowerCase();
  const category = (c.category || '').toLowerCase();
  const location = (c.location || '').toLowerCase();
  const sub_location = (c.sub_location || '').toLowerCase();
  const specification = (c.specification || c.note || '').toLowerCase();
  const textTarget = id + ' ' + name + ' ' + category + ' ' + location + ' ' + sub_location + ' ' + specification;

  const matchedAliases = [];
  for(let i = 0; i < PRECOMPILED_CONSUMABLE_ALIASES.length; i++){
    const entry = PRECOMPILED_CONSUMABLE_ALIASES[i];
    if(name.includes(entry.key)){
      for(let j = 0; j < entry.aliases.length; j++){
        matchedAliases.push(entry.aliases[j]);
      }
    }
  }

  const words = name.split(/\s+/).filter(Boolean);
  const initials = words.map(function(w){ return w.charAt(0); }).join('');

  const profile = {
    textTarget: textTarget,
    aliases: matchedAliases,
    initials: initials
  };
  c._searchProfile = profile;
  return profile;
}

function matchesConsumableSearch(c, query){
  if(!query) return true;
  const q = query.toLowerCase().trim();
  if(!q) return true;

  const profile = getConsumableSearchProfile(c);
  if(profile.textTarget.includes(q)) return true;

  const aliases = profile.aliases;
  for(let i = 0; i < aliases.length; i++){
    const a = aliases[i];
    if(a.startsWith(q) || a.includes(q) || q.startsWith(a)){
      return true;
    }
  }

  if(profile.initials && profile.initials.startsWith(q)) return true;
  return false;
}

function getRoomBadgeHtml(loc){
  const l = (loc || '').toLowerCase();
  let badgeClass = 'room-default';
  let icon = '📍';
  if(l.includes('클린룸')){
    badgeClass = 'room-cleanroom';
    icon = '🟦';
  } else if(l.includes('화학') || l.includes('후드')){
    badgeClass = 'room-chemical';
    icon = '🟧';
  } else if(l.includes('측정') || l.includes('3층')){
    badgeClass = 'room-measurement';
    icon = '🟩';
  } else if(l.includes('장비') || l.includes('가스')){
    badgeClass = 'room-facility';
    icon = '🟪';
  }
  return '<span class="room-badge ' + badgeClass + '">' + icon + ' ' + safe(loc || '연구실') + '</span>';
}

let displayedConsumablesCount = 24;
const CONSUMABLES_PAGE_SIZE = 24;
let consumableViewMode = 'card';
try {
  const savedMode = localStorage.getItem('2dqh_consumable_view_mode');
  if(savedMode === 'compact' || savedMode === 'card') consumableViewMode = savedMode;
} catch(_) {}

function parseConsumableMeta(c){
  const spec = c.specification || c.note || '';
  let maker = '';
  let cas = '';
  let cat = '';
  let hazard = '';
  let qty = '';

  const mMatch = spec.match(/제조사:\s*([^·]+)/);
  if(mMatch) maker = mMatch[1].trim();

  const casMatch = spec.match(/CAS:\s*([^·]+)/);
  if(casMatch) cas = casMatch[1].trim();

  const catMatch = spec.match(/CAT:\s*([^·]+)/);
  if(catMatch) cat = catMatch[1].trim();

  const hMatch = spec.match(/위험도:\s*([^·]+)/);
  if(hMatch) hazard = hMatch[1].trim();

  const qMatch = spec.match(/재고수량:\s*([^·]+)/);
  if(qMatch) qty = qMatch[1].trim();

  return { maker: maker, cas: cas, cat: cat, hazard: hazard, qty: qty, rawSpec: spec };
}

function getHazardBadgeHtml(hazard){
  if(!hazard) return '';
  let cls = 'hazard-low';
  if(hazard.includes('A') || hazard.includes('B') || hazard.includes('치명') || hazard.includes('높음')){
    cls = 'hazard-high';
  } else if(hazard.includes('C') || hazard.includes('D') || hazard.includes('보통') || hazard.includes('주의')){
    cls = 'hazard-med';
  }
  return '<span class="hazard-badge ' + cls + '" title="위험도 등급: ' + safe(hazard) + '">⚠️ ' + safe(hazard) + '</span>';
}

function getCasBadgeHtml(cas){
  if(!cas) return '';
  return '<span class="cas-badge" title="CAS 등록번호">CAS ' + safe(cas) + '</span>';
}

function getMakerBadgeHtml(maker){
  if(!maker) return '';
  return '<span class="maker-badge">' + safe(maker) + '</span>';
}

function loadMoreConsumables(){
  displayedConsumablesCount += CONSUMABLES_PAGE_SIZE;
  renderConsumables();
}

function renderConsumables(){
  const searchEl = $('consumableSearch');
  const q = searchEl ? searchEl.value.trim().toLowerCase() : '';

  const list = consumables.filter(function(c){
    let matchCategory = false;
    if(q){
      // 검색어 입력 시 소모품과 327종 시약 전체에서 통합 검색
      matchCategory = true;
    } else if(selectedConsumableCategory === '자주찾는 소모품'){
      // 기본 화면: 일상 핵심 소모품만 노출 (시약 제외)
      matchCategory = c.category !== '시약·화학' && c.category !== '화학·시약';
    } else if(selectedConsumableCategory === '시약·화학' || selectedConsumableCategory === '화학·시약'){
      const isReagent = c.category === '시약·화학' || c.category === '화학·시약';
      if(!isReagent) return false;
      if(showOnlyControlledReagents){
        return isControlledSubstance(c);
      }
      return true;
    } else {
      matchCategory = c.category === selectedConsumableCategory;
    }
    const matchSearch = matchesConsumableSearch(c, q);
    return matchCategory && matchSearch;
  });

  // 시약·화학 탭이거나 검색 시 특별관리물질을 상단에 자동 우선 배치
  if(selectedConsumableCategory === '시약·화학' || selectedConsumableCategory === '화학·시약' || q){
    list.sort(function(a, b){
      const aCtrl = isControlledSubstance(a) ? 1 : 0;
      const bCtrl = isControlledSubstance(b) ? 1 : 0;
      if(aCtrl !== bCtrl) return bCtrl - aCtrl;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }

  const categoryHost = $('consumableCategories');
  if(categoryHost){
    categoryHost.innerHTML = consumableCategoryTabsHtml(selectedConsumableCategory);
  }

  const toggleButtons = document.querySelectorAll('#consumableViewModeToggle button');
  toggleButtons.forEach(function(btn){
    btn.classList.toggle('active', btn.dataset.consumableView === consumableViewMode);
  });

  const countBadge = $('consumablesCountBadge');
  if(countBadge) countBadge.textContent = list.length;

  // 실시간 검색/필터 결과 요약 카운트 뱃지 & 특별관리물질 안내 배너
  const summaryEl = $('consumablesResultSummary');
  if(summaryEl){
    const filteredCount = list.length;
    let summaryHtml = '';
    if(q){
      summaryHtml = '<div class="summary-line"><span class="summary-icon">🔍</span> \'' + safe(q) + '\' 검색 결과: <strong>' + filteredCount + '</strong>개 품목</div>';
    } else if(selectedConsumableCategory === '시약·화학' || selectedConsumableCategory === '화학·시약'){
      const totalReagents = consumables.filter(function(c){ return c.category === '시약·화학' || c.category === '화학·시약'; }).length;
      const controlledCount = consumables.filter(isControlledSubstance).length;

      if(showOnlyControlledReagents){
        summaryHtml = '<div class="controlled-summary-bar reagent-bar is-filtered-controlled">' +
          '<div class="controlled-summary-text">' +
            '<span class="summary-icon">⚠️</span> ' +
            '<span><strong style="color:#b91c1c;">특별관리물질 ' + controlledCount + '종</strong> (산안법 [별표 12] · 30년 보존 의무)</span>' +
          '</div>' +
          '<div class="controlled-summary-actions">' +
            '<button type="button" class="btn-filter-controlled active" id="btnToggleControlledFilter">🧪 전체 시약 보기 (' + totalReagents + '종)</button>' +
            '<button type="button" class="btn-export-log-csv" id="btnExportChemicalLogs" title="고용노동부 법정 서식 CSV 다운로드">📥 취급일지 다운로드 (CSV)</button>' +
          '</div>' +
        '</div>';
      } else {
        summaryHtml = '<div class="controlled-summary-bar reagent-bar">' +
          '<div class="controlled-summary-text">' +
            '<span class="summary-icon">🧪</span> ' +
            '<span><strong>연구실 시약 도감</strong> (' + totalReagents + '종) · ' +
            '<strong style="color:#b91c1c;">⚠️ 특별관리물질 ' + controlledCount + '종 포함</strong></span>' +
          '</div>' +
          '<div class="controlled-summary-actions">' +
            '<button type="button" class="btn-filter-controlled" id="btnToggleControlledFilter">⚠️ 특별관리물질만 (' + controlledCount + '종)</button>' +
            '<button type="button" class="btn-export-log-csv" id="btnExportChemicalLogs" title="고용노동부 법정 서식 CSV 다운로드">📥 취급일지 다운로드 (CSV)</button>' +
          '</div>' +
        '</div>';
      }
    } else if(selectedConsumableCategory === '자주찾는 소모품'){
      summaryHtml = '<div class="summary-line"><span class="summary-icon">⭐</span> 연구실 핵심 일상 소모품 <strong>' + filteredCount + '</strong>종 (글러브·와이퍼·테이프 등 위치 안내)</div>';
    } else {
      summaryHtml = '<div class="summary-line"><span class="summary-icon">🏷️</span> <strong>' + safe(selectedConsumableCategory) + '</strong>: ' + filteredCount + '개 품목</div>';
    }
    summaryEl.innerHTML = summaryHtml;
  }

  // 검색창 클리어 버튼(✕) 상태 동기화
  const btnClear = $('btnClearConsumableSearch');
  if(btnClear && searchEl){
    btnClear.classList.toggle('hidden', searchEl.value.trim().length === 0);
  }

  const container = $('consumableRows');
  if(!container) return;

  if(list.length > 0){
    const visibleList = list.slice(0, displayedConsumablesCount);
    let html = '';

    if(consumableViewMode === 'compact'){
      // 컴팩트 고밀도 목록형 뷰 (Dense List Layout)
      html += '<div class="consumables-compact-list" id="consumablesList">';
      for(let i = 0; i < visibleList.length; i++){
        const c = visibleList[i];
        const meta = parseConsumableMeta(c);
        const cat = c.category || '일반소모품';
        const isCtrl = isControlledSubstance(c);

        let adminActions = '';
        if(isAdmin()){
          adminActions = '<button class="text-btn btn-action-edit" data-edit-consumable="' + safe(c.id) + '">수정</button>';
        }

        let logAction = '';
        if(isCtrl){
          logAction = '<button type="button" class="btn-compact-log" data-log-chemical="' + safe(c.id) + '" title="특별관리물질 취급일지 작성"><span>📝 일지</span></button>';
        }

        let ctrlBadgeHtml = '';
        if(isCtrl){
          const ci = getControlledSubstanceInfo(c);
          const tooltip = ci
            ? ('산업안전보건법 시행규칙 [별표 12] 특별관리물질: ' + (ci.nameKo || '') + ' (관리범위: ' + (ci.threshold || '0.1% 이상') + ')')
            : '법정 특별관리물질 (취급일지 30년 보존 대상)';
          ctrlBadgeHtml = '<span class="badge-controlled-compact" title="' + safe(tooltip) + '">⚠️ 특별관리</span>';
        }

        html += '<div class="consumable-compact-row' + (isCtrl ? ' is-controlled-row' : '') + '">' +
          '<div class="compact-main-info">' +
            '<div class="compact-row-top">' +
              (isCtrl ? ctrlBadgeHtml : '<span class="consumable-cat-tag">' + safe(cat) + '</span>') +
              '<h3 class="compact-name">' + safe(c.name) + '</h3>' +
              getCasBadgeHtml(meta.cas) +
              getHazardBadgeHtml(meta.hazard) +
            '</div>' +
            '<div class="compact-row-bottom">' +
              getRoomBadgeHtml(c.location) +
              '<span class="compact-sub-loc">📍 ' + safe(c.sub_location || '위치 지정') + '</span>' +
              getMakerBadgeHtml(meta.maker) +
              (meta.qty ? '<span class="maker-badge">재고: ' + safe(meta.qty) + '</span>' : '') +
            '</div>' +
          '</div>';

        if(logAction || adminActions){
          html += '<div class="compact-actions">' +
            logAction +
            adminActions +
          '</div>';
        }

        html += '</div>';
      }
      html += '</div>';
    } else {
      // 표준 카드형 뷰 (Card Layout)
      html += '<div class="consumables-grid" id="consumablesGrid">';
      for(let i = 0; i < visibleList.length; i++){
        const c = visibleList[i];
        const meta = parseConsumableMeta(c);
        const spec = c.specification || c.note || '';
        const cat = c.category || '일반소모품';
        const isCtrl = isControlledSubstance(c);

        let adminActions = '';
        if(isAdmin()){
          adminActions = '<button class="text-btn btn-action-edit" data-edit-consumable="' + safe(c.id) + '">수정</button>';
        }

        let logAction = '';
        let ctrlBadgeHtml = '';
        if(isCtrl){
          const ci = getControlledSubstanceInfo(c);
          const tooltip = ci
            ? ('산업안전보건법 시행규칙 [별표 12] 특별관리물질: ' + (ci.nameKo || '') + ' (관리범위: ' + (ci.threshold || '0.1% 이상') + ')')
            : '법정 특별관리물질 (취급일지 30년 보존 대상)';
          ctrlBadgeHtml = '<span class="badge-controlled" title="' + safe(tooltip) + '">⚠️ 특별관리물질</span>';
          logAction = '<button type="button" class="btn-chemical-log" data-log-chemical="' + safe(c.id) + '"><span>📝 취급일지 작성</span></button>';
        }

        html += '<div class="consumable-card' + (isCtrl ? ' is-controlled-card' : '') + '">' +
          '<div class="consumable-card-header">' +
            '<div class="consumable-title-wrap">' +
              '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                (isCtrl ? ctrlBadgeHtml : '') +
                '<span class="consumable-cat-tag">' + safe(cat) + '</span>' +
                getMakerBadgeHtml(meta.maker) +
                getHazardBadgeHtml(meta.hazard) +
              '</div>' +
              '<h3 class="consumable-name">' + safe(c.name) + '</h3>' +
              (meta.cas ? '<div>' + getCasBadgeHtml(meta.cas) + '</div>' : '') +
            '</div>' +
            '<span class="consumable-id-tag hide-mobile">' + safe(c.id) + '</span>' +
          '</div>' +
          '<div class="consumable-location-box">' +
            '<div class="location-breadcrumbs">' +
              getRoomBadgeHtml(c.location) +
              '<span class="sub-loc-text">📍 ' + safe(c.sub_location || '위치 지정') + '</span>' +
            '</div>' +
          '</div>' +
          (spec ? '<div class="consumable-spec-text">💡 ' + safe(spec) + '</div>' : '');

        if(logAction || adminActions){
          html += '<div class="consumable-card-actions">' +
            logAction +
            adminActions +
          '</div>';
        }

        html += '</div>';
      }
      html += '</div>';
    }

    if(list.length > visibleList.length){
      const remaining = list.length - visibleList.length;
      html += '<div class="consumables-load-more-wrap">' +
        '<button type="button" class="btn-load-more" id="btnLoadMoreConsumables">' +
          '<span>더보기 (+' + Math.min(CONSUMABLES_PAGE_SIZE, remaining) + '개)</span>' +
          '<span class="load-more-count">(' + visibleList.length + ' / ' + list.length + '개 표시 중)</span>' +
        '</button>' +
      '</div>';
    }

    container.innerHTML = html;

    const loadMoreBtn = $('btnLoadMoreConsumables');
    if(loadMoreBtn && 'IntersectionObserver' in window){
      const observer = new IntersectionObserver(function(entries){
        if(entries[0].isIntersecting){
          observer.disconnect();
          loadMoreConsumables();
        }
      }, { rootMargin: '240px' });
      observer.observe(loadMoreBtn);
    }
  } else {
    container.innerHTML = '<div class="consumables-empty-state">' +
      '<div class="empty-icon">🔍</div>' +
      '<h3>' + (q ? "'" + safe(q) + "' 검색 결과가 없습니다" : '등록된 소모품이 없습니다') + '</h3>' +
      '<p>연구실에 새로 입고되었거나 위치가 등록되지 않았나요?</p>' +
      '<div class="empty-actions">' +
        (isAdmin() ? '<button class="btn primary" id="btnEmptyAddConsumable">＋ 새 소모품 위치 등록하기</button>' : '') +
      '</div>' +
    '</div>';
  }
}

function copyConsumableLocation(id, btnEl){
  const c = consumableFor(id);
  if(!c) return;
  const text = '[' + (c.location || '연구실') + '] ' + (c.sub_location || '') + ' · ' + c.name;

  function triggerButtonFeedback(){
    if(!btnEl) return;
    const originalHtml = btnEl.innerHTML;
    btnEl.classList.add('copied');
    btnEl.innerHTML = '<span aria-hidden="true">✓</span> <span>복사 완료!</span>';
    setTimeout(function(){
      btnEl.classList.remove('copied');
      btnEl.innerHTML = originalHtml;
    }, 1500);
  }

  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){
      triggerButtonFeedback();
      toast("✓ '" + c.name + "' 보관 위치가 복사되었습니다!");
    }).catch(function(){
      fallbackCopyText(text, c.name);
      triggerButtonFeedback();
    });
  } else {
    fallbackCopyText(text, c.name);
    triggerButtonFeedback();
  }
}

// 특별관리물질 취급일지 법정 서식(산업안전보건기준에 관한 규칙 제439조) CSV 다운로드
function exportChemicalLogsCsv(){
  let logs = [];
  try {
    logs = JSON.parse(localStorage.getItem('labstock_chemical_logs') || '[]');
  } catch(_) {}

  if(!logs || logs.length === 0){
    toast('⚠️ 등록된 특별관리물질 취급일지가 없습니다. 시약 카드의 [📝 취급일지 작성]을 통해 먼저 일지를 작성해 주세요.');
    return;
  }

  const headers = [
    '연번',
    '법정 물질분류(별표12)',
    '취급일시',
    '취급자 성명',
    '물질명(제품명)',
    'CAS 번호',
    '취급량(사용량)',
    '단위',
    '작업 장소',
    '취급 작업 내용',
    '개인보호구 착용 여부',
    '국소배기장치 가동 여부',
    '사용 후 잔여량 및 비고'
  ];

  const rows = logs.map(function(item, idx){
    let statutoryCategory = '';
    const c = consumableFor(item.consumable_id);
    const ci = c ? getControlledSubstanceInfo(c) : null;
    if(ci){
      statutoryCategory = ci.nameKo + (ci.threshold ? ' (' + ci.threshold + ')' : '');
    }
    return [
      idx + 1,
      statutoryCategory,
      item.used_at ? item.used_at.replace('T', ' ') : '',
      item.handler_name || '',
      item.chemical_name || '',
      item.cas_number || '',
      item.quantity || '',
      item.unit || 'mL',
      item.work_location || '',
      item.work_description || '',
      item.ppe_checked ? 'O (착용)' : 'X',
      item.ventilation_checked ? 'O (정상가동)' : 'X',
      item.remaining_qty || item.note || ''
    ].map(function(cell){
      const s = String(cell || '').replace(/"/g, '""');
      return '"' + s + '"';
    }).join(',');
  });

  const csvContent = '\uFEFF' + headers.join(',') + '\r\n' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '2DQH_특별관리물질_취급일지_' + today() + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('✓ 특별관리물질 취급일지(' + logs.length + '건)가 법정 서식 CSV로 다운로드되었습니다.');
}

// ========================================================
// [연구장비 & 전자 로그북 모듈 - 2DQH-XRD_log 공식 기반]
// ========================================================

function initXrdControls(){
  if(xrdControlsInitialized) return;
  const f = $('xrdForm');
  if(!f) return;

  const slots = [];
  for(let h=0; h<24; h++){
    for(const m of [0, 30]){
      slots.push(pad(h) + ':' + pad(m));
    }
  }
  const opt = function(o){ return '<option value="' + o + '">' + o + '</option>'; };
  if(f.start_time && f.start_time.options.length === 0) f.start_time.innerHTML = slots.map(opt).join('');
  if(f.end_time && f.end_time.options.length === 0) f.end_time.innerHTML = slots.map(opt).join('');
  if(f.sample_count && f.sample_count.options.length === 0){
    f.sample_count.innerHTML = XRD_COUNTS.map(function(n){
      return '<option value="' + n + '">' + (n >= 10 ? '10 or more' : n) + '</option>';
    }).join('');
  }

  const scanChipsHost = $('xrdScanChips');
  if(scanChipsHost && scanChipsHost.children.length === 0){
    scanChipsHost.innerHTML = XRD_SCAN_CHIPS.map(function(c){
      return '<button type="button" class="xrd-chip" data-scan="' + c + '">' + c + '</button>';
    }).join('');
  }

  const durChipsHost = $('xrdDurChips');
  if(durChipsHost && durChipsHost.children.length === 0){
    durChipsHost.innerHTML = [[30,'0.5 h'],[60,'1 h'],[90,'1.5 h'],[120,'2 h'],[180,'3 h'],[240,'4 h']].map(function(x){
      return '<button type="button" class="xrd-chip sm" data-xrd-add="' + x[0] + '">' + x[1] + '</button>';
    }).join('');
  }

  // 모드 전환 버튼 (측정 시작 / 측정 완료 일괄 기록)
  const btnStart = $('btnXrdModeStart');
  if(btnStart){
    btnStart.addEventListener('click', function(){
      showXrdMode('start');
    });
  }
  const btnFull = $('btnXrdModeFull');
  if(btnFull){
    btnFull.addEventListener('click', function(){
      showXrdMode('full');
    });
  }

  // 칩 & 토글 클릭 이벤트 위임 (가동시간 퀵 모드, 얼라인 PB/BB, 스캔타입, 점검체크)
  f.addEventListener('click', function(e){
    const c = e.target.closest('.xrd-chip');
    if(!c) return;
    const addVal = c.dataset.xrdAdd || c.dataset.add;
    if(addVal){
      const val = parseInt(addVal, 10);
      if(f.start_time && f.start_time.value){
        const parts = f.start_time.value.split(':');
        const t = ((+parts[0]) * 60 + (+parts[1]) + val) % 1440;
        f.end_time.value = pad(Math.floor(t / 60)) + ':' + pad(t % 60);
        updXrdDur();
        updateXrdChecks(true);
      }
      return;
    }
    if(c.dataset.chk){
      xrdChk[c.dataset.chk] = !xrdChk[c.dataset.chk];
    } else if(c.dataset.align){
      xrdAlign = c.dataset.align;
    } else if(c.dataset.scan){
      if(xrdScanSel.has(c.dataset.scan)){
        xrdScanSel.delete(c.dataset.scan);
      } else {
        xrdScanSel.add(c.dataset.scan);
      }
    }
    updateXrdChecks(false);
  });

  f.addEventListener('input', function(){
    updXrdDur();
    checkXrdChiller();
    updateXrdChecks(true);
  });

  f.addEventListener('change', function(e){
    if(e.target.name === 'start_time' || e.target.name === 'end_time'){
      updXrdDur();
      updateXrdChecks(false);
    }
    if(e.target.name === 'chiller_start' || e.target.name === 'chiller_end'){
      checkXrdChiller();
    }
  });

  const modeLink = $('xrdModeLink');
  if(modeLink){
    modeLink.addEventListener('click', function(){
      if(xrdMode === 'start'){
        showXrdMode('full');
      } else {
        showXrdMode('start');
      }
    });
  }

  const cancelEditBtn = $('xrdCancelEditBtn');
  if(cancelEditBtn){
    cancelEditBtn.addEventListener('click', function(){
      resetXrdForm();
    });
  }

  const searchInput = $('xrdSearch');
  const btnClearSearch = $('btnClearXrdSearch');
  if(searchInput){
    searchInput.addEventListener('input', function(){
      if(btnClearSearch) btnClearSearch.classList.toggle('hidden', searchInput.value.trim().length === 0);
      renderXrdLogs();
    });
  }
  if(btnClearSearch){
    btnClearSearch.addEventListener('click', function(){
      searchInput.value = '';
      btnClearSearch.classList.add('hidden');
      searchInput.focus();
      renderXrdLogs();
    });
  }

  const btnExportXrd = $('btnExportXrdCsv');
  if(btnExportXrd){
    btnExportXrd.addEventListener('click', exportXrdLogsCsv);
  }

  f.addEventListener('submit', handleXrdFormSubmit);

  xrdControlsInitialized = true;
}

function xrdAfterHours(){
  const f = $('xrdForm');
  if(!f || !f.start_time || !f.end_time) return false;
  const s = f.start_time.value, e = f.end_time.value;
  if(!s || !e) return false;
  const a = s.split(':'), b = e.split(':'), sm = (+a[0]) * 60 + (+a[1]), em = (+b[0]) * 60 + (+b[1]);
  return em <= sm || em > XRD_WORK_END || em < XRD_WORK_START;
}

function updateXrdChecks(clear){
  const need = xrdAfterHours();
  const btn = $('xrdMinBtn');
  if(btn){
    btn.disabled = !need;
    if(!need && clear) xrdChk.xray_min_ok = false;
    btn.classList.toggle('req', need && !xrdChk.xray_min_ok);
  }
  const hint = $('xrdMinHint');
  if(hint){
    hint.textContent = need ? 'Required: session ends outside 10:00–17:00.' : 'Only if you finish outside 10:00–17:00.';
  }
  paintXrdToggles();
}

function paintXrdToggles(){
  document.querySelectorAll('[data-chk]').forEach(function(b){
    b.classList.toggle('on', !!xrdChk[b.dataset.chk]);
  });
  document.querySelectorAll('[data-align]').forEach(function(b){
    b.classList.toggle('on', b.dataset.align === xrdAlign);
  });
  document.querySelectorAll('[data-scan]').forEach(function(b){
    b.classList.toggle('on', xrdScanSel.has(b.dataset.scan));
  });
}

function updXrdDur(){
  const f = $('xrdForm');
  if(!f || !f.start_time || !f.end_time) return;
  const m = minutesBetween(f.start_time.value, f.end_time.value);
  const durEl = $('xrdDur');
  if(durEl) durEl.textContent = m ? '= ' + formatDurationHoursMinutes(m) : '';
}

function minutesBetween(s, e){
  if(!s || !e) return 0;
  const a = s.split(':'), b = e.split(':');
  let m = ((+b[0]) * 60 + (+b[1])) - ((+a[0]) * 60 + (+a[1]));
  if(m <= 0) m += 1440;
  return m;
}

function formatDurationHoursMinutes(m){
  return Math.floor(m / 60) + 'h ' + pad(m % 60) + 'm';
}

function checkXrdChiller(){
  const f = $('xrdForm');
  if(!f) return;
  const s = parseFloat(f.chiller_start ? f.chiller_start.value : ''), e = parseFloat(f.chiller_end ? f.chiller_end.value : '');
  const out = (s && (s < 20 || s > 24)) || (e && (e < 20 || e > 24));
  const hint = $('xrdChillerHint');
  if(hint) hint.classList.toggle('hidden', !out);
}

function showXrdMode(m){
  xrdMode = m;
  const f = $('xrdForm');
  if(!f) return;

  const btnStart = $('btnXrdModeStart');
  const btnFull = $('btnXrdModeFull');
  if(btnStart) btnStart.classList.toggle('active', m === 'start');
  if(btnFull) btnFull.classList.toggle('active', m === 'full');

  f.classList.toggle('mode-start', m === 'start');
  f.classList.toggle('hidden', m === 'active');
  const activeBox = $('xrdActiveBox');
  if(activeBox) activeBox.classList.toggle('hidden', m !== 'active');
  const modeBar = $('xrdModeBar');
  if(modeBar) modeBar.classList.toggle('hidden', m === 'active');

  if(f.chiller_end) f.chiller_end.required = (m === 'full');
  if(f.vacuum_end) f.vacuum_end.required = (m === 'full');

  const modeTitle = $('xrdModeTitle');
  if(modeTitle){
    modeTitle.textContent = m === 'start' ? 'Start session (세션 시작)' : (xrdFinishing ? 'Finish session (세션 종료)' : (xrdEditId ? 'Edit log (수정)' : 'Log a finished session (사후 일괄 기록)'));
  }
  const modeLink = $('xrdModeLink');
  if(modeLink){
    modeLink.textContent = m === 'start' ? 'Log a finished session instead →' : '← Back';
    modeLink.classList.toggle('hidden', !!xrdEditId);
  }
  if(m === 'active') renderXrdActive();
  updateXrdSaveLabel();
}

function updateXrdSaveLabel(){
  const btn = $('xrdSaveBtn');
  if(!btn) return;
  btn.textContent = xrdMode === 'start' ? 'Start session (세션 시작)' : (xrdFinishing ? 'Finish & save log (측정 종료 및 저장)' : (xrdEditId ? 'Save changes (수정 저장)' : 'Save log (로그북 등록)'));
}

function resetXrdForm(){
  xrdEditId = null;
  xrdFinishing = false;
  const f = $('xrdForm');
  if(!f) return;
  f.reset();
  if(f.used_on) f.used_on.value = today();

  const d = new Date(), t = d.getHours() * 60 + (d.getMinutes() < 30 ? 0 : 30);
  if(f.start_time) f.start_time.value = pad(Math.floor(t / 60)) + ':' + pad(t % 60);
  const e = (t + 60) % 1440;
  if(f.end_time) f.end_time.value = pad(Math.floor(e / 60)) + ':' + pad(e % 60);

  xrdChk = { xray_max_ok: false, xray_min_ok: false, position_ok: false };
  xrdAlign = 'PB';
  xrdScanSel = new Set();
  if(f.sample_count) f.sample_count.value = '1';

  // 회원 프로필 정보 자동완성
  if(session && session.user){
    const meta = session.user.user_metadata || {};
    if(f.user_name && meta.name) f.user_name.value = meta.name;
    if(f.professor && meta.professor) f.professor.value = meta.professor;
    if(f.affiliation && meta.affiliation) f.affiliation.value = meta.affiliation;
  }

  const cancelBtn = $('xrdCancelEditBtn');
  if(cancelBtn) cancelBtn.classList.add('hidden');
  const moreBox = $('xrdMoreBox');
  if(moreBox) moreBox.open = false;

  updXrdDur();
  updateXrdChecks(false);
  checkXrdChiller();
  paintXrdToggles();
  updateXrdSaveLabel();
  showXrdMode(myActiveXrdSession() ? 'active' : 'start');
}

function myActiveXrdSession(){
  return xrdLogs.find(function(l){ return l.status === 'active'; });
}

function renderXrdActive(){
  const l = myActiveXrdSession();
  const box = $('xrdActiveBox');
  if(!box) return;
  if(!l){
    showXrdMode('start');
    return;
  }
  const dt = l.used_on ? String(l.used_on).replace(/-/g, '.') : '';
  const tm = l.start_time ? String(l.start_time).slice(0, 5) : '';
  box.innerHTML =
    '<div class="xrd-activecard">' +
      '<b>● Session in progress (측정 진행 중)</b>' +
      '<div style="margin-top:6px;font-size:14px;color:#1e3a8a;">' +
        '사용자: <b>' + safe(l.user_name) + '</b> (' + safe(l.affiliation || '') + ') · 시작: <b>' + safe(dt) + ' ' + safe(tm) + '</b><br>' +
        'Chiller <b>' + safe(l.chiller_start) + ' °C</b> · Vacuum <b>' + safe(l.vacuum_start) + ' mV</b>' +
      '</div>' +
      '<div class="actions" style="margin-top:12px;display:flex;gap:10px;">' +
        '<button class="btn primary" type="button" id="btnFinishXrdActive" style="height:40px;padding:0 18px;font-weight:700;">Finish &amp; log (측정 종료 및 기록)</button>' +
        '<button class="btn" type="button" id="btnCancelXrdActive" style="height:40px;padding:0 14px;">Cancel session (취소)</button>' +
      '</div>' +
    '</div>';

  const finishBtn = $('btnFinishXrdActive');
  if(finishBtn){
    finishBtn.addEventListener('click', function(){
      finishXrdSession(l.id);
    });
  }
  const cancelBtn = $('btnCancelXrdActive');
  if(cancelBtn){
    cancelBtn.addEventListener('click', function(){
      if(confirm('진행 중인 세션을 취소(삭제)하시겠습니까?')){
        deleteXrdLog(l.id);
      }
    });
  }
}

function renderXrdInUse(){
  const inuse = $('xrdInUse');
  if(!inuse) return;
  const act = xrdLogs.filter(function(l){ return l.status === 'active'; });
  inuse.classList.toggle('hidden', act.length === 0);
  if(act.length > 0){
    const listText = act.slice(0, 3).map(function(l){
      const tm = l.start_time ? String(l.start_time).slice(0, 5) : '';
      return '<b>' + safe(l.user_name) + '</b> (since ' + safe(tm) + ')';
    }).join(', ');
    inuse.innerHTML = '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,0.3);margin-right:4px;"></span> ● In use now: ' + listText;
  }
}

function renderXrdLogs(){
  const searchInput = $('xrdSearch');
  const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const rows = $('xrdRows');
  if(!rows) return;

  renderXrdInUse();

  const filtered = xrdLogs.filter(function(l){
    if(!q) return true;
    const hay = [l.sample_name, l.meas_info, l.user_name, l.affiliation, l.professor, l.scan_type, l.reservation_no, l.memo].join(' ').toLowerCase();
    return hay.includes(q);
  });

  if(filtered.length === 0){
    rows.innerHTML = '<div style="text-align:center;padding:36px;color:#64748b;font-size:14px;">등록된 HR-XRD 사용일지가 없습니다.</div>';
    return;
  }

  const arrow = function(a, b){
    return safe(a ?? '—') + ' → ' + (b == null || b === '' ? '…' : safe(b));
  };
  const checksHtml = function(l){
    const m = function(ok, t){
      return '<span class="' + (ok ? 'ok-badge' : 'bad-badge') + '">' + t + (ok ? ' ✓' : ' ✕') + '</span>';
    };
    return m(l.xray_max_ok, 'Max') + ' ' + m(l.xray_min_ok, 'Min') + ' ' + m(l.position_ok, 'Pos');
  };

  let html = '<table><thead><tr>' +
    '<th>Date / Time</th>' +
    '<th>User / Adviser</th>' +
    '<th>Chiller [°C]</th>' +
    '<th>Vacuum [mV]</th>' +
    '<th>Checks</th>' +
    '<th>Align.</th>' +
    '<th>Scan type</th>' +
    '<th>Sample</th>' +
    '<th>Action</th>' +
    '</tr></thead><tbody>';

  filtered.forEach(function(l){
    const dt = l.used_on ? String(l.used_on).replace(/-/g, '.') : '';
    const st = l.start_time ? String(l.start_time).slice(0, 5) : '';
    const et = l.end_time ? String(l.end_time).slice(0, 5) : '';
    const isActive = l.status === 'active';
    const durStr = l.duration_min ? formatDurationHoursMinutes(l.duration_min) : '';

    html += '<tr>' +
      '<td data-l="Time"><b>' + safe(dt) + '</b> <span class="id" style="font-size:12px;color:#64748b;display:block;">' + safe(st) + ' ~ ' + (isActive ? '<span style="background:#dbeafe;color:#1e40af;padding:1px 6px;border-radius:4px;font-weight:700;font-size:11px;">In progress</span>' : safe(et) + ' (' + durStr + ')') + (l.reservation_no ? ' · #' + safe(l.reservation_no) : '') + '</span></td>' +
      '<td data-l="User"><b>' + safe(l.user_name) + '</b> <span class="id" style="font-size:12px;color:#64748b;display:block;">' + safe(l.professor || '') + ' · ' + safe(l.affiliation || '') + '</span></td>' +
      '<td data-l="Chiller">' + arrow(l.chiller_start, l.chiller_end) + '</td>' +
      '<td data-l="Vacuum">' + arrow(l.vacuum_start, l.vacuum_end) + '</td>' +
      '<td data-l="Checks">' + (isActive ? '—' : checksHtml(l)) + '</td>' +
      '<td data-l="Align.">' + (isActive ? '—' : safe(l.align || 'PB')) + '</td>' +
      '<td data-l="Scan">' + (safe(l.scan_type) || '—') + '</td>' +
      '<td data-l="Sample"><b>' + (safe(l.sample_name) || '—') + '</b> <span class="id" style="font-size:12px;color:#64748b;display:block;">' + (isActive ? '' : '×' + safe(l.sample_count || 1)) + (l.meas_info ? ' · ' + safe(l.meas_info) : '') + (l.memo ? ' · 📝 ' + safe(l.memo) : '') + '</span></td>' +
      '<td data-l="Action">' +
        (isActive ? '<button type="button" class="text-btn" data-xrd-finish="' + l.id + '" style="font-weight:700;color:var(--primary);">Finish</button> ' : '<button type="button" class="text-btn" data-xrd-edit="' + l.id + '">Edit</button> ') +
        '<button type="button" class="text-btn del" data-xrd-del="' + l.id + '">Delete</button>' +
      '</td>' +
      '</tr>';
  });

  html += '</tbody></table>';
  rows.innerHTML = html;
}

function finishXrdSession(id){
  const l = xrdLogs.find(function(x){ return String(x.id) === String(id); });
  if(!l) return;
  const f = $('xrdForm');
  if(!f) return;

  xrdEditId = l.id;
  xrdFinishing = (l.status === 'active');

  for(const k of ['reservation_no','used_on','chiller_start','chiller_end','vacuum_start','vacuum_end','sample_name','meas_info','affiliation','user_name','professor','memo']){
    if(f[k]) f[k].value = l[k] ?? '';
  }
  if(f.start_time && l.start_time) f.start_time.value = String(l.start_time).slice(0, 5);

  const d = new Date();
  let t = Math.ceil((d.getHours() * 60 + d.getMinutes()) / 30) * 30 % 1440;
  const sm = f.start_time ? (+f.start_time.value.split(':')[0] * 60 + +f.start_time.value.split(':')[1]) : 0;
  if(t === sm) t = (t + 30) % 1440;
  if(f.end_time) f.end_time.value = l.end_time ? String(l.end_time).slice(0, 5) : (pad(Math.floor(t / 60)) + ':' + pad(t % 60));

  xrdChk = {
    xray_max_ok: !!l.xray_max_ok,
    xray_min_ok: !!l.xray_min_ok,
    position_ok: !!l.position_ok
  };
  xrdAlign = l.align || 'PB';

  const parts = String(l.scan_type || '').split(',').map(function(x){ return x.trim(); }).filter(Boolean);
  xrdScanSel = new Set(parts.filter(function(x){ return XRD_SCAN_CHIPS.includes(x); }));
  if(f.scan_other) f.scan_other.value = parts.filter(function(x){ return !XRD_SCAN_CHIPS.includes(x); }).join(', ');
  if(f.sample_count) f.sample_count.value = String(l.sample_count || 1);

  showXrdMode('full');
  updXrdDur();
  updateXrdChecks(true);
  checkXrdChiller();
  paintXrdToggles();

  const cancelBtn = $('xrdCancelEditBtn');
  if(cancelBtn) cancelBtn.classList.remove('hidden');

  f.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function handleXrdFormSubmit(e){
  e.preventDefault();
  const f = $('xrdForm');
  if(!f) return;

  const btn = $('xrdSaveBtn');
  if(btn) btn.disabled = true;

  try {
    const isStartMode = (xrdMode === 'start');
    const memoVal = (f.memo ? f.memo.value : '').trim();

    if(!isStartMode){
      const needMin = xrdAfterHours();
      if(!xrdChk.xray_max_ok && !memoVal){
        alert('Set max. while using 체크를 확인하거나, 메모(Memo / Issue)에 사유를 기록해주세요.');
        if(btn) btn.disabled = false;
        return;
      }
      if(needMin && !xrdChk.xray_min_ok && !memoVal){
        alert('10:00–17:00 외 종료 시 "Set min. after use" 체크가 필수입니다. 체크하거나 메모에 사유를 기록해주세요.');
        if(btn) btn.disabled = false;
        return;
      }
      if(!xrdChk.position_ok && !memoVal){
        alert('Set initial after use 체크를 확인하거나, 메모(Memo / Issue)에 사유를 기록해주세요.');
        if(btn) btn.disabled = false;
        return;
      }
    }

    const scanList = Array.from(xrdScanSel);
    if(f.scan_other && f.scan_other.value.trim()){
      scanList.push(f.scan_other.value.trim());
    }

    const dur = (isStartMode || !f.start_time.value || !f.end_time.value) ? null : minutesBetween(f.start_time.value, f.end_time.value);

    const logEntry = {
      reservation_no: f.reservation_no ? f.reservation_no.value.trim() : '',
      used_on: f.used_on ? f.used_on.value : today(),
      start_time: f.start_time ? f.start_time.value : '10:00',
      end_time: isStartMode ? null : (f.end_time ? f.end_time.value : null),
      duration_min: isStartMode ? null : dur,
      status: isStartMode ? 'active' : 'done',
      chiller_start: f.chiller_start && f.chiller_start.value ? parseFloat(f.chiller_start.value) : null,
      chiller_end: !isStartMode && f.chiller_end && f.chiller_end.value ? parseFloat(f.chiller_end.value) : null,
      vacuum_start: f.vacuum_start && f.vacuum_start.value ? parseInt(f.vacuum_start.value, 10) : null,
      vacuum_end: !isStartMode && f.vacuum_end && f.vacuum_end.value ? parseInt(f.vacuum_end.value, 10) : null,
      xray_max_ok: !!xrdChk.xray_max_ok,
      xray_min_ok: !!xrdChk.xray_min_ok,
      position_ok: !!xrdChk.position_ok,
      align: xrdAlign,
      scan_type: scanList.join(', '),
      sample_name: f.sample_name ? f.sample_name.value.trim() : '',
      meas_info: f.meas_info ? f.meas_info.value.trim() : '',
      sample_count: f.sample_count ? parseInt(f.sample_count.value, 10) : 1,
      affiliation: f.affiliation ? f.affiliation.value.trim() : '2DQH',
      user_name: f.user_name ? f.user_name.value.trim() : '',
      professor: f.professor ? f.professor.value.trim() : '',
      memo: memoVal,
      user_id: session && session.user ? session.user.id : null,
      updated_at: new Date().toISOString()
    };

    if(xrdEditId){
      const idx = xrdLogs.findIndex(function(x){ return String(x.id) === String(xrdEditId); });
      if(idx !== -1){
        logEntry.id = xrdEditId;
        logEntry.created_at = xrdLogs[idx].created_at || new Date().toISOString();
        xrdLogs[idx] = Object.assign({}, xrdLogs[idx], logEntry);
      }
      if(db && !isLocalMode){
        try {
          await db.from('xrd_logs').update(logEntry).eq('id', xrdEditId);
        } catch(err){
          console.warn('Supabase xrd_logs update 실패 (로컬 유지):', err);
        }
      }
      toast('✓ HR-XRD 로그가 저장되었습니다.');
    } else {
      logEntry.id = Date.now();
      logEntry.created_at = new Date().toISOString();
      xrdLogs.unshift(logEntry);

      if(db && !isLocalMode){
        try {
          const { data: inserted, error: insertErr } = await db.from('xrd_logs').insert(logEntry).select();
          if(!insertErr && inserted && inserted[0]){
            logEntry.id = inserted[0].id;
          }
        } catch(err){
          console.warn('Supabase xrd_logs insert 실패 (로컬 유지):', err);
        }
      }
      toast(isStartMode ? '✓ HR-XRD 측정이 시작되었습니다 (진행 중 등록).' : '✓ HR-XRD 사용일지가 등록되었습니다.');
    }

    try { localStorage.setItem('labstock_xrd_logs', JSON.stringify(xrdLogs)); } catch(_) {}
    resetXrdForm();
    renderXrdLogs();
  } catch(e){
    console.error('HR-XRD 저장 실패:', e);
    toast('저장 중 오류가 발생했습니다.');
  } finally {
    if(btn) btn.disabled = false;
  }
}

async function deleteXrdLog(id){
  if(!confirm('이 HR-XRD 로그 기록을 삭제하시겠습니까?')) return;
  xrdLogs = xrdLogs.filter(function(l){ return String(l.id) !== String(id); });
  try { localStorage.setItem('labstock_xrd_logs', JSON.stringify(xrdLogs)); } catch(_) {}

  if(db && !isLocalMode){
    try {
      await db.from('xrd_logs').delete().eq('id', id);
    } catch(err){
      console.warn('Supabase delete 실패:', err);
    }
  }
  toast('✓ 로그 기록이 삭제되었습니다.');
  if(xrdEditId === id) resetXrdForm();
  renderXrdLogs();
}

function exportXrdLogsCsv(){
  if(xrdLogs.length === 0){
    toast('내보낼 HR-XRD 로그 데이터가 없습니다.');
    return;
  }
  const headers = ['Reservation No', 'Date', 'Start Time', 'End Time', 'Duration(min)', 'Status', 'User Name', 'Professor', 'Affiliation', 'Chiller Start(°C)', 'Chiller End(°C)', 'Vacuum Start(mV)', 'Vacuum End(mV)', 'X-ray Max', 'X-ray Min', 'Position', 'Align', 'Scan Type', 'Sample Name', 'Sample Count', 'Measurement Info', 'Memo', 'Created At'];
  const rows = xrdLogs.map(function(l){
    return [
      l.reservation_no || '',
      l.used_on || '',
      l.start_time || '',
      l.end_time || '',
      l.duration_min || '',
      l.status || '',
      l.user_name || '',
      l.professor || '',
      l.affiliation || '',
      l.chiller_start ?? '',
      l.chiller_end ?? '',
      l.vacuum_start ?? '',
      l.vacuum_end ?? '',
      l.xray_max_ok ? 'OK' : 'NO',
      l.xray_min_ok ? 'OK' : 'NO',
      l.position_ok ? 'OK' : 'NO',
      l.align || '',
      l.scan_type || '',
      l.sample_name || '',
      l.sample_count || 1,
      l.meas_info || '',
      (l.memo || '').replace(/[\r\n]+/g, ' '),
      l.created_at || ''
    ].map(function(cell){
      const s = String(cell ?? '').replace(/"/g, '""');
      return '"' + s + '"';
    }).join(',');
  });

  const csvContent = '\uFEFF' + headers.join(',') + '\r\n' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '2DQH_HR-XRD_Logbook_' + today() + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('✓ HR-XRD 전체 로그(' + xrdLogs.length + '건)가 CSV로 다운로드되었습니다.');
}

function renderResearchEquipmentTabs(){
  const host = $('researchEquipmentTabs');
  if(!host) return;

  let html = '';
  researchEquipments.forEach(function(eq){
    const isActive = (eq.id === currentSelectedEquipment);
    html += '<button type="button" class="research-equipment-tab ' + (isActive ? 'active' : '') + '" data-select-equipment="' + safe(eq.id) + '">' +
      '<span class="tab-badge">' + safe(eq.code) + '</span>' +
      '<span>' + safe(eq.name) + '</span>' +
    '</button>';
  });

  html += '<button type="button" class="research-equipment-tab" id="btnRegisterNewEquipment" style="border-style:dashed;color:var(--primary);">' +
    '<span>＋ 새 연구장비 등록</span>' +
  '</button>';

  host.innerHTML = html;
}

function selectResearchEquipment(eqId){
  currentSelectedEquipment = eqId;
  renderResearchEquipmentTabs();

  const countBadge = $('logbookCountBadge');
  const selected = researchEquipments.find(function(e){ return e.id === eqId; });
  if(countBadge && selected){
    countBadge.textContent = selected.code;
  }

  const isXrd = (selected && selected.type === 'xrd');
  const xrdContainer = $('xrdLogbookContainer');
  const generalContainer = $('generalEquipmentLogContainer');

  if(xrdContainer) xrdContainer.classList.toggle('hidden', !isXrd);
  if(generalContainer) generalContainer.classList.toggle('hidden', isXrd);

  if(isXrd){
    initXrdControls();
    resetXrdForm();
    renderXrdLogs();
  } else {
    renderGeneralEquipmentLogs();
  }
}

function renderGeneralEquipmentLogs(){
  const rows = $('generalEquipmentLogRows');
  if(!rows) return;

  const selected = researchEquipments.find(function(e){ return e.id === currentSelectedEquipment; });
  if(!selected) return;

  const filtered = equipmentLogs.filter(function(lg){
    return String(lg.asset_id) === String(selected.id) || String(lg.asset_name).includes(selected.name);
  });

  let html =
    '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">' +
        '<div>' +
          '<h3 style="margin:0 0 4px;font-size:16px;color:var(--ink);">' + safe(selected.name) + '</h3>' +
          '<div style="font-size:13px;color:#64748b;">모델: ' + safe(selected.model) + ' · 위치: ' + safe(selected.location) + ' · 책임자: ' + safe(selected.manager) + '</div>' +
        '</div>' +
        '<button type="button" class="btn primary" id="btnLogThisEquipment">＋ 사용일지 작성</button>' +
      '</div>' +
    '</div>';

  if(filtered.length === 0){
    html += '<div style="text-align:center;padding:36px;color:#64748b;font-size:14px;">등록된 ' + safe(selected.name) + ' 사용일지가 없습니다.</div>';
  } else {
    html += '<div class="logbook-cards-grid" style="display:flex;flex-direction:column;gap:10px;">';
    filtered.forEach(function(rec){
      const dt = String(rec.start_time || '').replace('T', ' ').slice(0, 16);
      const isIssue = rec.status_check === 'issue';
      const statusBadge = isIssue ? '<span class="status-badge is-issue">⚠️ 점검 필요</span>' : '<span class="status-badge is-normal">✓ 정상 작동</span>';
      html +=
        '<div class="logbook-card">' +
          '<div class="logbook-card-header">' +
            '<span class="logbook-asset-name">' + safe(selected.name) + '</span>' +
            '<div>' + statusBadge + '</div>' +
          '</div>' +
          '<div class="logbook-meta-row">' +
            '<span>📅 ' + safe(dt) + '</span>' +
            '<span>⏱️ <b>' + safe(rec.run_hours || '—') + '시간</b> 가동</span>' +
            '<span>👤 <b>' + safe(rec.operator_name) + '</b></span>' +
            (rec.project_name ? '<span>🎯 ' + safe(rec.project_name) + '</span>' : '') +
          '</div>' +
          (rec.sample_info ? '<div class="logbook-sample-box"><b>시료/샘플:</b> ' + safe(rec.sample_info) + '</div>' : '') +
          (rec.notes ? '<div style="font-size:12px;color:#64748b;margin-top:6px;">📝 ' + safe(rec.notes) + '</div>' : '') +
        '</div>';
    });
    html += '</div>';
  }

  rows.innerHTML = html;

  const btnLog = $('btnLogThisEquipment');
  if(btnLog){
    btnLog.addEventListener('click', function(){
      openModal('equipmentLog', selected.id);
    });
  }
}

function renderLogbook(){
  if(!ENABLE_EQUIPMENT_LOGBOOK) return;

  const standaloneBanner = $('logbookStandaloneBanner');
  if(standaloneBanner){
    const isStandalone = (window.location.hash || '').includes('standalone') ||
      new URLSearchParams(window.location.search).get('standalone') === 'true' ||
      new URLSearchParams(window.location.search).get('mode') === 'logbook';
    standaloneBanner.classList.toggle('hidden', !isStandalone);
  }

  currentSelectedEquipment = 'EQ-XRD-01';
  initXrdControls();
  resetXrdForm();
  renderXrdLogs();
}

function exportEquipmentLogsCsv(){
  const selected = researchEquipments.find(function(e){ return e.id === currentSelectedEquipment; });
  if(selected && selected.type === 'xrd'){
    exportXrdLogsCsv();
  } else {
    exportGeneralEquipmentLogsCsv();
  }
}

function exportGeneralEquipmentLogsCsv(){
  if(equipmentLogs.length === 0){
    toast('내보낼 장비 로그북 데이터가 없습니다.');
    return;
  }
  const headers = ['연번', '로그ID', '장비코드', '장비명', '사용자', '시작일시', '가동시간(h)', '연구과제명', '측정시료', '장비상태', '특이사항', '등록일시'];
  const rows = equipmentLogs.map(function(lg, idx){
    return [
      idx + 1,
      lg.id || '',
      lg.asset_id || '',
      lg.asset_name || '',
      lg.operator_name || '',
      lg.start_time ? lg.start_time.replace('T', ' ') : '',
      lg.run_hours || '',
      lg.project_name || '',
      lg.sample_info || '',
      lg.status_check === 'issue' ? '점검필요' : '정상작동',
      (lg.notes || '').replace(/[\r\n]+/g, ' '),
      lg.created_at ? lg.created_at.replace('T', ' ') : ''
    ].map(function(cell){
      const s = String(cell || '').replace(/"/g, '""');
      return '"' + s + '"';
    }).join(',');
  });

  const csvContent = '\uFEFF' + headers.join(',') + '\r\n' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '2DQH_연구장비_전자로그북_' + today() + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('✓ 장비 로그북이 CSV로 다운로드되었습니다.');
}

function fallbackCopyText(text, name){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    toast("✓ '" + (name || '소모품') + "' 보관 위치가 복사되었습니다!");
  } catch(e){
    toast('위치: ' + text, 5000);
  }
  document.body.removeChild(ta);
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

    $('historyRows').innerHTML = '<div class="table-wrap"><table aria-label="전체 비품 대여 및 반납 이력"><thead><tr><th scope="col">비품 / 식별번호</th><th scope="col">대여자</th><th scope="col">시작일</th><th scope="col">예정 반납일</th><th scope="col">실제 반납일</th><th scope="col">상태</th></tr></thead><tbody>' +
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
  if(document.body) document.body.classList.add('modal-open');

  const a = id ? assetFor(id) : null;

  let titleText = '관리자 로그인';

  if(mode === 'asset'){
    titleText = a ? '비품 정보 수정' : '비품 등록';
  } else if(mode === 'borrow'){
    titleText = '비품 대여 신청';
  } else if(mode === 'return'){
    titleText = '비품 반납';
  } else if(mode === 'editLoan'){
    titleText = '대여 기록 수정';
  } else if(mode === 'extendPeriod'){
    titleText = '📅 대여 기간 연장';
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
  } else if(mode === 'chemicalLog'){
    titleText = '📝 특별관리물질 취급일지 작성';
  } else if(mode === 'equipmentLog'){
    titleText = '📖 연구장비 전자 로그북 작성';
  } else if(mode === 'addResearchEquipment'){
    titleText = '🔬 새 연구장비 등록 (비품과 독립 관리)';
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

    // 1. 기본 동시 대여 제한: 1인당 최대 3개까지
    const activeLoans = getMyActiveLoans(lastBorrower);
    if(activeLoans.length >= 3){
      toast('💡 비품은 1인당 최대 3개까지 동시 대여 가능합니다. 기존 비품을 먼저 반납해 주세요 :)', 4000);
      closeModal();
      setTimeout(function(){ openModal('return', activeLoans[0].id); }, 350);
      return;
    }

    // 2. 24시간 이상 경과 비품이 2개 이상일 때: 반납 팝업 먼저 노출 (단, 취소 시 대여창으로 복귀)
    if(!window.__bypass24hPrompt){
      const overdue24h = getMy24hOverdueLoans(lastBorrower);
      if(overdue24h.length >= 2){
        window.__pendingBorrowAssetId = id || null;
        window.__isPromptingReturnBeforeBorrow = true;
        closeModal();
        setTimeout(function(){
          openModal('return', overdue24h[0].id);
        }, 120);
        return;
      }
    }
    window.__bypass24hPrompt = false;

    if(preselectedAsset){
      parts.push('<div class="selected-asset-box has-modal-thumb">');
      parts.push('<div class="modal-asset-thumb-wrap">' + getEquipmentImageHtml(preselectedAsset, 'modal') + '</div>');
      parts.push('<div class="modal-asset-info">');
      parts.push('<div class="selected-asset-badge"><span class="status available">대여 가능</span><span class="asset-id">' + safe(preselectedAsset.id) + '</span></div>');
      parts.push('<div class="selected-asset-title">' + safe(preselectedAsset.name) + '</div>');
      parts.push('<div class="selected-asset-sub">📍 보관 위치: ' + safe(preselectedAsset.location || '연구실 지정 장소') + (preselectedAsset.category ? ' · ' + safe(preselectedAsset.category) : '') + '</div>');
      parts.push('</div>');
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

    const defaultDueDate = calcSmartDueDate(1);

    parts.push('<div class="form-grid" style="margin-top:10px;">');
    parts.push('<input type="hidden" name="due_date" value="' + defaultDueDate + '">');
    parts.push('<label class="field full">대여자 이름 *<input name="borrower_name" required maxlength="100" autocomplete="name" placeholder="홍길동" value="' + safe(lastBorrower) + '"></label>');
    parts.push('<label class="field full">사용 목적 / 메모 (선택)<input name="memo" maxlength="500" placeholder="예: 3층 측정실 작업 (생략 가능)"></label>');
    parts.push('</div>');
  } else if(mode === 'consumable'){
    if(!isAdmin()){
      parts.push('<p>소모품 등록 및 수정은 관리자 로그인이 필요합니다.</p>');
    } else {
      const c = consumableFor(id);
      const cat = c ? (c.category || '기판·박리') : '기판·박리';

      const catOpts = CONSUMABLE_CATEGORIES.map(function(k){
        return '<option value="' + safe(k) + '" ' + (cat === k ? 'selected' : '') + '>' + safe(k) + '</option>';
      }).join('');

      parts.push('<div class="form-grid">');
      parts.push('<label class="field full">소모품명 *<input name="name" required maxlength="160" value="' + safe(c ? c.name : '') + '" placeholder="예: 4인치 Si/SiO2 웨이퍼 (300nm)"></label>');
      parts.push('<label class="field">분류 *<select name="category" required>' + catOpts + '</select></label>');
      parts.push('<label class="field">보관 구역 (호실) *<input name="location" required maxlength="100" value="' + safe(c ? c.location : '') + '" placeholder="예: 클린룸 광학실, 화학실험실"></label>');
      parts.push('<label class="field full">상세 위치 (캐비닛/선반) *<input name="sub_location" required maxlength="150" value="' + safe(c ? (c.sub_location || '') : '') + '" placeholder="예: 진공 데시케이터 A 2단, 시약장 1단"></label>');
      parts.push('<label class="field full">규격 / 주의사항 (선택)<textarea name="specification" rows="2" maxlength="500" placeholder="예: P-type, 500µm 두께, 개봉 후 질소 퍼지">' + safe(c ? (c.specification || c.note || '') : '') + '</textarea></label>');
      parts.push('</div>');
    }
  } else if(mode === 'chemicalLog'){
    const c = consumableFor(id);
    if(!c){
      parts.push('<p>시약 정보를 찾을 수 없습니다.</p>');
    } else {
      const meta = parseConsumableMeta(c);
      const lastBorrower = localStorage.getItem('labstock_last_borrower_name') || '';
      const lastWorkLoc = localStorage.getItem('labstock_last_work_location') || '3층 화학실 흄후드 1번';
      const lastWorkDesc = localStorage.getItem('labstock_last_work_description') || '2D Flake 박리 기판 세척 및 린스';
      const lastUnit = localStorage.getItem('labstock_last_unit') || 'mL';
      const nowStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

      const ci = getControlledSubstanceInfo(c);
      const statutoryKo = ci && ci.nameKo ? ci.nameKo : '';
      const statutoryEn = ci && ci.nameEn ? ci.nameEn : '';
      const statutoryThreshold = ci && ci.threshold ? ci.threshold : '0.1% 이상';
      const lawNo = ci && ci.no ? ci.no : null;

      parts.push('<div class="chem-id-card">');
      parts.push('  <div class="chem-id-top">');
      parts.push('    <div class="chem-id-badge-row">');
      parts.push('      <span class="chem-badge-controlled">🚨 특별관리물질</span>');
      if(lawNo){
        parts.push('      <span class="chem-badge-num">별표 12 제' + safe(lawNo) + '호</span>');
      }
      parts.push('    </div>');
      parts.push('    <div class="chem-id-title-main">');
      if(statutoryKo){
        parts.push('      <span class="chem-name-ko">' + safe(statutoryKo) + '</span>');
        if(statutoryEn){
          parts.push('      <span class="chem-name-en">(' + safe(statutoryEn) + ')</span>');
        }
      } else {
        parts.push('      <span class="chem-name-ko">' + safe(c.name) + '</span>');
      }
      parts.push('    </div>');
      parts.push('    <div class="chem-id-spec">');
      parts.push('      <strong style="color:#334155;">시약 규격:</strong> ' + safe(c.name));
      parts.push('    </div>');
      parts.push('  </div>');
      parts.push('  <div class="chem-id-meta-bar">');
      parts.push('    <span class="chem-meta-item"><b>CAS</b> ' + safe(meta.cas || '확인 필요') + '</span>');
      parts.push('    <span class="chem-meta-item"><b>보관</b> 📍 ' + safe(c.location || '화학실') + (c.sub_location ? ' · ' + safe(c.sub_location) : '') + '</span>');
      if(statutoryThreshold){
        parts.push('    <span class="chem-meta-item"><b>관리기준</b> ' + safe(statutoryThreshold) + '</span>');
      }
      parts.push('  </div>');
      parts.push('  <div class="chem-notice-card">');
      parts.push('    <div class="chem-notice-icon" aria-hidden="true">🛡️</div>');
      parts.push('    <div class="chem-notice-body">');
      parts.push('      <div class="chem-notice-head">산업안전보건법 제420조 특별관리물질 취급일지</div>');
      parts.push('      <div class="chem-notice-desc">특별관리물질 사용 내역은 <b>30년간 보존</b>되며 정기 근로감독 시 제출 대상입니다.</div>');
      parts.push('    </div>');
      parts.push('  </div>');
      parts.push('</div>');

      parts.push('<div class="chem-form-grid">');
      parts.push('<input type="hidden" name="consumable_id" value="' + safe(c.id) + '">');
      parts.push('<input type="hidden" name="chemical_name" value="' + safe(c.name) + '">');
      parts.push('<input type="hidden" name="cas_number" value="' + safe(meta.cas || '') + '">');

      parts.push('<label class="field full">취급자 성명 *<input name="handler_name" required maxlength="50" value="' + safe(lastBorrower) + '" placeholder="취급자 성명 (예: 홍길동)"></label>');
      parts.push('<label class="field full">취급 일시 *<input name="used_at" type="datetime-local" required value="' + nowStr + '"></label>');

      parts.push('<div class="field full">');
      parts.push('<label class="field-label" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--text-secondary);">사용량 (취급량) *</label>');
      parts.push('<div class="compound-input-group">');
      parts.push('<input name="quantity" type="number" min="0.001" step="any" required placeholder="수량 입력 (예: 25)" class="compound-input" inputmode="decimal">');
      parts.push('<input name="unit" class="compound-unit-input" list="unitPresets" value="' + safe(lastUnit || 'mL') + '" placeholder="단위 입력" required maxlength="15" autocomplete="off">');
      parts.push('<datalist id="unitPresets">');
      parts.push('<option value="mL">');
      parts.push('<option value="µL">');
      parts.push('<option value="g">');
      parts.push('<option value="mg">');
      parts.push('<option value="L">');
      parts.push('<option value="ea">');
      parts.push('<option value="방울">');
      parts.push('</datalist>');
      parts.push('</div>');
      parts.push('<div class="preset-chips-wrap" style="margin-top:8px;">');
      parts.push('<span class="preset-chips-label">수량:</span>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="quantity" data-set-val="5">5</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="quantity" data-set-val="10">10</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="quantity" data-set-val="25">25</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="quantity" data-set-val="50">50</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="quantity" data-set-val="100">100</button>');
      parts.push('</div>');
      parts.push('<div class="preset-chips-wrap" style="margin-top:6px;">');
      parts.push('<span class="preset-chips-label">단위:</span>');
      const curUnit = lastUnit || 'mL';
      parts.push('<button type="button" class="btn-preset-chip' + (curUnit === 'mL' ? ' active' : '') + '" data-set-field="unit" data-set-val="mL">mL</button>');
      parts.push('<button type="button" class="btn-preset-chip' + (curUnit === 'µL' ? ' active' : '') + '" data-set-field="unit" data-set-val="µL">µL</button>');
      parts.push('<button type="button" class="btn-preset-chip' + (curUnit === 'g' ? ' active' : '') + '" data-set-field="unit" data-set-val="g">g</button>');
      parts.push('<button type="button" class="btn-preset-chip' + (curUnit === 'mg' ? ' active' : '') + '" data-set-field="unit" data-set-val="mg">mg</button>');
      parts.push('<button type="button" class="btn-preset-chip' + (curUnit === 'L' ? ' active' : '') + '" data-set-field="unit" data-set-val="L">L</button>');
      parts.push('</div></div>');

      parts.push('<label class="field full">작업 장소 *<input name="work_location" required maxlength="100" value="' + safe(lastWorkLoc) + '" placeholder="예: 3층 화학실 흄후드 1번">');
      parts.push('<div class="preset-chips-wrap" style="margin-top:8px;">');
      parts.push('<span class="preset-chips-label">빠른 선택:</span>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="work_location" data-set-val="3층 화학실 흄후드 1번">흄후드 1번</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="work_location" data-set-val="3층 화학실 흄후드 2번">흄후드 2번</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="work_location" data-set-val="클린룸 배기벤치">클린룸 벤치</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="work_location" data-set-val="PVD실 글로브박스">글로브박스</button>');
      parts.push('</div></label>');

      parts.push('<label class="field full">취급 작업 내용 *<input name="work_description" required maxlength="200" value="' + safe(lastWorkDesc) + '" placeholder="예: 2D Flake 박리 기판 세척 및 린스">');
      parts.push('<div class="preset-chips-wrap" style="margin-top:8px;">');
      parts.push('<span class="preset-chips-label">빠른 선택:</span>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="work_description" data-set-val="2D Flake 박리 기판 세척 및 린스">기판 세척/린스</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="work_description" data-set-val="화학재료 합성 전처리">합성 전처리</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="work_description" data-set-val="단결정 성장 후처리 세정">결정 세정</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="work_description" data-set-val="용매 추출 및 분액">용매 추출</button>');
      if(lastWorkDesc && lastWorkDesc !== '2D Flake 박리 기판 세척 및 린스'){
        parts.push('<button type="button" class="btn-preset-chip preset-recent" data-set-field="work_description" data-set-val="' + safe(lastWorkDesc) + '">⚡ 최근작업: ' + safe(lastWorkDesc) + '</button>');
      }
      parts.push('</div></label>');

      parts.push('<div class="field full safety-checklist-card">');
      parts.push('<div class="safety-card-title">🛡️ 필수 법정 안전 점검</div>');
      parts.push('<div class="safety-check-grid">');
      parts.push('<label class="safety-check-item"><input type="checkbox" name="ppe_checked" value="true" checked required><span class="safety-check-text"><b>개인보호구 착용 완료</b><small>내화학장갑, 보안경, 마스크</small></span></label>');
      parts.push('<label class="safety-check-item"><input type="checkbox" name="ventilation_checked" value="true" checked required><span class="safety-check-text"><b>국소배기 정상 가동</b><small>흄후드/배기벤치 배기 상태</small></span></label>');
      parts.push('</div></div>');

      parts.push('<label class="field full">사용 후 잔여량 및 비고 (선택)<input name="note" maxlength="100" placeholder="예: 잔여량 약 3.8L / 밀봉 보관 완료">');
      parts.push('<div class="preset-chips-wrap" style="margin-top:8px;">');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="note" data-set-val="잔여량 충분 / 밀봉 보관 완료">밀봉 보관 완료</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="note" data-set-val="잔여량 약 50% 남음">잔여 50%</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="note" data-set-val="잔여량 소량 남음 / 재주문 권장">소량 남음</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="note" data-set-val="전량 소진 (공병 세척 및 분리배출 완료)">전량 소진</button>');
      parts.push('</div></label>');
      parts.push('</div>');
    }
  } else if(mode === 'equipmentLog'){
    const targetAsset = id ? assetFor(id) : null;
    const lastBorrower = localStorage.getItem('labstock_last_borrower_name') || '';
    const lastProject = localStorage.getItem('labstock_last_project_name') || '2DQH 연구단 기본과제';
    const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    parts.push('<div class="logbook-modal-form-wrap">');

    // 1. 대상 연구장비 카드 / 셀렉터
    if(targetAsset){
      parts.push('<div class="selected-asset-box has-modal-thumb">');
      parts.push('  <div class="modal-thumb-box" aria-hidden="true">' + getEquipmentImageHtml(targetAsset, 'thumb') + '</div>');
      parts.push('  <div class="modal-thumb-info">');
      parts.push('    <div class="modal-thumb-title">' + safe(targetAsset.name) + '</div>');
      parts.push('    <div class="modal-thumb-sub"><span>' + safe(targetAsset.id) + '</span> · <span>📍 ' + safe(targetAsset.location || '연구실') + '</span> · <span class="badge-status">' + safe(topLevelCategory(targetAsset)) + '</span></div>');
      parts.push('  </div>');
      parts.push('  <input type="hidden" name="asset_id" value="' + safe(targetAsset.id) + '">');
      parts.push('  <input type="hidden" name="asset_name" value="' + safe(targetAsset.name) + '">');
      parts.push('</div>');
    } else {
      parts.push('<label class="field full">대상 연구장비 *');
      parts.push('  <select name="asset_id" required class="quick-return-select" id="logbookAssetSelect">');
      parts.push('    <option value="">-- 연구장비를 선택하세요 --</option>');
      assets.forEach(function(ast){
        parts.push('    <option value="' + safe(ast.id) + '">' + safe(ast.id) + ' - ' + safe(ast.name) + ' (' + safe(ast.location || '미지정') + ')</option>');
      });
      parts.push('  </select>');
      parts.push('</label>');
    }

    // 2. 사용자 성명
    parts.push('<label class="field full">사용자 성명 (Operator) *');
    parts.push('  <input name="operator_name" required placeholder="예: 김연구" value="' + safe(lastBorrower) + '">');
    parts.push('</label>');

    // 3. 시작 일시 & 가동 시간
    parts.push('<div class="form-grid-2">');
    parts.push('  <label class="field">시작 일시 *');
    parts.push('    <input name="start_time" type="datetime-local" required value="' + nowLocal + '">');
    parts.push('  </label>');
    parts.push('  <label class="field">가동 시간 (시간 단위) *');
    parts.push('    <input name="run_hours" type="number" step="0.1" min="0.1" max="100" required value="2.0" placeholder="예: 2.5">');
    parts.push('  </label>');
    parts.push('</div>');
    parts.push('<div class="preset-chips-wrap" style="margin-top:-6px;margin-bottom:12px;">');
    parts.push('  <span class="preset-chips-label">빠른 시간:</span>');
    parts.push('  <button type="button" class="btn-preset-chip" data-set-field="run_hours" data-set-val="1.0">1시간</button>');
    parts.push('  <button type="button" class="btn-preset-chip active" data-set-field="run_hours" data-set-val="2.0">2시간</button>');
    parts.push('  <button type="button" class="btn-preset-chip" data-set-field="run_hours" data-set-val="3.0">3시간</button>');
    parts.push('  <button type="button" class="btn-preset-chip" data-set-field="run_hours" data-set-val="4.0">4시간</button>');
    parts.push('  <button type="button" class="btn-preset-chip" data-set-field="run_hours" data-set-val="8.0">전일(8h)</button>');
    parts.push('</div>');

    // 4. 연구과제명
    parts.push('<label class="field full">연구과제명 / 사용 목적 *');
    parts.push('  <input name="project_name" required placeholder="예: 2DQH 연구단 기본과제" value="' + safe(lastProject) + '">');
    parts.push('</label>');
    parts.push('<div class="preset-chips-wrap" style="margin-top:-6px;margin-bottom:12px;">');
    parts.push('  <span class="preset-chips-label">추천 과제:</span>');
    parts.push('  <button type="button" class="btn-preset-chip active" data-set-field="project_name" data-set-val="2DQH 연구단 기본과제">2DQH 기본과제</button>');
    parts.push('  <button type="button" class="btn-preset-chip" data-set-field="project_name" data-set-val="IBS 연구단 시설 공동활용">시설 공동활용</button>');
    parts.push('  <button type="button" class="btn-preset-chip" data-set-field="project_name" data-set-val="위탁/외부 연구과제">위탁과제</button>');
    parts.push('  <button type="button" class="btn-preset-chip" data-set-field="project_name" data-set-val="장비 점검 및 시운전">점검·시운전</button>');
    parts.push('</div>');

    // 5. 시료 / 샘플 정보
    parts.push('<label class="field full">측정 시료 / 샘플 정보 (선택)');
    parts.push('  <input name="sample_info" placeholder="예: Graphene/h-BN heterostructure, 3개 샘플">');
    parts.push('</label>');

    // 6. 장비 상태 점검
    parts.push('<div class="field full">');
    parts.push('  <label class="field-title" style="display:block;margin-bottom:6px;font-size:13px;font-weight:700;">장비 상태 점검 (Status Inspection) *</label>');
    parts.push('  <div class="status-check-group" style="display:flex;gap:10px;">');
    parts.push('    <label class="status-radio-label is-normal" style="flex:1;cursor:pointer;display:flex;align-items:center;gap:8px;padding:10px 14px;border:1.5px solid #86efac;background:#f0fdf4;border-radius:10px;font-weight:700;color:#166534;">');
    parts.push('      <input type="radio" name="status_check" value="normal" checked style="accent-color:#16a34a;">');
    parts.push('      <span>✓ 정상 작동</span>');
    parts.push('    </label>');
    parts.push('    <label class="status-radio-label is-issue" style="flex:1;cursor:pointer;display:flex;align-items:center;gap:8px;padding:10px 14px;border:1.5px solid #fca5a5;background:#fef2f2;border-radius:10px;font-weight:700;color:#991b1b;">');
    parts.push('      <input type="radio" name="status_check" value="issue" style="accent-color:#dc2626;">');
    parts.push('      <span>⚠️ 이상 발견 / 점검 필요</span>');
    parts.push('    </label>');
    parts.push('  </div>');
    parts.push('</div>');

    // 7. 비고 및 메모
    parts.push('<label class="field full">특이사항 / 전달 메모 (선택)');
    parts.push('  <textarea name="notes" rows="2" placeholder="측정 파라미터(진공도, 가스 잔량 등)나 다음 사용자를 위한 인수인계 메모를 입력하세요..."></textarea>');
    parts.push('</label>');

    // 8. 최근 3회 기록
    if(targetAsset){
      const assetHistory = equipmentLogs.filter(function(lg){ return lg.asset_id === targetAsset.id; }).slice(0, 3);
      if(assetHistory.length > 0){
        parts.push('<div class="logbook-recent-card" style="margin-top:10px;padding:10px 12px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;">');
        parts.push('  <div style="font-size:12px;font-weight:700;color:#475569;margin-bottom:6px;">📋 최근 사용 기록 (' + assetHistory.length + '건)</div>');
        assetHistory.forEach(function(rec){
          const stIcon = rec.status_check === 'issue' ? '⚠️ 이상' : '✓ 정상';
          const dt = String(rec.start_time || '').replace('T', ' ').slice(0, 16);
          parts.push('  <div style="font-size:11.5px;color:#64748b;margin-bottom:3px;display:flex;justify-content:space-between;">');
          parts.push('    <span>' + dt + ' · ' + safe(rec.operator_name) + ' (' + safe(rec.run_hours || '—') + 'h)</span>');
          parts.push('    <span style="font-weight:600;' + (rec.status_check === 'issue' ? 'color:#dc2626;' : 'color:#16a34a;') + '">' + stIcon + '</span>');
          parts.push('  </div>');
        });
        parts.push('</div>');
      }
    }

    parts.push('</div>');
  } else if(mode === 'addResearchEquipment'){
    parts.push('<div class="logbook-modal-form-wrap">');
    parts.push('  <p style="font-size:13px;color:#64748b;margin-bottom:14px;line-height:1.45;">멀티미터, 공구 등 일반 비품(Inventory)과 구별되는 고가 연구실 실험·분석 장비를 등록합니다. 등록된 장비는 전용 로그북과 연동됩니다.</p>');
    parts.push('  <div class="field">');
    parts.push('    <label for="inpEqCode">장비 약칭 / 식별 코드 *</label>');
    parts.push('    <input id="inpEqCode" name="code" required placeholder="예: AFM, FTIR, FURNACE, PL" style="text-transform:uppercase;">');
    parts.push('  </div>');
    parts.push('  <div class="field">');
    parts.push('    <label for="inpEqName">연구장비 명칭 *</label>');
    parts.push('    <input id="inpEqName" name="name" required placeholder="예: 원자현미경 (Atomic Force Microscope)">');
    parts.push('  </div>');
    parts.push('  <div class="field">');
    parts.push('    <label for="inpEqModel">모델명 및 제조사</label>');
    parts.push('    <input id="inpEqModel" name="model" placeholder="예: Park Systems NX10">');
    parts.push('  </div>');
    parts.push('  <div class="field">');
    parts.push('    <label for="inpEqLoc">설치 위치 / 연구실</label>');
    parts.push('    <input id="inpEqLoc" name="location" placeholder="예: 2DQH 정밀측정실">');
    parts.push('  </div>');
    parts.push('  <div class="field">');
    parts.push('    <label for="inpEqManager">장비 책임자 / 연락처</label>');
    parts.push('    <input id="inpEqManager" name="manager" placeholder="예: 홍길동 (연구원)">');
    parts.push('  </div>');
    parts.push('  <div class="field">');
    parts.push('    <label for="inpEqType">로그북 운영 양식</label>');
    parts.push('    <select id="inpEqType" name="type">');
    parts.push('      <option value="standard">일반 정밀장비 일지 (가동시간 / 시료 / 장비상태)</option>');
    parts.push('      <option value="xrd">X선 회절분석기 (HR-XRD 2단계 정밀 양식)</option>');
    parts.push('    </select>');
    parts.push('  </div>');
    parts.push('</div>');
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
      parts.push('<div class="quick-return-empty">');
      parts.push('  <div style="font-size:32px;margin-bottom:8px;">🎉</div>');
      parts.push('  <p style="font-size:15px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">반납 대기 중인 비품이 없습니다</p>');
      parts.push('  <p style="font-size:13px;color:var(--text-muted);margin:0;">' + (isAdmin() ? '현재 대여 중인 모든 비품이 정상 반납되었습니다.' : '이 기기에서 대여한 비품이 없거나 모두 반납 완료되었습니다.') + '</p>');
      parts.push('</div>');
    } else {
      const opt = active.map(function(l){
        const a = assetFor(l.asset_id);
        const loc = a && a.location ? ' (보관: ' + a.location + ')' : '';
        return '<option value="' + safe(l.id) + '">' +
          safe(l.asset_id) + ' · ' + safe(fmtName(l.asset_id)) +
          ' · ' + safe(l.borrower_name || '') + loc + '</option>';
      }).join('');

      parts.push('<div class="return-form-grid">');
      parts.push('<label class="field full">반납할 비품 선택 *<select name="loan_id" id="quickReturnSelect" required class="quick-return-select">' + opt + '</select></label>');

      parts.push('<div id="quickReturnLocationBox" class="return-location-card">');
      const firstLoan = active[0];
      const firstA = firstLoan ? assetFor(firstLoan.asset_id) : null;
      const firstLoc = firstA && firstA.location ? firstA.location : '연구실 지정 보관함';
      parts.push('  <div class="return-location-icon" aria-hidden="true">📍</div>');
      parts.push('  <div class="return-location-body">');
      parts.push('    <div class="return-location-title">반납 보관 위치 (제자리에 넣어주세요)</div>');
      parts.push('    <div class="return-location-val" id="quickReturnLocationText">' + safe(firstLoc) + (firstA && firstA.category ? ' <span class="return-loc-sub">(' + safe(firstA.category) + ')</span>' : '') + '</div>');
      parts.push('  </div>');
      parts.push('</div>');

      parts.push('<div class="field full return-date-card">');
      parts.push('  <div class="return-date-header-row">');
      parts.push('    <div class="return-date-title-wrap">');
      parts.push('      <span class="field-title" style="margin:0;font-size:13px;font-weight:700;color:var(--text-primary);">실제 반납일</span>');
      parts.push('      <span class="return-date-badge" id="quickReturnDateBadge">오늘 반납</span>');
      parts.push('    </div>');
      parts.push('    <div class="return-date-picker-wrap">');
      parts.push('      <input name="returned_at" type="date" required value="' + today() + '" class="return-date-input" id="quickReturnedAtInput">');
      parts.push('    </div>');
      parts.push('  </div>');
      parts.push('  <div class="preset-chips-wrap return-date-chips">');
      parts.push('    <span class="preset-chips-label">빠른 선택:</span>');
      parts.push('    <button type="button" class="btn-preset-chip active" data-set-field="returned_at" data-set-val="' + today() + '">오늘 반납</button>');
      parts.push('    <button type="button" class="btn-preset-chip" data-set-field="returned_at" data-set-val="' + calcPastDate(1) + '">어제 반납</button>');
      parts.push('  </div>');
      parts.push('</div>');

      parts.push('<div class="field full">');
      parts.push('  <label class="field-label" style="display:block;margin-bottom:6px;font-size:12.5px;font-weight:600;color:var(--text-secondary);">비품 상태 점검 및 메모 (선택)</label>');
      parts.push('  <div class="preset-chips-wrap" style="margin-bottom:8px;">');
      parts.push('    <button type="button" class="btn-preset-chip active" data-set-field="return_memo" data-set-val="이상 없음 (정상 반납)">✅ 이상 없음</button>');
      parts.push('    <button type="button" class="btn-preset-chip" data-set-field="return_memo" data-set-val="소모품/부속품 보충 필요">⚠️ 부속품 보충 필요</button>');
      parts.push('    <button type="button" class="btn-preset-chip" data-set-field="return_memo" data-set-val="장비 이상 / 수리 점검 요망">🚨 수리 점검 필요</button>');
      parts.push('  </div>');
      parts.push('  <input name="return_memo" maxlength="200" placeholder="기타 특이사항 메모 (선택사항, 생략 가능)" value="이상 없음 (정상 반납)">');
      parts.push('</div>');

      parts.push('</div>');
    }
  } else if(mode === 'editLoan'){
    parts.push('<p><b>' + safe(assetObjName) + '</b> · ' + safe(lName) + '</p>');
    parts.push('<div class="form-grid">');
    parts.push('<label class="field full">대여자 이름 *<input name="borrower_name" required maxlength="100" value="' + safe(lName) + '"></label>');
    parts.push('<label class="field full">대여 기간 연장' +
      '<input name="due_date" type="hidden" value="' + safe(lDue) + '">' +
      '<div class="preset-chips-wrap">' +
        '<span class="preset-chips-label">⚡ 빠른 연장:</span>' +
        '<button type="button" class="btn-preset-chip" data-set-field="due_date" data-set-val="' + calcSmartDueDateFor(lDue, 1) + '">+24시간 연장</button>' +
        '<button type="button" class="btn-preset-chip" data-set-field="due_date" data-set-val="' + calcSmartDueDateFor(lDue, 3) + '">+3일 연장</button>' +
        '<button type="button" class="btn-preset-chip" data-set-field="due_date" data-set-val="' + calcSmartDueDateFor(lDue, 7) + '">+7일 연장</button>' +
      '</div>' +
    '</label>');
    parts.push('<label class="field full">메모<textarea name="memo" rows="2" maxlength="500">' + safe(lMemo) + '</textarea></label>');
    parts.push('</div>');
  } else if(mode === 'extendPeriod'){
    const target = loans.find(function(l){ return String(l.id) === String(id); });
    if(!target){
      parts.push('<p>대여 기록을 찾을 수 없습니다.</p>');
    } else {
      const info = getLoanDeadlineInfo(target);
      const todayStr = today();
      const baseDate = (!target.due_date || target.due_date < todayStr) ? todayStr : target.due_date;
      const d1 = calcSmartDueDateFor(baseDate, 1);
      const d2 = calcSmartDueDateFor(baseDate, 2);
      const d3 = calcSmartDueDateFor(baseDate, 3);
      const d7 = calcSmartDueDateFor(baseDate, 7);

      parts.push('<div class="extend-period-modal">');
      parts.push('<div class="extend-asset-header">');
      parts.push('  <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">' + safe(fmtName(target.asset_id)) + ' <span class="asset-id">' + safe(target.asset_id) + '</span></div>');
      parts.push('  <div class="extend-current-status">대여자: <b>' + safe(target.borrower_name) + '</b> · ' + (info.isOverdue ? '<span style="color:#dc2626;font-weight:700;">⚠️ 현재 대여 기간 지남 (' + safe(info.text) + ')</span>' : '현재 예정일: <b>' + dateText(target.due_date) + '</b> (' + safe(info.text) + ')') + '</div>');
      parts.push('</div>');

      parts.push('<div class="form-grid" style="margin-top:12px;">');
      parts.push('<input type="hidden" name="loan_id" value="' + safe(target.id) + '">');
      parts.push('<label class="field full">새 반납 예정일 지정 *');
      parts.push('<input name="due_date" type="date" required min="' + todayStr + '" value="' + d1 + '" class="extend-date-input">');
      parts.push('<div class="preset-chips-wrap" style="margin-top:8px;">');
      parts.push('  <span class="preset-chips-label">⚡ 빠른 기간 선택:</span>');
      parts.push('  <button type="button" class="btn-preset-chip active" data-set-field="due_date" data-set-val="' + d1 + '">+24시간 (내일)</button>');
      parts.push('  <button type="button" class="btn-preset-chip" data-set-field="due_date" data-set-val="' + d2 + '">+2일</button>');
      parts.push('  <button type="button" class="btn-preset-chip" data-set-field="due_date" data-set-val="' + d3 + '">+3일</button>');
      parts.push('  <button type="button" class="btn-preset-chip" data-set-field="due_date" data-set-val="' + d7 + '">+7일 (1주)</button>');
      parts.push('</div>');
      parts.push('</label>');

      parts.push('<label class="field full">연장 사유 / 메모 (선택)<input name="extend_memo" maxlength="200" placeholder="예: 추가 실험 진행 (생략 가능)"></label>');
      parts.push('</div>');
      parts.push('</div>');
    }
  } else if(mode === 'return'){
    const targetLoan = loans.find(function(l){ return String(l.id) === String(id); });
    const a = targetLoan ? assetFor(targetLoan.asset_id) : (id ? assetFor(id) : null);
    const aLoc = a && a.location ? a.location : '연구실 지정 보관함';
    const aCat = a && a.category ? a.category : '';
    const aName = a ? a.name : (assetObjName || '비품');
    const aId = a ? a.id : (targetLoan ? targetLoan.asset_id : '');
    const lBorrower = targetLoan ? (targetLoan.borrower_name || lName) : lName;
    const lStartDate = targetLoan ? (targetLoan.borrowed_at || lStart) : lStart;

    if(window.__isPromptingReturnBeforeBorrow){
      parts.push('<div class="borrow-fast-notice" style="background:#fef2f2; border-left:4px solid var(--brand-red); margin-bottom:14px; padding:12px 14px; font-size:13px; line-height:1.5; border-radius:10px;">');
      parts.push('<b style="color:var(--brand-red);">⏰ 24시간 이상 대여 중인 비품이 2개 이상 있습니다.</b><br>');
      parts.push('먼저 반납하시겠습니까? <b>[취소]</b>를 누르면 신규 비품 대여 화면으로 바로 이동합니다.');
      parts.push('</div>');
    }

    if(a){
      parts.push('<div class="selected-asset-box has-modal-thumb return-summary-box">');
      parts.push('  <div class="modal-asset-thumb-wrap">' + getEquipmentImageHtml(a, 'modal') + '</div>');
      parts.push('  <div class="modal-asset-info">');
      parts.push('    <div class="selected-asset-badge">');
      parts.push('      <span class="status return-pending">대여 반납</span>');
      parts.push('      <span class="asset-id">' + safe(aId) + '</span>');
      parts.push('    </div>');
      parts.push('    <div class="selected-asset-title">' + safe(aName) + '</div>');
      parts.push('    <div class="selected-asset-sub">대여자: <b>' + safe(lBorrower) + '</b> · 대여일: ' + safe(lStartDate) + '</div>');
      parts.push('  </div>');
      parts.push('</div>');
    } else {
      parts.push('<div class="return-plain-card"><b>' + safe(assetObjName) + '</b> · ' + safe(lBorrower) + ' (' + safe(lStartDate) + ' 대여)</div>');
    }

    // 💡 핵심: 반납 보관 위치 명확 안내 카드
    parts.push('<div class="return-location-card">');
    parts.push('  <div class="return-location-icon" aria-hidden="true">📍</div>');
    parts.push('  <div class="return-location-body">');
    parts.push('    <div class="return-location-title">반납 보관 위치 (제자리에 넣어주세요)</div>');
    parts.push('    <div class="return-location-val">' + safe(aLoc) + (aCat ? ' <span class="return-loc-sub">(' + safe(aCat) + ')</span>' : '') + '</div>');
    parts.push('  </div>');
    parts.push('</div>');

    parts.push('<div class="return-form-grid">');
    parts.push('<div class="field full return-date-card">');
    parts.push('  <div class="return-date-header-row">');
    parts.push('    <div class="return-date-title-wrap">');
    parts.push('      <span class="field-title" style="margin:0;font-size:13px;font-weight:700;color:var(--text-primary);">실제 반납일</span>');
    parts.push('      <span class="return-date-badge" id="returnDateBadge">오늘 반납</span>');
    parts.push('    </div>');
    parts.push('    <div class="return-date-picker-wrap">');
    parts.push('      <input name="returned_at" type="date" required value="' + today() + '" min="' + lStartDate + '" class="return-date-input" id="returnedAtInput">');
    parts.push('    </div>');
    parts.push('  </div>');
    parts.push('  <div class="preset-chips-wrap return-date-chips">');
    parts.push('    <span class="preset-chips-label">빠른 선택:</span>');
    parts.push('    <button type="button" class="btn-preset-chip active" data-set-field="returned_at" data-set-val="' + today() + '">오늘 반납</button>');
    parts.push('    <button type="button" class="btn-preset-chip" data-set-field="returned_at" data-set-val="' + calcPastDate(1) + '">어제 반납</button>');
    parts.push('  </div>');
    parts.push('</div>');

    // 비품 상태 원터치 칩 및 반납 메모
    parts.push('<div class="field full">');
    parts.push('  <label class="field-label" style="display:block;margin-bottom:6px;font-size:12.5px;font-weight:600;color:var(--text-secondary);">비품 상태 점검 및 메모 (선택)</label>');
    parts.push('  <div class="preset-chips-wrap" style="margin-bottom:8px;">');
    parts.push('    <button type="button" class="btn-preset-chip active" data-set-field="return_memo" data-set-val="이상 없음 (정상 반납)">✅ 이상 없음</button>');
    parts.push('    <button type="button" class="btn-preset-chip" data-set-field="return_memo" data-set-val="소모품/부속품 보충 필요">⚠️ 부속품 보충 필요</button>');
    parts.push('    <button type="button" class="btn-preset-chip" data-set-field="return_memo" data-set-val="장비 이상 / 수리 점검 요망">🚨 수리 점검 필요</button>');
    parts.push('  </div>');
    parts.push('  <input name="return_memo" maxlength="200" placeholder="기타 특이사항 메모 (선택사항, 생략 가능)" value="이상 없음 (정상 반납)">');
    parts.push('</div>');

    parts.push('</div>');
  } else {
    parts.push('<label class="field">관리자 이메일<input name="email" type="email" required autocomplete="username"></label>');
    parts.push('<label class="field" style="margin-top:12px">비밀번호<input name="password" type="password" required autocomplete="current-password"></label>');
    parts.push('<p class="sub" style="margin-top:12px">Supabase에서 미리 생성한 관리자 계정만 로그인할 수 있도록 회원가입은 꺼두세요.</p>');
  }

  $('modalBody').innerHTML = parts.join('');

  if(mode === 'quickReturn'){
    const qSel = $('modalBody').querySelector('#quickReturnSelect');
    const qLocText = $('modalBody').querySelector('#quickReturnLocationText');
    if(qSel && qLocText){
      qSel.addEventListener('change', function(){
        const selLoanId = qSel.value;
        const targetLoan = loans.find(function(l){ return String(l.id) === String(selLoanId); });
        const a = targetLoan ? assetFor(targetLoan.asset_id) : null;
        const loc = a && a.location ? a.location : '연구실 지정 보관함';
        const cat = a && a.category ? ' (' + a.category + ')' : '';
        qLocText.innerHTML = safe(loc) + (cat ? ' <span class="return-loc-sub">' + safe(cat) + '</span>' : '');
      });
    }
  }

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
  else if(mode === 'return') btnText = '✅ 반납 완료';
  else if(mode === 'login') btnText = '로그인';
  else if(mode === 'editLoan') btnText = '수정 저장';
  else if(mode === 'extendPeriod') btnText = '✓ 기간 연장 완료';
  else if(mode === 'consumable') btnText = id ? '수정 저장' : '소모품 등록';
  else if(mode === 'reorder') btnText = '재주문 요청';
  else if(mode === 'movement') btnText = '재고 반영';
  else if(mode === 'quickReturn') btnText = '✅ 반납 완료';
  else if(mode === 'quickReorder') btnText = '구매요청';
  else if(mode === 'chemicalLog') btnText = '✓ 취급일지 작성 완료';
  else if(mode === 'equipmentLog') btnText = '✓ 로그북 등록';
  else if(mode === 'addResearchEquipment') btnText = '✓ 연구장비 등록 완료';

  $('saveModal').textContent = btnText;

  const hasAvail = assets.some(function(x){
    return statusFor(x) === 'available';
  });

  const activeLoansForQuick = loans.filter(function(l){
    return !l.returned_at && canManageLoan(l);
  });

  $('saveModal').disabled = (mode === 'borrow' &&
    (!hasAvail || !assets.some(function(x){
      return statusFor(x) === 'available' &&
        (selectedBorrowCategory === 'all' || topLevelCategory(x) === selectedBorrowCategory);
    }))) || (mode === 'quickReturn' && activeLoansForQuick.length === 0);

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

const VALID_VIEWS = ['inventory', 'consumables', 'loans', 'dashboard', 'history', 'logbook'];

function isValidView(name){
  return VALID_VIEWS.includes(name);
}

// URL Hash, Query Parameter 및 세션 저장소 기반 활성 뷰 해석
function getViewFromUrl(){
  try {
    // 1. URL 쿼리 파라미터 우선 (?tab=consumables or ?view=consumables or ?mode=logbook)
    const params = new URLSearchParams(window.location.search);
    const queryTab = params.get('tab') || params.get('view') || params.get('mode');
    if(queryTab){
      const norm = (queryTab === 'equipment') ? 'inventory' : queryTab.toLowerCase();
      if(isValidView(norm)) return norm;
    }

    // 2. URL Hash (#consumables, #inventory, #loans, #dashboard, #history, #logbook, #standalone-logbook)
    const rawHash = (window.location.hash || '').replace(/^#\/?/, '').split('?')[0].split('/')[0].trim().toLowerCase();
    if(rawHash){
      if(rawHash === 'reorder') return 'consumables';
      if(rawHash === 'standalone-logbook') return 'logbook';
      const norm = (rawHash === 'equipment') ? 'inventory' : rawHash;
      if(isValidView(norm)) return norm;
    }

    // 3. 직전 세션 저장소 복원 (새로고침 시 해당 탭 완벽 유지)
    const saved = sessionStorage.getItem('labstock_active_view');
    if(saved && isValidView(saved)){
      return saved;
    }
  } catch(e){
    console.warn('URL 뷰 라우팅 파싱 에러:', e);
  }
  return 'inventory';
}

function showView(name, options){
  options = options || {};
  const updateUrl = options.updateUrl !== false;
  const pushState = options.pushState === true;

  if(name === 'equipment') name = 'inventory';

  if((name === 'dashboard' || name === 'history') && !isAdmin()){
    name = 'inventory';
  }

  if(!isValidView(name)){
    name = 'inventory';
  }

  // 1. URL Hash 및 History 동기화 (세부 페이지 고유 링크 부여 및 새로고침 대응)
  if(updateUrl){
    const targetHash = '#' + name;
    if(window.location.hash !== targetHash){
      try {
        if(pushState){
          history.pushState({ view: name }, '', targetHash);
        } else {
          history.replaceState({ view: name }, '', targetHash);
        }
      } catch(e){
        window.location.hash = targetHash;
      }
    }
  }

  // 2. 직전 활성 탭 세션 저장소에 보존 (새로고침 시 직전 탭 복원 보장)
  try {
    sessionStorage.setItem('labstock_active_view', name);
  } catch(e){}

  document.body.classList.toggle('home-active', name === 'home');

  document.querySelectorAll('.view').forEach(function(el){
    const isActive = el.id === 'view-' + name;
    el.classList.toggle('active', isActive);
    if(isActive) el.classList.remove('hidden');
  });

  document.querySelectorAll('.nav[data-view]').forEach(function(el){
    el.classList.toggle('active', el.dataset.view === name);
  });

  // 상단 헤더 메인 탭 활성화 상태 동기화
  document.querySelectorAll('.header-tab[data-main-view]').forEach(function(el){
    const isActive = el.dataset.mainView === name;
    el.classList.toggle('active', isActive);
    el.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // 모바일 하단 대여/반납 바: 소모품, 관리자 화면, 로그북 화면에서는 숨겨서 화면 영역 확보
  const mobileBar = $('mobileBar');
  if(mobileBar){
    mobileBar.classList.toggle('hidden', name === 'consumables' || name === 'dashboard' || name === 'history' || name === 'logbook');
  }

  // 모바일 돋보기 버튼 상태 동기화
  const btnToggleSearch = $('btnToggleSearch');
  if(btnToggleSearch){
    const targetPanel = (name === 'consumables') ? $('consumableSearchPanel') : $('searchFilterCollapsible');
    const isOpen = targetPanel && targetPanel.classList.contains('open');
    btnToggleSearch.classList.toggle('active', !!isOpen);
  }

  // 뷰 진입 시 렌더링 보장
  if(name === 'consumables'){
    displayedConsumablesCount = CONSUMABLES_PAGE_SIZE;
    renderConsumables();
  } else if(name === 'loans'){
    renderLoans();
  } else if(name === 'dashboard'){
    renderDashboard();
  } else if(name === 'history'){
    renderHistory();
  } else if(name === 'inventory'){
    renderInventory();
  } else if(name === 'logbook'){
    renderLogbook();
  }
}

function scrollToReorderPanel(){
  showView('consumables', { pushState: true });

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
  showView('consumables', { pushState: true });

  const c = firstOutOfStockConsumable();
  if(c) openModal('reorder', c.id);
  else openModal('quickReorder');
}

function closeModal(){
  $('modalBackdrop').classList.remove('open');
  if(document.body) document.body.classList.remove('modal-open');
  $('modalForm').reset();

  if(window.__isPromptingReturnBeforeBorrow){
    window.__isPromptingReturnBeforeBorrow = false;
    const targetAssetId = window.__pendingBorrowAssetId;
    window.__pendingBorrowAssetId = null;
    window.__bypass24hPrompt = true; // 취소 누르면 대여창으로 바로 이동
    setTimeout(function(){
      openModal('borrow', targetAssetId);
    }, 120);
    return;
  }

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

  if(code === '23503'){
    return '선택하신 비품이 데이터베이스에 등록되어 있지 않습니다. seed_2dqh_assets.sql 스크립트를 Supabase SQL Editor에서 실행해 주세요.';
  }

  if(code === '42501'){
    return '권한이 없습니다. 대여한 기기에서 처리하거나 관리자 로그인 후 다시 시도하세요.';
  }

  if(msg.includes('paused') || msg.includes('503') || (err && err.status === 503)){
    return 'Supabase 데이터베이스가 일시 휴면(Paused) 상태입니다. Supabase 대시보드에서 Restore를 진행해 주세요.';
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

  // [특별관리물질 취급일지 등록 처리]
  if(modalMode === 'chemicalLog'){
    try {
      const logEntry = {
        id: 'log-' + Date.now(),
        consumable_id: v.consumable_id || modalId,
        chemical_name: (v.chemical_name || '').trim(),
        cas_number: (v.cas_number || '').trim(),
        handler_name: (v.handler_name || '').trim(),
        used_at: v.used_at || new Date().toISOString(),
        quantity: Number(v.quantity) || 0,
        unit: (v.unit || 'mL').trim(),
        work_location: (v.work_location || '').trim(),
        work_description: (v.work_description || '').trim(),
        ppe_checked: v.ppe_checked === 'true' || v.ppe_checked === true || v.ppe_checked === 'on',
        ventilation_checked: v.ventilation_checked === 'true' || v.ventilation_checked === true || v.ventilation_checked === 'on',
        note: (v.note || '').trim(),
        created_at: new Date().toISOString()
      };

      if(v.handler_name){
        localStorage.setItem('labstock_last_borrower_name', v.handler_name.trim());
      }
      if(v.work_location){
        localStorage.setItem('labstock_last_work_location', v.work_location.trim());
      }
      if(v.work_description){
        localStorage.setItem('labstock_last_work_description', v.work_description.trim());
      }
      if(v.unit){
        localStorage.setItem('labstock_last_unit', v.unit.trim());
      }

      // 1. 브라우저 로컬 영구 보존 (30년 보존 규정 대비 오프라인 및 즉시 보존)
      let currentLogs = [];
      try {
        currentLogs = JSON.parse(localStorage.getItem('labstock_chemical_logs') || '[]');
      } catch(_) {
        currentLogs = [];
      }
      currentLogs.unshift(logEntry);
      localStorage.setItem('labstock_chemical_logs', JSON.stringify(currentLogs));

      // 2. Supabase 연동 시 DB 저장 시도
      if(db && !isLocalMode){
        try {
          const { error: dbErr } = await db.from('chemical_logs').insert({
            consumable_id: logEntry.consumable_id,
            chemical_name: logEntry.chemical_name,
            cas_number: logEntry.cas_number,
            handler_name: logEntry.handler_name,
            used_at: logEntry.used_at,
            quantity: logEntry.quantity,
            unit: logEntry.unit,
            work_location: logEntry.work_location,
            work_description: logEntry.work_description,
            ppe_checked: logEntry.ppe_checked,
            ventilation_checked: logEntry.ventilation_checked,
            note: logEntry.note
          });
          if(dbErr) console.warn('Supabase chemical_logs 저장 건너뜀 (로컬 스토리지에 보존됨):', dbErr);
        } catch(netErr) {
          console.warn('Supabase 동기화 건너뜀 (로컬 스토리지에 보존됨):', netErr);
        }
      }

      closeModal();
      toast('✓ 특별관리물질 취급일지가 성공적으로 등록되었습니다.');
      renderConsumables();
    } catch(logErr){
      console.error('취급일지 등록 실패:', logErr);
      toast('취급일지 저장 중 오류가 발생했습니다.');
    } finally {
      btn.disabled = false;
    }
    return;
  }

  // [연구장비 전자 로그북 등록 처리]
  if(modalMode === 'equipmentLog'){
    try {
      const targetAstId = v.asset_id || modalId;
      const targetAst = assetFor(targetAstId);
      const logEntry = {
        id: 'eqlog-' + Date.now(),
        asset_id: targetAstId,
        asset_name: (v.asset_name || (targetAst ? targetAst.name : targetAstId) || '').trim(),
        operator_name: (v.operator_name || '').trim(),
        start_time: v.start_time || new Date().toISOString(),
        run_hours: Number(v.run_hours) || 1.0,
        project_name: (v.project_name || '').trim(),
        sample_info: (v.sample_info || '').trim(),
        status_check: v.status_check || 'normal',
        notes: (v.notes || '').trim(),
        created_at: new Date().toISOString()
      };

      if(v.operator_name){
        localStorage.setItem('labstock_last_borrower_name', v.operator_name.trim());
      }
      if(v.project_name){
        localStorage.setItem('labstock_last_project_name', v.project_name.trim());
      }

      // 1. 브라우저 로컬 저장
      equipmentLogs.unshift(logEntry);
      localStorage.setItem('labstock_equipment_logs', JSON.stringify(equipmentLogs));
  localStorage.setItem('labstock_research_equipments', JSON.stringify(researchEquipments));
  localStorage.setItem('labstock_xrd_logs', JSON.stringify(xrdLogs));

      // 2. Supabase 연동 시 DB 저장 시도
      if(db && !isLocalMode){
        try {
          const { error: dbErr } = await db.from('equipment_logs').insert({
            asset_id: logEntry.asset_id,
            asset_name: logEntry.asset_name,
            operator_name: logEntry.operator_name,
            start_time: logEntry.start_time,
            run_hours: logEntry.run_hours,
            project_name: logEntry.project_name,
            sample_info: logEntry.sample_info,
            status_check: logEntry.status_check,
            notes: logEntry.notes
          });
          if(dbErr) console.warn('Supabase equipment_logs 저장 건너뜀 (로컬 스토리지에 보존됨):', dbErr);
        } catch(netErr) {
          console.warn('Supabase 동기화 건너뜀 (로컬 스토리지에 보존됨):', netErr);
        }
      }

      closeModal();
      toast('✓ 연구장비 사용 로그북이 성공적으로 등록되었습니다.');
      renderLogbook();
      renderInventory();
    } catch(eqErr){
      console.error('로그북 등록 실패:', eqErr);
      toast('로그북 저장 중 오류가 발생했습니다.');
    } finally {
      btn.disabled = false;
    }
    return;
  }

  // [새 연구장비 등록 처리 (비품과 독립 관리)]
  if(modalMode === 'addResearchEquipment'){
    try {
      const code = (v.code || '').trim().toUpperCase();
      const name = (v.name || '').trim();
      const model = (v.model || '').trim();
      const location = (v.location || '').trim();
      const manager = (v.manager || '').trim();
      const type = (v.type || 'standard');

      if(!code || !name){
        toast('장비 식별 코드와 장비 명칭을 입력해주세요.');
        btn.disabled = false;
        return;
      }

      const newEq = {
        id: 'EQ-' + code + '-' + pad(researchEquipments.length + 1),
        code: code,
        name: name,
        model: model || '—',
        location: location || '2DQH 연구실',
        manager: manager || '장비담당자',
        type: type
      };

      researchEquipments.push(newEq);
      try { localStorage.setItem('labstock_research_equipments', JSON.stringify(researchEquipments)); } catch(_) {}
      closeModal();
      toast("✓ '" + name + "' 연구장비가 등록되었습니다.");
      renderLogbook();
      selectResearchEquipment(newEq.id);
    } catch(err){
      console.error('연구장비 등록 오류:', err);
      toast('연구장비 등록 중 오류가 발생했습니다.');
    } finally {
      btn.disabled = false;
    }
    return;
  }
  if(isLocalMode || !db){
    if(modalMode === 'borrow'){
      const newLoan = {
        id: 'loan-' + Date.now(),
        asset_id: v.asset_id,
        borrower_name: v.borrower_name.trim(),
        borrowed_at: v.borrowed_at || today(),
        due_date: v.due_date || calcSmartDueDate(1),
        memo: (v.memo || '').trim(),
        client_id: getClientId(),
        created_at: new Date().toISOString()
      };
      loans.unshift(newLoan);
      recordMyLoanId(newLoan.id);
      saveLocalStorage();
      closeModal();
      toast("'" + fmtName(v.asset_id) + "' 대여가 등록되었습니다 (기본 24시간).");
      btn.disabled = false;
      return;
    } else if(modalMode === 'editLoan'){
      const target = loans.find(function(l){ return String(l.id) === String(modalId); });
      if(target){
        target.borrower_name = v.borrower_name.trim();
        target.due_date = v.due_date || calcSmartDueDate(3);
        target.memo = (v.memo || '').trim();
        saveLocalStorage();
        closeModal();
        toast('대여 기록이 수정되었습니다.');
      }
      btn.disabled = false;
      return;
    } else if(modalMode === 'extendPeriod'){
      const target = loans.find(function(l){ return String(l.id) === String(modalId); });
      if(target){
        const newDueDate = v.due_date || calcSmartDueDate(1);
        const todayStr = today();
        const allMatches = Array.from((target.memo || '').matchAll(/(\d+)회/g));
        const extCount = allMatches.length > 0 ? (Number(allMatches[allMatches.length - 1][1]) + 1) : 1;
        const reason = v.extend_memo ? ' (' + v.extend_memo.trim() + ')' : '';
        const extMemoTag = '[' + todayStr + ' ' + extCount + '회 기간연장: ~' + newDueDate + reason + ']';
        target.due_date = newDueDate;
        target.memo = target.memo ? (target.memo + ' ' + extMemoTag) : extMemoTag;
        saveLocalStorage();
        closeModal();
        toast("✓ '" + fmtName(target.asset_id) + "' 대여가 " + dateText(newDueDate) + "까지 연장되었습니다.");
      }
      btn.disabled = false;
      render();
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
        category: (v.category || '일반소모품').trim(),
        location: (v.location || '').trim(),
        sub_location: (v.sub_location || '').trim(),
        specification: (v.specification || '').trim(),
        updated_at: new Date().toISOString()
      };

      if(!modalId){
        let max = 0;
        consumables.forEach(function(c){
          const m = String(c.id || '').match(/^CS-(\d+)$/i);
          if(m) max = Math.max(max, Number(m[1]));
        });
        payload.id = 'CS-' + String(max + 1).padStart(3, '0');
      }

      if(!db || isLocalMode){
        if(modalId){
          const idx = consumables.findIndex(function(c){ return c.id === modalId; });
          if(idx >= 0) consumables[idx] = Object.assign(consumables[idx], payload);
        } else {
          consumables.push(payload);
        }
        localStorage.setItem('labstock_local_consumables', JSON.stringify(consumables));
      } else {
        const result = modalId
          ? await db.from('consumables').update(payload).eq('id', modalId)
          : await db.from('consumables').insert(payload);

        if(result.error) throw result.error;
      }

      toast(modalId ? '✓ 소모품 위치 정보가 수정되었습니다.' : '✓ 새 소모품이 등록되었습니다.');
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

      // 2. 동시 대여 개수 제한: 1인당 최대 3개까지
      const activeLoans = getMyActiveLoans(v.borrower_name);
      if(activeLoans.length >= 3){
        throw new Error('비품은 1인당 최대 3개까지 대여 가능합니다. 현재 ' + activeLoans.length + '개 비품을 대여 중이므로 기존 비품을 반납 후 대여해 주세요.');
      }

      const insPayload = {
        asset_id: v.asset_id,
        borrower_name: v.borrower_name.trim(),
        borrowed_at: v.borrowed_at || today(),
        due_date: v.due_date || calcSmartDueDate(1),
        memo: (v.memo || '').trim()
      };
      if(uid) insPayload.user_id = uid;

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
    } else if(modalMode === 'extendPeriod'){
      const target = loans.find(function(l){ return String(l.id) === String(modalId); });
      if(!target) throw new Error('대여 기록을 찾을 수 없습니다.');
      if(!canManageLoan(target)) throw new Error('본인이 대여한 기록만 연장할 수 있습니다.');

      const newDueDate = v.due_date;
      if(!newDueDate) throw new Error('새 반납 예정일을 선택해 주세요.');

      const todayStr = today();
      const allMatches = Array.from((target.memo || '').matchAll(/(\d+)회/g));
      const extCount = allMatches.length > 0 ? (Number(allMatches[allMatches.length - 1][1]) + 1) : 1;
      const reason = v.extend_memo ? ' (' + v.extend_memo.trim() + ')' : '';
      const extMemoTag = '[' + todayStr + ' ' + extCount + '회 기간연장: ~' + newDueDate + reason + ']';
      const updatedMemo = target.memo ? (target.memo + ' ' + extMemoTag) : extMemoTag;

      target.due_date = newDueDate;
      target.memo = updatedMemo;
      saveLocalStorage();

      const result = await db.from('loans').update({
        due_date: newDueDate,
        memo: updatedMemo,
        updated_at: new Date().toISOString()
      }).eq('id', target.id).select('id');

      requireRows(result, '연장 처리가 반영되지 않았습니다. 대여한 기기/브라우저인지 확인하거나 관리자에게 요청하세요.');
    } else {
      throw new Error('알 수 없는 작업입니다.');
    }

    if(modalMode === 'return' || modalMode === 'quickReturn'){
      window.__isPromptingReturnBeforeBorrow = false;
      window.__pendingBorrowAssetId = null;
      window.__bypass24hPrompt = false;
    }

    closeModal();
    if(modalMode === 'borrow'){
      toast("✓ '" + fmtName(v.asset_id) + "' 대여가 완료되었습니다.");
    } else if(modalMode === 'return'){
      toast('✓ 반납 처리되었습니다. 감사합니다.');
    } else {
      toast('✓ 저장되었습니다.');
    }
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
      showView(el.dataset.view, { pushState: true });
    });
  });

  // 2DQH 로고 클릭 시 초기 화면으로 복귀 (모바일 & PC 공통)
  const brandLink = document.querySelector('.brand');
  if(brandLink){
    brandLink.addEventListener('click', function(e){
      e.preventDefault();
      showView('inventory', { pushState: true });
      const searchInput = $('assetSearch');
      if(searchInput) searchInput.value = '';
      const clearBtn = $('btnClearSearch');
      if(clearBtn) clearBtn.classList.add('hidden');
      const filterSel = $('assetFilter');
      if(filterSel) filterSel.value = 'all';
      selectedInventoryCategory = 'all';
      const searchCollapsible = $('searchFilterCollapsible');
      if(searchCollapsible) searchCollapsible.classList.remove('open');
      const toggleBtn = $('btnToggleSearch');
      if(toggleBtn) toggleBtn.classList.remove('active');
      closeModal();
      renderInventory();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  addEvt('btnToggleLoans', 'click', function(){ showView('loans', { pushState: true }); });
  addEvt('btnMobileLogin', 'click', function(){ openModal('login'); });
  addEvt('btnBackToInventory', 'click', function(){ showView('inventory', { pushState: true }); });

  // 브라우저 뒤로가기 / 앞으로가기 및 URL 해시 변경 실시간 동기화
  window.addEventListener('popstate', function(){
    const targetView = getViewFromUrl();
    showView(targetView, { updateUrl: false });
  });

  window.addEventListener('hashchange', function(){
    const targetView = getViewFromUrl();
    showView(targetView, { updateUrl: false });
  });

  // 소모품 검색창 입력 시 ✕ 클리어 버튼 토글
  const consumableSearchInput = $('consumableSearch');
  const btnClearConsumableSearch = $('btnClearConsumableSearch');
  if(consumableSearchInput && btnClearConsumableSearch){
    consumableSearchInput.addEventListener('input', function(){
      if(consumableSearchInput.value.trim().length > 0){
        btnClearConsumableSearch.classList.remove('hidden');
      } else {
        btnClearConsumableSearch.classList.add('hidden');
      }
    });
    btnClearConsumableSearch.addEventListener('click', function(){
      consumableSearchInput.value = '';
      btnClearConsumableSearch.classList.add('hidden');
      consumableSearchInput.focus();
      displayedConsumablesCount = CONSUMABLES_PAGE_SIZE;
      renderConsumables();
    });
  }

  // 장비 로그북 검색창 및 필터 실시간 바인딩
  const logbookSearch = $('logbookSearch');
  const btnClearLogbookSearch = $('btnClearLogbookSearch');
  if(logbookSearch && btnClearLogbookSearch){
    logbookSearch.addEventListener('input', function(){
      btnClearLogbookSearch.classList.toggle('hidden', logbookSearch.value.trim().length === 0);
      renderLogbook();
    });
    btnClearLogbookSearch.addEventListener('click', function(){
      logbookSearch.value = '';
      btnClearLogbookSearch.classList.add('hidden');
      logbookSearch.focus();
      renderLogbook();
    });
  }
  addEvt('logbookEquipmentFilter', 'change', renderLogbook);
  addEvt('logbookStatusFilter', 'change', renderLogbook);

  document.addEventListener('click', function(e){
    const target = e.target.closest('button');
    if(!target) return;

    // 스마트 퀵 프리셋 칩 터치 시 해당 필드 즉시 입력 & 햅틱 시각 피드백
    if(target.classList.contains('btn-preset-chip') || target.dataset.setField){
      const fieldName = target.dataset.setField;
      const fieldVal = target.dataset.setVal;
      if(fieldName && fieldVal !== undefined){
        const modalForm = $('modalForm');
        if(modalForm){
          const input = modalForm.querySelector('[name="' + fieldName + '"]');
          if(input){
            input.value = fieldVal;
            input.focus();
            if(fieldName === 'returned_at'){
              const badge = $('returnDateBadge') || $('quickReturnDateBadge');
              if(badge){
                if(fieldVal === today()){
                  badge.textContent = '오늘 반납';
                  badge.className = 'return-date-badge is-today';
                } else if(fieldVal === calcPastDate(1)){
                  badge.textContent = '어제 반납';
                  badge.className = 'return-date-badge is-yesterday';
                } else {
                  badge.textContent = '날짜 지정 (' + fieldVal.slice(5) + ')';
                  badge.className = 'return-date-badge is-custom';
                }
              }
            }
            const parentWrap = target.closest('.preset-chips-wrap');
            if(parentWrap){
              parentWrap.querySelectorAll('.btn-preset-chip').forEach(function(c){ c.classList.remove('active'); });
              target.classList.add('active');
            }
            target.classList.add('active-pulse');
            setTimeout(function(){ target.classList.remove('active-pulse'); }, 200);
          }
        }
      }
      return;
    }

    if(target.dataset.mainView){
      showView(target.dataset.mainView, { pushState: true });
      return;
    }

    if(target.dataset.goto){
      showView(target.dataset.goto, { pushState: true });
      return;
    }

    if(target.dataset.inventoryCategory){
      selectedInventoryCategory = target.dataset.inventoryCategory;
      renderInventory();
      return;
    }

    if(target.dataset.consumableCategory){
      selectedConsumableCategory = target.dataset.consumableCategory;
      if(selectedConsumableCategory !== '시약·화학'){
        showOnlyControlledReagents = false;
      }
      displayedConsumablesCount = CONSUMABLES_PAGE_SIZE;
      renderConsumables();
      return;
    }

    if(target.id === 'btnToggleControlledFilter' || target.closest('#btnToggleControlledFilter')){
      showOnlyControlledReagents = !showOnlyControlledReagents;
      displayedConsumablesCount = CONSUMABLES_PAGE_SIZE;
      renderConsumables();
      return;
    }

    if(target.dataset.consumableView){
      consumableViewMode = target.dataset.consumableView;
      try { localStorage.setItem('2dqh_consumable_view_mode', consumableViewMode); } catch(_) {}
      renderConsumables();
      return;
    }

    if(target.id === 'btnLoadMoreConsumables' || target.closest('#btnLoadMoreConsumables')){
      loadMoreConsumables();
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

    if(target.dataset.extendLoan || target.closest('[data-extend-loan]')){
      const btn = target.dataset.extendLoan ? target : target.closest('[data-extend-loan]');
      const loanId = btn.dataset.extendLoan;
      const days = Number(btn.dataset.extendDays) || 1;
      extendLoan(loanId, days);
      return;
    }

    if(target.dataset.extendCustom || target.closest('[data-extend-custom]')){
      const btn = target.dataset.extendCustom ? target : target.closest('[data-extend-custom]');
      const loanId = btn.dataset.extendCustom;
      const ln = loans.find(function(x){ return String(x.id) === String(loanId); });
      if(!canManageLoan(ln)){
        toast('본인이 대여한 기록만 연장할 수 있습니다.');
        return;
      }
      openModal('extendPeriod', loanId);
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

    if(target.id === 'addConsumable' || target.id === 'btnEmptyAddConsumable'){
      if(isAdmin()) openModal('consumable');
      else toast('소모품 등록은 관리자 로그인이 필요합니다.');
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

    if(target.dataset.logChemical || target.closest('[data-log-chemical]')){
      const btn = target.dataset.logChemical ? target : target.closest('[data-log-chemical]');
      openModal('chemicalLog', btn.dataset.logChemical);
      return;
    }

    if(target.id === 'btnExportChemicalLogs' || target.closest('#btnExportChemicalLogs')){
      exportChemicalLogsCsv();
      return;
    }

    if(target.dataset.chk){
      xrdChk[target.dataset.chk] = !xrdChk[target.dataset.chk];
      paintXrdToggles();
      return;
    }

    if(target.dataset.align){
      xrdAlign = target.dataset.align;
      paintXrdToggles();
      return;
    }

    if(target.dataset.scan){
      const s = target.dataset.scan;
      if(xrdScanSel.has(s)) xrdScanSel.delete(s);
      else xrdScanSel.add(s);
      paintXrdToggles();
      return;
    }

    if(target.dataset.xrdAdd){
      const addMin = parseInt(target.dataset.xrdAdd, 10);
      const f = $('xrdForm');
      if(f && f.start_time && f.end_time){
        const a = f.start_time.value.split(':');
        const startMin = (+a[0]) * 60 + (+a[1]);
        const endMin = (startMin + addMin) % 1440;
        f.end_time.value = pad(Math.floor(endMin / 60)) + ':' + pad(endMin % 60);
        updXrdDur();
        updateXrdChecks(true);
      }
      return;
    }

    if(target.dataset.selectEquipment){
      selectResearchEquipment(target.dataset.selectEquipment);
      return;
    }

    if(target.dataset.xrdEdit){
      finishXrdSession(target.dataset.xrdEdit);
      return;
    }

    if(target.dataset.xrdFinish){
      finishXrdSession(target.dataset.xrdFinish);
      return;
    }

    if(target.dataset.xrdDel){
      deleteXrdLog(target.dataset.xrdDel);
      return;
    }

    if(target.id === 'btnAddResearchEquipment' || target.id === 'btnRegisterNewEquipment' || target.closest('#btnAddResearchEquipment') || target.closest('#btnRegisterNewEquipment')){
      openModal('addResearchEquipment');
      return;
    }

    if(target.id === 'btnOpenGeneralLogModal' || target.closest('#btnOpenGeneralLogModal')){
      openModal('equipmentLog', currentSelectedEquipment);
      return;
    }

    if(target.dataset.equipmentLog || target.closest('[data-equipment-log]')){
      const btn = target.dataset.equipmentLog ? target : target.closest('[data-equipment-log]');
      openModal('equipmentLog', btn.dataset.equipmentLog);
      return;
    }

    if(target.id === 'btnExportEquipmentLogs' || target.closest('#btnExportEquipmentLogs')){
      exportEquipmentLogsCsv();
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
        showView('loans', { pushState: true });
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

  addEvt('modalForm', 'submit', saveForm);

  const mForm = $('modalForm');
  if(mForm){
    mForm.addEventListener('input', function(e){
      if(e.target && e.target.name === 'due_date'){
        const wrap = e.target.parentNode ? e.target.parentNode.querySelector('.preset-chips-wrap') : null;
        if(wrap){
          wrap.querySelectorAll('.btn-preset-chip').forEach(function(c){
            c.classList.toggle('active', c.dataset.setVal === e.target.value);
          });
        }
      }
      if(e.target && e.target.name === 'returned_at'){
        const card = e.target.closest('.return-date-card');
        const badge = $('returnDateBadge') || $('quickReturnDateBadge');
        if(badge){
          if(e.target.value === today()){
            badge.textContent = '오늘 반납';
            badge.className = 'return-date-badge is-today';
          } else if(e.target.value === calcPastDate(1)){
            badge.textContent = '어제 반납';
            badge.className = 'return-date-badge is-yesterday';
          } else {
            badge.textContent = '날짜 지정 (' + e.target.value.slice(5) + ')';
            badge.className = 'return-date-badge is-custom';
          }
        }
        if(card){
          card.querySelectorAll('.btn-preset-chip').forEach(function(c){
            c.classList.toggle('active', c.dataset.setVal === e.target.value);
          });
        }
      }
    });
  }

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

  // 모바일 헤더 돋보기 검색 토글 (현재 활성 뷰에 맞게 패널 토글)
  const btnToggleSearch = $('btnToggleSearch');
  if(btnToggleSearch){
    btnToggleSearch.addEventListener('click', function(){
      const isConsumablesView = document.getElementById('view-consumables') && document.getElementById('view-consumables').classList.contains('active');
      const targetPanel = isConsumablesView ? $('consumableSearchPanel') : $('searchFilterCollapsible');
      if(targetPanel){
        const isOpen = targetPanel.classList.toggle('open');
        btnToggleSearch.classList.toggle('active', isOpen);
        if(isOpen){
          const searchInput = isConsumablesView ? $('consumableSearch') : $('assetSearch');
          if(searchInput) setTimeout(function(){ searchInput.focus(); }, 120);
        }
      }
    });
  }

  // 검색창 지우기 (✕) 버튼 제어
  const btnClearSearch = $('btnClearSearch');
  const assetSearchInput = $('assetSearch');
  if(btnClearSearch && assetSearchInput){
    assetSearchInput.addEventListener('input', function(){
      if(assetSearchInput.value.trim().length > 0){
        btnClearSearch.classList.remove('hidden');
      } else {
        btnClearSearch.classList.add('hidden');
      }
    });
    btnClearSearch.addEventListener('click', function(){
      assetSearchInput.value = '';
      btnClearSearch.classList.add('hidden');
      assetSearchInput.focus();
      renderInventory();
    });
  }

  addEvt('assetSearch', 'input', debounce(renderInventory, 180));
  addEvt('assetFilter', 'change', renderInventory);
  addEvt('consumableSearch', 'input', debounce(function(){
    displayedConsumablesCount = CONSUMABLES_PAGE_SIZE;
    renderConsumables();
  }, 180));
  addEvt('consumableFilter', 'change', function(){
    displayedConsumablesCount = CONSUMABLES_PAGE_SIZE;
    renderConsumables();
  });
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

  const debouncedRealtimeReload = debounce(function(){
    console.log('실시간 변동 감지 -> 디바운스 데이터 재로딩');
    loadData();
  }, 300);

  try {
    realtimeChannel = db.channel('labstock-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, debouncedRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, debouncedRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consumables' }, debouncedRealtimeReload)
      .subscribe(function(status){
        if(status === 'SUBSCRIBED'){
          console.log('Supabase Realtime 실시간 동기화 활성화됨 (300ms 디바운스 적용)');
        }
      });
  } catch(e){
    console.warn('Realtime 구독 실패 (비활성화 상태):', e);
  }
}

// QR 코드 스캔 및 URL 딥링크 다이렉트 액션 진입 (Sortly/Snipe-IT 스타일 Fast Track)
function handleUrlFastTrack(){
  try {
    const params = new URLSearchParams(window.location.search);
    const hash = (window.location.hash || '').replace(/^#\/?/, '').trim();

    // 0. 재발주 패널 스크롤 (#reorder or #consumables/reorder)
    if(hash === 'reorder' || hash === 'consumables/reorder'){
      scrollToReorderPanel();
      return;
    }

    // 1. 특별관리물질 취급일지 다이렉트 진입 (?log=CS-041 or ?action=chemicalLog&id=CS-041 or #chemicalLog/CS-041)
    const hashLogMatch = hash.match(/^(?:log|chemicallog)[\/\-](.+)$/i);
    const logId = params.get('log') || (params.get('action') === 'chemicalLog' ? params.get('id') : null) || (hashLogMatch ? hashLogMatch[1] : null);
    if(logId){
      showView('consumables', { updateUrl: false });
      selectedConsumableCategory = '시약·화학';
      displayedConsumablesCount = CONSUMABLES_PAGE_SIZE;
      renderConsumables();
      setTimeout(function(){
        openModal('chemicalLog', logId);
      }, 150);
      return;
    }

    // 2. 비품 대여 다이렉트 진입 (?loan=A-001 or ?action=borrow&id=A-001 or #borrow/A-001)
    const hashLoanMatch = hash.match(/^(?:loan|borrow)[\/\-](.+)$/i);
    const loanId = params.get('loan') || (params.get('action') === 'borrow' ? params.get('id') : null) || (hashLoanMatch ? hashLoanMatch[1] : null);
    if(loanId){
      showView('inventory', { updateUrl: false });
      setTimeout(function(){
        openModal('borrow', loanId);
      }, 150);
      return;
    }

    // 3. 비품 반납 다이렉트 진입 (?return=EQ-001 or ?action=return&id=EQ-001 or #return/EQ-001)
    const hashReturnMatch = hash.match(/^(?:return)[\/\-](.+)$/i);
    const returnAssetId = params.get('return') || (params.get('action') === 'return' ? params.get('id') : null) || (hashReturnMatch ? hashReturnMatch[1] : null);
    if(returnAssetId){
      showView('inventory', { updateUrl: false });
      const act = activeLoanFor(returnAssetId) || loans.find(function(l){ return String(l.id) === String(returnAssetId); });
      setTimeout(function(){
        openModal('return', act ? act.id : returnAssetId);
      }, 150);
      return;
    }

    // 4. 연구장비 전자 로그북 다이렉트 진입 (?logbook=XRD or #logbook/XRD or ?logbook=EQ-XRD-01)
    const hashEqLogMatch = hash.match(/^(?:logbook|equipmentlog)[\/\-](.+)$/i);
    const logbookCode = params.get('logbook') || (params.get('action') === 'logbook' ? params.get('id') : null) || (hashEqLogMatch ? hashEqLogMatch[1] : null);
    if(logbookCode){
      showView('logbook', { updateUrl: false });
      const found = researchEquipments.find(function(e){
        return e.id.toLowerCase() === logbookCode.toLowerCase() || e.code.toLowerCase() === logbookCode.toLowerCase();
      });
      if(found){
        selectResearchEquipment(found.id);
      }
      return;
    }

    // 5. 단독 로그북 키오스크 모드 (#standalone-logbook or ?mode=logbook or ?standalone=true)
    if(hash === 'standalone-logbook' || hash === 'logbook' || params.get('mode') === 'logbook' || params.get('standalone') === 'true'){
      showView('logbook', { updateUrl: false });
      return;
    }
  } catch(e) {
    console.warn('URL Fast-track 처리 실패:', e);
  }
}

async function initApp(){
  bindEvents();

  // URL Hash, 파라미터 및 세션 기반 활성 뷰 해석 (새로고침 시 소모품 등 현재 탭 유지)
  const initialView = getViewFromUrl();
  showView(initialView, { updateUrl: true, pushState: false });
  if(document.documentElement) document.documentElement.removeAttribute('data-initial-view');

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
    handleUrlFastTrack();
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
  handleUrlFastTrack();
}

document.addEventListener('DOMContentLoaded', initApp);
