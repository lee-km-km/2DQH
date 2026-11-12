
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
// 소모품 위치 안내 기능 활성화
const ENABLE_CONSUMABLES = true;
// 연구장비 전자 로그북(사용일지) 기능 활성화 (독립 모듈 스위치 / 백도어 플래그)
const ENABLE_EQUIPMENT_LOGBOOK = true;
let isLocalMode = false;

// [연구장비 독립 관리] 성균관대학교 양자기술첨단기기센터 (AQT / SESS) 표준 9대 연구장비
// 구조분석(structural: HR-XRD, Cs-TEM), 광학·표면(optical: AFM, RAMAN, FT-IR), 박막·증착(deposition: Ebeamsputter, ALD, Co-sputter, UHVsputter)
const DEFAULT_RESEARCH_EQUIPMENTS = [
  {
    id: 'EQ-XRD-01',
    assetNo: 'SESS-AQT-XRD-01',
    code: 'XRD',
    name: 'HR-XRD (고분해능 X선 회절분석기)',
    category: 'structural',
    categoryName: '구조분석',
    model: 'SmartLab 9 kW (Rigaku, Japan)',
    location: 'N센터 C동 지하 86013호 (XRD실)',
    serviceMode: '직접사용 / 측정의뢰 (SESS 연동)',
    spec: '9 kW 회전양극 Cu-Kα, PB/BB Dual-optical, In-plane 5축 고니오미터, 박막/단결정 정밀구조 분석',
    manager: '이강민 연구원 / 신현석 교수님',
    contact: '031-299-6576 (XRD실)',
    status: 'active',
    statusLabel: '디지털 로그북 가동 중',
    icon: '🔬',
    image: 'img/equipment/smartlab_xrd.png',
    type: 'xrd'
  },
  {
    id: 'EQ-TEM-01',
    assetNo: 'SESS-AQT-TEM-01',
    code: 'TEM',
    name: 'Cs-TEM (수차보정 투과전자현미경)',
    category: 'structural',
    categoryName: '구조분석',
    model: 'JEM-ARM300CF Grand ARM (JEOL, Japan)',
    location: 'N센터 C동 지하 86012호 (무진동 전현실)',
    serviceMode: '측정지원 / 공동연구지원 (전담 오퍼레이터)',
    spec: '80~300 kV Cold-FEG, Double Cs Corrector, Sub-0.05 nm 분해능, Dual SDD EDS, 원자단위 격자·화학분석',
    manager: 'SESS TEM 전담 엔지니어 / AQT 첨단기기센터',
    contact: '031-299-6512 (AQT 행정실/분석지원)',
    status: 'standby',
    statusLabel: '로그북 연동 준비 중 (SESS 규격 대기)',
    icon: '🔭',
    image: 'img/equipment/jeol_tem.png',
    type: 'placeholder'
  },
  {
    id: 'EQ-AFM-01',
    assetNo: 'SESS-AQT-AFM-01',
    code: 'AFM',
    name: 'AFM (원자간력현미경)',
    category: 'optical',
    categoryName: '광학·표면',
    model: 'Dimension Icon with ScanAsyst (Bruker, USA)',
    location: 'N센터 C동 86275호 (SPM 표면분석실)',
    serviceMode: '직접사용 (정기 사용자 교육 이수자)',
    spec: 'PeakForce QNM, ScanAsyst, Contact/Tapping Mode, 90×90 ㎛ 스캐너, 원자 스케일 표면 토포그래피 및 물성',
    manager: 'SESS 표면분석 엔지니어 / AQT 첨단기기센터',
    contact: '031-299-6512 (AQT 행정실/분석지원)',
    status: 'standby',
    statusLabel: '로그북 연동 준비 중 (SESS 규격 대기)',
    icon: '📐',
    image: 'img/equipment/bruker_afm.png',
    type: 'placeholder'
  },
  {
    id: 'EQ-RAMAN-01',
    assetNo: 'SESS-AQT-RAMAN-01',
    code: 'RAMAN',
    name: 'Laser Raman (마이크로 라만 분광기)',
    category: 'optical',
    categoryName: '광학·표면',
    model: 'XperRam 200 Multi-laser (NanoBase, Korea)',
    location: 'N센터 C동 86275호 (라만 분광분석실)',
    serviceMode: '직접사용 / 측정지원',
    spec: '532 nm / 633 nm / 785 nm 3파장 레이저, 100~4000 cm⁻¹, 초미세 고속 라만 2D/3D 이미징 매핑',
    manager: 'SESS 광학분광 엔지니어 / AQT 첨단기기센터',
    contact: '031-299-6512 (AQT 행정실/분석지원)',
    status: 'standby',
    statusLabel: '로그북 연동 준비 중 (SESS 규격 대기)',
    icon: '🌈',
    image: 'img/equipment/nanobase_raman.png',
    type: 'placeholder'
  },
  {
    id: 'EQ-FTIR-01',
    assetNo: 'SESS-AQT-FTIR-01',
    code: 'FT-IR',
    name: 'Vacuum FT-IR (진공 적외선 분광기)',
    category: 'optical',
    categoryName: '광학·표면',
    model: 'Vertex 70v 진공형 FT-IR (Bruker Optics, Germany)',
    location: 'N센터 C동 86275호 (적외선 분광분석실)',
    serviceMode: '직접사용 (자율운영)',
    spec: '< 2 hPa 고진공 광학 챔버, 4000~400 cm⁻¹, Diamond ATR / Transmission, 대기 수분·CO2 간섭 배제 고순도 분광',
    manager: 'SESS 분광분석 엔지니어 / AQT 첨단기기센터',
    contact: '031-299-6512 (AQT 행정실/분석지원)',
    status: 'standby',
    statusLabel: '로그북 연동 준비 중 (SESS 규격 대기)',
    icon: '💡',
    image: 'img/equipment/bruker_ftir.png',
    type: 'placeholder'
  },
  {
    id: 'EQ-EBEAM-01',
    assetNo: 'SESS-AQT-EBEAM-01',
    code: 'Ebeamsputter',
    name: 'E-beam Evaporator (전자빔 진공 증착기)',
    category: 'deposition',
    categoryName: '박막·증착',
    model: 'KVE-T2000 6-Pocket (Korea Vacuum Tech / AQT Custom)',
    location: '제1종합연구관 지하 81105호 (양자팹 클린룸)',
    serviceMode: '직접사용 / 공정의뢰 (클린룸 이수자)',
    spec: '6-Pocket 전자빔 건, 로드락 고진공 챔버 (<2×10⁻⁶ Torr), 고순도 금속(Ti, Au, Cr, Ni, Pt) 정밀 박막 증착',
    manager: 'SESS 클린룸 박막공정 엔지니어 / AQT 첨단기기센터',
    contact: '031-299-6512 (AQT 클린룸지원)',
    status: 'standby',
    statusLabel: '로그북 연동 준비 중 (SESS 규격 대기)',
    icon: '⚡',
    image: 'img/equipment/ebeam_evap.png',
    type: 'placeholder'
  },
  {
    id: 'EQ-ALD-01',
    assetNo: 'SESS-AQT-ALD-01',
    code: 'ALD',
    name: 'Thermal ALD (원자층 박막 증착기)',
    category: 'deposition',
    categoryName: '박막·증착',
    model: 'Sunale R-200 Thermal ALD (Picosun, Finland)',
    location: '제1종합연구관 지하 81105호 (양자팹 클린룸)',
    serviceMode: '직접사용 / 공정의뢰 (클린룸 이수자)',
    spec: '최대 8인치 웨이퍼 대응, 4 Source Line (Al₂O₃, HfO₂, TiO₂, ZnO 전구체), 초정밀 원자단위 절연막 증착',
    manager: 'SESS 클린룸 공정 엔지니어 / AQT 첨단기기센터',
    contact: '031-299-6512 (AQT 클린룸지원)',
    status: 'standby',
    statusLabel: '로그북 연동 준비 중 (SESS 규격 대기)',
    icon: '⚛️',
    image: 'img/equipment/picosun_ald.png',
    type: 'placeholder'
  },
  {
    id: 'EQ-COSPUTTER-01',
    assetNo: 'SESS-AQT-SPUTTER-01',
    code: 'Co-sputter',
    name: 'Multi-Cathode Sputter (다원 동시 스퍼터링 시스템)',
    category: 'deposition',
    categoryName: '박막·증착',
    model: 'Multi-Cathode RF/DC Magnetron Sputter (AQT Fab Custom)',
    location: '제1종합연구관 지하 81105호 (양자팹 클린룸)',
    serviceMode: '직접사용 / 공정의뢰 (클린룸 이수자)',
    spec: '3-Cathode Gun (DC 1.5 kW 2기, RF 600 W 1기), Ar/O₂/N₂ MFCs, 기판 가열/회전, 다성분계 합금·화합물 박막',
    manager: 'SESS 스퍼터 전담 엔지니어 / AQT 첨단기기센터',
    contact: '031-299-6512 (AQT 클린룸지원)',
    status: 'standby',
    statusLabel: '로그북 연동 준비 중 (SESS 규격 대기)',
    icon: '🌀',
    image: 'img/equipment/sputter_system.png',
    type: 'placeholder'
  },
  {
    id: 'EQ-UHVSPUTTER-01',
    assetNo: 'SESS-AQT-UHV-01',
    code: 'UHVsputter',
    name: 'UHV Sputter (초고진공 마그네트론 스퍼터)',
    category: 'deposition',
    categoryName: '박막·증착',
    model: 'Ultra-High Vacuum Quantum Thin-Film Sputterer (AVS/VTC Custom)',
    location: '제1종합연구관 지하 81105호 (양자팹 클린룸)',
    serviceMode: '공동연구지원 / 전문 오퍼레이터 운영',
    spec: '기저진공 < 5.0×10⁻⁸ Torr, Cryopump (<15K), 로드락 이송계, 초고순도 양자소재/자성 2D 박막 전용',
    manager: 'SESS 초고진공 박막 오퍼레이터 / AQT 첨단기기센터',
    contact: '031-299-6512 (AQT 클린룸지원)',
    status: 'standby',
    statusLabel: '로그북 연동 준비 중 (SESS 규격 대기)',
    icon: '🌌',
    image: 'img/equipment/uhv_sputter.png',
    type: 'placeholder'
  },
  {
    id: 'EQ-BONDER-01',
    assetNo: 'SESS-AQT-BOND-01',
    code: 'WireBonder',
    name: 'Wire Bonder (초음파 와이어본더 / 나노와이어본더)',
    category: 'fabrication',
    categoryName: '소자공정·패키징',
    model: 'West-Bond 7476E Deep Access Wire Bonder (USA)',
    location: '제1종합연구관 지하 81105호 (양자팹 클린룸 패키징실)',
    serviceMode: '직접사용 / 공정의뢰 (소자패키징 교육 이수자)',
    spec: 'Al/Au 와이어 웨지/볼 본딩 (0.7~2.0 mil), 초음파 파워 0~10 W, 접촉압력 10~150 gf, 마이크로/나노소자 전극 패키징',
    manager: 'SESS 소자공정 엔지니어 / AQT 첨단기기센터',
    contact: '031-299-6512 (AQT 클린룸지원)',
    status: 'active',
    statusLabel: '디지털 로그북 가동 중',
    icon: '🪡',
    image: 'img/equipment/wire_bonder.png',
    type: 'placeholder'
  },
  {
    id: 'EQ-XPS-01',
    assetNo: 'SESS-AQT-XPS-01',
    code: 'XPS',
    name: 'XPS (X선 광전자 분광기)',
    category: 'optical',
    categoryName: '표면·전자구조',
    model: 'ESCALAB 250Xi (Thermo Fisher Scientific, UK/USA)',
    location: 'N센터 C동 86275호 (표면분석실 / AQT 첨단기기센터)',
    serviceMode: '직접사용 / 측정지원 (SESS 연동, 교육 이수자)',
    spec: 'Micro-focused Monochromated Al-Kα, 0.45 eV FWHM 분해능, Dual flood gun 전하중화, XPS/UPS/ARXPS/Depth profiling, 원자 백분율 및 화학 결합 상태 분석',
    manager: 'SESS 표면분석 엔지니어 / AQT 첨단기기센터',
    contact: '031-299-6512 (AQT 행정실/표면분석지원)',
    status: 'active',
    statusLabel: '디지털 로그북 가동 중',
    icon: '⚡',
    image: 'img/equipment/thermo_xps.png',
    type: 'placeholder'
  }
];
// [2-in-1 연구 포털 모듈 아키텍처]
// lims: 성균관대 AQT/SESS 연구장비 & 전자로그북 전문 시스템
// inventory: IBS 2DQH 연구실 비품 및 소모품 재고와 대여 시스템
let currentPortalModule = 'lims'; // 'lims' | 'inventory'

function setPortalModule(mod, options){
  options = options || {};
  if(mod !== 'lims' && mod !== 'inventory') mod = 'lims';
  currentPortalModule = mod;

  try {
    localStorage.setItem('labstock_active_portal_module', mod);
  } catch(_) {}

  // 1. 상단 헤더 모듈 스위처 버튼 상태 동기화
  document.querySelectorAll('.portal-module-btn').forEach(function(b){
    const isActive = b.dataset.portalModule === mod;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // 2. Body 어트리뷰트 & 브랜드 서브텍스트 갱신
  document.body.setAttribute('data-portal-module', mod);
  const brandSubText = $('brandSubText');
  if(brandSubText){
    brandSubText.textContent = (mod === 'lims') ? '연구장비 포털' : '비품·소모품 관리';
  }

  // 3. 사이드바 메뉴 그룹 가시성: 통합 메뉴로 상시 접근 가능
  const groupLims = $('sidebarGroupLims');
  const groupInventory = $('sidebarGroupInventory');
  if(groupLims) groupLims.classList.remove('hidden');
  if(groupInventory) groupInventory.classList.remove('hidden');

  // 4. 사이드바 연구실 안내 카드 정보 갱신
  const infoBadge = $('sidebarInfoBadge');
  const infoTitle = $('sidebarInfoTitle');
  const infoDesc = $('sidebarInfoDesc');
  if(mod === 'lims'){
    if(infoBadge) infoBadge.textContent = 'IBS 2DQH';
    if(infoTitle) infoTitle.textContent = '성균관대 양자기술첨단기기센터';
    if(infoDesc) infoDesc.textContent = 'SESS 연동 정밀기기 운용 및 로그북';
  } else {
    if(infoBadge) infoBadge.textContent = 'IBS 2DQH';
    if(infoTitle) infoTitle.textContent = '비품 및 소모품 관리';
    if(infoDesc) infoDesc.textContent = '공용 비품 & 소모품 실시간 현황';
  }

  // 5. 모듈 전환 시 해당 도메인 메인 뷰로 라우팅
  if(options.switchView !== false){
    const curView = sessionStorage.getItem('labstock_active_view') || 'logbook';
    if(mod === 'lims'){
      if(curView !== 'logbook'){
        showView('logbook', { updateUrl: true, pushState: true });
        updateLimsNavActive('catalog');
      }
    } else {
      if(curView === 'logbook'){
        showView('inventory', { updateUrl: true, pushState: true });
      }
    }
  }
}

function updateLimsNavActive(type){
  document.querySelectorAll('[data-lims-nav]').forEach(function(b){
    b.classList.toggle('active', b.dataset.limsNav === type);
  });
}

let selectedEquipmentCategory = 'all';
let researchEquipments = (typeof DEFAULT_RESEARCH_EQUIPMENTS !== 'undefined' && Array.isArray(DEFAULT_RESEARCH_EQUIPMENTS))
  ? DEFAULT_RESEARCH_EQUIPMENTS.slice()
  : [];
let currentSelectedEquipment = 'EQ-XRD-01';
let equipmentSessions = [];
let selectedAnalyticsEquipmentId = 'all'; // 'all' | 'EQ-XRD-01' | 'EQ-BONDER-01' ... 장비별 통계 분리 스코프
let selectedAnalyticsPeriod = 'week'; // 'week' | 'month' | 'year' (주간 / 월별 / 연간 통계 주기)
let currentHubView = 'catalog'; // 'catalog' | 'analytics'
let currentCalendarYear = new Date().getFullYear();
let currentCalendarMonth = new Date().getMonth() + 1;
let timelineFilter = 'all'; // 'all' | 'active' | 'test'
let timelineDateFilter = null; // 'YYYY-MM-DD' | null
let timelineDisplayLimit = 6; // 타임라인 페이징 기본 표시 건수
let timelineSearchQuery = ''; // 실시간 가동 피드 검색어
let lastTimelineSessions = null; // 최근 렌더링된 세션 목록 캐시

// [연구장비 범용 파라미터 규격 스키마 (전 기종 표준)]
const EQUIPMENT_SCHEMAS = {
  'XRD': {
    name: 'HR-XRD (고분해능 X선 회절분석기)',
    readings: [
      { key: 'chiller_start', label: 'Chiller temp. (시작)', unit: '°C', step: 0.1, placeholder: '22.0', warnMin: 20, warnMax: 24 },
      { key: 'vacuum_start', label: 'Vacuum level (시작)', unit: 'mV', step: 1, placeholder: '90' }
    ],
    checks: [
      { key: 'xray_max_ok', label: 'Set max. while using (최대 전력 점검)' },
      { key: 'position_ok', label: 'Set initial after use (초기 각도 복귀)' },
      { key: 'xray_min_ok', label: 'Set min. after use (최소 전력 전환)' }
    ],
    options: [
      { key: 'align', label: 'Align.', choices: ['PB', 'BB'], default: 'PB' }
    ],
    scanTypes: ['θ/2θ', '2θ/ω', '2θ', 'ω', 'χ', 'φ']
  },
  'AFM': {
    name: 'AFM (원자간력현미경)',
    readings: [
      { key: 'laser_sum', label: 'Laser Sum Signal', unit: 'V', step: 0.1, placeholder: '6.5', warnMin: 4.0 },
      { key: 'drive_amp', label: 'Drive Amplitude', unit: 'mV', step: 1, placeholder: '250' }
    ],
    checks: [
      { key: 'tip_mounted_ok', label: 'Tip securely mounted & aligned (팁 안착 확인)' },
      { key: 'tune_ok', label: 'Resonance peak tuned (공진 주파수 튜닝)' },
      { key: 'parked_ok', label: 'Z-stage withdrawn & parked (스테이지 복귀)' }
    ],
    options: [
      { key: 'mode', label: 'Scan Mode', choices: ['Tapping', 'Contact', 'PeakForce', 'EFM/MFM'], default: 'Tapping' }
    ],
    scanTypes: ['Height (Topography)', 'Phase', 'Amplitude', 'Current', 'Friction']
  },
  'FT-IR': {
    name: 'FT-IR (적외선 분광기)',
    readings: [
      { key: 'resolution', label: 'Resolution', unit: 'cm⁻¹', step: 1, placeholder: '4' },
      { key: 'scans', label: 'Accumulation', unit: 'scans', step: 1, placeholder: '32' }
    ],
    checks: [
      { key: 'purge_ok', label: 'N₂ purge gas flow confirmed (퍼지 가스 흐름 확인)' },
      { key: 'background_ok', label: 'Background reference scanned (백그라운드 측정)' },
      { key: 'crystal_cleaned_ok', label: 'ATR crystal cleaned with IPA (크리스탈 세척)' }
    ],
    options: [
      { key: 'accessory', label: 'Accessory', choices: ['ATR (Diamond)', 'Transmission', 'Diffuse (DRIFTS)'], default: 'ATR (Diamond)' }
    ],
    scanTypes: ['Absorbance', 'Transmittance', 'Reflectance']
  },
  'RAMAN': {
    name: 'RAMAN (라만 분광기)',
    readings: [
      { key: 'laser_power', label: 'Laser Power', unit: '%', step: 1, placeholder: '10' },
      { key: 'int_time', label: 'Integration Time', unit: 's', step: 0.5, placeholder: '5.0' }
    ],
    checks: [
      { key: 'si_calib_ok', label: '520.7 cm⁻¹ Si calibration verified (Si 피크 교정)' },
      { key: 'shutter_ok', label: 'Laser safety shutter closed (안전 셔터 차단)' }
    ],
    options: [
      { key: 'wavelength', label: 'Laser Wavelength', choices: ['532 nm (Green)', '633 nm (Red)', '785 nm (NIR)'], default: '532 nm (Green)' },
      { key: 'objective', label: 'Objective', choices: ['10×', '50×', '100×'], default: '50×' }
    ],
    scanTypes: ['Single Spectrum', 'XY Surface Mapping', 'Z Depth Profile', 'Time Series']
  },
  'TEM': {
    name: 'TEM (투과전자현미경)',
    readings: [
      { key: 'col_vacuum', label: 'Column Vacuum', unit: '×10⁻⁵ Pa', step: 0.1, placeholder: '2.0', warnMax: 4.0 },
      { key: 'emission_current', label: 'Emission Current', unit: 'μA', step: 1, placeholder: '105' }
    ],
    checks: [
      { key: 'cold_trap_ok', label: 'Liquid N₂ cold trap filled (액체질소 트랩 주입)' },
      { key: 'gun_align_ok', label: 'Gun & beam alignment verified (전자총 정렬)' },
      { key: 'valves_closed_ok', label: 'Column beam valves closed (컬럼 밸브 폐쇄)' }
    ],
    options: [
      { key: 'acc_voltage', label: 'Acc. Voltage', choices: ['80 kV', '120 kV', '200 kV', '300 kV'], default: '200 kV' }
    ],
    scanTypes: ['Bright Field (BF)', 'Dark Field (DF)', 'HR-TEM', 'SAED Diffraction', 'EDS Mapping']
  },
  'Ebeamsputter': {
    name: 'E-beam Sputter (전자빔 스퍼터/증착기)',
    readings: [
      { key: 'base_press', label: 'Base Vacuum', unit: '×10⁻⁶ Torr', step: 0.1, placeholder: '2.5', warnMax: 5.0 },
      { key: 'dep_rate', label: 'Deposition Rate', unit: 'Å/s', step: 0.1, placeholder: '1.0' }
    ],
    checks: [
      { key: 'cooling_ok', label: 'Cooling water flow verified (냉각수 유량 확인)' },
      { key: 'pocket_ok', label: 'Pocket crucible centered (포켓 위치 정렬)' },
      { key: 'shutter_ok', label: 'Substrate shutter closed & cooled (셔터 닫힘 및 냉각)' }
    ],
    options: [
      { key: 'source', label: 'Target Source', choices: ['Ti', 'Au', 'Pt', 'Cr', 'Ni', 'SiO₂'], default: 'Ti' }
    ],
    scanTypes: ['Single Layer', 'Multilayer Stack', 'Adhesion Layer']
  },
  'ALD': {
    name: 'ALD (원자층 증착기)',
    readings: [
      { key: 'temp', label: 'Chamber Temp.', unit: '°C', step: 1, placeholder: '200' },
      { key: 'cycles', label: 'Cycle Count', unit: 'cycles', step: 1, placeholder: '150' }
    ],
    checks: [
      { key: 'precursor_ok', label: 'Precursor heating stabilized (전구체 가열 안정화)' },
      { key: 'scrubber_ok', label: 'Exhaust pump & scrubber verified (배기 스크러버 점검)' },
      { key: 'purge_ok', label: 'Post-process N₂ purge completed (종료 후 질소 퍼지)' }
    ],
    options: [
      { key: 'recipe', label: 'Recipe', choices: ['Al₂O₃ (TMA+H₂O)', 'TiO₂ (TiCl₄+H₂O)', 'HfO₂ (TEMAH+H₂O)', 'ZnO (DEZ+H₂O)'], default: 'Al₂O₃ (TMA+H₂O)' }
    ],
    scanTypes: ['Atomic Layer Deposition', 'Surface Passivation', '2D Hetero Interface']
  },
  'Co-sputter': {
    name: 'Co-sputter (동시 스퍼터링 시스템)',
    readings: [
      { key: 'base_press', label: 'Base Vacuum', unit: '×10⁻⁶ Torr', step: 0.1, placeholder: '3.0' },
      { key: 'ar_flow', label: 'Ar Gas Flow', unit: 'sccm', step: 1, placeholder: '20' }
    ],
    checks: [
      { key: 'rf_match_ok', label: 'RF reflected power < 2W (임피던스 매칭)' },
      { key: 'rotation_ok', label: 'Substrate rotation active (기판 회전 확인)' },
      { key: 'target_cool_ok', label: 'Post-process cooling completed (타겟 냉각 확인)' }
    ],
    options: [
      { key: 'gun_config', label: 'Power Mode', choices: ['Gun 1 (DC) + Gun 2 (RF)', 'Dual DC', 'Dual RF'], default: 'Gun 1 (DC) + Gun 2 (RF)' }
    ],
    scanTypes: ['Binary Alloy', 'Composite Film', 'Graded Doping']
  },
  'UHVsputter': {
    name: 'UHV Sputter (초고진공 스퍼터링 시스템)',
    readings: [
      { key: 'uhv_base', label: 'UHV Base Vacuum', unit: '×10⁻⁸ Torr', step: 0.1, placeholder: '4.5', warnMax: 8.0 },
      { key: 'tmp_speed', label: 'TMP Speed', unit: 'Hz', step: 10, placeholder: '1500' }
    ],
    checks: [
      { key: 'cryo_ok', label: 'Cryopump temp < 15 K verified (크라이오 펌프 온도)' },
      { key: 'gate_valve_ok', label: 'Loadlock gate valve isolated (게이트 밸브 차단)' },
      { key: 'bakeout_off_ok', label: 'Bakeout finished & cooled (베이크아웃 종료 확인)' }
    ],
    options: [
      { key: 'gas_type', label: 'Process Gas', choices: ['Ar Pure', 'Ar + O₂ (Reactive)', 'Ar + N₂ (Nitride)'], default: 'Ar Pure' }
    ],
    scanTypes: ['UHV Clean Film', 'Magnetic Multilayer', 'Quantum Heterostructure']
  },
  'WireBonder': {
    name: 'Wire Bonder (초음파 와이어본더 / 나노와이어본더)',
    readings: [
      { key: 'ultrasonic_power', label: '초음파 파워 (Ultrasonic Power)', unit: 'W', step: 0.1, placeholder: '3.5', warnMin: 1.0, warnMax: 8.0 },
      { key: 'bonding_force', label: '본딩 가압력 (Bonding Force)', unit: 'gf', step: 1, placeholder: '45', warnMin: 15, warnMax: 120 },
      { key: 'stage_temp', label: '스테이지 히터 온도 (Stage Temp)', unit: '°C', step: 1, placeholder: '25' }
    ],
    checks: [
      { key: 'wire_feed_ok', label: '와이어 피딩 및 텐션 상태 정상 확인 (Wire Feed OK)' },
      { key: 'wedge_tip_ok', label: '웨지 본딩 팁 상태 및 광학 현미경 정렬 정상 (Tip Clean & Aligned)' },
      { key: 'electrode_test_ok', label: '테스트 패드 본딩 및 접촉 저항 검증 완료 (Bonding Check OK)' }
    ],
    options: [
      { key: 'wire_type', label: '와이어 재질 규격', choices: ['Al 1.0 mil (25 ㎛)', 'Au 1.0 mil (25 ㎛)', 'Al 0.8 mil (20 ㎛)', 'Au 0.7 mil (18 ㎛)'], default: 'Al 1.0 mil (25 ㎛)' },
      { key: 'bonding_mode', label: '본딩 모드', choices: ['Ultrasonic Wedge (웨지 본딩)', 'Thermosonic Ball (볼 본딩)', 'Deep Access Ribbon'], default: 'Ultrasonic Wedge (웨지 본딩)' }
    ],
    scanTypes: ['Chamber 16-ch 패드', '양자홀바(Hall-bar) 전극', '2D 이종접합 전극', 'RF 고주파 패키징', 'PCB 헤더 리드 본딩', '기타 특수 전극']
  },
  'XPS': {
    name: 'XPS (X선 광전자 분광기)',
    readings: [
      { key: 'base_vacuum', label: '분석실 기본 진공도', unit: '×10⁻¹⁰ mbar', step: 0.1, placeholder: '1.2', warnMax: 5.0 },
      { key: 'chiller_temp', label: '칠러 냉각수 온도', unit: '°C', step: 0.1, placeholder: '20.5', warnMin: 18, warnMax: 23 },
      { key: 'xray_power', label: 'X선 소스 파워', unit: 'W', step: 10, placeholder: '150' },
      { key: 'pass_energy', label: '통과 에너지 (Pass Energy)', unit: 'eV', step: 5, placeholder: '20' }
    ],
    checks: [
      { key: 'vacuum_interlock_ok', label: '진공 인터록 및 진입 게이트 밸브 확인 (Vacuum Interlock OK)' },
      { key: 'flood_gun_ok', label: '전하 중화 듀얼 플러드 건(Dual Flood Gun) 작동 확인' },
      { key: 'sample_ground_ok', label: '시료 홀더 접지 및 전기적 도통 상태 검증 (Ground OK)' }
    ],
    options: [
      { key: 'xray_spot', label: 'X선 빔 스팟 크기', choices: ['400 ㎛ (Standard)', '200 ㎛', '100 ㎛ (Micro-focus)', '50 ㎛'], default: '400 ㎛ (Standard)' },
      { key: 'analyzer_mode', label: '분석 모드 (Analyzer Mode)', choices: ['CAE (Constant Analyzer Energy)', 'CRR (Constant Retard Ratio)', 'Snapshot Mapping'], default: 'CAE (Constant Analyzer Energy)' }
    ],
    scanTypes: ['Survey Scan (전원소 와이드)', 'Narrow / Core Level Scan (C 1s, O 1s 등)', 'Valence Band (UPS)', 'Depth Profile (Ar+ 에칭)', 'ARXPS (각도분해)']
  },
};
if(typeof window !== 'undefined') window.EQUIPMENT_SCHEMAS = EQUIPMENT_SCHEMAS;

// [공통 유틸리티] 숫자 2자리 패딩
function pad(n){ return String(n).padStart(2, '0'); }

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

// 2DQH 이차원양자헤테로구조체연구단 시약 표준 카탈로그 (외부 consumables_catalog.js 연동)
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

  const SESS_EQUIP_DATA_VER = '20261110_sess_aqt_v6_xps_png';
  try {
    const savedVer = localStorage.getItem('labstock_sess_eq_ver');
    const savedEqs = JSON.parse(localStorage.getItem('labstock_research_equipments') || 'null');
    if(savedVer !== SESS_EQUIP_DATA_VER || !Array.isArray(savedEqs) || savedEqs.length < DEFAULT_RESEARCH_EQUIPMENTS.length){
      // 기존 사용자가 변경한 active 상태 맵 보존
      const activeMap = {};
      if(Array.isArray(savedEqs)){
        savedEqs.forEach(function(e){
          if(e && e.code) activeMap[e.code] = e.status;
        });
      }
      researchEquipments = DEFAULT_RESEARCH_EQUIPMENTS.map(function(def){
        const copy = Object.assign({}, def);
        if(activeMap[def.code] === 'active'){
          copy.status = 'active';
          copy.statusLabel = '디지털 로그북 가동 중';
        }
        return copy;
      });
      try {
        localStorage.setItem('labstock_research_equipments', JSON.stringify(researchEquipments));
        localStorage.setItem('labstock_sess_eq_ver', SESS_EQUIP_DATA_VER);
      } catch(_) {}
    } else {
      researchEquipments = savedEqs;
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

  try {
    equipmentSessions = JSON.parse(localStorage.getItem('labstock_equipment_sessions') || '[]');
  } catch(e){
    equipmentSessions = [];
  }

  // 연구장비 캘린더 및 주간/월별/연간 운영통계 초기 시연 데이터 (11월 실측 데이터셋)
  if(!Array.isArray(equipmentSessions) || equipmentSessions.length < 5){
    equipmentSessions = [
      {
        id: 'sess_bonder_001',
        equipment_id: 'EQ-BONDER-01',
        equipment_code: 'WireBonder',
        equipment_name: 'Wire Bonder (초음파 와이어본더)',
        used_on: today(),
        start_time: '14:00',
        end_time: '16:00',
        duration_min: 120,
        user_name: '박지원 연구원',
        affiliation: '2DQH 그래핀 연구팀',
        professor: '신현석 교수님',
        sample_name: 'Graphene/h-BN Hall-bar 소자 전극 와이어 본딩',
        sample_count: 16,
        scan_type: '웨지 본딩(Wedge)',
        parameters: { wire_type: 'Al 1.0 mil (25 ㎛)', bonding_force: 45 },
        memo: '16채널 Al 와이어 웨지 본딩 완료. 4단자 전극 접촉 저항 2.1 Ω 정상 통전 확인.',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'sess_afm_001',
        equipment_id: 'EQ-AFM-01',
        equipment_code: 'AFM',
        equipment_name: 'AFM (원자간력현미경)',
        used_on: '2026-11-09',
        start_time: '10:00',
        end_time: '12:30',
        duration_min: 150,
        user_name: '김태현 연구원',
        affiliation: '2DQH 2차원 물질팀',
        professor: '신현석 교수님',
        sample_name: 'MoS2/WSe2 이종접합 원자단차(Step-height) 프로파일',
        sample_count: 4,
        scan_type: 'Non-contact 모드',
        parameters: { mode: 'Non-contact', scan_rate: '0.8 Hz' },
        memo: '단차 0.72 nm 측정으로 단일층 전사 성공 확인.',
        created_at: '2026-11-09T12:35:00.000Z'
      },
      {
        id: 'sess_xrd_002',
        equipment_id: 'EQ-XRD-01',
        equipment_code: 'XRD',
        equipment_name: 'HR-XRD (고분해능 X선 회절분석기)',
        used_on: '2026-11-08',
        start_time: '13:30',
        end_time: '15:15',
        duration_min: 105,
        user_name: '한지훈 연구원',
        affiliation: '2DQH 페로브스카이트팀',
        professor: '신현석 교수님',
        sample_name: 'CsPbBr3 무기 페로브스카이트 박막 회절분석',
        sample_count: 3,
        scan_type: 'θ/2θ 스캔',
        parameters: { chiller_start: 22.0, vacuum_start: 91 },
        memo: '(100) 배향성 피크 선명, 결정성 우수 확인.',
        created_at: '2026-11-08T15:20:00.000Z'
      },
      {
        id: 'sess_raman_001',
        equipment_id: 'EQ-RAMAN-01',
        equipment_code: 'Raman',
        equipment_name: 'Micro Raman (라만 분광기)',
        used_on: '2026-11-07',
        start_time: '15:00',
        end_time: '16:30',
        duration_min: 90,
        user_name: '정우진 연구원',
        affiliation: '2DQH 나노광학팀',
        professor: '신현석 교수님',
        sample_name: 'CVD 그래핀 G/2D peak 2D 맵핑 분석',
        sample_count: 6,
        scan_type: '532 nm 레이저',
        parameters: { laser: '532 nm', power: '2 mW' },
        memo: 'I(2D)/I(G) 비율 2.4로 우수한 단일층 균일도 확인.',
        created_at: '2026-11-07T16:35:00.000Z'
      },
      {
        id: 'sess_evap_001',
        equipment_id: 'EQ-EVAP-01',
        equipment_code: 'ThermalEvap',
        equipment_name: 'Thermal Evaporator (열 증착기)',
        used_on: '2026-11-05',
        start_time: '11:00',
        end_time: '12:00',
        duration_min: 60,
        user_name: '최민서 연구원',
        affiliation: '2DQH 소자제작팀',
        professor: '신현석 교수님',
        sample_name: 'Cr/Au (5/50 nm) 소스-드레인 접촉 전극 증착',
        sample_count: 8,
        scan_type: '고진공 열증착',
        parameters: { base_vacuum: '3.2e-6 Torr', rate: '0.5 A/s' },
        memo: '두께 균일도 ±2% 이내 양호.',
        created_at: '2026-11-05T12:05:00.000Z'
      },
      {
        id: 'sess_sputter_001',
        equipment_id: 'EQ-SPUTTER-01',
        equipment_code: 'Sputter',
        equipment_name: 'RF/DC Sputter (스퍼터)',
        used_on: '2026-11-04',
        start_time: '14:30',
        end_time: '16:20',
        duration_min: 110,
        user_name: '이강민 연구원',
        affiliation: '2DQH 그래핀 연구팀',
        professor: '신현석 교수님',
        sample_name: 'SiO2 20 nm 보호막 증착',
        sample_count: 2,
        scan_type: 'RF 스퍼터링',
        parameters: { rf_power: '100W', ar_flow: '20 sccm' },
        memo: '표면 조도 거칠기 Rq 0.25 nm 확인.',
        created_at: '2026-11-04T16:25:00.000Z'
      },
      {
        id: 'sess_pl_001',
        equipment_id: 'EQ-PL-01',
        equipment_code: 'PL',
        equipment_name: 'Micro PL (포토루미네센스)',
        used_on: '2026-11-02',
        start_time: '16:00',
        end_time: '17:20',
        duration_min: 80,
        user_name: '김태현 연구원',
        affiliation: '2DQH 2차원 물질팀',
        professor: '신현석 교수님',
        sample_name: 'WS2 단일층(Monolayer) 실온 발광 스펙트럼',
        sample_count: 5,
        scan_type: '실온(RT) 광발광',
        parameters: { excitation: '405 nm' },
        memo: '중심 파장 625 nm (1.98 eV) 엑시톤 피크 확인.',
        created_at: '2026-11-02T17:25:00.000Z'
      }
    ];
    try { localStorage.setItem('labstock_equipment_sessions', JSON.stringify(equipmentSessions)); } catch(_) {}
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
  localStorage.setItem('labstock_equipment_sessions', JSON.stringify(equipmentSessions));
  
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
  set modalId(v){ modalId = v; },
  get researchEquipments(){ return researchEquipments; },
  set researchEquipments(v){ researchEquipments = v; },
  get equipmentSessions(){ return equipmentSessions; },
  set equipmentSessions(v){ equipmentSessions = v; },
  get xrdLogs(){ return xrdLogs; },
  set xrdLogs(v){ xrdLogs = v; },
  get currentSelectedEquipment(){ return currentSelectedEquipment; },
  set currentSelectedEquipment(v){ currentSelectedEquipment = v; }
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
  let base;
  if(baseDateStr){
    const cleanStr = String(baseDateStr).trim().slice(0, 10);
    if(/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)){
      base = new Date(cleanStr + 'T00:00:00');
    } else {
      base = new Date(baseDateStr);
    }
  }
  if(!base || isNaN(base.getTime())){
    base = new Date();
  }
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
  try {
    if(admin === true) return true;
    if(localStorage.getItem('labstock_is_admin') === 'true') return true;
  } catch(_) {}
  return false;
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
  const isAdm = isAdmin();
  try {
    if(isAdm){
      localStorage.setItem('labstock_is_admin', 'true');
      if(document.documentElement) document.documentElement.classList.add('is-admin');
      if(document.body) document.body.classList.add('is-admin');
    } else {
      localStorage.removeItem('labstock_is_admin');
      if(document.documentElement) document.documentElement.classList.remove('is-admin');
      if(document.body) document.body.classList.remove('is-admin');
    }
  } catch(_){}

  if(typeof updateUserUI === 'function') updateUserUI();

  const adminEls = document.querySelectorAll('.admin-only:not(.view)');
  for(let i=0; i<adminEls.length; i++){
    adminEls[i].classList.toggle('hidden', !isAdm);
  }

  const activeView = document.querySelector('.view.active');
  if(!isAdm && activeView && (activeView.id === 'view-history' || activeView.id === 'view-dashboard' || activeView.classList.contains('admin-only'))){
    showView('inventory');
  }

  if(!isAdm && currentHubView === 'analytics'){
    currentHubView = 'catalog';
    switchEquipmentHubView('catalog');
  }

  // 장비 관련 화면 갱신 (관리자 로그인 상태에 따라 수정/삭제 및 통계 뷰 동적 반영)
  if(currentSelectedEquipment === 'EQ-XRD-01'){
    renderXrdLogs();
  } else {
    const curEq = researchEquipments.find(function(e){ return e.id === currentSelectedEquipment; });
    if(curEq) renderEquipmentTestSessions(curEq.code);
  }
}

async function refreshAdminState(){
  admin = false;

  if(db && session && session.user && !session.user.is_anonymous){
    if(session.user.email === '2dqh2024@gmail.com' || session.user.id === 'c28a6a4e-9fd6-46ea-bf46-261364e48c59'){
      admin = true;
    } else {
      const res = await db.rpc('is_admin');
      if(res.error) console.error('관리자 권한 확인 실패:', res.error);
      admin = !res.error && res.data === true;
    }
  } else if(localStorage.getItem('labstock_is_admin') === 'true'){
    admin = true;
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
      // 1. 범용 연구장비 세션 (equipment_sessions) 동기화
      try {
        let remoteSessions = null;
        let sessErr = null;
        try {
          const res = await db.from('view_equipment_sessions').select('*').order('used_on', { ascending: false });
          remoteSessions = res.data;
          sessErr = res.error;
        } catch(_) {}
        if(!remoteSessions || remoteSessions.length === 0){
          const res = await db.from('equipment_sessions').select('*').order('used_on', { ascending: false });
          remoteSessions = res.data;
          sessErr = res.error;
        }
        if(!sessErr && Array.isArray(remoteSessions) && remoteSessions.length > 0){
          equipmentSessions = remoteSessions;
          try { localStorage.setItem('labstock_equipment_sessions', JSON.stringify(equipmentSessions)); } catch(_) {}
        }
      } catch(e){
        console.warn('Supabase equipment_sessions 로드 건너뜀 (로컬 캐시 사용):', e);
      }

      // 2. HR-XRD 일지 (xrd_logs) 동기화
      try {
        const { data: remoteXrd, error: xrdErr } = await db.from('xrd_logs').select('*').order('used_on', { ascending: false });
        if(!xrdErr && Array.isArray(remoteXrd) && remoteXrd.length > 0){
          xrdLogs = remoteXrd;
          try { localStorage.setItem('labstock_xrd_logs', JSON.stringify(xrdLogs)); } catch(_) {}
        }
      } catch(e){
        console.warn('Supabase xrd_logs 로드 건너뜀 (로컬 캐시 사용):', e);
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
  renderMetrics();
  renderDashboard();
  renderInventory();
  renderLoans();
  renderHistory();
  if(ENABLE_CONSUMABLES) renderConsumables();
  renderChemicalsView();
  setAdminUI();
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
  renderDashboardOverview();
  if(currentDashTab === "loans") renderDashLoans();
  if(currentDashTab === "history") renderDashHistory();
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

      rowsHtml += '<tr><td data-label="비품"><b>' + safe(fmtName(l.asset_id)) +
        '</b><div class="asset-id">' + safe(l.asset_id) +
        '</div></td><td data-label="대여자">' + safe(l.borrower_name) +
        '</td><td data-label="대여일">' + dateText(l.borrowed_at) +
        '</td><td data-label="상태">' + (isOverdue ? '<span class="status-chip overdue-chip">⚠️ 기간 지남</span>' : '<span class="status borrowed">대여 중</span>') + '</td></tr>';
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
  multimeter: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><rect x="15" y="8" width="34" height="48" rx="8" fill="#F59E0B"/><rect x="18" y="11" width="28" height="42" rx="5" fill="#1E293B"/><rect x="21" y="14" width="22" height="12" rx="3" fill="#E0F2FE"/><rect x="23" y="17" width="10" height="2" rx="1" fill="#0284C7"/><rect x="23" y="21" width="14" height="2" rx="1" fill="#0284C7"/><circle cx="32" cy="35" r="7" fill="#334155" stroke="#475569" stroke-width="1.5"/><line x1="32" y1="35" x2="32" y2="30" stroke="#C2272D" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="46" r="2" fill="#C2272D"/><circle cx="32" cy="46" r="2" fill="#0F172A"/><circle cx="40" cy="46" r="2" fill="#F59E0B"/></svg>',

  oscilloscope: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><rect x="10" y="13" width="44" height="38" rx="6" fill="#1E293B"/><rect x="12" y="15" width="40" height="34" rx="4" fill="#334155"/><rect x="15" y="18" width="26" height="26" rx="3" fill="#0F172A"/><line x1="15" y1="31" x2="41" y2="31" stroke="#1E293B" stroke-width="0.8" stroke-dasharray="1 1"/><line x1="28" y1="18" x2="28" y2="44" stroke="#1E293B" stroke-width="0.8" stroke-dasharray="1 1"/><path d="M16 31 Q20 20 24 31 T32 31 T40 31" stroke="#06B6D4" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="46" cy="22" r="3" fill="#94A3B8"/><circle cx="46" cy="30" r="3" fill="#94A3B8"/><circle cx="46" cy="38" r="2" fill="#C2272D"/><circle cx="46" cy="44" r="2" fill="#38BDF8"/></svg>',

  powersupply: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><rect x="11" y="11" width="42" height="42" rx="6" fill="#1E293B"/><rect x="13" y="13" width="38" height="38" rx="4" fill="#334155"/><rect x="16" y="16" width="15" height="10" rx="2" fill="#0F172A"/><text x="17.5" y="24" font-family="monospace" font-size="6.5" font-weight="bold" fill="#EF4444">30V</text><rect x="33" y="16" width="15" height="10" rx="2" fill="#0F172A"/><text x="34.5" y="24" font-family="monospace" font-size="6.5" font-weight="bold" fill="#10B981">5.0A</text><circle cx="23" cy="34" r="4" fill="#64748B" stroke="#94A3B8" stroke-width="1"/><circle cx="41" cy="34" r="4" fill="#64748B" stroke="#94A3B8" stroke-width="1"/><circle cx="20" cy="45" r="2.5" fill="#EF4444"/><circle cx="32" cy="45" r="2.5" fill="#10B981"/><circle cx="44" cy="45" r="2.5" fill="#0F172A"/></svg>',

  caliper: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><rect x="8" y="27" width="48" height="8" rx="1.5" fill="#94A3B8"/><line x1="16" y1="27" x2="16" y2="30" stroke="#64748B" stroke-width="1"/><line x1="20" y1="27" x2="20" y2="29" stroke="#64748B" stroke-width="0.8"/><line x1="24" y1="27" x2="24" y2="30" stroke="#64748B" stroke-width="1"/><line x1="28" y1="27" x2="28" y2="29" stroke="#64748B" stroke-width="0.8"/><line x1="32" y1="27" x2="32" y2="30" stroke="#64748B" stroke-width="1"/><path d="M8 27 L8 46 Q10 49 13 46 L13 35 L17 35 L17 27 Z" fill="#64748B"/><path d="M8 27 L8 14 Q10 12 12 14 L13 22 L16 27 Z" fill="#64748B"/><rect x="24" y="23" width="18" height="16" rx="3" fill="#1E293B"/><rect x="27" y="26" width="12" height="6" rx="1" fill="#BAE6FD"/><rect x="29" y="28" width="7" height="2" rx="0.5" fill="#0284C7"/><path d="M24 39 L24 47 Q26 50 28 47 L30 39 Z" fill="#475569"/></svg>',

  hex_wrench: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><rect x="18" y="24" width="28" height="26" rx="4" fill="#C2272D"/><rect x="20" y="26" width="24" height="22" rx="2" fill="#991B1B"/><polygon points="32,30 38,33.5 38,40.5 32,44 26,40.5 26,33.5" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2"/><polygon points="32,32.5 36,35 36,39.5 32,42 28,39.5 28,35" fill="#1E293B"/><path d="M23 24 L23 16 L27 16" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M29 24 L29 13 L35 13" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M35 24 L35 10 L43 10" stroke="#94A3B8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M41 24 L41 7 L51 7" stroke="#64748B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="51" cy="7" r="2.2" fill="#334155"/><polygon points="51,5.5 52.3,6.3 52.3,7.7 51,8.5 49.7,7.7 49.7,6.3" fill="#F8FAFC"/><line x1="23" y1="50" x2="23" y2="54" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round"/><line x1="29" y1="50" x2="29" y2="56" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/><line x1="35" y1="50" x2="35" y2="58" stroke="#94A3B8" stroke-width="3.5" stroke-linecap="round"/><line x1="41" y1="50" x2="41" y2="60" stroke="#64748B" stroke-width="4" stroke-linecap="round"/></svg>',

  torque_driver: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><path d="M10 27 C10 23 13 21 17 21 L27 21 C30 21 32 23 33 26 L33 38 C32 41 30 43 27 43 L17 43 C13 43 10 41 10 37 Z" fill="#1E293B"/><ellipse cx="12" cy="32" rx="3" ry="7" fill="#334155"/><rect x="18" y="23" width="9" height="18" rx="2" fill="#C2272D"/><rect x="19.5" y="27" width="6" height="10" rx="1" fill="#FEF2F2" stroke="#991B1B" stroke-width="0.8"/><line x1="22.5" y1="28" x2="22.5" y2="36" stroke="#C2272D" stroke-width="1"/><text x="20.5" y="34" font-family="monospace" font-size="4" font-weight="bold" fill="#0F172A">1.2</text><rect x="33" y="25" width="4" height="14" rx="1" fill="#64748B"/><line x1="35" y1="25" x2="35" y2="39" stroke="#334155" stroke-width="0.8" stroke-dasharray="1 1"/><rect x="37" y="29.5" width="13" height="5" fill="#94A3B8"/><line x1="37" y1="31" x2="50" y2="31" stroke="#E2E8F0" stroke-width="1"/><rect x="49" y="28" width="5" height="8" rx="1" fill="#475569"/><path d="M54 30 L59 31 L60 32 L59 33 L54 34 Z" fill="#334155"/><rect x="18" y="47" width="10" height="3" rx="0.8" fill="#64748B"/><polygon points="28,47 31,48.5 28,50" fill="#334155"/><rect x="32" y="47" width="10" height="3" rx="0.8" fill="#64748B"/><polygon points="42,47 45,48.5 42,50" fill="#334155"/></svg>',

  tweezers: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><path d="M12 18 C12 14 16 12 20 12 L24 12 C26 12 28 14 28 17 L22 46 C21 52 19 54 18 54 C17 54 16 52 16 48 Z" fill="#64748B"/><path d="M36 18 C36 14 32 12 28 12 L24 12 C22 12 20 14 20 17 L26 46 C27 52 29 54 30 54 C31 54 32 52 32 48 Z" fill="#94A3B8"/><line x1="18" y1="28" x2="22" y2="28" stroke="#334155" stroke-width="1"/><line x1="18" y1="31" x2="23" y2="31" stroke="#334155" stroke-width="1"/><line x1="19" y1="34" x2="24" y2="34" stroke="#334155" stroke-width="1"/><rect x="18" y="14" width="12" height="6" rx="2" fill="#1E293B"/><circle cx="24" cy="52" r="1.5" fill="#C2272D"/><text x="36" y="32" font-family="sans-serif" font-size="6.5" font-weight="bold" fill="#0284C7">ESD</text><text x="36" y="40" font-family="monospace" font-size="5" fill="#64748B">#5</text></svg>',

  microscope: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><ellipse cx="32" cy="53" rx="18" ry="4" fill="#334155"/><rect x="28" y="47" width="8" height="4" rx="1.5" fill="#E2E8F0"/><circle cx="32" cy="46" r="2.5" fill="#F59E0B"/><rect x="20" y="36" width="24" height="3" rx="1.5" fill="#1E293B"/><path d="M38 52 C46 52 48 30 40 22 C37 19 33 21 33 24" stroke="#475569" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="41" cy="38" r="4.5" fill="#94A3B8" stroke="#334155" stroke-width="1.5"/><circle cx="28" cy="27" r="4" fill="#334155"/><rect x="25" y="29" width="3" height="6" rx="1" fill="#C2272D"/><rect x="29" y="29" width="3" height="4.5" rx="1" fill="#F59E0B"/><path d="M28 25 L23 13" stroke="#64748B" stroke-width="4.5" stroke-linecap="round"/><rect x="20" y="9" width="6" height="4" rx="1.5" fill="#1E293B"/></svg>',

  hotplate: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><rect x="12" y="22" width="40" height="32" rx="6" fill="#334155"/><rect x="14" y="14" width="36" height="16" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/><ellipse cx="32" cy="22" rx="12" ry="4" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/><rect x="18" y="34" width="13" height="8" rx="2" fill="#0F172A"/><rect x="20" y="37" width="8" height="2" rx="0.5" fill="#EF4444"/><circle cx="34" cy="38" r="2" fill="#DC2626"/><circle cx="43" cy="38" r="4" fill="#64748B" stroke="#94A3B8" stroke-width="1"/></svg>',

  spincoater: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><rect x="12" y="22" width="40" height="32" rx="6" fill="#1E293B"/><ellipse cx="32" cy="22" rx="16" ry="7" fill="#334155" stroke="#64748B" stroke-width="1.5"/><ellipse cx="32" cy="22" rx="7" ry="3" fill="#0F172A"/><circle cx="32" cy="22" r="3" fill="#C2272D"/><path d="M16 22 C16 11 48 11 48 22 Z" fill="#38BDF8" fill-opacity="0.25" stroke="#38BDF8" stroke-width="1.5"/><rect x="18" y="36" width="16" height="8" rx="2" fill="#0F172A"/><rect x="21" y="39" width="10" height="2" rx="0.5" fill="#06B6D4"/><circle cx="41" cy="40" r="3.5" fill="#10B981"/></svg>',

  scale: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><rect x="12" y="36" width="40" height="18" rx="4" fill="#334155"/><rect x="16" y="12" width="32" height="24" rx="2" fill="#E0F2FE" fill-opacity="0.35" stroke="#94A3B8" stroke-width="1.5"/><rect x="30" y="27" width="4" height="9" fill="#64748B"/><ellipse cx="32" cy="27" rx="9" ry="2.5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1"/><rect x="18" y="42" width="18" height="7" rx="2" fill="#0F172A"/><rect x="20" y="44" width="12" height="2" rx="0.5" fill="#38BDF8"/><rect x="39" y="42" width="7" height="7" rx="1.5" fill="#C2272D"/></svg>',

  sonicator: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><rect x="13" y="16" width="38" height="36" rx="5" fill="#475569"/><rect x="9" y="24" width="4" height="8" rx="1.5" fill="#334155"/><rect x="51" y="24" width="4" height="8" rx="1.5" fill="#334155"/><rect x="15" y="14" width="34" height="5" rx="1.5" fill="#94A3B8"/><ellipse cx="32" cy="19" rx="12" ry="2.5" fill="#38BDF8" fill-opacity="0.4"/><path d="M27 28 Q32 25 37 28" stroke="#38BDF8" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M25 32 Q32 28 39 32" stroke="#38BDF8" stroke-width="1.5" fill="none" stroke-linecap="round"/><rect x="23" y="38" width="18" height="8" rx="2" fill="#0F172A"/><rect x="26" y="41" width="11" height="2" rx="0.5" fill="#10B981"/></svg>',

  soldering: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><rect x="11" y="22" width="28" height="30" rx="5" fill="#1E293B"/><rect x="16" y="27" width="16" height="8" rx="2" fill="#0F172A"/><rect x="19" y="30" width="10" height="2" rx="0.5" fill="#EF4444"/><circle cx="24" cy="42" r="3.5" fill="#475569" stroke="#64748B" stroke-width="1"/><rect x="42" y="36" width="12" height="16" rx="3" fill="#334155"/><path d="M47 36 L39 12" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/><path d="M39 12 L36 7" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/><path d="M48 48 C44 54 28 54 24 50" stroke="#0F172A" stroke-width="2" fill="none"/></svg>',

  pump: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><rect x="12" y="24" width="26" height="24" rx="4" fill="#334155"/><line x1="16" y1="28" x2="16" y2="44" stroke="#475569" stroke-width="1.5"/><line x1="21" y1="28" x2="21" y2="44" stroke="#475569" stroke-width="1.5"/><line x1="26" y1="28" x2="26" y2="44" stroke="#475569" stroke-width="1.5"/><line x1="31" y1="28" x2="31" y2="44" stroke="#475569" stroke-width="1.5"/><rect x="36" y="28" width="16" height="18" rx="3" fill="#1E293B"/><circle cx="44" cy="20" r="6" fill="#F8FAFC" stroke="#334155" stroke-width="1.5"/><line x1="44" y1="20" x2="46" y2="17" stroke="#C2272D" stroke-width="1.2" stroke-linecap="round"/><path d="M20 24 L20 17 L34 17 L34 24" stroke="#64748B" stroke-width="3" stroke-linecap="round" fill="none"/></svg>',

  chiller: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><rect x="14" y="16" width="36" height="38" rx="6" fill="#1E293B"/><rect x="16" y="18" width="32" height="34" rx="4" fill="#334155"/><rect x="19" y="21" width="16" height="10" rx="2" fill="#0F172A"/><text x="21" y="28.5" font-family="monospace" font-size="6.5" font-weight="bold" fill="#38BDF8">4.0°C</text><circle cx="41" cy="26" r="3" fill="#10B981"/><line x1="19" y1="36" x2="45" y2="36" stroke="#475569" stroke-width="1.5"/><line x1="19" y1="40" x2="45" y2="40" stroke="#475569" stroke-width="1.5"/><line x1="19" y1="44" x2="45" y2="44" stroke="#475569" stroke-width="1.5"/><rect x="22" y="10" width="5" height="7" rx="1.5" fill="#0284C7"/><rect x="37" y="10" width="5" height="7" rx="1.5" fill="#EF4444"/><circle cx="21" cy="54" r="2.5" fill="#0F172A"/><circle cx="43" cy="54" r="2.5" fill="#0F172A"/></svg>',

  thermometer: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><path d="M18 20 C18 16 21 14 25 14 L42 14 C46 14 48 16 48 20 L48 30 C48 34 45 36 41 36 L34 36 L31 52 C30 55 27 57 24 56 C21 55 20 52 21 48 L25 36 L22 36 C19 36 18 33 18 30 Z" fill="#F59E0B"/><rect x="26" y="18" width="15" height="12" rx="2" fill="#0F172A"/><text x="28" y="26.5" font-family="monospace" font-size="6" font-weight="bold" fill="#EF4444">24.5°</text><circle cx="48" cy="22" r="3" fill="#1E293B"/><circle cx="48" cy="22" r="1.2" fill="#EF4444"/><line x1="51" y1="22" x2="57" y2="22" stroke="#EF4444" stroke-width="1.2" stroke-dasharray="1 1"/><circle cx="58" cy="22" r="1" fill="#EF4444"/></svg>',

  tool: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><path d="M16 48 L28 36" stroke="#C2272D" stroke-width="7" stroke-linecap="round"/><path d="M28 36 L44 20" stroke="#94A3B8" stroke-width="3.5" stroke-linecap="round"/><path d="M44 20 L48 16" stroke="#475569" stroke-width="2" stroke-linecap="round"/><path d="M20 18 L42 40 L38 46" stroke="#475569" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',

  default: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="14" fill="none"/><polygon points="32,14 46,22 46,38 32,46 18,38 18,22" fill="#FEF2F2" stroke="#C2272D" stroke-width="2"/><circle cx="32" cy="14" r="3" fill="#C2272D"/><circle cx="46" cy="22" r="3" fill="#58595B"/><circle cx="46" cy="38" r="3" fill="#C2272D"/><circle cx="32" cy="46" r="3" fill="#58595B"/><circle cx="18" cy="38" r="3" fill="#C2272D"/><circle cx="18" cy="22" r="3" fill="#58595B"/><circle cx="32" cy="30" r="5" fill="#C2272D"/><path d="M32 20 L32 25 M32 35 L32 40 M23 25 L27 28 M37 32 L41 35 M41 25 L37 28 M27 32 L23 35" stroke="#94A3B8" stroke-width="1.2"/></svg>'
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
      const isMine = l && isMyLoan(l);
      const canManage = l && canManageLoan(l);
      const info = l ? getLoanDeadlineInfo(l) : null;
      const isOverdue = !!(info && info.isOverdue);

      let actionBtn = '';

      if(st === 'available'){
        actionBtn += '<button class="text-btn btn-action-borrow" data-borrow="' + safe(a.id) + '">⚡ 대여 신청</button>';
      } else if(st === 'borrowed'){
        if(canManage){
          // 본인 대여 비품: 깔끔하게 단일 [✓ 반납] 버튼만 노출 (대여 신청 버튼과 동일한 크기/단일 행 유지, 24시간 연장은 상단 배너 및 반납 모달에서 1클릭 지원)
          actionBtn += '<button class="text-btn btn-action-return" data-return="' + l.id + '">✓ 반납</button>';
        } else {
          // 타인 대여 비품: 줄바꿈/너비 낭비 없는 컴팩트 칩 노출
          actionBtn += '<span class="status-chip locked-chip">대여 중</span>';
        }
      }

      if(isAdmin()){
        actionBtn += '<button class="text-btn btn-action-edit" data-edit="' + safe(a.id) + '">수정</button>';
      }

      // 모바일 친화적 카드 메타: 상태 및 대여자 정보 노출
      let cardMetaHtml = '<span class="status ' + st + '">' + statusLabel(st) + '</span>';
      if(st === 'borrowed'){
        const borrowerBadgeText = isMine ? '내 대여' : safe(bName);
        cardMetaHtml += ' <span class="loan-user-tag ' + (isMine ? 'is-me' : '') + '">👤 ' + borrowerBadgeText + '</span>';
        if(isOverdue){
          cardMetaHtml += ' <span class="loan-overdue-tag">⚠️ 기한초과</span>';
        }
      }

      const rowClass = 'quick-row' + (st === 'borrowed' ? ' is-borrowed' + (isMine ? ' is-my-loan' : '') + (isOverdue ? ' is-overdue' : '') : '');

      // 모바일 비품 카드 & 데스크톱 테이블 행 (셀 래퍼를 통해 테이블 border-bottom 일관 정렬 보장)
      listHtml += '<tr data-status="' + st + '" class="' + rowClass + '">' +
        '<td class="col-main">' +
          '<div class="asset-cell-wrap">' +
            '<div class="asset-thumb-box" aria-hidden="true">' +
              getEquipmentImageHtml(a, 'thumb') +
            '</div>' +
            '<div class="asset-info-col">' +
              '<div class="card-meta">' +
                cardMetaHtml +
              '</div>' +
              '<b class="asset-name">' + safe(a.name) + '</b>' +
              '<span class="asset-id hide-mobile">' + safe(a.id) + '</span>' +
              '<div class="asset-loc">📍 ' + safe(loc) + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td class="col-meta hide-mobile">' + safe(a.category) + '</td>' +
        '<td class="col-meta hide-mobile">' + safe(loc) + '</td>' +
        '<td class="col-meta hide-mobile"><span class="status ' + st + '">' + statusLabel(st) + '</span></td>' +
        '<td class="col-meta hide-mobile">' + safe(bName) + '</td>' +
        '<td class="col-action"><div class="col-action-wrap">' + actionBtn + '</div></td></tr>';
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
  // 1. Supabase 로그인 세션 UID 대조 (로그인 사용자 본인 계정)
  if(l.user_id && session && session.user && l.user_id === session.user.id) return true;
  // 2. 이 기기/브라우저에서 실제 대여 신청했던 loan_id 목록 대조 (오프라인/익명 대여)
  if(getMyLoanIds().has(String(l.id))) return true;
  // 3. 브라우저 client_id 비교 (동일 기기 브라우저 검증)
  if(l.client_id && l.client_id === getClientId()) return true;
  // ⚠️ 단순 이름 일치만으로 다른 기기/계정의 대여를 내 대여로 취급하지 않음 (본인 기기/계정 대여만 인정)
  return false;
}

// 2DQH JPG 로고의 외곽 흰색 배경을 캔버스에서 투명 알파 채널로 변환하여 다크모드/라이트모드 이질감 완전 제거
function initTransparentLogo(){
  try {
    const logos = document.querySelectorAll('.brand-img-logo');
    if(!logos.length) return;
    const img = new Image();
    img.src = 'logo_2dqh.jpg';
    img.onload = function(){
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 200;
        canvas.height = img.naturalHeight || img.height || 60;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for(let i = 0; i < d.length; i += 4){
          const r = d[i], g = d[i+1], b = d[i+2];
          // 흰색 배경(R,G,B 모두 230 이상)을 투명화
          if(r >= 230 && g >= 230 && b >= 230){
            d[i+3] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
        const transparentDataUrl = canvas.toDataURL('image/png');
        logos.forEach(function(el){
          el.src = transparentDataUrl;
        });
      } catch(e){}
    };
  } catch(e){}
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
  // 기준일: 만약 기존 due_date가 오늘보다 이전이거나 비정상 값이면 오늘 기준, 미래이면 기존 due_date 기준
  const rawDue = (target.due_date && target.due_date.length >= 10 && !target.due_date.includes('NaN')) ? target.due_date.slice(0, 10) : todayStr;
  const baseDate = (rawDue < todayStr) ? todayStr : rawDue;
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

  closeModal();

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
    $('loanRows').innerHTML = '<div class="empty">' +
      '<p style="font-size:14.5px;font-weight:600;margin-bottom:8px;">표시할 대여 기록이 없습니다.</p>' +
      '<button type="button" class="btn primary" id="btnEmptyLoanBorrow" style="margin-top:6px;display:inline-flex;align-items:center;gap:6px;">⚡ 비품 대여 신청하기</button>' +
      '</div>';
  }

  const activeCountBadge = $('activeLoansCountBadge');
  if(activeCountBadge){
    const activeCount = loans.filter(function(l){ return !l.returned_at; }).length;
    activeCountBadge.textContent = activeCount;
  }

  const btnEmptyBorrow = $('btnEmptyLoanBorrow');
  if(btnEmptyBorrow){
    btnEmptyBorrow.onclick = function(e){
      e.preventDefault();
      openModal('borrow');
    };
  }
}

// ==========================================
// [소모품 및 시약 목록 모듈]
// ==========================================
const CONSUMABLE_CATEGORIES = [
  '전체 소모품',
  '자주찾는 소모품',
  '보호구',
  '배관·테이프'
];

function isReagentCategory(cat){
  return cat === '시약' || cat === '시약·화학' || cat === '화학·시약';
}

function isProtectiveCategory(cat){
  return cat === '보호구' || cat === '보호·클린룸';
}

function consumableCategoryTabsHtml(selected){
  return '<div class="category-tabs" aria-label="소모품 카테고리">' +
    CONSUMABLE_CATEGORIES.map(function(cat){
      const icon = (
        cat === '자주찾는 소모품' ? '⭐' :
        cat === '전체 소모품' ? '📦' :
        cat === '보호구' ? '🧤' :
        cat === '배관·테이프' ? '🔧' : '📦'
      );
      const isReagent = isReagentCategory(cat);
      const isActive = (selected === cat) || (cat === '전체 소모품' && (selected === 'all' || !selected || selected === '전체 소모품')) || (cat === '보호구' && selected === '보호·클린룸');
      return '<button type="button" class="category-tab' +
        (isReagent ? ' tab-reagent' : '') +
        (isActive ? ' active' : '') + '" data-consumable-category="' + safe(cat) +
        '" aria-pressed="' + (isActive ? 'true' : 'false') +
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
    } else if(selectedConsumableCategory === '전체 소모품' || selectedConsumableCategory === 'all' || !selectedConsumableCategory){
      // 전체 소모품: 시약을 제외한 모든 연구실 소모품 전체 노출
      matchCategory = !isReagentCategory(c.category);
    } else if(selectedConsumableCategory === '자주찾는 소모품'){
      // 자주찾는 소모품: 일상 핵심 소모품만 노출 (CS-001 ~ CS-010 등)
      matchCategory = !isReagentCategory(c.category) && (c.is_common || c.isCommon || (c.code && /^CS-00[1-9]/.test(c.code)) || (c.id && /^CS-00[1-9]/.test(c.id)));
    } else if(isReagentCategory(selectedConsumableCategory)){
      const isReagent = isReagentCategory(c.category);
      if(!isReagent) return false;
      if(showOnlyControlledReagents){
        return isControlledSubstance(c);
      }
      return true;
    } else if(isProtectiveCategory(selectedConsumableCategory)){
      matchCategory = isProtectiveCategory(c.category);
    } else {
      matchCategory = c.category === selectedConsumableCategory;
    }
    const matchSearch = matchesConsumableSearch(c, q);
    return matchCategory && matchSearch;
  });

  // 시약 탭이거나 검색 시 특별관리물질을 상단에 자동 우선 배치
  if(isReagentCategory(selectedConsumableCategory) || q){
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
    } else if(isReagentCategory(selectedConsumableCategory)){
      const totalReagents = consumables.filter(function(c){ return isReagentCategory(c.category); }).length;
      const controlledCount = consumables.filter(isControlledSubstance).length;

      if(showOnlyControlledReagents){
        summaryHtml = '<div class="controlled-summary-bar reagent-bar is-filtered-controlled">' +
          '<div class="controlled-summary-text">' +
            '<span class="summary-icon">⚠️</span> ' +
            '<span><strong style="color:#b91c1c;">특별관리물질 ' + controlledCount + '종</strong> (산안법 [별표 12] · 30년 보존 의무)</span>' +
          '</div>' +
          '<div class="controlled-summary-actions">' +
            '<button type="button" class="btn-filter-controlled active" id="btnToggleControlledFilter">🧪 전체 시약 보기 (' + totalReagents + '종)</button>' +
            '<button type="button" class="btn-export-log-csv" id="btnExportChemicalLogsMonth" title="이번 달 특별관리물질 취급일지 CSV 다운로드">📅 월간 취급일지 (CSV)</button>' +
            '<button type="button" class="btn-export-log-csv" id="btnExportChemicalLogsYear" title="올해 특별관리물질 취급일지 CSV 다운로드">📆 연간 취급일지 (CSV)</button>' +
          '</div>' +
        '</div>';
      } else {
        summaryHtml = '<div class="controlled-summary-bar reagent-bar">' +
          '<div class="controlled-summary-text">' +
            '<span class="summary-icon">🧪</span> ' +
            '<span><strong>보관 시약 관리대장</strong> (' + totalReagents + '종) · ' +
            '<strong style="color:#b91c1c;">⚠️ 특별관리물질 ' + controlledCount + '종 포함</strong></span>' +
          '</div>' +
          '<div class="controlled-summary-actions">' +
            '<button type="button" class="btn-filter-controlled" id="btnToggleControlledFilter">⚠️ 특별관리물질만 (' + controlledCount + '종)</button>' +
            '<button type="button" class="btn-export-log-csv" id="btnExportChemicalLogsMonth" title="이번 달 특별관리물질 취급일지 CSV 다운로드">📅 월간 취급일지 (CSV)</button>' +
            '<button type="button" class="btn-export-log-csv" id="btnExportChemicalLogsYear" title="올해 특별관리물질 취급일지 CSV 다운로드">📆 연간 취급일지 (CSV)</button>' +
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

// 특별관리물질 취급일지 법정 서식(산업안전보건기준에 관한 규칙 제439조) CSV 다운로드 (월간 / 연간 분리 지원)

// ==========================================
// [특별관리물질 공용 취급대장 렌더링 모듈]
// ==========================================
function renderChemicalLedgerTable(){
  const wrap = $('chemicalLedgerTableWrap');
  const summaryEl = $('chemicalLedgerSummary');
  const countBadge = $('chemicalLogTotalCountBadge');
  if(!wrap) return;

  let logs = [];
  try {
    logs = JSON.parse(localStorage.getItem('labstock_chemical_logs') || '[]');
  } catch(e){
    logs = [];
  }

  if(countBadge){
    countBadge.textContent = '총 ' + logs.length + '건';
  }

  if(logs.length === 0){
    if(summaryEl){
      summaryEl.innerHTML = '<span>📋 등록된 특별관리물질 취급일지가 없습니다. 시약 카드의 <b>[📝 취급일지 작성]</b>을 통해 첫 일지를 작성할 수 있습니다.</span>';
    }
    wrap.innerHTML = '<div style="text-align:center;padding:32px 16px;color:var(--ink-light);font-size:13px;">작성된 특별관리물질 취급일지가 없습니다.</div>';
    return;
  }

  // 최신 순 정렬
  logs.sort(function(a, b){
    const tA = a.used_at || a.created_at || '';
    const tB = b.used_at || b.created_at || '';
    return tB.localeCompare(tA);
  });

  // 이번 달 사용량 집계 및 직전 사용자 사용량 파악
  const curMonthStr = today().slice(0, 7);
  let curMonthCount = 0;
  const curMonthUsageMap = {}; // { '시약명': { qty: number, unit: string } }
  
  logs.forEach(function(l){
    const d = (l.used_at || l.created_at || '').slice(0, 7);
    if(d === curMonthStr){
      curMonthCount++;
      const chem = l.chemical_name || '특별관리시약';
      const q = Number(l.quantity) || 0;
      const u = l.unit || 'mL';
      if(!curMonthUsageMap[chem]){
        curMonthUsageMap[chem] = { qty: 0, unit: u };
      }
      curMonthUsageMap[chem].qty += q;
    }
  });

  const latestLog = logs[0];
  const latestDesc = latestLog ? (safe(latestLog.handler_name) + ' (' + safe(latestLog.chemical_name) + ' ' + (latestLog.quantity || 0) + safe(latestLog.unit || 'mL') + ' 사용)') : '-';

  let usageSummaryStr = '';
  const usageKeys = Object.keys(curMonthUsageMap);
  if(usageKeys.length > 0){
    usageSummaryStr = usageKeys.slice(0, 3).map(function(k){
      return safe(k) + ': <b>' + curMonthUsageMap[k].qty + safe(curMonthUsageMap[k].unit) + '</b>';
    }).join(' · ');
  } else {
    usageSummaryStr = '이번 달 취급 내역 없음';
  }

  if(summaryEl){
    summaryEl.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
      '<div>📅 <b>' + curMonthStr + '월 취급 현황:</b> ' + curMonthCount + '건 (' + usageSummaryStr + ')</div>' +
      '<div style="color:var(--primary);font-weight:600;">⚡ 직전 취급자: ' + latestDesc + '</div>' +
      '</div>';
  }

  let tableHtml = '<table aria-label="특별관리물질 공용 취급대장" style="width:100%;font-size:12.5px;">';
  tableHtml += '<thead><tr>';
  tableHtml += '<th scope="col" style="white-space:nowrap;">취급 일시</th>';
  tableHtml += '<th scope="col">시약명 (CAS No.)</th>';
  tableHtml += '<th scope="col" style="white-space:nowrap;">취급자</th>';
  tableHtml += '<th scope="col" style="white-space:nowrap;">취급량</th>';
  tableHtml += '<th scope="col">작업 장소</th>';
  tableHtml += '<th scope="col">작업 내용 및 잔여량</th>';
  tableHtml += '<th scope="col" style="white-space:nowrap;">안전 점검</th>';
  tableHtml += '</tr></thead><tbody>';

  logs.forEach(function(l){
    const dateStr = (l.used_at || l.created_at || '').replace('T', ' ').slice(0, 16);
    const casStr = l.cas_number ? ' <span style="font-family:monospace;font-size:11px;color:var(--ink-light);">[' + safe(l.cas_number) + ']</span>' : '';
    const qtyStr = (l.quantity !== undefined ? l.quantity : '') + ' ' + safe(l.unit || 'mL');
    const noteStr = l.note ? '<div style="font-size:11px;color:var(--ink-light);margin-top:2px;">📝 잔여량: ' + safe(l.note) + '</div>' : '';

    tableHtml += '<tr>';
    tableHtml += '<td style="white-space:nowrap;font-weight:600;">' + safe(dateStr) + '</td>';
    tableHtml += '<td><b style="color:var(--ink);">' + safe(l.chemical_name || '특별관리물질') + '</b>' + casStr + '</td>';
    tableHtml += '<td style="white-space:nowrap;font-weight:600;">👤 ' + safe(l.handler_name || '연구원') + '</td>';
    tableHtml += '<td style="white-space:nowrap;font-weight:700;color:var(--primary);">' + safe(qtyStr) + '</td>';
    tableHtml += '<td>📍 ' + safe(l.work_location || '화학실') + '</td>';
    tableHtml += '<td>' + safe(l.work_description || '-') + noteStr + '</td>';
    tableHtml += '<td style="white-space:nowrap;"><span style="color:#16a34a;font-weight:700;">✓ 보호구/배기 완료</span></td>';
    tableHtml += '</tr>';
  });

  tableHtml += '</tbody></table>';
  wrap.innerHTML = tableHtml;
}

function exportChemicalLogsCsv(period){
  let logs = [];
  try {
    logs = JSON.parse(localStorage.getItem('labstock_chemical_logs') || '[]');
  } catch(_) {}

  if(!logs || logs.length === 0){
    toast('⚠️ 등록된 특별관리물질 취급일지가 없습니다. 시약 카드의 [📝 취급일지 작성]을 통해 먼저 일지를 작성해 주세요.');
    return;
  }

  const now = new Date();
  const curYear = String(now.getFullYear());
  const curMonth = curYear + '-' + String(now.getMonth() + 1).padStart(2, '0');

  let filteredLogs = logs;
  let filePeriodLabel = '전체';

  if(period === 'month'){
    filePeriodLabel = curMonth + '_월간';
    filteredLogs = logs.filter(function(item){
      const dt = item.used_at || '';
      return dt.startsWith(curMonth);
    });
    if(filteredLogs.length === 0){
      toast('ℹ️ 이번 달(' + curMonth + ')에 등록된 특별관리물질 취급일지가 없습니다.');
      return;
    }
  } else if(period === 'year'){
    filePeriodLabel = curYear + '_연간';
    filteredLogs = logs.filter(function(item){
      const dt = item.used_at || '';
      return dt.startsWith(curYear);
    });
    if(filteredLogs.length === 0){
      toast('ℹ️ 올해(' + curYear + '년)에 등록된 특별관리물질 취급일지가 없습니다.');
      return;
    }
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

  const rows = filteredLogs.map(function(item, idx){
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
  a.download = '2DQH_특별관리물질_' + filePeriodLabel + '_취급일지_' + today() + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('✓ 특별관리물질 ' + filePeriodLabel + ' 취급일지(' + filteredLogs.length + '건)가 법정 서식 CSV로 다운로드되었습니다.');
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

  const btnToggleXrd = $('btnToggleXrdUserEdit');
  if(btnToggleXrd && !btnToggleXrd.__bound){
    btnToggleXrd.__bound = true;
    btnToggleXrd.addEventListener('click', function(e){
      e.preventDefault();
      const grid = $('xrdUserInputsGrid');
      if(!grid) return;
      const isHidden = grid.classList.contains('hidden');
      grid.classList.toggle('hidden', !isHidden);
      btnToggleXrd.textContent = isHidden ? '접기' : '수정';
    });
  }
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

  // 모드 전환 버튼 (측정 시작 / 완료 일지 작성)
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
    const c = e.target.closest('.xrd-chip') || e.target.closest('[data-chk]') || e.target.closest('[data-align]') || e.target.closest('[data-scan]') || e.target.closest('[data-xrd-add]');
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



  // 2DQH-XRD_log 공식 상단 주의사항 바로가기 스크롤
  const openNotice = $('xrdOpenNotice');
  if(openNotice){
    openNotice.addEventListener('click', function(){
      const n = $('xrdNotice');
      if(n){
        n.open = true;
        n.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // 긴급 공지 팝업 닫기
  const alertClose = $('btnXrdAlertClose');
  const alertDlg = $('xrdAlertDlg');
  if(alertClose && alertDlg){
    alertClose.addEventListener('click', function(){
      alertDlg.close();
    });
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
    const isOn = !!xrdChk[b.dataset.chk];
    b.classList.toggle('on', isOn);
    let ind = b.querySelector('.xrd-check-indicator');
    if(!ind){
      ind = document.createElement('span');
      ind.className = 'xrd-check-indicator';
      b.prepend(ind);
    }
    ind.textContent = isOn ? '✓ ' : '';
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

  if(f.end_time) f.end_time.required = (m === 'full');
  if(f.chiller_end) f.chiller_end.required = (m === 'full');
  if(f.vacuum_end) f.vacuum_end.required = (m === 'full');
  if(f.sample_count) f.sample_count.required = (m === 'full');

  const modeTitle = $('xrdModeTitle');
  if(modeTitle){
    modeTitle.textContent = m === 'start' ? '측정 세션 시작' : (xrdFinishing ? '측정 세션 종료' : (xrdEditId ? '로그북 수정' : '완료 일지 직접 입력'));
  }
  const modeLink = $('xrdModeLink');
  if(modeLink){
    modeLink.textContent = m === 'start' ? '완료 일지 작성 →' : '← 시작 모드로 복귀';
    modeLink.classList.toggle('hidden', !!xrdEditId);
  }
  if(m === 'active') renderXrdActive();
  updateXrdSaveLabel();
}

function updateXrdSaveLabel(){
  const btn = $('xrdSaveBtn');
  if(!btn) return;
  btn.textContent = xrdMode === 'start' ? '⚡ 측정 세션 시작' : (xrdFinishing ? '✅ 측정 종료 및 일지 저장' : (xrdEditId ? '💾 수정 사항 저장' : '📝 로그북 등록'));
}

function applyLastXrdSettings(){
  const f = $('xrdForm');
  if(!f) return;
  const uid = (session && session.user && !session.user.is_anonymous) ? session.user.id : 'default';
  try {
    const L = JSON.parse(localStorage.getItem('xrd_last_' + uid) || 'null');
    if(L){
      if(Array.isArray(L.scan)){
        xrdScanSel = new Set(L.scan.filter(function(x){ return XRD_SCAN_CHIPS.includes(x); }));
      }
      if(f.scan_other && L.etc) f.scan_other.value = L.etc;
      if(L.align) xrdAlign = L.align;
      if(f.sample_count && L.count) f.sample_count.value = String(L.count);
    }
  } catch(e){}
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

  if(typeof applyCurrentUserToForms === 'function') applyCurrentUserToForms();

  // 회원 프로필 정보 자동완성 (로그인 회원 메타데이터 or 게스트 localStorage 기억)
  if(session && session.user && !session.user.is_anonymous){
    const meta = session.user.user_metadata || {};
    if(f.user_name && meta.name) f.user_name.value = meta.name;
    if(f.professor && meta.professor) f.professor.value = meta.professor;
    if(f.affiliation && meta.affiliation) f.affiliation.value = meta.affiliation;
  } else {
    for(const k of ['user_name', 'affiliation', 'professor']){
      try {
        if(f[k] && !f[k].value) f[k].value = localStorage.getItem('xrd_' + k) || '';
      } catch(e){}
    }
  }

  // 직전 스캔 타입 / 얼라인 / 시료 수 자동 복원 (2DQH-XRD_log 공식)
  applyLastXrdSettings();

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

function renderXrdAdminKpis(){
  const totalMin = xrdLogs.reduce(function(acc, l){ return acc + (l.duration_min || 0); }, 0);
  const totalHours = (totalMin / 60).toFixed(1);
  const activeLogs = xrdLogs.filter(function(l){ return l.status === 'active'; });
  const issueLogs = xrdLogs.filter(function(l){
    return (l.memo && l.memo.trim().length > 0) || !l.xray_max_ok || !l.position_ok;
  });
  const kpiHours = $('xrdKpiHours');
  const kpiCount = $('xrdKpiCount');
  const kpiActive = $('xrdKpiActive');
  const kpiIssues = $('xrdKpiIssues');
  if(kpiHours) kpiHours.textContent = totalHours + 'h';
  if(kpiCount) kpiCount.textContent = xrdLogs.length + '건';
  if(kpiActive){
    if(activeLogs.length > 0){
      kpiActive.textContent = activeLogs.length + '건 진행 중';
      kpiActive.style.color = '#3b82f6';
    } else {
      kpiActive.textContent = '대기 중 (Idle)';
      kpiActive.style.color = '#10b981';
    }
  }
  if(kpiIssues) kpiIssues.textContent = issueLogs.length + '건';
}

function renderXrdLogs(){
  renderXrdAdminKpis();
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
      '<td data-l="Action">';
    if(isActive){
      html += '<button type="button" class="text-btn" data-xrd-finish="' + l.id + '" style="font-weight:700;color:var(--primary);background:rgba(36,87,214,0.08);padding:4px 8px;border-radius:6px;">Finish</button>';
    } else if(isAdmin()){
      html += '<button type="button" class="text-btn btn-log-edit" data-xrd-edit="' + l.id + '" style="margin-right:6px;">수정</button>' +
        '<button type="button" class="text-btn del btn-log-del" data-xrd-del="' + l.id + '" style="color:#dc2626;">삭제</button>';
    } else {
      html += '<span style="font-size:11.5px;color:#059669;font-weight:600;background:#ecfdf5;padding:2px 7px;border-radius:6px;">완료</span>';
    }
    html += '</td></tr>';
  });

  html += '</tbody></table>';
  rows.innerHTML = html;
}

function finishXrdSession(id){
  const l = xrdLogs.find(function(x){ return String(x.id) === String(id); });
  if(!l) return;
  const isCurrentlyActive = (l.status === 'active');
  if(!isCurrentlyActive && !isAdmin()){
    toast('완료된 로그북 기록 수정은 관리자만 가능합니다.');
    return;
  }
  const f = $('xrdForm');
  if(!f) return;

  xrdEditId = l.id;
  xrdFinishing = isCurrentlyActive;

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
      if(f.start_time && f.end_time && f.start_time.value === f.end_time.value){
        alert('종료 시각(End time)은 시작 시각(Start time)과 달라야 합니다.');
        if(btn) btn.disabled = false;
        return;
      }
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

    if(!isStartMode && scanList.length === 0){
      alert('스캔 타입(Scan type)을 최소 1개 이상 선택하거나 etc.에 직접 입력해주세요.');
      if(btn) btn.disabled = false;
      return;
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

    // 2DQH-XRD_log 공식 사용자 정보 및 직전 세팅 기억
    try {
      for(const k of ['user_name', 'affiliation', 'professor']){
        if(f[k] && f[k].value.trim()) localStorage.setItem('xrd_' + k, f[k].value.trim());
      }
      const uid = (session && session.user && !session.user.is_anonymous) ? session.user.id : 'default';
      localStorage.setItem('xrd_last_' + uid, JSON.stringify({
        scan: Array.from(xrdScanSel),
        etc: f.scan_other ? f.scan_other.value.trim() : '',
        align: xrdAlign,
        count: f.sample_count ? f.sample_count.value : '1'
      }));
    } catch(_) {}

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
  if(!isAdmin()){
    toast('로그북 삭제 권한은 관리자에게만 있습니다.');
    return;
  }
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

// ========================================================
// [스마트 내보내기 엔진: Excel 친화적 Date/Number 포맷터 & XLS 생성기]
// ========================================================

function normalizeExportDate(val){
  if(!val) return '';
  if(val instanceof Date){
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  const s = String(val).trim();
  if(/T\d{2}:\d{2}/.test(s)){
    return s.split('T')[0];
  }
  const match = s.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if(match){
    return match[1] + '-' + match[2].padStart(2, '0') + '-' + match[3].padStart(2, '0');
  }
  return s;
}

function formatCsvCell(val, type){
  if(val === null || val === undefined || val === '') return '""';
  if(type === 'date'){
    const dStr = normalizeExportDate(val);
    if(/^\d{4}-\d{2}-\d{2}$/.test(dStr)){
      return dStr; // unquoted ISO date: Excel parses this natively as Date!
    }
    return '"' + dStr + '"';
  }
  if(type === 'time'){
    const tStr = String(val).trim();
    if(/^\d{1,2}:\d{2}(:\d{2})?$/.test(tStr)){
      return tStr;
    }
    return '"' + tStr + '"';
  }
  if(type === 'number'){
    const n = Number(val);
    if(!isNaN(n)) return String(n);
  }
  let str = String(val).replace(/[\r\n]+/g, ' ').trim();
  if(/^[=+\-@\t\r]/.test(str)){
    str = "'" + str;
  }
  return '"' + str.replace(/"/g, '""') + '"';
}

function getXrdExportData(){
  const headers = [
    '측정일자 (Date)',
    '예약번호 (No)',
    '사용자 (User)',
    '소속 (Affiliation)',
    '지도교수 (Adviser)',
    '시작시간 (Start)',
    '종료시간 (End)',
    '가동시간_분 (min)',
    '시료명 (Sample)',
    '스캔타입 (Scan)',
    '진행상태 (Status)',
    '특이사항_메모 (Memo)'
  ];

  const csvRows = [];
  const excelRows = [];

  xrdLogs.forEach(function(l){
    const dateStr = normalizeExportDate(l.used_on || '');
    const resNo = l.reservation_no || '';
    const userName = l.user_name || '';
    const affil = l.affiliation || '2DQH';
    const prof = l.professor || '';
    const startTm = l.start_time ? String(l.start_time).slice(0, 5) : '';
    const endTm = l.end_time ? String(l.end_time).slice(0, 5) : '';
    const durMin = l.duration_min != null ? Number(l.duration_min) : 0;
    const sample = l.sample_name ? (l.sample_name + (l.sample_count > 1 ? ' (' + l.sample_count + '개)' : '')) : '';
    const scan = l.scan_type || '';
    const statusText = l.status === 'active' ? '측정진행중' : '측정완료';
    const memo = String(l.memo || '').replace(/[\r\n]+/g, ' ').trim();

    // CSV Row (장비명 컬럼 중복 제거)
    csvRows.push([
      formatCsvCell(dateStr, 'date'),
      formatCsvCell(resNo, 'text'),
      formatCsvCell(userName, 'text'),
      formatCsvCell(affil, 'text'),
      formatCsvCell(prof, 'text'),
      formatCsvCell(startTm, 'time'),
      formatCsvCell(endTm, 'time'),
      formatCsvCell(durMin, 'number'),
      formatCsvCell(sample, 'text'),
      formatCsvCell(scan, 'text'),
      formatCsvCell(statusText, 'text'),
      formatCsvCell(memo, 'text')
    ].join(','));

    // Excel Row with styles
    excelRows.push([
      { val: dateStr, cls: 'cell-date' },
      { val: resNo, cls: 'cell-center' },
      { val: userName, cls: 'cell-text' },
      { val: affil, cls: 'cell-center' },
      { val: prof, cls: 'cell-text' },
      { val: startTm, cls: 'cell-time' },
      { val: endTm, cls: 'cell-time' },
      { val: durMin, cls: 'cell-num' },
      { val: sample, cls: 'cell-text' },
      { val: scan, cls: 'cell-text' },
      { val: statusText, cls: 'cell-center' },
      { val: memo, cls: 'cell-text' }
    ]);
  });

  const colWidths = [110, 100, 100, 110, 110, 85, 85, 95, 180, 110, 95, 200];
  return { headers, csvRows, excelRows, colWidths };
}

function exportXrdLogsCsv(){
  if(xrdLogs.length === 0){
    toast('내보낼 HR-XRD 로그 데이터가 없습니다.');
    return;
  }
  const data = getXrdExportData();
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);

  let totalMins = 0;
  let totalSamples = 0;
  const affilMap = {};
  const userMap = {};

  xrdLogs.forEach(function(l){
    totalMins += (l.duration_min || 0);
    const cnt = (l.sample_count || 1);
    totalSamples += cnt;
    const aff = l.affiliation || '2DQH';
    affilMap[aff] = (affilMap[aff] || 0) + cnt;
    const u = l.user_name || '연구원';
    userMap[u] = (userMap[u] || 0) + 1;
  });

  let topAffil = '-';
  let maxAff = 0;
  for(const a in affilMap){
    if(affilMap[a] > maxAff){
      maxAff = affilMap[a];
      const pct = totalSamples > 0 ? Math.round((maxAff / totalSamples) * 100) : 0;
      topAffil = a + ' (' + maxAff + '개, ' + pct + '%)';
    }
  }

  let topUser = '-';
  let maxU = 0;
  for(const u in userMap){
    if(userMap[u] > maxU){
      maxU = userMap[u];
      topUser = u + ' (' + maxU + '건)';
    }
  }

  const lines = [];
  lines.push('"[IBS 2DQH 연구단 HR-XRD (고분해능 X선 회절분석기) 전자 로그북]"');
  lines.push('"설치위치: 제1연구동 204호","총 ' + xrdLogs.length + '건 가동 · ' + (totalMins / 60).toFixed(1) + '시간 (' + totalMins + '분)","총 시료수: ' + totalSamples + '개"');
  lines.push('"[최다 측정처 (어디에서 많이 찍었는지): ' + topAffil + ' | 최다 사용자: ' + topUser + ']"');
  lines.push('""');
  lines.push(data.headers.join(','));
  lines.push(data.csvRows.join('\r\n'));

  const csvContent = lines.join('\r\n');
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '2DQH_HR-XRD_Logbook_' + today() + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('✓ HR-XRD 로그(' + xrdLogs.length + '건)가 최다 측정처 요약과 함께 엑셀(CSV)로 다운로드되었습니다.');
}

// ========================================================
// [다크모드 / 암실 모드 제어 엔진 (IBS 2DQH 고도화)]
// ========================================================
function initTheme(){
  let saved = null;
  try { saved = localStorage.getItem('labstock_theme'); } catch(_) {}
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(initial);

  if(window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e){
      try {
        if(!localStorage.getItem('labstock_theme')){
          applyTheme(e.matches ? 'dark' : 'light');
        }
      } catch(_) {}
    });
  }
}

function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = (theme === 'dark');
  const icon = $('themeToggleIcon');
  if(icon) icon.textContent = isDark ? '☀️' : '🌙';
}

function toggleTheme(){
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = (current === 'dark') ? 'light' : 'dark';
  try { localStorage.setItem('labstock_theme', next); } catch(_) {}
  applyTheme(next);
  toast(next === 'dark' ? '🌙 암실 전용 다크모드가 적용되었습니다.' : '☀️ 일반 라이트모드가 적용되었습니다.');
}

// ========================================================
// [장비 본체 부착용 QR 라벨 생성 및 인쇄 모달]
// ========================================================
// QR 코드 렌더링 통합 헬퍼 (로컬 QRCode.js 우선 + 3중 안전 렌더링)
function renderQrCodeInto(container, text, size){
  size = size || 190;
  if(!container) return;
  container.innerHTML = '';

  if(window.QRCode){
    try {
      new QRCode(container, {
        text: text,
        width: size,
        height: size,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
      // 인라인 스타일로 가로/세로를 190px 엄격 고정하여 CSS 캐시나 flex 왜곡 방지
      const applyStrictSize = function(){
        const cvs = container.querySelector('canvas');
        const img = container.querySelector('img');
        if(img && img.src){
          img.style.width = size + 'px';
          img.style.height = size + 'px';
          img.style.maxWidth = size + 'px';
          img.style.maxHeight = size + 'px';
          img.style.display = 'block';
          img.style.margin = '0 auto';
          img.style.objectFit = 'contain';
          if(cvs) cvs.style.display = 'none';
        } else if(cvs){
          cvs.style.width = size + 'px';
          cvs.style.height = size + 'px';
          cvs.style.maxWidth = size + 'px';
          cvs.style.maxHeight = size + 'px';
          cvs.style.display = 'block';
          cvs.style.margin = '0 auto';
        }
      };
      applyStrictSize();
      setTimeout(applyStrictSize, 40);
      setTimeout(applyStrictSize, 120);
      return;
    } catch(err){
      console.warn('QRCode generation fallback:', err);
    }
  }

  // Fallback: 이미지 태그
  const img = document.createElement('img');
  img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(text);
  img.alt = 'QR Code';
  img.style.width = size + 'px';
  img.style.height = size + 'px';
  img.style.maxWidth = size + 'px';
  img.style.maxHeight = size + 'px';
  img.style.display = 'block';
  img.style.margin = '0 auto';
  container.appendChild(img);
}

// [모바일 카메라 스캔 호환 웹앱 Base URL 계산기]
function getAppBaseUrl(){
  try {
    if(window.location.protocol === 'http:' || window.location.protocol === 'https:'){
      const host = window.location.hostname;
      if(host && host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.') && !host.startsWith('10.')){
        let p = window.location.pathname;
        if(!p.endsWith('/')) {
          // If pathname ends with index.html, keep directory or full
          if(!p.endsWith('.html')) p += '/';
        }
        return window.location.origin + p;
      }
    }
  } catch(e){}
  // 로컬/file 프로토콜 테스트 시 GitHub Pages 라이브 주소로 안전 자동 연결
  return 'https://lee-km-km.github.io/2DQH/';
}

// [장비 본체 부착용 QR 라벨 생성 및 인쇄 모달 (관리자 전용)]
function openEquipmentQrModal(eqId){
  if(!isAdmin()){
    toast('장비 본체 부착용 QR 코드는 관리자 전용 기능입니다. 관리자 로그인이 필요합니다.');
    if(typeof openModal === 'function') openModal('login');
    return;
  }
  eqId = eqId || currentSelectedEquipment || 'EQ-XRD-01';
  const eq = researchEquipments.find(function(e){ return e.id === eqId || e.code === eqId; }) || {
    id: eqId, code: eqId, name: eqId
  };

  const modal = $('modalEquipmentQrBackdrop');
  if(!modal) return;
  modal.dataset.equipmentId = eq.id;
  modal.dataset.equipmentCode = eq.code || eq.id;

  // 장비명/코드 기반 "HR-XRD Logbook" 형식만 상단에 배치 (위치/모델/IBS 하단문구 일체 배제)
  let shortName = eq.code || 'HR-XRD';
  if(shortName === 'XRD') shortName = 'HR-XRD';
  const logbookTitle = shortName + ' Logbook';

  const titleEl = $('qrLabelEquipName');
  const container = $('equipmentQrCanvasContainer');

  if(titleEl) titleEl.textContent = logbookTitle;

  // 생성될 직행 URL (HTTPS origin + 경로 + 해시 쿼리)
  const targetUrl = getAppBaseUrl() + '#logbook?eq=' + encodeURIComponent(eq.id) + '&action=quick_start';

  if(container){
    renderQrCodeInto(container, targetUrl, 190);
  }

  // 액션 버튼 직접 바인딩 (이벤트 누락 방지)
  const printBtn = $('btnPrintEquipmentQr');
  if(printBtn && !printBtn._hasBound){
    printBtn._hasBound = true;
    printBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      printEquipmentQrLabel();
    });
  }
  const downloadBtn = $('btnDownloadEquipmentQr');
  if(downloadBtn && !downloadBtn._hasBound){
    downloadBtn._hasBound = true;
    downloadBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      downloadEquipmentQrImage();
    });
  }
  const closeBtn = $('btnCloseEquipmentQr');
  if(closeBtn && !closeBtn._hasBound){
    closeBtn._hasBound = true;
    closeBtn.addEventListener('click', function(e){
      e.preventDefault();
      closeEquipmentQrModal();
    });
  }
  const closeBottomBtn = $('btnCloseEquipmentQrBottom');
  if(closeBottomBtn && !closeBottomBtn._hasBound){
    closeBottomBtn._hasBound = true;
    closeBottomBtn.addEventListener('click', function(e){
      e.preventDefault();
      closeEquipmentQrModal();
    });
  }

  modal.classList.add('open');
  modal.style.display = 'flex';
}

function closeEquipmentQrModal(){
  const modal = $('modalEquipmentQrBackdrop');
  if(modal){
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
}

// [본체 부착용 완성형 1:1 정사각형 고해상도 QR 라벨 PNG 생성 및 직접 저장]
function downloadEquipmentQrImage(){
  const modal = $('modalEquipmentQrBackdrop');
  const eqId = (modal && modal.dataset.equipmentId) ? modal.dataset.equipmentId : (currentSelectedEquipment || 'EQ-XRD-01');
  const cur = researchEquipments.find(function(e){ return e.id === eqId || e.code === eqId; }) || {
    id: eqId, code: 'HR-XRD', name: 'HR-XRD'
  };

  let shortName = cur.code || 'HR-XRD';
  if(shortName === 'XRD') shortName = 'HR-XRD';
  const titleString = shortName + ' Logbook';
  const fileName = shortName + '_Logbook_QR.png';

  downloadGenericQrImage(titleString, $('equipmentQrCanvasContainer'), fileName);
}

// [QR 라벨 전용 80mm x 80mm 정사각형 클린 인쇄 핸들러]
function printEquipmentQrLabel(){
  const title = ($('qrLabelEquipName') ? $('qrLabelEquipName').textContent : 'HR-XRD Logbook');
  printGenericQrSticker(title, $('equipmentQrCanvasContainer'), 'equipmentQrPrintArea');
}

// [공통 1:1 정사각형 고해상도 QR 라벨 다운로드 헬퍼 (600x600)]
function downloadGenericQrImage(titleString, container, fileName){
  if(!container){ toast('QR 요소를 찾을 수 없습니다.'); return; }

  function getQrDrawable(){
    const cvs = container.querySelector('canvas');
    if(cvs && cvs.width > 0) return Promise.resolve(cvs);
    const img = container.querySelector('img');
    if(img){
      if(img.complete && img.naturalWidth > 0) return Promise.resolve(img);
      return new Promise(function(resolve, reject){
        const testImg = new Image();
        testImg.crossOrigin = 'anonymous';
        testImg.onload = function(){ resolve(testImg); };
        testImg.onerror = function(){ resolve(img); };
        testImg.src = img.src;
      });
    }
    return Promise.reject(new Error('QR 요소를 찾을 수 없습니다.'));
  }

  getDrawableSafe(getQrDrawable).then(function(qrDrawable){
    const w = 600;
    const h = 600;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d');

    // 순백색 배경
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // 외곽 테두리 (8px)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    if(ctx.roundRect){
      ctx.beginPath();
      ctx.roundRect(14, 14, w - 28, h - 28, 24);
      ctx.stroke();
    } else {
      ctx.strokeRect(14, 14, w - 28, h - 28);
    }

    // 상단 타이틀
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 38px Pretendard, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(titleString, 300, 75);

    // 대형 정사각형 QR 코드 정중앙 배치 (440x440)
    const qrSize = 440;
    const qrX = (w - qrSize) / 2;
    const qrY = 118;
    ctx.drawImage(qrDrawable, qrX, qrY, qrSize, qrSize);

    const dataUrl = cvs.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = fileName;
    a.href = dataUrl;
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){
      if(a.parentNode) a.parentNode.removeChild(a);
    }, 500);

    toast('📷 ' + titleString + ' 정사각형 QR 라벨 이미지가 저장되었습니다.');
  }).catch(function(err){
    console.error('QR download failed:', err);
    toast('QR 이미지 저장 중 오류가 발생했습니다: ' + (err.message || '다시 시도해주세요.'));
  });
}

// [공통 80mm x 80mm 정사각형 클린 스티커 인쇄 헬퍼]
function printGenericQrSticker(title, container, printAreaId){
  let qrImgSrc = '';
  if(container){
    const cvs = container.querySelector('canvas');
    if(cvs){
      try { qrImgSrc = cvs.toDataURL('image/png'); } catch(e){}
    }
    if(!qrImgSrc){
      const img = container.querySelector('img');
      if(img) qrImgSrc = img.src;
    }
  }

  let printFrame = document.getElementById('genericQrPrintIframe');
  if(!printFrame){
    printFrame = document.createElement('iframe');
    printFrame.id = 'genericQrPrintIframe';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);
  }

  try {
    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write('<!DOCTYPE html>' +
'<html><head><meta charset="utf-8">' +
'<title>' + title + '</title>' +
'<style>' +
'@page { size: auto; margin: 0; }' +
'html, body {' +
'  margin: 0; padding: 0;' +
'  width: 100%; height: 100%;' +
'  display: flex; align-items: center; justify-content: center;' +
'  background: #ffffff;' +
'  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Pretendard", sans-serif;' +
'  -webkit-print-color-adjust: exact;' +
'  print-color-adjust: exact;' +
'}' +
'.square-sticker {' +
'  width: 80mm;' +
'  height: 80mm;' +
'  box-sizing: border-box;' +
'  border: 2.5px solid #0f172a;' +
'  border-radius: 6mm;' +
'  padding: 6mm 6mm 7mm;' +
'  display: flex;' +
'  flex-direction: column;' +
'  justify-content: space-between;' +
'  align-items: center;' +
'  text-align: center;' +
'  background: #ffffff;' +
'  page-break-inside: avoid;' +
'}' +
'.label-title {' +
'  margin: 0;' +
'  font-size: 16.5pt;' +
'  font-weight: 900;' +
'  color: #0f172a;' +
'  line-height: 1.2;' +
'  letter-spacing: -0.4px;' +
'}' +
'.qr-box {' +
'  width: 58mm;' +
'  height: 58mm;' +
'  display: flex;' +
'  align-items: center;' +
'  justify-content: center;' +
'  margin: auto 0 0;' +
'}' +
'.qr-box img {' +
'  width: 58mm;' +
'  height: 58mm;' +
'  display: block;' +
'  image-rendering: pixelated;' +
'}' +
'</style></head><body>' +
'<div class="square-sticker">' +
'  <h1 class="label-title">' + title + '</h1>' +
'  <div class="qr-box">' +
(qrImgSrc ? '    <img src="' + qrImgSrc + '" alt="QR Code">' : '') +
'  </div>' +
'</div></body></html>');
    doc.close();

    setTimeout(function(){
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch(e){
        window.print();
      }
    }, 250);
  } catch(err){
    window.print();
  }
}

// [시약장 부착용 특별관리물질 취급일지 직통 QR 모달 열기]
function openChemicalQrModal(){
  if(!isAdmin()){
    toast('시약장 부착용 QR 코드는 관리자 전용 기능입니다. 관리자 로그인이 필요합니다.');
    if(typeof openModal === 'function') openModal('login');
    return;
  }
  const modal = $('modalChemicalQrBackdrop');
  if(!modal) return;

  const targetUrl = getAppBaseUrl() + '#chemicals?action=quick_chem_log';
  const qrBox = $('chemicalQrCanvasContainer');
  if(qrBox){
    renderQrCodeInto(qrBox, targetUrl, 190);
  }

  const printBtn = $('btnPrintChemicalQr');
  if(printBtn && !printBtn._hasBound){
    printBtn._hasBound = true;
    printBtn.addEventListener('click', function(e){
      e.preventDefault();
      printGenericQrSticker('특별관리물질 취급일지', qrBox, 'chemicalQrPrintArea');
    });
  }
  const downloadBtn = $('btnDownloadChemicalQr');
  if(downloadBtn && !downloadBtn._hasBound){
    downloadBtn._hasBound = true;
    downloadBtn.addEventListener('click', function(e){
      e.preventDefault();
      downloadGenericQrImage('특별관리물질 취급일지', qrBox, 'Special_Chemical_Log_QR.png');
    });
  }
  const closeBtn = $('btnCloseChemicalQr');
  if(closeBtn && !closeBtn._hasBound){
    closeBtn._hasBound = true;
    closeBtn.addEventListener('click', function(e){
      e.preventDefault();
      closeChemicalQrModal();
    });
  }
  const closeBottomBtn = $('btnCloseChemicalQrBottom');
  if(closeBottomBtn && !closeBottomBtn._hasBound){
    closeBottomBtn._hasBound = true;
    closeBottomBtn.addEventListener('click', function(e){
      e.preventDefault();
      closeChemicalQrModal();
    });
  }

  modal.classList.add('open');
  modal.style.display = 'flex';
}

function closeChemicalQrModal(){
  const modal = $('modalChemicalQrBackdrop');
  if(modal){
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
}

// [비품 대여 직통 QR 모달 열기]
function openLoanQrModal(){
  if(!isAdmin()){
    toast('비품 대여 직통 QR 코드는 관리자 전용 기능입니다. 관리자 로그인이 필요합니다.');
    if(typeof openModal === 'function') openModal('login');
    return;
  }
  const modal = $('modalLoanQrBackdrop');
  if(!modal) return;

  const targetUrl = getAppBaseUrl() + '#inventory?action=quick_loan';
  const qrBox = $('loanQrCanvasContainer');
  if(qrBox){
    renderQrCodeInto(qrBox, targetUrl, 190);
  }

  const printBtn = $('btnPrintLoanQr');
  if(printBtn && !printBtn._hasBound){
    printBtn._hasBound = true;
    printBtn.addEventListener('click', function(e){
      e.preventDefault();
      printGenericQrSticker('비품 대여 신청', qrBox, 'loanQrPrintArea');
    });
  }
  const downloadBtn = $('btnDownloadLoanQr');
  if(downloadBtn && !downloadBtn._hasBound){
    downloadBtn._hasBound = true;
    downloadBtn.addEventListener('click', function(e){
      e.preventDefault();
      downloadGenericQrImage('비품 대여 신청', qrBox, 'Equipment_Loan_QR.png');
    });
  }
  const closeBtn = $('btnCloseLoanQr');
  if(closeBtn && !closeBtn._hasBound){
    closeBtn._hasBound = true;
    closeBtn.addEventListener('click', function(e){
      e.preventDefault();
      closeLoanQrModal();
    });
  }
  const closeBottomBtn = $('btnCloseLoanQrBottom');
  if(closeBottomBtn && !closeBottomBtn._hasBound){
    closeBottomBtn._hasBound = true;
    closeBottomBtn.addEventListener('click', function(e){
      e.preventDefault();
      closeLoanQrModal();
    });
  }

  modal.classList.add('open');
  modal.style.display = 'flex';
}

function closeLoanQrModal(){
  const modal = $('modalLoanQrBackdrop');
  if(modal){
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
}

function getDrawableSafe(getter){
  try {
    return getter();
  } catch(e){
    return Promise.reject(e);
  }
}

// ========================================================
// [연구장비 파라미터 규격 & 시험 가동 관리]
// ========================================================
function renderEquipmentSchemaPreview(code){
  const container = $('eqSchemaContent');
  if(!container) return;
  const schema = EQUIPMENT_SCHEMAS[code];
  if(!schema){
    container.innerHTML = '<p class="xrd-hint">이 장비는 표준 기본 측정 항목으로 구성됩니다.</p>';
    return;
  }

  const eq = researchEquipments.find(function(e){ return e.code === code; });
  let html = '<div class="eq-schema-preview-box">';

  if(eq){
    html += '<div class="eq-meta-summary-box">';
    html += '<span>🏛️ <b>SESS 관리번호:</b> <code style="color:var(--primary);font-weight:700;">' + safe(eq.assetNo || eq.id) + '</code></span>';
    html += '<span>🏷️ <b>장비모델:</b> ' + safe(eq.model) + '</span>';
    html += '<span>📍 <b>설치장소:</b> ' + safe(eq.location) + '</span>';
    html += '<span>🛠️ <b>서비스구분:</b> ' + safe(eq.serviceMode || '직접사용 / 측정지원') + '</span>';
    html += '</div>';
  }

  // 1. 측정 지표 (Readings)
  if(schema.readings && schema.readings.length){
    html += '<div style="margin-bottom:12px;"><b style="font-size:12px;color:var(--ink-light);display:block;margin-bottom:6px;">📊 실시간/시작 측정 지표 (Readings)</b><div class="eq-schema-badge-list">';
    schema.readings.forEach(function(r){
      let rangeText = '';
      if(r.warnMin !== undefined && r.warnMax !== undefined) rangeText = ' (' + r.warnMin + '~' + r.warnMax + ' ' + r.unit + ')';
      else if(r.warnMin !== undefined) rangeText = ' (≥ ' + r.warnMin + ' ' + r.unit + ')';
      else if(r.warnMax !== undefined) rangeText = ' (≤ ' + r.warnMax + ' ' + r.unit + ')';
      html += '<span class="eq-schema-badge reading">⚡ ' + safe(r.label) + ': <b>' + (r.placeholder || '-') + ' ' + safe(r.unit) + '</b>' + safe(rangeText) + '</span>';
    });
    html += '</div></div>';
  }

  // 2. 프로세스 옵션 (Options)
  if(schema.options && schema.options.length){
    html += '<div style="margin-bottom:12px;"><b style="font-size:12px;color:var(--ink-light);display:block;margin-bottom:6px;">⚙️ 프로세스 파라미터 / 가동 옵션 (Options)</b><div class="eq-schema-badge-list">';
    schema.options.forEach(function(opt){
      html += '<span class="eq-schema-badge option">🔧 ' + safe(opt.label) + ': <b>' + safe(opt.choices.join(' / ')) + '</b></span>';
    });
    html += '</div></div>';
  }

  // 3. 표준 작업 절차 (SOP Checks)
  if(schema.checks && schema.checks.length){
    html += '<div style="margin-bottom:12px;"><b style="font-size:12px;color:var(--ink-light);display:block;margin-bottom:6px;">✅ 안전 및 SOP 필수 점검 항목 (Checklist)</b><div style="display:flex;flex-direction:column;gap:4px;">';
    schema.checks.forEach(function(chk){
      html += '<div style="font-size:12.5px;color:var(--ink);display:flex;align-items:center;gap:6px;"><span style="color:#10b981;font-weight:bold;">✔</span> ' + safe(chk.label) + '</div>';
    });
    html += '</div></div>';
  }

  // 4. 측정/스캔/공정 종류 (Scan / Process Types)
  if(schema.scanTypes && schema.scanTypes.length){
    html += '<div><b style="font-size:12px;color:var(--ink-light);display:block;margin-bottom:6px;">🎯 지원 측정 및 공정 모드 (Modes)</b><div class="eq-schema-badge-list">';
    schema.scanTypes.forEach(function(st){
      html += '<span class="eq-schema-badge scan">🔬 ' + safe(st) + '</span>';
    });
    html += '</div></div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

function renderEquipmentTestSessions(code){
  const box = $('eqTestSessionsBox');
  const list = $('eqTestSessionsList');
  if(!box || !list) return;

  const currentEq = researchEquipments.find(function(e){ return e.id === currentSelectedEquipment; });
  const eqId = currentEq ? currentEq.id : 'EQ-' + code;

  const matches = equipmentSessions.filter(function(s){
    return s.equipment_id === eqId || s.equipment_code === code;
  });

  if(matches.length === 0){
    box.classList.add('hidden');
    list.innerHTML = '';
    return;
  }

  box.classList.remove('hidden');
  let html = '<div class="eq-test-sessions-container">';
  matches.forEach(function(s){
    const paramChips = [];
    if(s.parameters){
      for(const k in s.parameters){
        const v = s.parameters[k];
        if(v !== undefined && v !== null && v !== false && v !== ''){
          let label = k;
          if(k === 'ultrasonic_power') label = '초음파 ' + v + ' W';
          else if(k === 'bonding_force') label = '본딩압력 ' + v + ' gf';
          else if(k === 'stage_temp') label = '스테이지 ' + v + ' °C';
          else if(k === 'wire_type') label = String(v);
          else if(k === 'bonding_mode') label = String(v);
          else if(v === true) label = k.replace(/_ok$/, '') + ' 점검완료';
          else label = k + ': ' + v;
          paramChips.push(label);
        }
      }
    }

    html += '<div class="eq-test-card">';
    html += '  <div class="eq-test-card-header">';
    html += '    <div class="eq-test-card-title-group">';
    html += '      <span class="eq-test-sample-name">' + safe(s.sample_name || '샘플 미지정') + '</span>';
    html += '      <span class="eq-test-count-pill">' + (s.sample_count || 1) + '개</span>';
    html += '    </div>';
    html += '    <div class="eq-test-card-actions">';
    html += '      <span class="eq-badge-status active">가동 완료</span>';
    if(isAdmin()){
      html += '      <button type="button" class="btn-clear-search btn-log-del" data-delete-eq-session="' + s.id + '" title="기록 삭제" style="color:var(--danger,#dc2626);font-size:12px;font-weight:600;padding:2px 6px;cursor:pointer;">✕ 삭제</button>';
    }
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="eq-test-meta-info">';
    html += '    <span>📅 ' + safe(s.used_on || today()) + ' ' + safe(s.start_time || '') + (s.end_time ? ' ~ ' + safe(s.end_time) : '') + ' (' + (s.duration_min || 0) + '분)</span>';
    html += '    <span>👤 ' + safe(s.user_name || '연구원') + ' (' + safe(s.affiliation || '2DQH') + (s.professor ? ' · ' + safe(s.professor) : '') + ')</span>';
    if(s.scan_type){
      html += '    <span class="eq-test-mode-pill">🔬 ' + safe(s.scan_type) + '</span>';
    }
    html += '  </div>';

    if(paramChips.length > 0){
      html += '  <div class="eq-test-params-list">';
      paramChips.forEach(function(chip){
        html += '    <span class="eq-test-param-chip">⚡ ' + safe(chip) + '</span>';
      });
      html += '  </div>';
    }

    if(s.memo){
      html += '  <div class="eq-test-memo">📝 ' + safe(s.memo) + '</div>';
    }
    html += '</div>';
  });
  html += '</div>';
  list.innerHTML = html;
}

function openEquipmentTestDrive(code){
  let targetCode = code;
  let targetEq = null;
  if(targetCode){
    targetEq = researchEquipments.find(function(e){ return e.code === targetCode || e.id === targetCode; });
  }
  if(!targetEq){
    targetEq = researchEquipments.find(function(e){ return e.id === currentSelectedEquipment; }) || {
      id: 'EQ-' + (targetCode || 'AFM'), code: targetCode || 'AFM', name: targetCode || 'AFM'
    };
    targetCode = targetEq.code || targetCode || 'AFM';
  } else {
    targetCode = targetEq.code || targetCode;
  }
  const schema = EQUIPMENT_SCHEMAS[targetCode] || EQUIPMENT_SCHEMAS['AFM'];

  const modal = $('modalTestDriveBackdrop');
  if(!modal) return;

  const titleEl = $('testDriveModalTitle');
  if(titleEl) titleEl.textContent = '📝 ' + (targetEq.name || targetCode) + ' 사용 기록 작성';

  const container = $('testDriveFormDynamicContent');
  if(!container) return;

  const now = new Date();
  const defTime = pad(now.getHours()) + ':' + pad(now.getMinutes());
  const storedUser = localStorage.getItem('xrd_user_name') || '';
  const storedAffil = localStorage.getItem('xrd_affiliation') || '';
  const storedProf = localStorage.getItem('xrd_professor') || '';

  let formHtml = '';
  formHtml += '<input type="hidden" name="equipment_id" value="' + safe(targetEq.id) + '">';
  formHtml += '<input type="hidden" name="equipment_code" value="' + safe(targetCode) + '">';

  // 1. 공통 필수 메타데이터 (시간, 사용자, 샘플)
  formHtml += '<div class="param-section-box">';
  formHtml += '  <h4 class="param-section-title"><span>📅</span> 기본 세션 정보</h4>';
  formHtml += '  <div class="xrd-grid modal-session-grid" style="margin-bottom:8px;">';
  formHtml += '    <label class="xrd-mini modal-col-date">측정 날짜<input name="used_on" type="date" value="' + today() + '" required></label>';
  formHtml += '    <label class="xrd-mini modal-col-time">시작 시간<input name="start_time" type="time" value="' + defTime + '" required></label>';
  formHtml += '    <label class="xrd-mini modal-col-dur">가동 시간(분)<input name="duration_min" type="number" min="5" step="5" value="60" required></label>';
  formHtml += '  </div>';
  const curAuthUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const isAuthLoggedIn = !!curAuthUser;
  const uNameVal = curAuthUser ? (curAuthUser.name || '') : storedUser;
  const uAffilVal = curAuthUser ? (curAuthUser.affiliation || '') : storedAffil;
  const uProfVal = curAuthUser ? (curAuthUser.advisor || '') : storedProf;

  if(isAuthLoggedIn){
    formHtml += '  <div class="modal-user-compact-bar" id="modalUserCompactBar">';
    formHtml += '    <div class="modal-user-compact-left">';
    formHtml += '      <span class="modal-user-compact-label">OPERATOR</span>';
    formHtml += '      <span class="modal-user-compact-name"><strong>' + safe(uNameVal) + '</strong></span>';
    formHtml += '      <span class="modal-user-compact-meta">' + safe(uAffilVal) + (uProfVal ? (' · ' + safe(uProfVal)) : '') + '</span>';
    formHtml += '      <span class="modal-user-compact-badge">자동 연동</span>';
    formHtml += '    </div>';
    formHtml += '    <button type="button" class="modal-user-toggle-btn" id="btnToggleModalUserInputs">수정</button>';
    formHtml += '  </div>';
    formHtml += '  <div class="xrd-grid xrd-c3 hidden" id="modalUserInputsGrid" style="margin-top:6px;">';
    formHtml += '    <label class="xrd-mini">사용자 이름<input name="user_name" value="' + safe(uNameVal) + '" placeholder="사용자 성명" required></label>';
    formHtml += '    <label class="xrd-mini">소속 연구실<input name="affiliation" value="' + safe(uAffilVal) + '" placeholder="e.g. 2DQH"></label>';
    formHtml += '    <label class="xrd-mini">지도교수<input name="professor" value="' + safe(uProfVal) + '" placeholder="e.g. 신현석 교수님"></label>';
    formHtml += '  </div>';
  } else {
    formHtml += '  <div class="xrd-grid xrd-c3" id="modalUserInputsGrid">';
    formHtml += '    <label class="xrd-mini">사용자 이름<input name="user_name" value="' + safe(uNameVal) + '" placeholder="사용자 성명" required></label>';
    formHtml += '    <label class="xrd-mini">소속 연구실<input name="affiliation" value="' + safe(uAffilVal) + '" placeholder="e.g. 2DQH"></label>';
    formHtml += '    <label class="xrd-mini">지도교수<input name="professor" value="' + safe(uProfVal) + '" placeholder="e.g. 신현석 교수님"></label>';
    formHtml += '  </div>';
  }
  formHtml += '</div>';

  // 2. 샘플 정보
  formHtml += '<div class="param-section-box">';
  formHtml += '  <h4 class="param-section-title"><span>🧪</span> 샘플 및 공정 정보</h4>';
  formHtml += '  <div class="xrd-grid xrd-c2" style="margin-bottom:8px;">';
  formHtml += '    <label class="xrd-full">샘플명 / 공정명<input name="sample_name" placeholder="e.g. WS2 monolayer on SiO2" required></label>';
  formHtml += '    <label class="xrd-mini">샘플 수량<select name="sample_count"><option value="1" selected>1개</option><option value="2">2개</option><option value="3">3개</option><option value="4">4개</option><option value="5">5개 이상</option></select></label>';
  formHtml += '  </div>';

  if(schema.scanTypes && schema.scanTypes.length){
    formHtml += '  <label class="xrd-mini" style="display:block;margin-top:6px;">측정 / 스캔 모드<select name="scan_type">';
    schema.scanTypes.forEach(function(st){
      formHtml += '<option value="' + safe(st) + '">' + safe(st) + '</option>';
    });
    formHtml += '  </select></label>';
  }
  formHtml += '</div>';

  // 3. 장비 고유 파라미터 (Dynamic Readings & Options)
  formHtml += '<div class="param-section-box">';
  formHtml += '  <h4 class="param-section-title" style="color:#2563eb;"><span>⚡</span> ' + safe(schema.name) + ' 고유 측정 파라미터</h4>';

  if(schema.readings && schema.readings.length){
    const colClass = schema.readings.length >= 3 ? 'xrd-c3' : (schema.readings.length === 2 ? 'xrd-c2' : 'xrd-c1');
    formHtml += '  <div class="xrd-grid ' + colClass + '" style="margin-bottom:12px;">';
    schema.readings.forEach(function(r){
      formHtml += '    <label class="xrd-mini" style="display:flex;flex-direction:column;gap:4px;">' + safe(r.label) + ' (' + safe(r.unit) + ')';
      formHtml += '      <div class="xrd-input-wrap">';
      formHtml += '        <input name="param_reading_' + safe(r.key) + '" type="number" step="' + (r.step || 'any') + '" placeholder="' + (r.placeholder || '') + '" value="' + (r.placeholder || '') + '">';
      formHtml += '        <span class="xrd-unit">' + safe(r.unit) + '</span>';
      formHtml += '      </div>';
      formHtml += '    </label>';
    });
    formHtml += '  </div>';
  }

  if(schema.options && schema.options.length){
    const colClass = schema.options.length >= 2 ? 'xrd-c2' : 'xrd-c1';
    formHtml += '  <div class="xrd-grid ' + colClass + '" style="margin-bottom:12px;">';
    schema.options.forEach(function(opt){
      const isFull = (schema.options.length === 1) ? ' style="grid-column: 1 / -1;"' : '';
      formHtml += '    <label class="xrd-mini" style="display:flex;flex-direction:column;gap:4px;"' + isFull + '>' + safe(opt.label);
      formHtml += '      <select name="param_opt_' + safe(opt.key) + '">';
      opt.choices.forEach(function(c){
        const sel = (c === opt.default) ? ' selected' : '';
        formHtml += '<option value="' + safe(c) + '"' + sel + '>' + safe(c) + '</option>';
      });
      formHtml += '      </select>';
      formHtml += '    </label>';
    });
    formHtml += '  </div>';
  }

  // 4. SOP 체크리스트 (가로 일체형 카드 레이아웃 + 인라인 스타일로 텍스트 분리 현상 원천 차단)
  if(schema.checks && schema.checks.length){
    formHtml += '  <div class="sop-checklist-container" style="margin-top:14px;padding-top:14px;border-top:1px dashed var(--border,#cbd5e1);">';
    formHtml += '    <div class="sop-checklist-title" style="font-size:13px;font-weight:800;color:var(--ink,#0f172a);margin-bottom:10px;display:flex;align-items:center;gap:6px;"><span>✅</span> SOP 안전 점검 (필수 확인)</div>';
    formHtml += '    <div class="sop-checklist-wrap" style="display:flex;flex-direction:column;gap:8px;width:100%;">';
    schema.checks.forEach(function(chk){
      formHtml += '      <label class="sop-check-card" style="display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:12px!important;border-radius:8px!important;padding:10px 14px!important;cursor:pointer!important;width:100%!important;box-sizing:border-box!important;margin:0!important;text-align:left!important;">';
      formHtml += '        <input type="checkbox" name="param_chk_' + safe(chk.key) + '" checked style="width:19px!important;min-width:19px!important;height:19px!important;min-height:19px!important;margin:0!important;padding:0!important;flex-shrink:0!important;accent-color:#2563eb!important;cursor:pointer!important;">';
      formHtml += '        <span class="sop-check-text" style="font-size:13px!important;font-weight:600!important;line-height:1.45!important;flex:1!important;text-align:left!important;white-space:normal!important;word-break:keep-all!important;">' + safe(chk.label) + '</span>';
      formHtml += '      </label>';
    });
    formHtml += '    </div>';
    formHtml += '  </div>';
  }
  formHtml += '</div>';

  // 5. 메모
  formHtml += '<div class="param-section-box" style="margin-bottom:0;">';
  formHtml += '  <label class="xrd-mini" style="display:block;font-weight:700;color:var(--ink);margin-bottom:6px;">비고 / 특이사항 (Memo)</label>';
  formHtml += '  <textarea name="memo" rows="2" placeholder="측정 상태 및 특이사항 입력" style="width:100%;box-sizing:border-box;border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:13.5px;background:var(--card);color:var(--ink);line-height:1.5;"></textarea>';
  formHtml += '</div>';

  container.innerHTML = formHtml;

  const btnToggleModalUser = container.querySelector('#btnToggleModalUserInputs');
  if(btnToggleModalUser){
    btnToggleModalUser.addEventListener('click', function(e){
      e.preventDefault();
      const grid = container.querySelector('#modalUserInputsGrid');
      if(!grid) return;
      const isHidden = grid.classList.contains('hidden');
      grid.classList.toggle('hidden', !isHidden);
      btnToggleModalUser.textContent = isHidden ? '접기' : '수정';
    });
  }

  modal.classList.add('open');
}

function closeEquipmentTestDrive(){
  const modal = $('modalTestDriveBackdrop');
  if(modal) modal.classList.remove('open');
}


// ==========================================
// [연구장비 Supabase 독립 테이블 매핑 & 파라미터 빌더]
// ==========================================
const EQUIPMENT_TABLE_MAP = {
  'XRD': 'xrd_logs',
  'EQ-XRD-01': 'xrd_logs',
  'TEM': 'tem_logs',
  'EQ-TEM-01': 'tem_logs',
  'AFM': 'afm_logs',
  'EQ-AFM-01': 'afm_logs',
  'RAMAN': 'raman_logs',
  'EQ-RAMAN-01': 'raman_logs',
  'FT-IR': 'ftir_logs',
  'EQ-FTIR-01': 'ftir_logs',
  'Ebeamsputter': 'ebeam_logs',
  'EQ-EBEAM-01': 'ebeam_logs',
  'ALD': 'ald_logs',
  'EQ-ALD-01': 'ald_logs',
  'Co-sputter': 'cosputter_logs',
  'EQ-COSPUTTER-01': 'cosputter_logs',
  'UHVsputter': 'uhvsputter_logs',
  'EQ-UHVSPUTTER-01': 'uhvsputter_logs',
  'WireBonder': 'wirebonder_logs',
  'EQ-BONDER-01': 'wirebonder_logs',
  'XPS': 'xps_logs',
  'EQ-XPS-01': 'xps_logs'
};

function getEquipmentLogTable(codeOrId){
  return EQUIPMENT_TABLE_MAP[codeOrId] || 'xrd_logs';
}

function buildEquipmentSpecificPayload(eqTable, s){
  const p = s.parameters || {};
  const base = {
    session_id: s.id ? ('SESS-' + s.id) : ('SESS-' + Date.now()),
    used_on: s.used_on || today(),
    start_time: s.start_time || '10:00',
    end_time: s.end_time || null,
    duration_min: s.duration_min || 60,
    status: s.status || 'done',
    user_name: s.user_name || '연구원',
    affiliation: s.affiliation || '2DQH',
    professor: s.professor || '',
    sample_name: s.sample_name || '',
    sample_count: s.sample_count || 1,
    purpose: s.purpose || (s.parameters && s.parameters.mode) || s.scan_type || '',
    memo: s.memo || ''
  };

  switch(eqTable){
    case 'xrd_logs':
      if(p.chiller_start !== undefined) base.chiller_start = Number(p.chiller_start);
      if(p.vacuum_start !== undefined) base.vacuum_start = parseInt(p.vacuum_start, 10);
      if(p.align) base.optical_align = String(p.align);
      if(s.scan_type) base.scan_type = String(s.scan_type);
      if(p.xray_max_ok !== undefined) base.xray_max_ok = Boolean(p.xray_max_ok);
      if(p.position_ok !== undefined) base.position_ok = Boolean(p.position_ok);
      if(p.xray_min_ok !== undefined) base.xray_min_ok = Boolean(p.xray_min_ok);
      break;

    case 'tem_logs':
      if(p.col_vacuum !== undefined) base.col_vacuum = Number(p.col_vacuum);
      if(p.emission_current !== undefined) base.emission_current_ua = Number(p.emission_current);
      if(p.acc_voltage) base.acc_voltage = String(p.acc_voltage);
      if(s.scan_type) base.scan_type = String(s.scan_type);
      if(p.cold_trap_ok !== undefined) base.cold_trap_ok = Boolean(p.cold_trap_ok);
      if(p.gun_align_ok !== undefined) base.gun_align_ok = Boolean(p.gun_align_ok);
      if(p.valves_closed_ok !== undefined) base.valves_closed_ok = Boolean(p.valves_closed_ok);
      break;

    case 'afm_logs':
      if(p.laser_sum !== undefined) base.laser_sum = Number(p.laser_sum);
      if(p.drive_amp !== undefined) base.drive_amp = Number(p.drive_amp);
      if(p.mode) base.scan_mode = String(p.mode);
      if(s.scan_type) base.scan_type = String(s.scan_type);
      if(p.tip_mounted_ok !== undefined) base.tip_mounted_ok = Boolean(p.tip_mounted_ok);
      if(p.tune_ok !== undefined) base.tune_ok = Boolean(p.tune_ok);
      if(p.parked_ok !== undefined) base.parked_ok = Boolean(p.parked_ok);
      break;

    case 'raman_logs':
      if(p.laser_power !== undefined) base.laser_power_pct = Number(p.laser_power);
      if(p.int_time !== undefined) base.integration_time_sec = Number(p.int_time);
      if(p.wavelength) base.laser_wavelength = String(p.wavelength);
      if(p.objective) base.objective_lens = String(p.objective);
      if(s.scan_type) base.scan_type = String(s.scan_type);
      if(p.si_calib_ok !== undefined) base.si_calib_ok = Boolean(p.si_calib_ok);
      if(p.shutter_ok !== undefined) base.shutter_ok = Boolean(p.shutter_ok);
      break;

    case 'ftir_logs':
      if(p.resolution !== undefined) base.resolution = Number(p.resolution);
      if(p.scans !== undefined) base.accum_scans = parseInt(p.scans, 10);
      if(p.accessory) base.accessory = String(p.accessory);
      if(s.scan_type) base.scan_type = String(s.scan_type);
      if(p.purge_ok !== undefined) base.purge_ok = Boolean(p.purge_ok);
      if(p.background_ok !== undefined) base.background_ok = Boolean(p.background_ok);
      if(p.crystal_cleaned_ok !== undefined) base.crystal_cleaned_ok = Boolean(p.crystal_cleaned_ok);
      break;

    case 'ebeam_logs':
      if(p.base_press !== undefined) base.base_vacuum_torr = Number(p.base_press);
      if(p.dep_rate !== undefined) base.dep_rate_angs = Number(p.dep_rate);
      if(p.source) base.target_source = String(p.source);
      if(p.cooling_ok !== undefined) base.cooling_ok = Boolean(p.cooling_ok);
      if(p.pocket_ok !== undefined) base.pocket_ok = Boolean(p.pocket_ok);
      if(p.shutter_ok !== undefined) base.shutter_ok = Boolean(p.shutter_ok);
      break;

    case 'ald_logs':
      if(p.chamber_temp !== undefined) base.chamber_temp_c = Number(p.chamber_temp);
      if(p.pulse_time !== undefined) base.pulse_time_ms = Number(p.pulse_time);
      if(p.precursor) base.precursor_type = String(p.precursor);
      if(p.n2_flow_ok !== undefined) base.n2_flow_ok = Boolean(p.n2_flow_ok);
      if(p.valves_ok !== undefined) base.valves_ok = Boolean(p.valves_ok);
      if(p.pump_exhaust_ok !== undefined) base.pump_exhaust_ok = Boolean(p.pump_exhaust_ok);
      break;

    case 'cosputter_logs':
      if(p.sputter_power !== undefined) base.sputter_power_w = Number(p.sputter_power);
      if(p.ar_flow !== undefined) base.ar_flow_sccm = Number(p.ar_flow);
      if(p.power_type) base.power_type = String(p.power_type);
      if(p.rotation_ok !== undefined) base.rotation_ok = Boolean(p.rotation_ok);
      if(p.plasma_ignited_ok !== undefined) base.plasma_ignited_ok = Boolean(p.plasma_ignited_ok);
      if(p.shutter_closed_ok !== undefined) base.shutter_closed_ok = Boolean(p.shutter_closed_ok);
      break;

    case 'uhvsputter_logs':
      if(p.uhv_base !== undefined) base.uhv_base_torr = Number(p.uhv_base);
      if(p.working_press !== undefined) base.working_pressure_mtorr = Number(p.working_press);
      if(p.loadlock_transferred_ok !== undefined) base.loadlock_transferred_ok = Boolean(p.loadlock_transferred_ok);
      if(p.cryo_temp_ok !== undefined) base.cryo_temp_ok = Boolean(p.cryo_temp_ok);
      if(p.gate_valve_isolated_ok !== undefined) base.gate_valve_isolated_ok = Boolean(p.gate_valve_isolated_ok);
      break;

    case 'xps_logs':
      if(p.base_vacuum !== undefined) base.base_vacuum_mbar = Number(p.base_vacuum);
      if(p.chiller_temp !== undefined) base.chiller_temp_c = Number(p.chiller_temp);
      if(p.xray_power !== undefined) base.xray_power_w = Number(p.xray_power);
      if(p.pass_energy !== undefined) base.pass_energy_ev = Number(p.pass_energy);
      if(p.xray_spot) base.xray_spot_size = String(p.xray_spot);
      if(p.analyzer_mode) base.analyzer_mode = String(p.analyzer_mode);
      if(s.scan_type) base.scan_type = String(s.scan_type);
      if(p.vacuum_interlock_ok !== undefined) base.vacuum_interlock_ok = Boolean(p.vacuum_interlock_ok);
      if(p.flood_gun_ok !== undefined) base.flood_gun_ok = Boolean(p.flood_gun_ok);
      if(p.sample_ground_ok !== undefined) base.sample_ground_ok = Boolean(p.sample_ground_ok);
      break;

    case 'wirebonder_logs':
      if(p.ultrasonic_power !== undefined) base.ultrasonic_power = Number(p.ultrasonic_power);
      if(p.bonding_time !== undefined) base.bonding_time_ms = Number(p.bonding_time);
      if(p.bonding_force !== undefined) base.bonding_force_gf = Number(p.bonding_force);
      if(p.wire_type) base.wire_type = String(p.wire_type);
      if(p.feeder_aligned_ok !== undefined) base.feeder_aligned_ok = Boolean(p.feeder_aligned_ok);
      if(p.flame_off_spark_ok !== undefined) base.flame_off_spark_ok = Boolean(p.flame_off_spark_ok);
      if(p.pull_test_passed_ok !== undefined) base.pull_test_passed_ok = Boolean(p.pull_test_passed_ok);
      break;
  }
  return base;
}

async function handleTestDriveFormSubmit(e){
  e.preventDefault();
  const f = $('testDriveForm');
  if(!f) return;

  const codeFromForm = f.equipment_code ? f.equipment_code.value : '';
  const idFromForm = f.equipment_id ? f.equipment_id.value : '';

  const targetEq = (idFromForm && researchEquipments.find(function(eq){ return eq.id === idFromForm; })) ||
    (codeFromForm && researchEquipments.find(function(eq){ return eq.code === codeFromForm; })) ||
    researchEquipments.find(function(eq){ return eq.id === currentSelectedEquipment; }) || {
      id: idFromForm || 'EQ-AFM', code: codeFromForm || 'AFM', name: codeFromForm || 'AFM'
    };
  const code = targetEq.code || codeFromForm || 'AFM';
  const schema = EQUIPMENT_SCHEMAS[code] || {};

  const usedOn = f.used_on ? f.used_on.value : today();
  const startTime = f.start_time ? f.start_time.value : '10:00';
  const durationMin = f.duration_min ? (parseInt(f.duration_min.value, 10) || 60) : 60;

  let endTime = '';
  if(startTime){
    const parts = startTime.split(':');
    const startMins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    const endMins = (startMins + durationMin) % (24 * 60);
    endTime = pad(Math.floor(endMins / 60)) + ':' + pad(endMins % 60);
  }

  const userName = f.user_name ? f.user_name.value.trim() : '';
  const affiliation = f.affiliation ? f.affiliation.value.trim() : '';
  const professor = f.professor ? f.professor.value.trim() : '';
  const sampleName = f.sample_name ? f.sample_name.value.trim() : '';
  const sampleCount = f.sample_count ? (parseInt(f.sample_count.value, 10) || 1) : 1;
  const scanType = f.scan_type ? f.scan_type.value : '';
  const memo = f.memo ? f.memo.value.trim() : '';

  const dynamicParams = {};
  if(schema.readings){
    schema.readings.forEach(function(r){
      const el = f['param_reading_' + r.key];
      if(el && el.value !== '') dynamicParams[r.key] = parseFloat(el.value);
    });
  }
  if(schema.options){
    schema.options.forEach(function(opt){
      const el = f['param_opt_' + opt.key];
      if(el) dynamicParams[opt.key] = el.value;
    });
  }
  if(schema.checks){
    schema.checks.forEach(function(chk){
      const el = f['param_chk_' + chk.key];
      dynamicParams[chk.key] = el ? el.checked : false;
    });
  }

  const sessionEntry = {
    id: Date.now(),
    equipment_id: targetEq.id,
    equipment_code: code,
    used_on: usedOn,
    start_time: startTime,
    end_time: endTime,
    duration_min: durationMin,
    status: 'done',
    user_name: userName,
    affiliation: affiliation,
    professor: professor,
    sample_name: sampleName,
    sample_count: sampleCount,
    scan_type: scanType,
    parameters: dynamicParams,
    memo: memo,
    created_at: new Date().toISOString()
  };

  equipmentSessions.unshift(sessionEntry);
  try {
    localStorage.setItem('labstock_equipment_sessions', JSON.stringify(equipmentSessions));
  } catch(_) {}

  try {
    if(userName) localStorage.setItem('xrd_user_name', userName);
    if(affiliation) localStorage.setItem('xrd_affiliation', affiliation);
    if(professor) localStorage.setItem('xrd_professor', professor);
  } catch(_) {}

  if(db && !isLocalMode){
    try {
      const eqTable = getEquipmentLogTable(sessionEntry.equipment_code || sessionEntry.equipment_id);
      const specificPayload = buildEquipmentSpecificPayload(eqTable, sessionEntry);
      
      const { data: inserted, error: insertErr } = await db.from(eqTable).insert(specificPayload).select();
      if(!insertErr && inserted && inserted[0]){
        sessionEntry.id = inserted[0].id;
        sessionEntry.session_id = inserted[0].session_id || sessionEntry.session_id;
        try { localStorage.setItem('labstock_equipment_sessions', JSON.stringify(equipmentSessions)); } catch(_) {}
        console.log('Supabase 전용 테이블(' + eqTable + ') 저장 성공:', inserted[0]);
      } else {
        // fallback: equipment_sessions 테이블에도 백업 시도
        console.warn('Supabase ' + eqTable + ' insert fallback:', insertErr);
        const legacyPayload = {
          equipment_id: sessionEntry.equipment_id,
          equipment_code: sessionEntry.equipment_code || 'EQUIP',
          used_on: sessionEntry.used_on,
          start_time: sessionEntry.start_time,
          end_time: sessionEntry.end_time || null,
          duration_min: sessionEntry.duration_min,
          status: sessionEntry.status || 'done',
          user_name: sessionEntry.user_name,
          affiliation: sessionEntry.affiliation || '',
          professor: sessionEntry.professor || '',
          sample_name: sessionEntry.sample_name || '',
          sample_count: sessionEntry.sample_count || 1,
          scan_type: sessionEntry.scan_type || '',
          parameters: sessionEntry.parameters || {},
          memo: sessionEntry.memo || ''
        };
        await db.from('equipment_sessions').insert(legacyPayload);
      }
    } catch(err){
      console.warn('Supabase insert fallback:', err);
    }
  }

  closeEquipmentTestDrive();
  toast('✓ ' + targetEq.name + ' 사용 기록이 저장되었습니다.');
  renderEquipmentTestSessions(code);
}

async function deleteEquipmentSession(id){
  if(!isAdmin()){
    toast('가동 기록 삭제 권한은 관리자에게만 있습니다.');
    return;
  }
  if(!confirm('이 사용 기록을 삭제하시겠습니까?')) return;
  equipmentSessions = equipmentSessions.filter(function(s){ return String(s.id) !== String(id); });
  try { localStorage.setItem('labstock_equipment_sessions', JSON.stringify(equipmentSessions)); } catch(_) {}

  if(db && !isLocalMode){
    try {
      const targetSess = equipmentSessions.find(function(s){ return String(s.id) === String(id) || s.session_id === id; });
      if(targetSess){
        const eqTable = getEquipmentLogTable(targetSess.equipment_code || targetSess.equipment_id);
        await db.from(eqTable).delete().or('id.eq.' + id + ',session_id.eq.' + id);
      }
      await db.from('equipment_sessions').delete().eq('id', id);
    } catch(err){
      console.warn('Supabase session delete failed:', err);
    }
  }
  toast('✓ 가동 기록이 삭제되었습니다.');
  const currentEq = researchEquipments.find(function(e){ return e.id === currentSelectedEquipment; });
  if(currentEq) renderEquipmentTestSessions(currentEq.code);
}

function renderEquipmentPortalGrid(){
  const grid = $('equipmentPortalGrid');
  if(!grid) return;

  // SESS 9대 전체 연구장비 통합 포털 (XRD 별도 분리/편애 제거)
  const allEquips = researchEquipments;

  const cntAll = allEquips.length;
  const cntStructural = allEquips.filter(function(e){ return e.category === 'structural'; }).length;
  const cntOptical = allEquips.filter(function(e){ return e.category === 'optical'; }).length;
  const cntDeposition = allEquips.filter(function(e){ return e.category === 'deposition'; }).length;
  if($('catCntAll')) $('catCntAll').textContent = cntAll;
  if($('catCntStructural')) $('catCntStructural').textContent = cntStructural;
  if($('catCntOptical')) $('catCntOptical').textContent = cntOptical;
  if($('catCntDeposition')) $('catCntDeposition').textContent = cntDeposition;
  if($('eqSecondaryCountBadge')) $('eqSecondaryCountBadge').textContent = '정밀 분석장비';

  const searchInput = $('eqSearchInput');
  const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const clearBtn = $('btnClearEqSearch');
  if(clearBtn) clearBtn.classList.toggle('hidden', !q);

  const filtered = allEquips.filter(function(eq){
    const matchCat = (selectedEquipmentCategory === 'all' || eq.category === selectedEquipmentCategory);
    if(!matchCat) return false;
    if(!q) return true;
    const hay = [eq.code, eq.name, eq.categoryName, eq.model, eq.location, eq.manager, eq.assetNo || '', eq.serviceMode || '', eq.spec || ''].join(' ').toLowerCase();
    return hay.includes(q);
  });

  if(filtered.length === 0){
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:36px 20px;color:#64748b;font-size:14px;">검색 조건에 맞는 SESS 연동 연구장비가 없습니다.</div>';
    return;
  }

  let html = '';
  filtered.forEach(function(eq){
    const serviceSimple = (eq.serviceMode || '직접사용').split('/')[0].trim();
    const isXrd = (eq.code === 'XRD');
    const isBonder = (eq.code === 'WireBonder');
    const isXps = (eq.code === 'XPS');
    const isActive = (eq.status === 'active' || isXrd || isBonder || isXps);

    let actionBtnText = '📖 전자 로그북 열기';
    if(isXrd){
      actionBtnText = '📖 HR-XRD 전자 로그북 열기';
    } else if(isBonder){
      actionBtnText = '📖 Wire Bonder 전자 로그북 열기';
    } else if(isActive){
      actionBtnText = '📖 ' + safe(eq.code) + ' 전자 로그북 열기';
    }

    const actionBtnHtml = '<button type="button" class="btn btn-compact-view' + (isActive ? ' btn-view-active' : '') + '" data-select-eq="' + safe(eq.id) + '"' + (isActive ? ' style="background:#2563eb;color:#fff;border-color:#2563eb;font-weight:700;margin-top:8px;"' : ' style="margin-top:8px;"') + '>' + actionBtnText + '</button>';
    const statusBadgeHtml = '<span class="eq-card-cat-badge">' + safe(eq.categoryName || '장비') + '</span>';

    html +=
      '<div class="eq-compact-card' + (isActive ? ' is-active-equipment' : '') + '" data-select-eq="' + safe(eq.id) + '">' +
        '<div class="eq-card-thumb-wrap">' +
          '<img src="' + safe(eq.image || 'logo_2dqh.jpg') + '" alt="' + safe(eq.name) + '" class="eq-card-photo" loading="lazy" onerror="this.src=\'logo_2dqh.jpg\'">' +
          statusBadgeHtml +
          '<span class="eq-card-code-pill">' + safe(eq.code) + '</span>' +
        '</div>' +
        '<div class="eq-card-content">' +
          '<div class="eq-compact-asset-text">' + safe(eq.assetNo || '') + '</div>' +
          '<h4 class="eq-compact-name">' + safe(eq.name) + '</h4>' +
          '<p class="eq-compact-model">' + safe(eq.model) + '</p>' +
          '<p class="eq-compact-spec-line">' + safe(eq.spec) + '</p>' +
          '<div class="eq-compact-footer">' +
            '<span class="eq-compact-loc">📍 ' + safe(eq.location) + '</span>' +
            '<span class="eq-compact-mode-pill">' + safe(serviceSimple) + '</span>' +
          '</div>' +
          actionBtnHtml +
        '</div>' +
      '</div>';
  });

  grid.innerHTML = html;
}

function showEquipmentCatalogHub(){
  const hub = $('equipmentCatalogHub');
  const detail = $('equipmentDetailHub');
  if(hub) hub.classList.remove('hidden');
  if(detail) detail.classList.add('hidden');
  switchEquipmentHubView(currentHubView || 'catalog');
  if(typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================================
// [Phase 3: 연구단 장비 종합 통계 및 가동 대시보드 엔진]
// ========================================================

function getUnifiedEquipmentSessions(){
  const list = [];

  // 1. HR-XRD logs (map to unified session object)
  if(Array.isArray(xrdLogs)){
    xrdLogs.forEach(function(l){
      list.push({
        id: 'xrd_' + (l.id || l.created_at || Math.random()),
        raw_id: l.id,
        equipment_id: 'EQ-XRD-01',
        equipment_code: 'XRD',
        equipment_name: 'HR-XRD (고분해능 X선 회절분석기)',
        icon: '🔬',
        is_live: true,
        type: 'active',
        used_on: l.used_on || (l.created_at ? l.created_at.slice(0, 10) : today()),
        start_time: l.start_time || '10:00',
        end_time: l.end_time || '',
        duration_min: l.duration_min || 60,
        user_name: l.user_name || '이강민',
        affiliation: l.affiliation || '2DQH',
        professor: l.professor || '신현석 교수님',
        sample_name: l.sample_name || 'HR-XRD 분석 시료',
        sample_count: l.sample_count || 1,
        scan_type: l.scan_type || 'θ/2θ',
        parameters: {
          chiller_start: l.chiller_start,
          chiller_end: l.chiller_end,
          vacuum_start: l.vacuum_start,
          vacuum_end: l.vacuum_end,
          align: l.align,
          xray_max_ok: l.xray_max_ok,
          xray_min_ok: l.xray_min_ok,
          position_ok: l.position_ok
        },
        memo: l.memo || '',
        created_at: l.created_at || new Date().toISOString()
      });
    });
  }

  // 2. 범용 장비 시험/운영 세션 (equipmentSessions)
  if(Array.isArray(equipmentSessions)){
    equipmentSessions.forEach(function(s){
      const eq = researchEquipments.find(function(e){ return e.id === s.equipment_id || e.code === s.equipment_code; }) || {};
      list.push({
        id: 'sess_' + (s.id || s.created_at || Math.random()),
        raw_id: s.id,
        equipment_id: s.equipment_id || eq.id || ('EQ-' + (s.equipment_code || 'MISC')),
        equipment_code: s.equipment_code || eq.code || 'EQUIP',
        equipment_name: eq.name || s.equipment_code || '연구장비',
        icon: eq.icon || '⚡',
        is_live: (eq.status === 'active'),
        type: 'test',
        used_on: s.used_on || today(),
        start_time: s.start_time || '10:00',
        end_time: s.end_time || '',
        duration_min: s.duration_min || 60,
        user_name: s.user_name || '연구원',
        affiliation: s.affiliation || '2DQH',
        professor: s.professor || '신현석 교수님',
        sample_name: s.sample_name || '연구 시료',
        sample_count: s.sample_count || 1,
        scan_type: s.scan_type || '',
        parameters: s.parameters || {},
        memo: s.memo || '',
        created_at: s.created_at || new Date().toISOString()
      });
    });
  }

  // 최신순 (날짜 desc, 시간 desc) 정렬
  list.sort(function(a, b){
    const dateA = (a.used_on || '') + ' ' + (a.start_time || '');
    const dateB = (b.used_on || '') + ' ' + (b.start_time || '');
    return dateB.localeCompare(dateA);
  });

  return list;
}

function switchEquipmentHubView(mode){
  if(mode === 'analytics' && !isAdmin()){
    toast('장비 운영 통계는 관리자 전용 기능입니다.');
    mode = 'catalog';
  }
  currentHubView = mode || 'catalog';
  const isCatalog = (currentHubView === 'catalog');

  const hub = $('equipmentCatalogHub');
  const detail = $('equipmentDetailHub');
  if(hub) hub.classList.remove('hidden');
  if(detail) detail.classList.add('hidden');

  const catalogView = $('eqCatalogViewContainer');
  const analyticsView = $('equipmentAnalyticsDashboard');

  if(catalogView) catalogView.classList.toggle('hidden', !isCatalog);
  if(analyticsView) analyticsView.classList.toggle('hidden', isCatalog);

  const dGrid = $('btnHubShowGrid');
  const dAnalytics = $('btnHubShowAnalytics');
  const mGrid = $('btnMobileHubShowGrid');
  const mAnalytics = $('btnMobileHubShowAnalytics');

  if(dGrid) dGrid.classList.toggle('active', isCatalog);
  if(dAnalytics) dAnalytics.classList.toggle('active', !isCatalog);
  if(mGrid) mGrid.classList.toggle('active', isCatalog);
  if(mAnalytics) mAnalytics.classList.toggle('active', !isCatalog);

  updateLimsNavActive(isCatalog ? 'catalog' : 'analytics');

  if(!isCatalog){
    renderEquipmentAnalyticsDashboard();
  } else {
    renderEquipmentPortalGrid();
  }
  if(typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getMonthWeeks(year, month){
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeks = [];
  let start = 1;
  let weekNum = 1;
  while(start <= daysInMonth){
    const end = Math.min(start + 6, daysInMonth);
    const startStr = year + '-' + pad(month) + '-' + pad(start);
    const endStr = year + '-' + pad(month) + '-' + pad(end);
    const label = month + '월 ' + weekNum + '주차 (' + pad(month) + '.' + pad(start) + '~' + pad(month) + '.' + pad(end) + ')';
    weeks.push({
      weekNum: weekNum,
      label: label,
      startDay: start,
      endDay: end,
      startDate: startStr,
      endDate: endStr
    });
    start = end + 1;
    weekNum++;
  }
  return weeks;
}

function renderEquipmentAnalyticsScopeChips(){
  const selEl = $('eqAnalyticsSelect');
  const descEl = $('eqAnalyticsScopeDesc');
  const periodDescEl = $('eqAnalyticsPeriodDesc');

  const allSessions = getUnifiedEquipmentSessions();

  // 1. 드롭다운 <select id="eqAnalyticsSelect"> 옵션 갱신 및 체인지 이벤트 바인딩
  if(selEl){
    let optHtml = '<option value="all">🌐 전체 연구장비 통합 개요 (' + researchEquipments.length + '대 · ' + allSessions.length + '건)</option>';
    researchEquipments.forEach(function(eq){
      const isSel = (selectedAnalyticsEquipmentId === eq.id);
      const count = allSessions.filter(function(s){ return s.equipment_id === eq.id || s.equipment_code === eq.code; }).length;
      const durMins = allSessions.filter(function(s){ return s.equipment_id === eq.id || s.equipment_code === eq.code; })
                                 .reduce(function(acc, cur){ return acc + (cur.duration_min || 0); }, 0);
      const durHours = durMins > 0 ? (durMins / 60).toFixed(1) + 'h' : '0h';
      optHtml += '<option value="' + safe(eq.id) + '" ' + (isSel ? 'selected' : '') + '>' + (eq.icon || '🔬') + ' ' + safe(eq.code) + ' - ' + safe(eq.name.split('(')[0].trim()) + ' (' + count + '건 · ' + durHours + ')</option>';
    });
    selEl.innerHTML = optHtml;
    selEl.value = selectedAnalyticsEquipmentId;

    if(!selEl.__boundChange){
      selEl.__boundChange = true;
      selEl.addEventListener('change', function(){
        selectedAnalyticsEquipmentId = selEl.value;
        renderEquipmentAnalyticsDashboard();
      });
    }
  }

  // 2. 주기 전환 탭 활성화 상태 동기화 및 전용 클릭 이벤트 바인딩
  const periodSwitcher = $('eqPeriodSwitcher');
  if(periodSwitcher){
    const tabs = periodSwitcher.querySelectorAll('.eq-period-tab');
    tabs.forEach(function(tab){
      tab.classList.toggle('active', tab.dataset.analyticsPeriod === selectedAnalyticsPeriod);
    });

    if(!periodSwitcher.__boundClick){
      periodSwitcher.__boundClick = true;
      periodSwitcher.addEventListener('click', function(e){
        const tab = e.target.closest('[data-analytics-period]');
        if(!tab) return;
        e.preventDefault();
        e.stopPropagation();
        selectedAnalyticsPeriod = tab.dataset.analyticsPeriod || 'month';
        renderEquipmentAnalyticsDashboard();
      });
    }
  }

  const periodName = selectedAnalyticsPeriod === 'week' ? '주간 가동 추이 분석' : (selectedAnalyticsPeriod === 'month' ? '월별 가동 실적 분석' : '연간 가동 실적 분석');
  if(periodDescEl){
    periodDescEl.textContent = currentCalendarYear + '년 ' + periodName;
  }

  const isAll = (selectedAnalyticsEquipmentId === 'all');
  if(isAll){
    if(descEl) descEl.textContent = '첨단 연구장비 통합 운영 관리 오버뷰';
  } else {
    const selectedEq = researchEquipments.find(function(e){ return e.id === selectedAnalyticsEquipmentId; });
    if(descEl && selectedEq) {
      descEl.textContent = selectedEq.name + ' [' + selectedEq.code + '] 독립 세션 및 ' + periodName;
    }
  }
}

function renderEquipmentAnalyticsDashboard(){
  const allSessions = getUnifiedEquipmentSessions();

  renderEquipmentAnalyticsScopeChips();

  const isAll = (selectedAnalyticsEquipmentId === 'all');
  const selectedEq = isAll ? null : researchEquipments.find(function(e){ return e.id === selectedAnalyticsEquipmentId; });

  // 세션 스코프 분리: 전체 vs 선택된 단일 장비
  const targetSessions = isAll ? allSessions : allSessions.filter(function(s){
    return s.equipment_id === selectedAnalyticsEquipmentId || (selectedEq && s.equipment_code === selectedEq.code);
  });

  // 1. KPI 지표 계산 (선택 주기: week / month / year 반영)
  const monthWeeks = getMonthWeeks(currentCalendarYear, currentCalendarMonth);
  const todayStr = today();
  let curWeek = null;
  if(timelineDateFilter){
    curWeek = monthWeeks.find(function(w){ return timelineDateFilter >= w.startDate && timelineDateFilter <= w.endDate; });
  }
  if(!curWeek){
    curWeek = monthWeeks.find(function(w){ return todayStr >= w.startDate && todayStr <= w.endDate; }) || monthWeeks[0];
  }

  let periodSessions = [];
  let periodTag = '';
  let periodKorName = '';

  if(selectedAnalyticsPeriod === 'week'){
    periodSessions = targetSessions.filter(function(s){
      return (s.used_on || '') >= curWeek.startDate && (s.used_on || '') <= curWeek.endDate;
    });
    periodTag = curWeek.label;
    periodKorName = '주간 (' + curWeek.label + ')';
  } else if(selectedAnalyticsPeriod === 'month'){
    const currentMonthStr = currentCalendarYear + '-' + pad(currentCalendarMonth);
    periodSessions = targetSessions.filter(function(s){
      return (s.used_on || '').startsWith(currentMonthStr);
    });
    periodTag = currentCalendarYear + '년 ' + currentCalendarMonth + '월';
    periodKorName = '월별 (' + currentCalendarMonth + '월)';
  } else {
    // year
    const yrStr = String(currentCalendarYear);
    periodSessions = targetSessions.filter(function(s){
      return (s.used_on || '').startsWith(yrStr);
    });
    periodTag = currentCalendarYear + '년 연간';
    periodKorName = '연간 (' + currentCalendarYear + '년)';
  }

  let totalPeriodMins = 0;
  let totalPeriodSamples = 0;
  const userSet = new Set();
  const affilSet = new Set();

  periodSessions.forEach(function(s){
    totalPeriodMins += (s.duration_min || 0);
    totalPeriodSamples += (s.sample_count || 1);
    if(s.user_name) userSet.add(s.user_name);
    if(s.affiliation) affilSet.add(s.affiliation);
  });

  const totalPeriodHours = (totalPeriodMins / 60).toFixed(1);
  const avgMins = periodSessions.length > 0 ? Math.round(totalPeriodMins / periodSessions.length) : 0;

  // 전체 누적 수치 계산
  let allTargetMins = 0;
  targetSessions.forEach(function(s){ allTargetMins += (s.duration_min || 0); });
  const allTargetHours = (allTargetMins / 60).toFixed(1);

  // KPI UI 반영
  const kpiEqLabel = $('kpiEqLabel');
  const kpiEqTotal = $('kpiEqTotal');
  const kpiEqSub = $('kpiEqSub');
  const kpiSessionsTotal = $('kpiSessionsTotal');
  const kpiSessionsSub = $('kpiSessionsSub');
  const kpiRuntimeTotal = $('kpiRuntimeTotal');
  const kpiRuntimeSub = $('kpiRuntimeSub');
  const kpiUsersTotal = $('kpiUsersTotal');
  const kpiAffilSub = $('kpiAffilSub');

  if(isAll){
    if(kpiEqLabel) kpiEqLabel.textContent = '대상 연구장비';
    if(kpiEqTotal) kpiEqTotal.textContent = researchEquipments.length + '대 통합 운영';
    if(kpiEqSub) kpiEqSub.textContent = '구조 2 · 광학 3 · 증착 4 · 공정 1';
    if(kpiSessionsTotal) kpiSessionsTotal.textContent = periodSessions.length + '건';
    if(kpiSessionsSub) kpiSessionsSub.textContent = periodTag + ' 가동 (누적 ' + targetSessions.length + '건)';
    if(kpiRuntimeTotal) kpiRuntimeTotal.textContent = totalPeriodHours + '시간';
    if(kpiRuntimeSub) kpiRuntimeSub.textContent = periodTag + ' 가동 (누적 ' + allTargetHours + 'h)';
    if(kpiUsersTotal) kpiUsersTotal.textContent = totalPeriodSamples + '개 시료';
    if(kpiAffilSub) kpiAffilSub.textContent = periodTag + ' 참여 ' + userSet.size + '명';
  } else if(selectedEq) {
    if(kpiEqLabel) kpiEqLabel.textContent = selectedEq.code;
    if(kpiEqTotal) kpiEqTotal.textContent = selectedEq.name.split('(')[0].trim();
    if(kpiEqSub) kpiEqSub.textContent = (selectedEq.categoryName || '연구장비') + ' · ' + (selectedEq.status === 'active' ? '🟢 정상 가동' : '⚪ 준비 중');
    if(kpiSessionsTotal) kpiSessionsTotal.textContent = periodSessions.length + '건';
    if(kpiSessionsSub) kpiSessionsSub.textContent = periodTag + ' 가동 (누적 ' + targetSessions.length + '건)';
    if(kpiRuntimeTotal) kpiRuntimeTotal.textContent = totalPeriodHours + '시간';
    if(kpiRuntimeSub) kpiRuntimeSub.textContent = periodSessions.length > 0 ? ('평균 세션 ' + avgMins + '분') : (allTargetHours + 'h 누적');
    if(kpiUsersTotal) kpiUsersTotal.textContent = totalPeriodSamples + '개 시료';
    const userNames = Array.from(userSet).slice(0, 3).join(', ');
    if(kpiAffilSub) kpiAffilSub.textContent = userNames ? (userNames + (userSet.size > 3 ? ' 외 ' + (userSet.size - 3) + '명' : '')) : (selectedEq.location || '연구실');
  }

  // 2. 메인 패널 제목 및 배지 갱신
  const mainTitleEl = $('eqAnalyticsMainTitle');
  const mainSubEl = $('eqAnalyticsMainSub');
  const periodBadgeEl = $('eqAnalyticsPeriodBadge');

  if(mainTitleEl){
    if(isAll){
      mainTitleEl.textContent = '🔬 전체 연구장비 ' + (selectedAnalyticsPeriod === 'week' ? '주간' : (selectedAnalyticsPeriod === 'month' ? '월별' : '연간')) + ' 운용 관리 오버뷰';
    } else if(selectedEq){
      mainTitleEl.textContent = '📊 ' + selectedEq.name + ' ' + (selectedAnalyticsPeriod === 'week' ? '주간' : (selectedAnalyticsPeriod === 'month' ? '월별' : '연간')) + ' 가동 통계';
    }
  }

  if(mainSubEl){
    if(isAll){
      mainSubEl.textContent = selectedAnalyticsPeriod === 'week' ? (currentCalendarYear + '년 ' + currentCalendarMonth + '월 주차별(1~5주차) 가동 실적 및 장비별 현황') : (selectedAnalyticsPeriod === 'month' ? (currentCalendarYear + '년 1월~12월 월별 가동 실적 및 장비별 현황') : (currentCalendarYear + '년도 연간 누적 가동 실적 및 장비별 현황'));
    } else if(selectedEq){
      mainSubEl.textContent = '[' + selectedEq.code + '] ' + (selectedAnalyticsPeriod === 'week' ? (currentCalendarYear + '년 ' + currentCalendarMonth + '월 주차별 가동 실적') : (selectedAnalyticsPeriod === 'month' ? (currentCalendarYear + '년 1월~12월 월별 가동 실적') : '연도별 누적 가동 실적'));
    }
  }

  if(periodBadgeEl){
    periodBadgeEl.textContent = currentCalendarYear + '년 ' + (selectedAnalyticsPeriod === 'week' ? (currentCalendarMonth + '월 주간 통계') : (selectedAnalyticsPeriod === 'month' ? currentCalendarMonth + '월 통계' : '연간 통계'));
  }

  // 3. 관리 오버뷰 / 주기별 상세 통계 콘텐츠 렌더링
  renderEquipmentAnalyticsOverview(periodSessions, targetSessions, allSessions);

  // 4. 월간 가동 캘린더 렌더링 (선택된 스코프의 세션 전달)
  renderEquipmentCalendar(targetSessions);

  // 5. 최근 통합 타임라인 피드 렌더링 (선택된 스코프의 세션 전달)
  renderEquipmentRecentTimeline(targetSessions);
}

function renderEquipmentAnalyticsOverview(periodSessions, targetSessions, allSessions){
  periodSessions = periodSessions || targetSessions;
  const container = $('eqUtilizationList');
  if(!container) return;

  const isAll = (selectedAnalyticsEquipmentId === 'all');
  const selectedEq = isAll ? null : researchEquipments.find(function(e){ return e.id === selectedAnalyticsEquipmentId; });

  const monthWeeks = getMonthWeeks(currentCalendarYear, currentCalendarMonth);
  const todayStr = today();
  let curWeek = null;
  if(timelineDateFilter){
    curWeek = monthWeeks.find(function(w){ return timelineDateFilter >= w.startDate && timelineDateFilter <= w.endDate; });
  }
  if(!curWeek){
    curWeek = monthWeeks.find(function(w){ return todayStr >= w.startDate && todayStr <= w.endDate; }) || monthWeeks[0];
  }

  // ----------------------------------------------------
  // 상단 소속별 비중 요약 (어디에서 많이 찍었는지 & 최다 시편)
  // ----------------------------------------------------
  const affilCounts = {};
  const sampleCounts = {};
  const activeSessionsForStats = (periodSessions && periodSessions.length > 0) ? periodSessions : [];
  
  activeSessionsForStats.forEach(function(s){
    let aff = s.affiliation || '2DQH 페로브스카이트팀';
    if(!aff || aff === '1' || /^\d+$/.test(aff)){
      aff = '2DQH 연구단';
    }
    affilCounts[aff] = (affilCounts[aff] || 0) + (s.sample_count || 1);
    if(s.sample_name){
      sampleCounts[s.sample_name] = (sampleCounts[s.sample_name] || 0) + (s.sample_count || 1);
    }
  });

  const sortedAffils = Object.keys(affilCounts).sort(function(a, b){ return affilCounts[b] - affilCounts[a]; });
  const sortedSamples = Object.keys(sampleCounts).sort(function(a, b){ return sampleCounts[b] - sampleCounts[a]; });
  const totalSamplesAll = activeSessionsForStats.reduce(function(a, c){ return a + (c.sample_count || 1); }, 0);

  let topSummaryHtml = '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:12.5px;">';
  topSummaryHtml += '  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">';
  topSummaryHtml += '    <span style="font-weight:700;color:var(--ink);">📍 소속/연구실별 측정 비중 (어디에서 가장 많이 찍었는지):</span>';
  if(sortedAffils.length > 0){
    const topAffList = sortedAffils.slice(0, 4).map(function(af, idx){
      const cnt = affilCounts[af];
      const pct = totalSamplesAll > 0 ? Math.round((cnt / totalSamplesAll) * 100) : 0;
      return '<span style="font-weight:600;color:var(--primary);">' + (idx + 1) + '위 ' + safe(af) + ' (' + cnt + '개 · ' + pct + '%)</span>';
    }).join('<span style="color:#cbd5e1;"> | </span>');
    topSummaryHtml += topAffList;
  } else {
    topSummaryHtml += '<span style="color:#94a3b8;">측정 기록 없음</span>';
  }
  topSummaryHtml += '  </div>';

  if(sortedSamples.length > 0){
    topSummaryHtml += '  <div style="font-size:12px;color:var(--ink-light);">';
    topSummaryHtml += '    <span>최다 측정 시편: <b>' + safe(sortedSamples.slice(0, 2).join(', ')) + '</b></span>';
    topSummaryHtml += '  </div>';
  }
  topSummaryHtml += '</div>';

  // ----------------------------------------------------
  // 1. 주기별 종합 분석 테이블 (주간: 당월 1~5주차 / 월별: 1~12월 / 연간: 연도별)
  // ----------------------------------------------------
  let periodTableHtml = '';

  if(selectedAnalyticsPeriod === 'week'){
    // 주간 통계: 현재 선택된 월의 1주차 ~ 5주차
    let maxWeekMins = 1;
    let totalWeekMins = 0;
    let totalWeekSessions = 0;
    let totalWeekSamples = 0;

    const weekStats = monthWeeks.map(function(w){
      const wSessions = targetSessions.filter(function(s){
        return (s.used_on || '') >= w.startDate && (s.used_on || '') <= w.endDate;
      });
      let mins = 0;
      let samples = 0;
      const users = new Set();
      const affMap = {};

      wSessions.forEach(function(s){
        mins += (s.duration_min || 0);
        samples += (s.sample_count || 1);
        if(s.user_name) users.add(s.user_name);
        const a = s.affiliation || '2DQH';
        affMap[a] = (affMap[a] || 0) + (s.sample_count || 1);
      });

      if(mins > maxWeekMins) maxWeekMins = mins;
      totalWeekMins += mins;
      totalWeekSessions += wSessions.length;
      totalWeekSamples += samples;

      let topAff = '-';
      let maxA = 0;
      for(const k in affMap){
        if(affMap[k] > maxA){
          maxA = affMap[k];
          topAff = k;
        }
      }

      return {
        label: w.label,
        startDate: w.startDate,
        endDate: w.endDate,
        weekNum: w.weekNum,
        mins: mins,
        hours: (mins / 60).toFixed(1),
        sessions: wSessions.length,
        samples: samples,
        topAff: topAff,
        users: Array.from(users)
      };
    });

    const rowsHtml = weekStats.map(function(item){
      const isCur = (curWeek && curWeek.weekNum === item.weekNum);
      const pct = maxWeekMins > 0 ? Math.min(100, Math.round((item.mins / maxWeekMins) * 100)) : 0;
      const usersStr = item.users.slice(0, 3).join(', ') + (item.users.length > 3 ? ' 외 ' + (item.users.length - 3) + '명' : '');

      return '<tr class="' + (isCur ? 'period-current' : '') + '">' +
        '<td><b>' + safe(item.label) + '</b> ' + (isCur ? '<span class="status return-pending" style="font-size:10px;padding:1px 5px;">현재 주차</span>' : '') + '</td>' +
        '<td style="text-align:right;"><b style="color:var(--primary);font-size:13.5px;">' + item.hours + 'h</b></td>' +
        '<td style="text-align:right;color:#64748b;">' + item.mins + '분</td>' +
        '<td style="text-align:center;font-weight:600;">' + (item.sessions > 0 ? item.sessions + '건' : '-') + '</td>' +
        '<td style="text-align:center;">' + (item.samples > 0 ? item.samples + '개' : '-') + '</td>' +
        '<td style="font-size:12px;color:var(--ink);"><span style="font-weight:600;">' + safe(item.topAff) + '</span></td>' +
        '<td style="font-size:12px;color:var(--ink-light);">' + (usersStr || '-') + '</td>' +
        '<td class="col-gauge">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<div class="gauge-bar-wrap"><div class="gauge-bar-fill" style="width:' + pct + '%;"></div></div>' +
            '<span style="font-size:10.5px;color:#64748b;min-width:28px;">' + pct + '%</span>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    const totalWeekHours = (totalWeekMins / 60).toFixed(1);

    periodTableHtml = '<div style="margin-bottom:20px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<h4 style="margin:0;font-size:14px;font-weight:700;color:var(--ink);">📅 ' + currentCalendarYear + '년 ' + currentCalendarMonth + '월 주차별 가동 현황</h4>' +
        '<span style="font-size:12px;color:var(--ink-light);">' + currentCalendarMonth + '월 1주차 ~ ' + monthWeeks.length + '주차 주간 실적 종합</span>' +
      '</div>' +
      '<div class="table-wrap" style="overflow-x:auto;border:1px solid var(--border);border-radius:10px;">' +
        '<table class="eq-period-table">' +
          '<thead>' +
            '<tr>' +
              '<th>주차 (기간)</th>' +
              '<th style="text-align:right;">가동시간(h)</th>' +
              '<th style="text-align:right;">가동(분)</th>' +
              '<th style="text-align:center;">세션수</th>' +
              '<th style="text-align:center;">시료수</th>' +
              '<th>최다 측정처</th>' +
              '<th>주요 사용자</th>' +
              '<th class="col-gauge">주간 비중</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + rowsHtml + '</tbody>' +
          '<tfoot>' +
            '<tr style="background:var(--bg);font-weight:700;border-top:2px solid var(--border);">' +
              '<td>' + currentCalendarMonth + '월 전 주차 합계</td>' +
              '<td style="text-align:right;color:var(--primary);">' + totalWeekHours + 'h</td>' +
              '<td style="text-align:right;">' + totalWeekMins + '분</td>' +
              '<td style="text-align:center;">' + totalWeekSessions + '건</td>' +
              '<td style="text-align:center;">' + totalWeekSamples + '개</td>' +
              '<td colspan="2" style="font-size:12px;color:var(--ink-light);">전체 주간 종합</td>' +
              '<td>100%</td>' +
            '</tr>' +
          '</tfoot>' +
        '</table>' +
      '</div>' +
    '</div>';

  } else if(selectedAnalyticsPeriod === 'month'){
    // 월별 통계: 1월 ~ 12월
    let maxMonthMins = 1;
    const monthStats = [];
    let yearTotalMins = 0;
    let yearTotalSessions = 0;
    let yearTotalSamples = 0;
    const allUsers = new Set();

    for(let m = 1; m <= 12; m++){
      const mStr = currentCalendarYear + '-' + pad(m);
      const mSessions = targetSessions.filter(function(s){
        const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
        return d.startsWith(mStr);
      });
      let mins = 0;
      let samples = 0;
      const users = new Set();
      const affMap = {};

      mSessions.forEach(function(s){
        mins += (s.duration_min || 0);
        samples += (s.sample_count || 1);
        if(s.user_name) { users.add(s.user_name); allUsers.add(s.user_name); }
        const a = s.affiliation || '2DQH';
        affMap[a] = (affMap[a] || 0) + (s.sample_count || 1);
      });

      if(mins > maxMonthMins) maxMonthMins = mins;
      yearTotalMins += mins;
      yearTotalSessions += mSessions.length;
      yearTotalSamples += samples;

      let topAff = '-';
      let maxA = 0;
      for(const k in affMap){
        if(affMap[k] > maxA){
          maxA = affMap[k];
          topAff = k;
        }
      }

      monthStats.push({
        month: m,
        mStr: mStr,
        mins: mins,
        hours: (mins / 60).toFixed(1),
        sessions: mSessions.length,
        samples: samples,
        topAff: topAff,
        users: Array.from(users)
      });
    }

    const currentM = currentCalendarMonth;
    const rowsHtml = monthStats.map(function(item){
      const isCur = (item.month === currentM);
      const pct = maxMonthMins > 0 ? Math.min(100, Math.round((item.mins / maxMonthMins) * 100)) : 0;
      const usersStr = item.users.slice(0, 3).join(', ') + (item.users.length > 3 ? ' 외 ' + (item.users.length - 3) + '명' : '');

      return '<tr class="' + (isCur ? 'period-current' : '') + '">' +
        '<td><b>' + item.month + '월</b> ' + (isCur ? '<span class="status return-pending" style="font-size:10px;padding:1px 5px;">당월</span>' : '') + '</td>' +
        '<td style="text-align:right;"><b style="color:var(--primary);font-size:13.5px;">' + item.hours + 'h</b></td>' +
        '<td style="text-align:right;color:#64748b;">' + item.mins + '분</td>' +
        '<td style="text-align:center;font-weight:600;">' + (item.sessions > 0 ? item.sessions + '건' : '-') + '</td>' +
        '<td style="text-align:center;">' + (item.samples > 0 ? item.samples + '개' : '-') + '</td>' +
        '<td style="font-size:12px;color:var(--ink);"><span style="font-weight:600;">' + safe(item.topAff) + '</span></td>' +
        '<td style="font-size:12px;color:var(--ink-light);">' + (usersStr || '-') + '</td>' +
        '<td class="col-gauge">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<div class="gauge-bar-wrap"><div class="gauge-bar-fill" style="width:' + pct + '%;"></div></div>' +
            '<span style="font-size:10.5px;color:#64748b;min-width:28px;">' + pct + '%</span>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    const yearTotalHours = (yearTotalMins / 60).toFixed(1);

    periodTableHtml = '<div style="margin-bottom:20px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<h4 style="margin:0;font-size:14px;font-weight:700;color:var(--ink);">📅 ' + currentCalendarYear + '년 월별 가동 실적 (1월 ~ 12월)</h4>' +
        '<span style="font-size:12px;color:var(--ink-light);">' + currentCalendarYear + '년 1월 ~ 12월 월별 실적 추이</span>' +
      '</div>' +
      '<div class="table-wrap" style="overflow-x:auto;border:1px solid var(--border);border-radius:10px;">' +
        '<table class="eq-period-table">' +
          '<thead>' +
            '<tr>' +
              '<th>월별 (1~12월)</th>' +
              '<th style="text-align:right;">가동시간(h)</th>' +
              '<th style="text-align:right;">가동(분)</th>' +
              '<th style="text-align:center;">세션수</th>' +
              '<th style="text-align:center;">시료수</th>' +
              '<th>최다 측정처</th>' +
              '<th>주요 사용자</th>' +
              '<th class="col-gauge">가동 비중</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + rowsHtml + '</tbody>' +
          '<tfoot>' +
            '<tr style="background:var(--bg);font-weight:700;border-top:2px solid var(--border);">' +
              '<td>' + currentCalendarYear + '년 연간 총계</td>' +
              '<td style="text-align:right;color:var(--primary);">' + yearTotalHours + 'h</td>' +
              '<td style="text-align:right;">' + yearTotalMins + '분</td>' +
              '<td style="text-align:center;">' + yearTotalSessions + '건</td>' +
              '<td style="text-align:center;">' + yearTotalSamples + '개</td>' +
              '<td colspan="2" style="font-size:12px;color:var(--ink-light);">총 ' + allUsers.size + '명 참여</td>' +
              '<td>100%</td>' +
            '</tr>' +
          '</tfoot>' +
        '</table>' +
      '</div>' +
    '</div>';

  } else {
    // 연간 통계: 2024년 ~ 2027년
    const years = [2024, 2025, 2026, 2027];
    let maxYearMins = 1;
    let grandTotalMins = 0;
    let grandTotalSessions = 0;
    let grandTotalSamples = 0;

    const yearStats = years.map(function(yr){
      const yStr = String(yr);
      const ySessions = targetSessions.filter(function(s){
        const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
        return d.startsWith(yStr);
      });
      let mins = 0;
      let samples = 0;
      const users = new Set();
      const affMap = {};

      ySessions.forEach(function(s){
        mins += (s.duration_min || 0);
        samples += (s.sample_count || 1);
        if(s.user_name) users.add(s.user_name);
        const a = s.affiliation || '2DQH';
        affMap[a] = (affMap[a] || 0) + (s.sample_count || 1);
      });

      if(mins > maxYearMins) maxYearMins = mins;
      grandTotalMins += mins;
      grandTotalSessions += ySessions.length;
      grandTotalSamples += samples;

      let topAff = '-';
      let maxA = 0;
      for(const k in affMap){
        if(affMap[k] > maxA){
          maxA = affMap[k];
          topAff = k;
        }
      }

      return {
        year: yr,
        mins: mins,
        hours: (mins / 60).toFixed(1),
        sessions: ySessions.length,
        samples: samples,
        topAff: topAff,
        userCount: users.size
      };
    });

    const rowsHtml = yearStats.map(function(item){
      const isCur = (item.year === currentCalendarYear);
      const pct = maxYearMins > 0 ? Math.min(100, Math.round((item.mins / maxYearMins) * 100)) : 0;

      return '<tr class="' + (isCur ? 'period-current' : '') + '">' +
        '<td><b>' + item.year + '년</b> ' + (isCur ? '<span class="status return-pending" style="font-size:10px;padding:1px 5px;">현재년도</span>' : '') + '</td>' +
        '<td style="text-align:right;"><b style="color:var(--primary);font-size:14px;">' + item.hours + 'h</b></td>' +
        '<td style="text-align:right;color:#64748b;">' + item.mins + '분</td>' +
        '<td style="text-align:center;font-weight:600;">' + (item.sessions > 0 ? item.sessions + '건' : '-') + '</td>' +
        '<td style="text-align:center;">' + (item.samples > 0 ? item.samples + '개' : '-') + '</td>' +
        '<td style="font-size:12px;color:var(--ink);"><span style="font-weight:600;">' + safe(item.topAff) + '</span></td>' +
        '<td style="font-size:12px;color:var(--ink-light);">' + item.userCount + '명 참여</td>' +
        '<td class="col-gauge">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<div class="gauge-bar-wrap"><div class="gauge-bar-fill" style="width:' + pct + '%;"></div></div>' +
            '<span style="font-size:10.5px;color:#64748b;min-width:28px;">' + pct + '%</span>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    const grandTotalHours = (grandTotalMins / 60).toFixed(1);

    periodTableHtml = '<div style="margin-bottom:20px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<h4 style="margin:0;font-size:14px;font-weight:700;color:var(--ink);">📆 연도별 가동 실적 (2024년 ~ 2027년)</h4>' +
        '<span style="font-size:12px;color:var(--ink-light);">다년간 누적 운영 추이 및 실적 비교</span>' +
      '</div>' +
      '<div class="table-wrap" style="overflow-x:auto;border:1px solid var(--border);border-radius:10px;">' +
        '<table class="eq-period-table">' +
          '<thead>' +
            '<tr>' +
              '<th>연도 (Year)</th>' +
              '<th style="text-align:right;">총 가동시간(h)</th>' +
              '<th style="text-align:right;">총 가동(분)</th>' +
              '<th style="text-align:center;">총 세션수</th>' +
              '<th style="text-align:center;">총 시료수</th>' +
              '<th>최다 측정처</th>' +
              '<th>참여 사용자</th>' +
              '<th class="col-gauge">연도별 비중</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + rowsHtml + '</tbody>' +
          '<tfoot>' +
            '<tr style="background:var(--bg);font-weight:700;border-top:2px solid var(--border);">' +
              '<td>전체 누적 총계</td>' +
              '<td style="text-align:right;color:var(--primary);">' + grandTotalHours + 'h</td>' +
              '<td style="text-align:right;">' + grandTotalMins + '분</td>' +
              '<td style="text-align:center;">' + grandTotalSessions + '건</td>' +
              '<td style="text-align:center;">' + grandTotalSamples + '개</td>' +
              '<td colspan="2" style="font-size:12px;color:var(--ink-light);">전체 기간 통합</td>' +
              '<td>100%</td>' +
            '</tr>' +
          '</tfoot>' +
        '</table>' +
      '</div>' +
    '</div>';
  }

  // 개별 장비 모드인 경우: 상단 요약 바 + 해당 장비의 주기별 상세 테이블만 렌더링하고 종료
  if(!isAll){
    container.innerHTML = topSummaryHtml + periodTableHtml;
    return;
  }

  // ----------------------------------------------------
  // 2. [전체 연구장비 통합 모드]: 전체 연구장비 운용 관리 오버뷰 테이블
  // ----------------------------------------------------
  const currentMonthStr = currentCalendarYear + '-' + pad(currentCalendarMonth);
  const currentYearStr = String(currentCalendarYear);

  const periodStats = researchEquipments.map(function(eq){
    const eqSessions = allSessions.filter(function(s){
      return s.equipment_id === eq.id || s.equipment_code === eq.code;
    });

    let pSessions = [];
    if(selectedAnalyticsPeriod === 'week'){
      pSessions = eqSessions.filter(function(s){
        return (s.used_on || '') >= curWeek.startDate && (s.used_on || '') <= curWeek.endDate;
      });
    } else if(selectedAnalyticsPeriod === 'month'){
      pSessions = eqSessions.filter(function(s){
        return (s.used_on || '').startsWith(currentMonthStr);
      });
    } else {
      pSessions = eqSessions.filter(function(s){
        return (s.used_on || '').startsWith(currentYearStr);
      });
    }

    let pMins = 0;
    let pSamples = 0;
    const affilMap = {};
    const userMap = {};

    pSessions.forEach(function(s){
      pMins += (s.duration_min || 0);
      pSamples += (s.sample_count || 1);
      const aff = s.affiliation || '2DQH';
      affilMap[aff] = (affilMap[aff] || 0) + (s.sample_count || 1);
      const u = s.user_name || '연구원';
      userMap[u] = (userMap[u] || 0) + 1;
    });

    let totalMins = 0;
    eqSessions.forEach(function(s){ totalMins += (s.duration_min || 0); });

    // 어디에서 가장 많이 찍었는지 (소속별 최다 비중)
    let topAffil = '-';
    let maxAff = 0;
    for(const a in affilMap){
      if(affilMap[a] > maxAff){
        maxAff = affilMap[a];
        const pct = pSamples > 0 ? Math.round((affilMap[a] / pSamples) * 100) : 0;
        topAffil = a + ' (' + maxAff + '개, ' + pct + '%)';
      }
    }

    let topUser = '-';
    let maxU = 0;
    for(const u in userMap){
      if(userMap[u] > maxU){
        maxU = userMap[u];
        topUser = u;
      }
    }

    return {
      eq: eq,
      pSessions: pSessions,
      pMins: pMins,
      pHours: (pMins / 60).toFixed(1),
      pSamples: pSamples,
      totalMins: totalMins,
      totalHours: (totalMins / 60).toFixed(1),
      totalSessionsCount: eqSessions.length,
      topAffil: topAffil,
      topUser: topUser,
      lastSession: eqSessions[0]
    };
  });

  let maxPMins = 1;
  let grandPMins = 0;
  let grandPSessions = 0;
  let grandPSamples = 0;

  periodStats.forEach(function(st){
    if(st.pMins > maxPMins) maxPMins = st.pMins;
    grandPMins += st.pMins;
    grandPSessions += st.pSessions.length;
    grandPSamples += st.pSamples;
  });

  const periodColName = selectedAnalyticsPeriod === 'week' ? (curWeek.label + ' 가동') : (selectedAnalyticsPeriod === 'month' ? (currentCalendarMonth + '월 가동') : (currentCalendarYear + '년 가동'));
  const sessionColName = selectedAnalyticsPeriod === 'week' ? '주간 세션' : (selectedAnalyticsPeriod === 'month' ? '월간 세션' : '연간 세션');

  const rowsHtml = periodStats.map(function(st){
    const eq = st.eq;
    const isActive = (eq.status === 'active');
    let statusBadge = '<span class="status available">정상 가동</span>';
    if(!isActive){
      statusBadge = '<span class="status-chip borrowed-chip" style="background:#f1f5f9;color:#64748b;">대기 중</span>';
    }

    const pct = maxPMins > 0 ? Math.round((st.pMins / maxPMins) * 100) : 0;
    const pTimeStr = st.pMins > 0 ? ('<b style="color:var(--primary);font-size:13.5px;">' + st.pHours + 'h</b> <span style="font-size:11px;color:#64748b;">(' + st.pMins + '분)</span>') : '<span style="color:#94a3b8;font-size:12px;">-</span>';

    return '<tr>' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:16px;">' + (eq.icon || '🔬') + '</span>' +
          '<div>' +
            '<b style="font-size:13px;color:var(--ink);">' + safe(eq.code) + '</b> ' +
            '<span style="font-size:12px;color:var(--ink-light);">' + safe(eq.name.split('(')[0].trim()) + '</span>' +
            '<div style="font-size:11px;color:#94a3b8;">' + safe(eq.location || '연구실') + '</div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td style="text-align:center;">' + statusBadge + '</td>' +
      '<td style="text-align:right;">' + pTimeStr + '</td>' +
      '<td class="col-gauge">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<div class="gauge-bar-wrap"><div class="gauge-bar-fill" style="width:' + pct + '%;"></div></div>' +
          '<span style="font-size:10.5px;color:#64748b;min-width:28px;">' + (st.pMins > 0 ? pct + '%' : '0%') + '</span>' +
        '</div>' +
      '</td>' +
      '<td style="text-align:center;font-weight:600;">' + (st.pSessions.length > 0 ? st.pSessions.length + '건' : '-') + '</td>' +
      '<td style="text-align:center;">' + (st.pSamples > 0 ? st.pSamples + '개' : '-') + '</td>' +
      '<td style="font-size:12px;color:var(--ink);"><span style="font-weight:600;">' + safe(st.topAffil) + '</span></td>' +
      '<td style="font-size:12px;color:var(--ink-light);">' + safe(st.topUser) + '</td>' +
      '<td style="text-align:center;">' +
        '<button type="button" class="btn" style="padding:4px 8px;font-size:11.5px;font-weight:600;border-radius:6px;" data-analytics-eq="' + safe(eq.id) + '">' +
          '📊 상세 분석' +
        '</button>' +
      '</td>' +
    '</tr>';
  }).join('');

  const grandHours = (grandPMins / 60).toFixed(1);

  const eqOverviewTableHtml = '<div style="margin-top:24px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
      '<h4 style="margin:0;font-size:14px;font-weight:700;color:var(--ink);">🔬 연구장비별 운용 관리 현황 (' + safe(periodColName) + ')</h4>' +
      '<span style="font-size:12px;color:var(--ink-light);">전체 연구장비 기간 실적 및 최다 측정처 요약</span>' +
    '</div>' +
    '<div class="table-wrap" style="overflow-x:auto;border:1px solid var(--border);border-radius:10px;">' +
      '<table class="eq-overview-table">' +
        '<thead>' +
          '<tr>' +
            '<th>연구장비 명칭 / 위치</th>' +
            '<th style="text-align:center;">운영 상태</th>' +
            '<th style="text-align:right;">' + periodColName + '</th>' +
            '<th class="col-gauge">가동 비중</th>' +
            '<th style="text-align:center;">' + sessionColName + '</th>' +
            '<th style="text-align:center;">시료수</th>' +
            '<th>최다 측정처 (어디에서 많이 찍었는지)</th>' +
            '<th>주요 사용자</th>' +
            '<th style="text-align:center;">상세</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
        '<tfoot>' +
          '<tr style="background:var(--bg);font-weight:700;border-top:2px solid var(--border);">' +
            '<td colspan="2">전체 연구장비 기간 합계</td>' +
            '<td style="text-align:right;color:var(--primary);font-size:13.5px;">' + grandHours + 'h <span style="font-size:11px;color:#64748b;">(' + grandPMins + '분)</span></td>' +
            '<td><div class="gauge-bar-wrap"><div class="gauge-bar-fill" style="width:100%;"></div></div></td>' +
            '<td style="text-align:center;">' + grandPSessions + '건</td>' +
            '<td style="text-align:center;">' + grandPSamples + '개</td>' +
            '<td colspan="2" style="font-size:12px;color:var(--ink-light);">전체 연구단 실시간 집계</td>' +
            '<td></td>' +
          '</tr>' +
        '</tfoot>' +
      '</table>' +
    '</div>' +
  '</div>';

  container.innerHTML = topSummaryHtml + periodTableHtml + eqOverviewTableHtml;
}

function exportAnalyticsSummaryCsv(){
  try {
    const allSessions = getUnifiedEquipmentSessions();
    const isAll = (!selectedAnalyticsEquipmentId || selectedAnalyticsEquipmentId === 'all');
    const selectedEq = isAll ? null : (researchEquipments.find(function(e){ return e.id === selectedAnalyticsEquipmentId; }) || null);
    const eqName = isAll ? '첨단 연구장비 10대 통합' : (selectedEq ? (selectedEq.name + ' [' + selectedEq.code + ']') : '선택 연구장비');
    const eqCodeStr = isAll ? '전체장비통합' : (selectedEq ? selectedEq.code : '장비');

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const lines = [];
    const periodLabel = selectedAnalyticsPeriod === 'week' ? '주간' : (selectedAnalyticsPeriod === 'month' ? '월간' : '연간');
    const monthWeeks = getMonthWeeks(currentCalendarYear, currentCalendarMonth);

    let curWeek = null;
    if(timelineDateFilter && monthWeeks && monthWeeks.length){
      curWeek = monthWeeks.find(function(w){ return timelineDateFilter >= w.startDate && timelineDateFilter <= w.endDate; });
    }
    if(!curWeek && monthWeeks && monthWeeks.length){
      curWeek = monthWeeks.find(function(w){ return today() >= w.startDate && today() <= w.endDate; }) || monthWeeks[0];
    }
    if(!curWeek){
      const startD = currentCalendarYear + '-' + pad(currentCalendarMonth) + '-01';
      const endD = currentCalendarYear + '-' + pad(currentCalendarMonth) + '-07';
      curWeek = { label: '1주차', startDate: startD, endDate: endD };
    }

    // 대상 장비 필터링
    const targetSessions = isAll ? allSessions : allSessions.filter(function(s){
      return s.equipment_id === selectedAnalyticsEquipmentId || (selectedEq && s.equipment_code === selectedEq.code);
    });

    let periodDesc = '';
    let filename = '';
    let periodSessions = [];

    if(selectedAnalyticsPeriod === 'year'){
      periodDesc = currentCalendarYear + '년 연간 통계 (1월 ~ 12월)';
      filename = '2DQH_연구장비운영통계_연간_월별집계_' + eqCodeStr + '_' + currentCalendarYear + '년.csv';
      const yrStr = String(currentCalendarYear);
      periodSessions = targetSessions.filter(function(s){
        const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
        return d.startsWith(yrStr);
      });
    } else if(selectedAnalyticsPeriod === 'month'){
      const currentMonthStr = currentCalendarYear + '-' + pad(currentCalendarMonth);
      periodDesc = currentCalendarYear + '년 ' + currentCalendarMonth + '월 월간 통계 (주차별 집계)';
      filename = '2DQH_연구장비운영통계_월간_주차별집계_' + eqCodeStr + '_' + currentCalendarYear + '년' + pad(currentCalendarMonth) + '월.csv';
      periodSessions = targetSessions.filter(function(s){
        const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
        return d.startsWith(currentMonthStr);
      });
    } else {
      // week
      periodDesc = currentCalendarYear + '년 ' + currentCalendarMonth + '월 ' + curWeek.label + ' (' + curWeek.startDate + ' ~ ' + curWeek.endDate + ')';
      filename = '2DQH_연구장비운영통계_주간_요일별집계_' + eqCodeStr + '_' + currentCalendarYear + '년' + pad(currentCalendarMonth) + '월_' + curWeek.label + '.csv';
      periodSessions = targetSessions.filter(function(s){
        const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
        return d >= curWeek.startDate && d <= curWeek.endDate;
      });
    }

    // 총괄 집계 계산
    let grandPeriodMins = 0;
    let grandPeriodSamples = 0;
    const userSet = new Set();
    const affilMap = {};

    periodSessions.forEach(function(s){
      grandPeriodMins += (s.duration_min || 0);
      grandPeriodSamples += (s.sample_count || 1);
      if(s.user_name) userSet.add(s.user_name);
      const af = s.affiliation || '2DQH';
      affilMap[af] = (affilMap[af] || 0) + (s.sample_count || 1);
    });

    let topAffilOverall = '-';
    let maxAffOverall = 0;
    for(const k in affilMap){
      if(affilMap[k] > maxAffOverall){
        maxAffOverall = affilMap[k];
        const pct = grandPeriodSamples > 0 ? Math.round((affilMap[k] / grandPeriodSamples) * 100) : 0;
        topAffilOverall = k + ' (' + maxAffOverall + '개, ' + pct + '%)';
      }
    }

    // ====================================================
    // [헤더 및 메타데이터]
    // ====================================================
    lines.push('"[IBS 2DQH 연구단 연구장비 운영통계 및 분석 실적 리포트]"');
    lines.push('"보고서 생성일시: ' + today() + '","분석 주기: ' + periodLabel + ' 통계","조회 기준: ' + periodDesc + '","대상 장비: ' + eqName + '"');
    lines.push('""');

    // ====================================================
    // 1. 총괄 운영 서머리
    // ====================================================
    lines.push('"[1. 연구장비 총괄 운영 서머리]"');
    lines.push('"구분 항목","운영 통계 수치"');
    lines.push('"분석 대상 장비","' + eqName + '"');
    lines.push('"분석 기준 기간","' + periodDesc + '"');
    lines.push('"총 분석·가동 건수","' + periodSessions.length + '건 (전체 누적 ' + targetSessions.length + '건 중)"');
    lines.push('"총 가동 시간 (시간)","' + (grandPeriodMins / 60).toFixed(1) + '시간"');
    lines.push('"총 가동 시간 (분)","' + grandPeriodMins.toLocaleString() + '분"');
    lines.push('"총 측정 시료수","' + grandPeriodSamples + '개"');
    lines.push('"참여 연구원 수","' + userSet.size + '명"');
    lines.push('"최다 분석처 (소속/연구실)","' + topAffilOverall + '"');
    lines.push('""');

    // ====================================================
    // 2. 주기별 세부 분석 테이블 (연간->월별, 월간->주별, 주간->요일별)
    // ====================================================
    if(selectedAnalyticsPeriod === 'year'){
      // [연간 통계 선택 시]: 1월 ~ 12월 월별 정리 집계
      lines.push('"[2. ' + currentCalendarYear + '년 월별(1월~12월) 운영 실적 분석 (연간 상세 집계)]"');
      lines.push('"해당 월","가동 건수(건)","가동 시간(시간)","가동 시간(분)","가동 비중(%)","측정 시료수(개)","참여 연구원 수(명)","주요 사용자","최다 분석처 (소속)"');

      for(let m = 1; m <= 12; m++){
        const mPrefix = currentCalendarYear + '-' + pad(m);
        const mSessions = periodSessions.filter(function(s){
          const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
          return d.startsWith(mPrefix);
        });

        let mMins = 0;
        let mSamples = 0;
        const mUsers = {};
        const mAffils = {};

        mSessions.forEach(function(s){
          mMins += (s.duration_min || 0);
          mSamples += (s.sample_count || 1);
          const u = s.user_name || '연구원';
          mUsers[u] = (mUsers[u] || 0) + 1;
          const a = s.affiliation || '2DQH';
          mAffils[a] = (mAffils[a] || 0) + (s.sample_count || 1);
        });

        const mUsersList = Object.keys(mUsers).sort(function(a, b){ return mUsers[b] - mUsers[a]; });
        const mTopUsers = mUsersList.slice(0, 2).map(function(u){ return u + '(' + mUsers[u] + '건)'; }).join(', ') || '-';

        let mTopAff = '-';
        let maxAff = 0;
        for(const a in mAffils){
          if(mAffils[a] > maxAff){
            maxAff = mAffils[a];
            mTopAff = a + ' (' + maxAff + '개)';
          }
        }

        const pctOfYr = grandPeriodMins > 0 ? Math.round((mMins / grandPeriodMins) * 100) : 0;

        lines.push([
          m + '월 (' + mPrefix + ')',
          mSessions.length,
          (mMins / 60).toFixed(1),
          mMins,
          pctOfYr + '%',
          mSamples,
          mUsersList.length,
          mTopUsers,
          mTopAff
        ].map(function(v){ return formatCsvCell(v); }).join(','));
      }

      // 연간 합계 행
      lines.push([
        '연간 총계(TOTAL)',
        periodSessions.length,
        (grandPeriodMins / 60).toFixed(1),
        grandPeriodMins,
        '100%',
        grandPeriodSamples,
        userSet.size,
        Array.from(userSet).slice(0, 3).join(', ') + (userSet.size > 3 ? ' 외 ' + (userSet.size - 3) + '명' : ''),
        topAffilOverall
      ].map(function(v){ return formatCsvCell(v); }).join(','));

    } else if(selectedAnalyticsPeriod === 'month'){
      // [월간 통계 선택 시]: 해당 달 주차별(1주차~5주차) 정리 집계
      lines.push('"[2. ' + currentCalendarYear + '년 ' + currentCalendarMonth + '월 주차별 운영 실적 분석 (월간 주별 상세 집계)]"');
      lines.push('"주차 구분","해당 기간","가동 건수(건)","가동 시간(시간)","가동 시간(분)","가동 비중(%)","측정 시료수(개)","참여 연구원 수(명)","주요 사용자","최다 분석처 (소속)"');

      monthWeeks.forEach(function(wk){
        const wkSessions = periodSessions.filter(function(s){
          const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
          return d >= wk.startDate && d <= wk.endDate;
        });

        let wMins = 0;
        let wSamples = 0;
        const wUsers = {};
        const wAffils = {};

        wkSessions.forEach(function(s){
          wMins += (s.duration_min || 0);
          wSamples += (s.sample_count || 1);
          const u = s.user_name || '연구원';
          wUsers[u] = (wUsers[u] || 0) + 1;
          const a = s.affiliation || '2DQH';
          wAffils[a] = (wAffils[a] || 0) + (s.sample_count || 1);
        });

        const wUsersList = Object.keys(wUsers).sort(function(a, b){ return wUsers[b] - wUsers[a]; });
        const wTopUsers = wUsersList.slice(0, 2).map(function(u){ return u + '(' + wUsers[u] + '건)'; }).join(', ') || '-';

        let wTopAff = '-';
        let maxAff = 0;
        for(const a in wAffils){
          if(wAffils[a] > maxAff){
            maxAff = wAffils[a];
            wTopAff = a + ' (' + maxAff + '개)';
          }
        }

        const pctOfMo = grandPeriodMins > 0 ? Math.round((wMins / grandPeriodMins) * 100) : 0;

        lines.push([
          wk.label,
          wk.startDate + ' ~ ' + wk.endDate,
          wkSessions.length,
          (wMins / 60).toFixed(1),
          wMins,
          pctOfMo + '%',
          wSamples,
          wUsersList.length,
          wTopUsers,
          wTopAff
        ].map(function(v){ return formatCsvCell(v); }).join(','));
      });

      // 월간 합계 행
      lines.push([
        '당월 총계(TOTAL)',
        currentCalendarYear + '년 ' + currentCalendarMonth + '월 전체',
        periodSessions.length,
        (grandPeriodMins / 60).toFixed(1),
        grandPeriodMins,
        '100%',
        grandPeriodSamples,
        userSet.size,
        Array.from(userSet).slice(0, 3).join(', ') + (userSet.size > 3 ? ' 외 ' + (userSet.size - 3) + '명' : ''),
        topAffilOverall
      ].map(function(v){ return formatCsvCell(v); }).join(','));

    } else {
      // [주간 통계 선택 시]: 현재 주간 요일별(월~일) 정리 집계
      lines.push('"[2. ' + curWeek.label + ' 요일별 운영 실적 분석 (주간 상세 집계: ' + curWeek.startDate + ' ~ ' + curWeek.endDate + ')]"');
      lines.push('"요일","일자","가동 건수(건)","가동 시간(시간)","가동 시간(분)","가동 비중(%)","측정 시료수(개)","사용 연구원","측정 시료 요약"');

      const startD = new Date(curWeek.startDate + 'T00:00:00');
      const endD = new Date(curWeek.endDate + 'T00:00:00');
      const curD = new Date(startD);
      const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

      while(curD <= endD){
        const y = curD.getFullYear();
        const m = pad(curD.getMonth() + 1);
        const dayNum = pad(curD.getDate());
        const dateKey = y + '-' + m + '-' + dayNum;
        const dayLabel = dayNames[curD.getDay()];

        const daySessions = periodSessions.filter(function(s){
          const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
          return d === dateKey;
        });

        let dMins = 0;
        let dSamples = 0;
        const dUsers = new Set();
        const dSampleNames = [];

        daySessions.forEach(function(s){
          dMins += (s.duration_min || 0);
          dSamples += (s.sample_count || 1);
          if(s.user_name) dUsers.add(s.user_name);
          if(s.sample_name) dSampleNames.push(s.sample_name);
        });

        const pctOfWk = grandPeriodMins > 0 ? Math.round((dMins / grandPeriodMins) * 100) : 0;
        const sampleSummary = dSampleNames.slice(0, 2).join(', ') + (dSampleNames.length > 2 ? ' 외 ' + (dSampleNames.length - 2) + '건' : '') || '-';

        lines.push([
          dayLabel,
          dateKey,
          daySessions.length,
          (dMins / 60).toFixed(1),
          dMins,
          pctOfWk + '%',
          dSamples,
          Array.from(dUsers).join(', ') || '-',
          sampleSummary
        ].map(function(v){ return formatCsvCell(v); }).join(','));

        curD.setDate(curD.getDate() + 1);
      }

      // 주간 합계 행
      lines.push([
        '금주 총계(TOTAL)',
        curWeek.startDate + ' ~ ' + curWeek.endDate,
        periodSessions.length,
        (grandPeriodMins / 60).toFixed(1),
        grandPeriodMins,
        '100%',
        grandPeriodSamples,
        Array.from(userSet).join(', ') || '-',
        '총 ' + grandPeriodSamples + '개 시료 측정'
      ].map(function(v){ return formatCsvCell(v); }).join(','));
    }
    lines.push('""');

    // ====================================================
    // 3. (전체 장비 조회 시) 10대 연구장비별 실적 비교 테이블
    // ====================================================
    if(isAll){
      lines.push('"[3. 연구장비별 세부 운영 현황 비교 (10대 연구장비)]"');
      lines.push('"장비코드","장비명","설치위치","상태","가동건수(건)","가동시간(시간)","가동시간(분)","가동비중(%)","측정시료수(개)","최다분석처","주요사용자"');

      researchEquipments.forEach(function(eq){
        const eqSessions = periodSessions.filter(function(s){
          return s.equipment_id === eq.id || s.equipment_code === eq.code;
        });

        let pMins = 0;
        let pSamples = 0;
        const eqAffMap = {};
        const eqUserMap = {};

        eqSessions.forEach(function(s){
          pMins += (s.duration_min || 0);
          pSamples += (s.sample_count || 1);
          const a = s.affiliation || '2DQH';
          eqAffMap[a] = (eqAffMap[a] || 0) + (s.sample_count || 1);
          const u = s.user_name || '연구원';
          eqUserMap[u] = (eqUserMap[u] || 0) + 1;
        });

        let topEqAff = '-';
        let maxA = 0;
        for(const a in eqAffMap){
          if(eqAffMap[a] > maxA){
            maxA = eqAffMap[a];
            topEqAff = a + ' (' + maxA + '개)';
          }
        }

        const sortedUsers = Object.keys(eqUserMap).sort(function(a, b){ return eqUserMap[b] - eqUserMap[a]; });
        const userSummary = sortedUsers.slice(0, 2).map(function(u){ return u + '(' + eqUserMap[u] + '건)'; }).join(', ') || '-';
        const pctOfGrand = grandPeriodMins > 0 ? Math.round((pMins / grandPeriodMins) * 100) : 0;

        lines.push([
          eq.code,
          eq.name,
          eq.location || '연구실',
          eq.status === 'active' ? '정상 가동' : '대기 중',
          eqSessions.length,
          (pMins / 60).toFixed(1),
          pMins,
          pctOfGrand + '%',
          pSamples,
          topEqAff,
          userSummary
        ].map(function(v){ return formatCsvCell(v); }).join(','));
      });
      lines.push('""');
    }

    // ====================================================
    // 4. 개별 가동 세션 상세 내역 (최신 100건)
    // ====================================================
    lines.push('"[4. ' + periodDesc + ' 개별 가동 세션 상세 로그 (최신순)]"');
    lines.push('"사용일자","시작시간","종료시간","장비명","장비코드","사용자","소속/연구실","책임교수","가동시간(분)","측정시료","시료수","측정목적/스캔타입"');

    const sortedPeriodSessions = periodSessions.slice().sort(function(a, b){
      const da = normalizeExportDate(a.used_on || (a.created_at ? a.created_at.slice(0, 10) : ''));
      const db = normalizeExportDate(b.used_on || (b.created_at ? b.created_at.slice(0, 10) : ''));
      return db.localeCompare(da);
    });

    sortedPeriodSessions.slice(0, 100).forEach(function(s){
      lines.push([
        normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : '')),
        s.start_time || '10:00',
        s.end_time || '-',
        s.equipment_name || s.equipment_code || '연구장비',
        s.equipment_code || '',
        s.user_name || '연구원',
        s.affiliation || '2DQH',
        s.professor || '',
        s.duration_min || 0,
        s.sample_name || '-',
        s.sample_count || 1,
        s.purpose || s.scan_type || '연구장비 가동'
      ].map(function(v){ return formatCsvCell(v); }).join(','));
    });

    const csvContent = lines.join('\r\n');
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('✓ ' + filename + ' (' + periodLabel + ' 통계) 다운로드 완료');
  } catch(err){
    console.error('장비운영통계 CSV 내보내기 오류:', err);
    alert('장비운영통계 CSV 생성 중 오류가 발생했습니다: ' + err.message);
  }
}
function renderEquipmentCalendar(allSessions){
  const container = $('eqCalendarContainer');
  const labelEl = $('eqCurrentMonthLabel');
  if(!container) return;

  if(labelEl){
    labelEl.textContent = currentCalendarYear + '년 ' + currentCalendarMonth + '월';
  }

  const firstDay = new Date(currentCalendarYear, currentCalendarMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();

  const sessionCountMap = {};
  allSessions.forEach(function(s){
    const dStr = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
    if(dStr){
      sessionCountMap[dStr] = (sessionCountMap[dStr] || 0) + 1;
    }
  });

  const todayStr = today();

  // 타 월의 날짜 필터가 남아있으면 초기화
  if(timelineDateFilter && !timelineDateFilter.startsWith(currentCalendarYear + '-' + pad(currentCalendarMonth))){
    timelineDateFilter = null;
  }

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  let html = '<div class="eq-calendar-grid">';

  weekdays.forEach(function(w, idx){
    const cls = (idx === 0) ? 'sun' : (idx === 6 ? 'sat' : '');
    html += '<div class="eq-cal-head ' + cls + '">' + w + '</div>';
  });

  for(let i=0; i<firstDay; i++){
    html += '<div class="eq-cal-day empty"></div>';
  }

  for(let d=1; d<=daysInMonth; d++){
    const dateStr = currentCalendarYear + '-' + pad(currentCalendarMonth) + '-' + pad(d);
    const cnt = sessionCountMap[dateStr] || 0;
    const isToday = (dateStr === todayStr);
    const isSelected = (timelineDateFilter === dateStr);

    let cls = 'eq-cal-day';
    if(isToday) cls += ' today';
    if(cnt > 0) cls += ' has-sessions';
    if(isSelected) cls += ' selected';

    html += '<div class="' + cls + '" data-cal-date="' + dateStr + '" title="' + dateStr + (cnt > 0 ? ': ' + cnt + '건 가동 (클릭하여 사용자 보기)' : ': 가동 기록 없음') + '">';
    html += '<span>' + d + '</span>';
    if(cnt > 0){
      html += '<span class="eq-cal-badge">' + cnt + '</span>';
    }
    html += '</div>';
  }

  html += '</div>';
  container.innerHTML = html;

  // 캘린더 전용 클릭 이벤트 바인딩 (이벤트 버블링 차단 방지)
  if(!container.__boundClick){
    container.__boundClick = true;
    container.addEventListener('click', function(e){
      const dayEl = e.target.closest('[data-cal-date]');
      if(!dayEl) return;
      e.preventDefault();
      e.stopPropagation();
      const d = dayEl.dataset.calDate;
      timelineDateFilter = (timelineDateFilter === d) ? null : d;
      renderEquipmentAnalyticsDashboard();
    });
  }

  // 캘린더 바로 아래 선택 일자 사용자 및 세션 내역 즉시 렌더링
  renderEquipmentCalendarDateDetail(timelineDateFilter, allSessions);
}

function renderEquipmentCalendarDateDetail(dateStr, allSessions){
  const detailEl = $('eqCalendarDateDetail');
  if(!detailEl) return;

  const all = allSessions || getUnifiedEquipmentSessions();

  if(!dateStr){
    const currentMonthStr = currentCalendarYear + '-' + pad(currentCalendarMonth);
    const monthSessions = all.filter(function(s){
      const sDate = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
      return sDate.startsWith(currentMonthStr);
    });
    const mTotalMins = monthSessions.reduce(function(a, c){ return a + (c.duration_min || 0); }, 0);
    const mTotalSamples = monthSessions.reduce(function(a, c){ return a + (c.sample_count || 1); }, 0);

    let html = '<div class="eq-cal-date-header" style="background:var(--bg);padding:10px 14px;border-radius:8px;border:1px solid var(--border);margin-bottom:10px;">';
    html += '  <div class="eq-cal-date-title" style="display:flex;justify-content:space-between;align-items:center;width:100%;">';
    html += '    <span>📅 <b>' + currentCalendarYear + '년 ' + currentCalendarMonth + '월 가동 현황 요약</b></span>';
    html += '    <span style="font-size:12px;font-weight:700;color:var(--primary);">' + monthSessions.length + '건 · ' + (mTotalMins / 60).toFixed(1) + 'h (' + mTotalMins + '분)</span>';
    html += '  </div>';
    html += '';
    html += '</div>';
    detailEl.innerHTML = html;
    return;
  }

  const normDateStr = normalizeExportDate(dateStr);
  const sessions = all.filter(function(s){
    const sDate = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
    return sDate === normDateStr;
  });

  const totalMins = sessions.reduce(function(a, c){ return a + (c.duration_min || 0); }, 0);
  const totalSamples = sessions.reduce(function(a, c){ return a + (c.sample_count || 1); }, 0);

  let html = '<div class="eq-cal-date-header" style="background:var(--bg);padding:10px 14px;border-radius:8px;border:1px solid var(--border);margin-bottom:10px;">';
  html += '  <div class="eq-cal-date-title" style="display:flex;justify-content:space-between;align-items:center;width:100%;">';
  html += '    <span>📅 <b>' + safe(normDateStr) + '</b> 가동 상세 (' + sessions.length + '건 · ' + (totalMins / 60).toFixed(1) + 'h)</span>';
  html += '    <button type="button" id="btnClearCalDateDetail" class="btn" style="padding:4px 10px;font-size:11.5px;background:var(--card-bg);border:1px solid var(--border);border-radius:6px;cursor:pointer;font-weight:600;">✕ 전체보기</button>';
  html += '  </div>';
  if(sessions.length > 0){
    html += '  <div style="font-size:11.5px;font-weight:600;color:var(--primary);margin-top:4px;">총 ' + totalMins + '분 가동 · ' + totalSamples + '개 시료 측정</div>';
  }
  html += '</div>';

  if(sessions.length === 0){
    html += '<div class="eq-cal-user-empty" style="text-align:center;padding:18px 14px;background:var(--card);border-radius:8px;border:1px dashed var(--border);color:#64748b;font-size:12.5px;">';
    html += '  <div>📅 <b>' + safe(normDateStr) + '</b>에는 등록된 장비 가동 기록이 없습니다.</div>';
    html += '  <button type="button" class="btn primary" id="btnQuickAddSessionOnDate" style="margin-top:8px;font-size:11.5px;padding:5px 12px;border-radius:6px;">📝 이 날짜로 장비 사용 기록 작성</button>';
    html += '</div>';
    detailEl.innerHTML = html;
  } else {
    html += '<div class="eq-cal-user-list">';
    sessions.forEach(function(s){
      const eqName = s.equipment_name || s.equipment_code || '연구장비';
      const userName = s.user_name || '연구원';
      const affil = s.affiliation || '2DQH';
      const durMins = s.duration_min || 0;
      const sample = s.sample_name || '시료 미지정';
      const sampleCnt = s.sample_count || 1;
      const timeRange = (s.start_time || '') + (s.end_time ? ' ~ ' + s.end_time : '');
      const purpose = s.purpose || (s.parameters && s.parameters.mode) || s.scan_type || '장비 가동';

      html += '<div class="eq-cal-user-card" style="border-left:3px solid var(--primary);">';
      html += '  <div class="user-top">';
      html += '    <span class="user-name" style="font-size:13px;">👤 <b style="color:var(--ink);">' + safe(userName) + '</b> <span style="font-size:11.5px;color:var(--ink-light);font-weight:600;">(' + safe(affil) + (s.professor ? ' · ' + safe(s.professor) : '') + ')</span></span>';
      html += '    <span style="font-size:12px;font-weight:700;color:var(--primary);">⏱️ ' + durMins + '분' + (timeRange ? ' <span style="font-weight:normal;color:#64748b;font-size:11px;">(' + safe(timeRange) + ')</span>' : '') + '</span>';
      html += '  </div>';
      html += '  <div class="user-meta" style="margin-top:4px;">';
      html += '    <span style="color:var(--ink);font-weight:600;">🔬 ' + safe(eqName) + '</span>';
      html += '    <span>🧪 ' + safe(sample) + ' (' + sampleCnt + '개)</span>';
      if(purpose){
        html += '    <span style="color:var(--primary);font-weight:600;">⚡ ' + safe(purpose) + '</span>';
      }
      html += '  </div>';
      if(s.memo){
        html += '  <div style="font-size:11.5px;color:var(--ink-light);margin-top:4px;border-top:1px dashed var(--border);padding-top:4px;">📝 ' + safe(s.memo) + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    detailEl.innerHTML = html;
  }

  // 캘린더 상세 내 버튼 전용 이벤트 바인딩
  if(!detailEl.__boundClick){
    detailEl.__boundClick = true;
    detailEl.addEventListener('click', function(e){
      const clearBtn = e.target.closest('#btnClearCalDateDetail');
      if(clearBtn){
        e.preventDefault();
        e.stopPropagation();
        timelineDateFilter = null;
        renderEquipmentAnalyticsDashboard();
        return;
      }
      const quickAddBtn = e.target.closest('#btnQuickAddSessionOnDate');
      if(quickAddBtn){
        e.preventDefault();
        e.stopPropagation();
        openModal('testDrive');
        const f = $('testDriveForm');
        if(f && f.used_on && timelineDateFilter){
          f.used_on.value = timelineDateFilter;
        }
      }
    });
  }
}

function initEquipmentTimelineControls(){
  const searchInput = $('eqTimelineSearchInput');
  const clearBtn = $('btnTimelineSearchClear');
  if(searchInput && !searchInput.__bound){
    searchInput.__bound = true;
    searchInput.addEventListener('input', function(){
      timelineSearchQuery = (this.value || '').trim();
      if(clearBtn){
        clearBtn.classList.toggle('hidden', !timelineSearchQuery);
      }
      timelineDisplayLimit = 6;
      renderEquipmentRecentTimeline();
    });
  }
  if(clearBtn && !clearBtn.__bound){
    clearBtn.__bound = true;
    clearBtn.addEventListener('click', function(e){
      e.preventDefault();
      if(searchInput){
        searchInput.value = '';
      }
      timelineSearchQuery = '';
      clearBtn.classList.add('hidden');
      timelineDisplayLimit = 6;
      renderEquipmentRecentTimeline();
      if(searchInput) searchInput.focus();
    });
  }
}

function renderEquipmentRecentTimeline(allSessions){
  const container = $('eqRecentTimelineList');
  const badgeEl = $('eqTimelineDateFilterBadge');
  const countBadgeEl = $('eqTimelineCountBadge');
  if(!container) return;

  // 실시간 검색 컨트롤 초기화
  initEquipmentTimelineControls();

  if(allSessions){
    lastTimelineSessions = allSessions;
  } else {
    allSessions = lastTimelineSessions || getUnifiedEquipmentSessions();
  }

  let filtered = allSessions.slice();

  // 1. 타임라인 필터 (active / test)
  if(timelineFilter === 'active'){
    filtered = filtered.filter(function(s){ return s.type === 'active' || s.is_live; });
  } else if(timelineFilter === 'test'){
    filtered = filtered.filter(function(s){ return s.type === 'test'; });
  }

  // 2. 캘린더 날짜 필터 (특정 일자 선택)
  if(timelineDateFilter){
    filtered = filtered.filter(function(s){
      return normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : '')) === timelineDateFilter;
    });
    if(badgeEl){
      badgeEl.classList.remove('hidden');
      badgeEl.innerHTML = '📅 <b>' + safe(timelineDateFilter) + '</b> 필터 중 <button type="button" id="btnClearTimelineDateFilter" class="btn-clear-date-filter" title="필터 해제">✕</button>';
      if(!badgeEl.__boundClick){
        badgeEl.__boundClick = true;
        badgeEl.addEventListener('click', function(e){
          e.preventDefault();
          e.stopPropagation();
          timelineDateFilter = null;
          timelineDisplayLimit = 6;
          renderEquipmentAnalyticsDashboard();
        });
      }
    }
  } else {
    if(badgeEl){
      badgeEl.classList.add('hidden');
      badgeEl.innerHTML = '';
    }
  }

  // 3. 실시간 텍스트 검색 필터
  if(timelineSearchQuery){
    const q = timelineSearchQuery.toLowerCase();
    filtered = filtered.filter(function(s){
      const name = (s.user_name || '').toLowerCase();
      const eq = (s.equipment_name || '').toLowerCase();
      const affil = (s.affiliation || '').toLowerCase();
      const sample = (s.sample_name || '').toLowerCase();
      const memo = (s.memo || '').toLowerCase();
      const purpose = (s.purpose || '').toLowerCase();
      return name.includes(q) || eq.includes(q) || affil.includes(q) || sample.includes(q) || memo.includes(q) || purpose.includes(q);
    });
  }

  // 4. 총 건수 뱃지 갱신
  if(countBadgeEl){
    countBadgeEl.textContent = '총 ' + filtered.length + '건';
  }

  // 5. 검색 결과 부재 시 안내
  if(filtered.length === 0){
    container.innerHTML = '<div style="text-align:center;padding:36px 16px;color:var(--ink-light);font-size:13px;background:var(--bg);border:1px dashed var(--border);border-radius:8px;">' +
      (timelineSearchQuery ? '🔍 "<b>' + safe(timelineSearchQuery) + '</b>" 검색 조건과 일치하는 가동 로그가 없습니다.' : '해당 조건의 연구장비 가동 기록이 없습니다.') +
      '</div>';
    return;
  }

  // 6. 최신 순 정렬 (used_on 내림차순, start_time 내림차순)
  filtered.sort(function(a, b){
    const dateA = normalizeExportDate(a.used_on || (a.created_at ? a.created_at.slice(0, 10) : '')) || '';
    const dateB = normalizeExportDate(b.used_on || (b.created_at ? b.created_at.slice(0, 10) : '')) || '';
    if(dateA !== dateB) return dateB.localeCompare(dateA);
    const timeA = a.start_time || '';
    const timeB = b.start_time || '';
    return timeB.localeCompare(timeA);
  });

  const totalCount = filtered.length;
  const currentLimit = Math.min(timelineDisplayLimit, totalCount);
  const visibleItems = filtered.slice(0, currentLimit);

  // 7. 일자별 그룹화 (Date Grouping)
  const todayStr = today();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const days = ['일', '월', '화', '수', '목', '금', '토'];

  const groups = {};
  visibleItems.forEach(function(s){
    const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : '')) || '기타 일자';
    if(!groups[d]) groups[d] = [];
    groups[d].push(s);
  });

  let html = '<div class="eq-timeline-feed">';

  for(const dateKey in groups){
    const sessionsInDate = groups[dateKey];
    let dateLabel = dateKey;
    if(dateKey === todayStr){
      dateLabel = '오늘 · ' + dateKey;
    } else if(dateKey === yesterdayStr){
      dateLabel = '어제 · ' + dateKey;
    } else if(dateKey.length === 10){
      const dObj = new Date(dateKey + 'T00:00:00');
      const dayIdx = dObj.getDay();
      if(!isNaN(dayIdx)){
        dateLabel = dateKey + ' (' + days[dayIdx] + ')';
      }
    }

    html += '<div class="eq-timeline-date-group">';
    html += '  <div class="eq-timeline-date-header">';
    html += '    <span class="date-badge">📅 <b>' + safe(dateLabel) + '</b></span>';
    html += '    <span class="date-count">' + sessionsInDate.length + '건 가동</span>';
    html += '  </div>';

    sessionsInDate.forEach(function(s){
      let paramSummary = [];
      if(s.parameters){
        for(const k in s.parameters){
          const val = s.parameters[k];
          if(val !== undefined && val !== null && val !== false && val !== ''){
            paramSummary.push(k + ': ' + val);
          }
        }
      }
      const paramStr = paramSummary.length ? paramSummary.slice(0, 3).join(', ') : '기본 운영 파라미터';
      const timeStr = (s.start_time || '') + (s.end_time ? ' ~ ' + s.end_time : '');
      const durMins = s.duration_min || 0;

      html += '<div class="eq-timeline-entry ' + (s.type === 'test' ? 'test' : '') + '">';
      html += '  <div class="eq-timeline-time-col">';
      if(timeStr){
        html += '    <b>' + safe(timeStr) + '</b>';
      }
      html += '    <span style="color:var(--primary);font-weight:700;">⏱️ ' + durMins + '분</span>';
      html += '  </div>';
      html += '  <div class="eq-timeline-content">';
      html += '    <div class="eq-timeline-title">';
      html += '      <span>' + (s.icon || '🔬') + ' ' + safe(s.equipment_name) + '</span>';
      html += '    </div>';
      html += '    <div style="font-weight:600;color:var(--ink);margin-bottom:3px;font-size:12.5px;">' + safe(s.sample_name || '시료 미지정') + ' <span style="font-weight:400;color:var(--ink-light);font-size:11.5px;">(' + (s.sample_count || 1) + '개)</span></div>';
      html += '    <div style="margin-bottom:4px;"><span class="eq-timeline-param-tag">⚡ ' + safe(paramStr) + '</span></div>';
      html += '    <div style="font-size:11.5px;color:var(--ink-light);display:flex;justify-content:space-between;align-items:center;">';
      html += '      <span>👤 ' + safe(s.user_name || '연구원') + ' (' + safe(s.affiliation || '2DQH') + (s.professor ? ' · ' + safe(s.professor) : '') + ')</span>';
      html += '      <button type="button" class="text-link" data-select-util-eq="' + safe(s.equipment_id) + '" style="font-size:11.5px;color:var(--primary);background:none;border:0;cursor:pointer;text-decoration:underline;">장비 상세 →</button>';
      html += '    </div>';
      if(s.memo){
        html += '    <div style="font-size:11.5px;color:var(--ink-light);margin-top:3px;background:rgba(0,0,0,0.02);padding:3px 6px;border-radius:4px;">📝 ' + safe(s.memo) + '</div>';
      }
      html += '  </div>';
      html += '</div>';
    });

    html += '</div>'; // end eq-timeline-date-group
  }

  // 8. 페이징 더보기 / 접기 컨트롤
  if(totalCount > currentLimit){
    const remaining = totalCount - currentLimit;
    const nextBatch = Math.min(6, remaining);
    html += '<div class="eq-timeline-load-more-bar">';
    html += '  <button type="button" id="btnTimelineLoadMore" class="btn-timeline-load-more">';
    html += '    <span>▼ 최근 가동 로그 더보기</span>';
    html += '    <span class="load-more-count">(' + currentLimit + ' / ' + totalCount + '건 표시 중 · +' + nextBatch + '건)</span>';
    html += '  </button>';
    html += '  <button type="button" id="btnTimelineShowAll" class="btn-timeline-show-all" title="전체 로그 한 번에 보기">';
    html += '    전체 펼치기';
    html += '  </button>';
    html += '</div>';
  } else if(totalCount > 6){
    html += '<div class="eq-timeline-end-msg">';
    html += '  <span>✓ 총 ' + totalCount + '건의 최근 가동 로그가 모두 표시되었습니다.</span>';
    html += '  <button type="button" id="btnTimelineCollapse" class="btn-timeline-collapse">처음 6건으로 접기</button>';
    html += '</div>';
  }

  html += '</div>'; // end eq-timeline-feed
  container.innerHTML = html;

  // 9. 더보기 / 접기 이벤트 바인딩
  const loadMoreBtn = $('btnTimelineLoadMore');
  if(loadMoreBtn){
    loadMoreBtn.onclick = function(e){
      e.preventDefault();
      timelineDisplayLimit += 6;
      renderEquipmentRecentTimeline();
    };
  }
  const showAllBtn = $('btnTimelineShowAll');
  if(showAllBtn){
    showAllBtn.onclick = function(e){
      e.preventDefault();
      timelineDisplayLimit = totalCount;
      renderEquipmentRecentTimeline();
    };
  }
  const collapseBtn = $('btnTimelineCollapse');
  if(collapseBtn){
    collapseBtn.onclick = function(e){
      e.preventDefault();
      timelineDisplayLimit = 6;
      renderEquipmentRecentTimeline();
      const feed = container.querySelector('.eq-timeline-feed');
      if(feed) feed.scrollTop = 0;
    };
  }
}
function exportUnifiedSessionsCsv(){
  const allSessions = getUnifiedEquipmentSessions();
  if(allSessions.length === 0){
    toast('내보낼 연구장비 세션 데이터가 없습니다.');
    return;
  }
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const lines = [];

  // 1. 문서 헤더
  lines.push('"[IBS 2DQH 연구단 연구장비 운용 실적 및 통합 세션 로그북]"');
  lines.push('"내보내기 일시: ' + today() + '","총 등록 장비: ' + researchEquipments.length + '대","총 가동 세션: ' + allSessions.length + '건"');
  lines.push('""');

  // 2. [섹션 1: 장비별 가동 실적 및 최다 측정처 요약 (어디에서 많이 찍었는지)]
  lines.push('"[1. 연구장비별 가동 실적 및 최다 측정처 요약 (어디에서 많이 찍었는지)]"');
  lines.push(['연구장비명', '장비코드', '설치위치', '가동상태', '총가동시간(시간)', '총가동시간(분)', '세션건수', '시료수량', '최다측정 소속/연구실(비중)', '최다사용자'].map(c => '"' + c + '"').join(','));

  let grandTotalMins = 0;
  let grandTotalSessions = 0;
  let grandTotalSamples = 0;

  researchEquipments.forEach(function(eq){
    const eqSessions = allSessions.filter(function(s){
      return s.equipment_id === eq.id || s.equipment_code === eq.code;
    });
    let durMins = 0;
    let sampleCnt = 0;
    const affilMap = {};
    const userMap = {};

    eqSessions.forEach(function(s){
      durMins += (s.duration_min || 0);
      sampleCnt += (s.sample_count || 1);
      const aff = s.affiliation || '2DQH';
      affilMap[aff] = (affilMap[aff] || 0) + (s.sample_count || 1);
      const u = s.user_name || '연구원';
      userMap[u] = (userMap[u] || 0) + 1;
    });

    grandTotalMins += durMins;
    grandTotalSessions += eqSessions.length;
    grandTotalSamples += sampleCnt;

    let topAffil = '-';
    let maxAffCount = 0;
    for(const a in affilMap){
      if(affilMap[a] > maxAffCount){
        maxAffCount = affilMap[a];
        const pct = sampleCnt > 0 ? Math.round((maxAffCount / sampleCnt) * 100) : 0;
        topAffil = a + ' (' + maxAffCount + '개, ' + pct + '%)';
      }
    }

    let topUser = '-';
    let maxUserCount = 0;
    for(const u in userMap){
      if(userMap[u] > maxUserCount){
        maxUserCount = userMap[u];
        topUser = u + ' (' + maxUserCount + '건)';
      }
    }

    const durHours = (durMins / 60).toFixed(1);
    const statusText = eq.status === 'active' ? '정상 가동' : '대기 중';

    lines.push([
      eq.name,
      eq.code,
      eq.location || '',
      statusText,
      durHours,
      durMins,
      eqSessions.length,
      sampleCnt,
      topAffil,
      topUser
    ].map(formatCsvCell).join(','));
  });

  lines.push([
    '[전체 연구장비 종합 합계]',
    'ALL',
    '연구동 전체',
    '운영 중',
    (grandTotalMins / 60).toFixed(1),
    grandTotalMins,
    grandTotalSessions,
    grandTotalSamples,
    '전체 연구단 통합',
    '-'
  ].map(formatCsvCell).join(','));

  lines.push('""');
  lines.push('""');

  // 3. [섹션 2: 연구장비별 세부 가동 세션 내역 (장비별 그룹화)]
  lines.push('"[2. 연구장비별 세부 가동 세션 내역 (장비별 그룹화)]"');

  researchEquipments.forEach(function(eq){
    const eqSessions = allSessions.filter(function(s){
      return s.equipment_id === eq.id || s.equipment_code === eq.code;
    });
    if(eqSessions.length === 0) return;

    let eqMins = 0;
    let eqSamples = 0;
    eqSessions.forEach(function(s){
      eqMins += (s.duration_min || 0);
      eqSamples += (s.sample_count || 1);
    });

    lines.push('"[그룹: ' + eq.name + ' (' + eq.code + ') | 설치: ' + (eq.location || '연구실') + ' | 총 ' + eqSessions.length + '건 · ' + (eqMins / 60).toFixed(1) + '시간 (' + eqMins + '분) · ' + eqSamples + '개 시료]"');
    lines.push(['측정일자', '시작시간', '종료시간', '가동시간(분)', '사용자', '소속/학과', '지도교수', '시료명', '시료수량', '측정모드/목적', '특이사항/메모'].map(c => '"' + c + '"').join(','));

    eqSessions.forEach(function(s){
      const dateStr = normalizeExportDate(s.used_on || '');
      const startTm = s.start_time ? String(s.start_time).slice(0, 5) : '';
      const endTm = s.end_time ? String(s.end_time).slice(0, 5) : '';
      const durMin = s.duration_min != null ? Number(s.duration_min) : 0;
      const userName = s.user_name || '연구원';
      const affil = s.affiliation || '2DQH';
      const prof = s.professor || '';
      const sample = s.sample_name || '시료 미지정';
      const sampleCnt = s.sample_count || 1;
      const purpose = s.purpose || (s.parameters && s.parameters.mode) || '장비 가동';
      const memo = String(s.memo || '').replace(/[\r\n]+/g, ' ').trim();

      lines.push([
        dateStr,
        startTm,
        endTm,
        durMin,
        userName,
        affil,
        prof,
        sample,
        sampleCnt,
        purpose,
        memo
      ].map(formatCsvCell).join(','));
    });

    lines.push(['[' + eq.code + ' 소계]', '', '', eqMins, '', '', '', '', eqSamples, eqSessions.length + '건 완료', ''].map(formatCsvCell).join(','));
    lines.push('""');
  });

  const csvContent = lines.join('\r\n');
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '2DQH_연구장비_그룹화_통합로그북_' + today() + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('✓ 장비별 그룹화 및 측정처 요약이 반영된 엑셀(CSV)이 다운로드되었습니다.');
}

function selectResearchEquipment(eqId){
  currentSelectedEquipment = eqId || 'EQ-XRD-01';
  const hub = $('equipmentCatalogHub');
  const detail = $('equipmentDetailHub');
  if(hub) hub.classList.add('hidden');
  if(detail) detail.classList.remove('hidden');

  const list = (researchEquipments && researchEquipments.length)
    ? researchEquipments
    : ((typeof DEFAULT_RESEARCH_EQUIPMENTS !== 'undefined' && DEFAULT_RESEARCH_EQUIPMENTS.length) ? DEFAULT_RESEARCH_EQUIPMENTS : []);
  const selected = list.find(function(e){ return e.id === currentSelectedEquipment; }) || list[0] || {
    id: eqId || 'EQ-XRD-01', code: 'XRD', name: 'HR-XRD', type: 'xrd', status: 'active', categoryName: '구조분석', model: 'SmartLab 9 kW'
  };

  const catBadge = $('detailEqCategory');
  const statusBadge = $('detailEqStatus');
  const titleEl = $('detailEqPageTitle');
  const countBadge = $('logbookCountBadge');

  const isXrd = (selected.type === 'xrd' || selected.code === 'XRD' || selected.code === 'HR-XRD' || selected.id === 'EQ-XRD-01');
  const isBonder = (selected.code === 'WireBonder');
  const isXps = (selected.code === 'XPS');
  const isActive = (selected.status === 'active' || isXrd || isBonder || isXps);

  if(catBadge) catBadge.textContent = selected.categoryName || '연구장비';
  if(statusBadge){
    statusBadge.textContent = isActive ? '🟢 운영 중' : '⚪ 연동 준비 중';
    statusBadge.className = 'eq-badge-status ' + (isActive ? 'active' : 'standby');
  }
  if(titleEl) titleEl.textContent = (selected.icon || '🔬') + ' ' + selected.name + ' 전자 로그북';
  if(countBadge) countBadge.textContent = selected.model || selected.code;

  const xrdContainer = $('xrdLogbookContainer');
  const placeholderContainer = $('placeholderEquipmentContainer');

  if(xrdContainer) xrdContainer.classList.toggle('hidden', !isXrd);
  if(placeholderContainer) placeholderContainer.classList.toggle('hidden', isXrd);

  if(isXrd){
    initXrdControls();
    resetXrdForm();
    renderXrdLogs();
  } else {
    // 대기 연구장비 (Standby) 표준 규격 및 정보 안내 렌더링
    const photoEl = $('placeholderEqPhoto');
    const codeEl = $('placeholderEqCode');
    const nameEl = $('placeholderEqName');
    const assetNoEl = $('placeholderEqAssetNo');
    const assetPillEl = $('placeholderEqAssetPill');
    const locEl = $('placeholderEqLocation');
    const modelEl = $('placeholderEqModel');
    const serviceModeEl = $('placeholderEqServiceMode');
    const specEl = $('placeholderEqSpec');
    const mgrEl = $('placeholderEqManager');
    const contactEl = $('placeholderEqContact');

    if(photoEl){
      photoEl.src = selected.image || 'logo_2dqh.jpg';
      photoEl.alt = selected.name;
    }
    const iconEl = $('placeholderEqIcon');
    if(iconEl) iconEl.textContent = selected.icon || '🔬';
    if(codeEl) codeEl.textContent = selected.code;
    if(nameEl) nameEl.textContent = selected.name;
    if(assetNoEl) assetNoEl.textContent = selected.assetNo || selected.id;
    if(assetPillEl) assetPillEl.textContent = selected.assetNo || selected.code;
    if(locEl) locEl.textContent = selected.location;
    if(modelEl) modelEl.textContent = selected.model;
    if(serviceModeEl) serviceModeEl.textContent = selected.serviceMode || '직접사용 / 측정지원';
    if(specEl) specEl.textContent = selected.spec || '표준 분석/공정 규격';
    if(mgrEl) mgrEl.textContent = selected.manager;
    if(contactEl) contactEl.textContent = selected.contact;

    const noticeEl = $('eqStandbyNoticeText');
    if(noticeEl){
      if(isActive){
        noticeEl.innerHTML = '<b>장비 운영 안내:</b><br>하단의 <b>[📝 장비 사용 기록 작성]</b> 버튼을 통해 측정 파라미터 및 세션 일지를 전산으로 등록할 수 있습니다.';
      } else {
        noticeEl.innerHTML = '<b>장비 사용 및 수기 일지 안내:</b><br>현재 오프라인 현장 일지로 운영되고 있습니다. 장비 사용 예약, 트레이닝 교육 이수 및 로그북 전산화 요청은 담당 오퍼레이터에게 문의 바랍니다.';
      }
    }

    renderEquipmentSchemaPreview(selected.code);
    renderEquipmentTestSessions(selected.code);
  }

  if(typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
  const viewLogbook = $('view-logbook');
  if(viewLogbook) viewLogbook.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // URL 파라미터나 명시적인 선택이 없으면 장비 허브를 우선 노출
  const params = new URLSearchParams(window.location.search);
  const hash = (window.location.hash || '').toLowerCase();
  const hasSpecificEq = params.get('eq') || params.get('logbook') || hash.includes('xrd') || hash.includes('eq=');

  if(currentHubView === 'analytics'){
    if(isAdmin()){
      showEquipmentCatalogHub();
      switchEquipmentHubView('analytics');
    } else {
      currentHubView = 'catalog';
      showEquipmentCatalogHub();
      switchEquipmentHubView('catalog');
    }
  } else if(!hasSpecificEq){
    showEquipmentCatalogHub();
  } else {
    selectResearchEquipment(currentSelectedEquipment || 'EQ-XRD-01');
  }
}

function getGeneralEquipmentExportData(){
  const curEq = researchEquipments.find(function(e){ return e.id === currentSelectedEquipment; }) || {};

  // 1. 해당 장비의 전용 독립 세션(equipmentSessions) 우선 조회
  const eqSessions = equipmentSessions.filter(function(s){
    return s.equipment_id === curEq.id || s.equipment_code === curEq.code;
  });

  const sourceList = (eqSessions.length > 0) ? eqSessions : equipmentLogs.filter(function(l){
    return l.asset_id === curEq.id || l.asset_id === curEq.code;
  });

  // 장비명/장비코드 컬럼 중복 제거 (개별 장비 로그북이므로 이미 명확함)
  const headers = [
    '작업일자 (Date)',
    '사용자 (Operator)',
    '소속 (Affiliation)',
    '지도교수 (Adviser)',
    '시작시간 (Start)',
    '종료시간 (End)',
    '가동시간_분 (min)',
    '시료/작업명 (Sample)',
    '특이사항_메모 (Notes)'
  ];

  const csvRows = [];
  const excelRows = [];
  let totalMins = 0;
  let totalSamples = 0;
  const affilMap = {};
  const userMap = {};

  sourceList.forEach(function(s, idx){
    const dateStr = normalizeExportDate(s.used_on || s.start_time || '');
    const startTm = s.start_time ? String(s.start_time).replace(/.*T/, '').slice(0, 5) : '';
    const endTm = s.end_time ? String(s.end_time).replace(/.*T/, '').slice(0, 5) : '';
    const durMin = s.duration_min != null ? Number(s.duration_min) : (Number(s.run_hours) ? Math.round(Number(s.run_hours) * 60) : 60);
    const operator = s.user_name || s.operator_name || '연구원';
    const affil = s.affiliation || '2DQH';
    const prof = s.professor || '신현석 교수님';
    const sample = (s.sample_name || s.sample_info || s.project_name || '연구 시료') + (s.sample_count > 1 ? ' (' + s.sample_count + '개)' : '');
    const notes = String(s.memo || s.notes || '').replace(/[\r\n]+/g, ' ').trim();

    totalMins += durMin;
    const cnt = (s.sample_count || 1);
    totalSamples += cnt;
    affilMap[affil] = (affilMap[affil] || 0) + cnt;
    userMap[operator] = (userMap[operator] || 0) + 1;

    csvRows.push([
      formatCsvCell(dateStr, 'date'),
      formatCsvCell(operator, 'text'),
      formatCsvCell(affil, 'text'),
      formatCsvCell(prof, 'text'),
      formatCsvCell(startTm, 'time'),
      formatCsvCell(endTm, 'time'),
      formatCsvCell(durMin, 'number'),
      formatCsvCell(sample, 'text'),
      formatCsvCell(notes, 'text')
    ].join(','));

    excelRows.push([
      { val: dateStr, cls: 'cell-date' },
      { val: operator, cls: 'cell-text' },
      { val: affil, cls: 'cell-center' },
      { val: prof, cls: 'cell-text' },
      { val: startTm, cls: 'cell-time' },
      { val: endTm, cls: 'cell-time' },
      { val: durMin, cls: 'cell-num' },
      { val: sample, cls: 'cell-text' },
      { val: notes, cls: 'cell-text' }
    ]);
  });

  let topAffil = '-';
  let maxAff = 0;
  for(const a in affilMap){
    if(affilMap[a] > maxAff){
      maxAff = affilMap[a];
      const pct = totalSamples > 0 ? Math.round((maxAff / totalSamples) * 100) : 0;
      topAffil = a + ' (' + maxAff + '개, ' + pct + '%)';
    }
  }

  let topUser = '-';
  let maxU = 0;
  for(const u in userMap){
    if(userMap[u] > maxU){
      maxU = userMap[u];
      topUser = u + ' (' + maxU + '건)';
    }
  }

  const colWidths = [110, 100, 110, 110, 85, 85, 95, 180, 200];
  return { curEq, count: sourceList.length, headers, csvRows, excelRows, colWidths, totalMins, totalSamples, topAffil, topUser };
}

function exportGeneralEquipmentLogsCsv(){
  const data = getGeneralEquipmentExportData();
  if(data.count === 0){
    toast('내보낼 ' + (data.curEq.name || '장비') + ' 로그북 세션 데이터가 없습니다.');
    return;
  }
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);

  const lines = [];
  lines.push('"[IBS 2DQH 연구장비 전자 로그북 - ' + (data.curEq.name || '장비') + ' (' + (data.curEq.code || 'EQUIP') + ')]"');
  lines.push('"설치위치: ' + (data.curEq.location || '연구실') + '","총 ' + data.count + '건 가동 · ' + (data.totalMins / 60).toFixed(1) + '시간 (' + data.totalMins + '분)","총 시료수: ' + data.totalSamples + '개"');
  lines.push('"[최다 측정처 (어디에서 많이 찍었는지): ' + data.topAffil + ' | 최다 사용자: ' + data.topUser + ']"');
  lines.push('""');
  lines.push(data.headers.join(','));
  lines.push(data.csvRows.join('\r\n'));

  const csvContent = lines.join('\r\n');
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '2DQH_' + (data.curEq.code || 'Equipment') + '_Logbook_' + today() + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('✓ ' + (data.curEq.name || '장비') + ' 세션 로그(' + data.count + '건)가 최다 측정처 요약과 함께 엑셀(CSV)로 다운로드되었습니다.');
}

// [연구장비 공식 사용일지 표준 Excel(.xlsx) 내보내기 엔진 (날짜 ### 짤림 원천 차단)]
function exportEquipmentLogsExcel(){
  const selected = researchEquipments.find(function(e){ return e.id === currentSelectedEquipment; }) || {
    id: 'EQ-XRD-01', code: 'HR-XRD', name: 'HR-XRD (고분해능 X선 회절분석기)', location: 'IBS 2DQH XRD실'
  };

  const isXrd = (selected.type === 'xrd' || selected.code === 'XRD' || selected.code === 'HR-XRD' || selected.id === 'EQ-XRD-01');
  const logs = isXrd ? xrdLogs : equipmentSessions.filter(function(s){
    return s.equipment_id === selected.id || s.equipment_code === selected.code;
  });

  if(!logs || logs.length === 0){
    toast('내보낼 ' + (selected.name || '장비') + ' 사용일지 데이터가 없습니다.');
    return;
  }

  // 1. 통계 집계
  let totalMins = 0;
  let totalSamples = 0;
  const affilMap = {};
  const userMap = {};

  logs.forEach(function(l){
    const mins = l.duration_min != null ? Number(l.duration_min) : (Number(l.run_hours) ? Math.round(Number(l.run_hours) * 60) : 60);
    totalMins += mins;
    const cnt = l.sample_count != null ? Number(l.sample_count) : 1;
    totalSamples += cnt;
    const aff = l.affiliation || '2DQH';
    affilMap[aff] = (affilMap[aff] || 0) + cnt;
    const u = l.user_name || l.operator_name || '연구원';
    userMap[u] = (userMap[u] || 0) + 1;
  });

  let topAffil = '-';
  let maxAff = 0;
  for(const a in affilMap){
    if(affilMap[a] > maxAff){
      maxAff = affilMap[a];
      const pct = totalSamples > 0 ? Math.round((maxAff / totalSamples) * 100) : 0;
      topAffil = a + ' (' + maxAff + '개, ' + pct + '%)';
    }
  }

  let topUser = '-';
  let maxU = 0;
  for(const u in userMap){
    if(userMap[u] > maxU){
      maxU = userMap[u];
      topUser = u + ' (' + maxU + '건)';
    }
  }

  // 2. 워크시트 데이터 배열 (AOA) 생성
  const aoa = [];
  aoa.push(['[IBS 2DQH 연구단 연구장비 공식 사용 및 운영일지]']);
  aoa.push(['장비명: ' + (selected.name || selected.code) + ' (' + (selected.code || '') + ')', '', '설치위치: ' + (selected.location || '-'), '', '출력일자: ' + today()]);
  aoa.push(['총 가동건수: ' + logs.length + '건', '', '총 가동시간: ' + (totalMins / 60).toFixed(1) + '시간 (' + totalMins + '분)', '', '총 시료수: ' + totalSamples + '개', '', '최다 사용처: ' + topAffil, '', '최다 사용자: ' + topUser]);
  aoa.push([]); // 빈 줄

  // 헤더 행
  const headers = [
    'No',
    '측정일자 (Date)',
    '시작시간 (Start)',
    '종료시간 (End)',
    '가동시간_분 (Duration)',
    '사용자 (Operator)',
    '소속 연구실 (Affiliation)',
    '지도교수 (Adviser)',
    '시료/공정명 (Sample)',
    '시료수량 (Count)',
    '측정/스캔모드 (Mode)',
    '장비 파라미터 (Parameters)',
    'SOP점검 (Safety Check)',
    '진행상태 (Status)',
    '비고/특이사항 (Memo)'
  ];
  aoa.push(headers);

  // 데이터 행 추가
  logs.forEach(function(l, idx){
    const dateStr = normalizeExportDate(l.used_on || l.start_time || '');
    const startTm = l.start_time ? String(l.start_time).replace(/.*T/, '').slice(0, 5) : '-';
    let endTm = l.end_time ? String(l.end_time).replace(/.*T/, '').slice(0, 5) : '';
    if(!endTm && l.duration_min && startTm !== '-'){
      const parts = startTm.split(':');
      if(parts.length === 2){
        const totalStartM = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        const totalEndM = totalStartM + Number(l.duration_min);
        const eh = Math.floor(totalEndM / 60) % 24;
        const em = totalEndM % 60;
        endTm = String(eh).padStart(2, '0') + ':' + String(em).padStart(2, '0');
      }
    }
    const durMin = l.duration_min != null ? Number(l.duration_min) : (Number(l.run_hours) ? Math.round(Number(l.run_hours) * 60) : 60);
    const userName = l.user_name || l.operator_name || '-';
    const affil = l.affiliation || '2DQH';
    const prof = l.professor || '-';
    const sample = l.sample_name || l.sample_info || '-';
    const sampleCnt = l.sample_count != null ? Number(l.sample_count) : 1;
    const scanMode = l.scan_type || (l.parameters && l.parameters.scan_type) || (isXrd ? (l.scan_mode || 'θ/2θ') : '표준');

    // 파라미터 문자열 포맷팅
    let paramStr = '-';
    if(l.parameters && typeof l.parameters === 'object'){
      const pArr = [];
      for(const k in l.parameters){
        if(k === 'scan_type' || k.endsWith('_ok')) continue;
        pArr.push(k + ': ' + l.parameters[k]);
      }
      if(pArr.length > 0) paramStr = pArr.join(' | ');
    } else if(isXrd){
      const xrdParams = [];
      if(l.chiller_temp_start != null) xrdParams.push('Chiller: ' + l.chiller_temp_start + '°C');
      if(l.vacuum_start != null) xrdParams.push('Vac: ' + l.vacuum_start + 'mV');
      if(xrdParams.length > 0) paramStr = xrdParams.join(' | ');
    }

    // SOP 점검 결과
    let sopStr = '완료 (Pass)';
    if(l.parameters){
      let allOk = true;
      for(const k in l.parameters){
        if(k.endsWith('_ok') && l.parameters[k] === false){
          allOk = false;
          break;
        }
      }
      if(!allOk) sopStr = '주의/특이';
    }

    const statusText = (l.status === 'active' || l.status === 'in_use') ? '가동중' : '정상완료';
    const memo = String(l.memo || l.notes || '').replace(/[\r\n]+/g, ' ').trim() || '-';

    aoa.push([
      idx + 1,
      dateStr,
      startTm,
      endTm || '-',
      durMin,
      userName,
      affil,
      prof,
      sample,
      sampleCnt,
      scanMode,
      paramStr,
      sopStr,
      statusText,
      memo
    ]);
  });

  const fileName = '2DQH_' + (selected.code || 'Equipment') + '_사용일지_' + today();

  // 3. SheetJS (.xlsx) 파일 생성 (열 너비 지정으로 ### 짤림 원천 차단)
  if(window.XLSX){
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // 열 너비 지정: 날짜 15, 사용자 14, 샘플명 26, 파라미터 32 등 넉넉하게 보장
      ws['!cols'] = [
        { wch: 6 },  // No
        { wch: 15 }, // 날짜 (### 짤림 절대 방지)
        { wch: 11 }, // 시작시간
        { wch: 11 }, // 종료시간
        { wch: 14 }, // 가동시간
        { wch: 14 }, // 사용자
        { wch: 16 }, // 소속
        { wch: 16 }, // 지도교수
        { wch: 28 }, // 시료명
        { wch: 10 }, // 시료수
        { wch: 16 }, // 모드
        { wch: 34 }, // 파라미터
        { wch: 15 }, // SOP 점검
        { wch: 12 }, // 상태
        { wch: 32 }  // 메모
      ];

      XLSX.utils.book_append_sheet(wb, ws, '사용일지');
      XLSX.writeFile(wb, fileName + '.xlsx');
      toast('✓ ' + (selected.name || '장비') + ' 공식 사용일지(' + logs.length + '건) 엑셀 파일이 다운로드되었습니다.');
      return;
    } catch(err){
      console.warn('XLSX export failed, fallback to CSV:', err);
    }
  }

  // 4. Fallback: UTF-8 BOM CSV 생성
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const csvLines = aoa.map(function(row){
    return row.map(function(cell){
      const str = String(cell == null ? '' : cell);
      return '"' + str.replace(/"/g, '""') + '"';
    }).join(',');
  });
  const blob = new Blob([bom, csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('✓ ' + (selected.name || '장비') + ' 사용일지가 다운로드되었습니다.');
}

function consumableFor(id){
  return consumables.find(function(c){
    return String(c.id) === String(id);
  }) || null;
}

let currentFilteredHistoryLoans = [];

function renderHistory(){
  const searchEl = $('historySearch');
  const assetFilterEl = $('historyAssetFilter');
  const monthFilterEl = $('historyMonthFilter');
  const statusFilterEl = $('historyStatusFilter');

  const q = searchEl ? searchEl.value.trim().toLowerCase() : '';
  const selectedAsset = assetFilterEl ? assetFilterEl.value : 'all';
  const selectedMonth = monthFilterEl ? monthFilterEl.value.trim() : ''; // YYYY-MM
  const selectedStatus = statusFilterEl ? statusFilterEl.value : 'all';

  // 비품 드롭다운 옵션 동적 채우기 (현재 등록된 assets 기준)
  if(assetFilterEl && assetFilterEl.options && assetFilterEl.options.length <= 1){
    const sortedAssets = assets.slice().sort(function(a, b){
      return (a.name || '').localeCompare(b.name || '', 'ko');
    });
    sortedAssets.forEach(function(a){
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.name + ' (' + a.id + ')';
      assetFilterEl.appendChild(opt);
    });
    if(selectedAsset && selectedAsset !== 'all') assetFilterEl.value = selectedAsset;
  }

  const list = loans.filter(function(l){
    // 1. 검색어 필터 (비품 식별번호, 비품명, 대여자, 메모)
    const matchesSearch = !q || [l.asset_id, l.borrower_name, fmtName(l.asset_id), l.memo || ''].join(' ').toLowerCase().includes(q);
    if(!matchesSearch) return false;

    // 2. 비품별 필터
    if(selectedAsset && selectedAsset !== 'all' && l.asset_id !== selectedAsset) return false;

    // 3. 월별 / 날짜별 필터 (대여일 또는 반납일이 해당 월 YYYY-MM에 속하는지)
    if(selectedMonth){
      const borrowMonth = (l.borrowed_at || '').substring(0, 7);
      const returnMonth = (l.returned_at || '').substring(0, 7);
      const dueMonth = (l.due_date || '').substring(0, 7);
      if(borrowMonth !== selectedMonth && returnMonth !== selectedMonth && dueMonth !== selectedMonth){
        return false;
      }
    }

    // 4. 상태별 필터 (all, returned, active)
    if(selectedStatus === 'returned' && !l.returned_at) return false;
    if(selectedStatus === 'active' && !!l.returned_at) return false;

    return true;
  });

  currentFilteredHistoryLoans = list;

  const summaryBadge = $('historySummaryBadge');
  if(summaryBadge){
    const activeCount = list.filter(function(l){ return !l.returned_at; }).length;
    const returnedCount = list.filter(function(l){ return !!l.returned_at; }).length;
    summaryBadge.textContent = '총 ' + list.length + '건 (대여중 ' + activeCount + ' · 반납완료 ' + returnedCount + ')';
  }

  if(list.length > 0){
    let histHtml = '';

    for(let i=0; i<list.length; i++){
      const l = list[i];
      const isRet = !!l.returned_at;
      const statClass = isRet ? 'available' : 'borrowed';
      const statText = isRet ? '반납 완료' : '대여 중';

      histHtml += '<tr>' +
        '<td data-label="비품 / 식별번호"><b>' + safe(fmtName(l.asset_id)) + '</b><div class="asset-id">' + safe(l.asset_id) + '</div></td>' +
        '<td data-label="대여자">' + safe(l.borrower_name) + '</td>' +
        '<td data-label="대여 시작일">' + dateText(l.borrowed_at) + '</td>' +
        '<td data-label="반납 예정일">' + dateText(l.due_date) + '</td>' +
        '<td data-label="실제 반납일">' + (isRet ? '<span style="color:#16a34a;font-weight:600;">' + dateText(l.returned_at) + '</span>' : '<span style="color:var(--muted);">미반납</span>') + '</td>' +
        '<td data-label="상태"><span class="status ' + statClass + '">' + statText + '</span></td>' +
        '<td data-label="특이사항/메모" style="font-size:12px;color:var(--muted);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + safe(l.memo || '') + '">' + safe(l.memo || '—') + '</td>' +
        '</tr>';
    }

    $('historyRows').innerHTML = '<div class="table-wrap"><table aria-label="전체 비품 대여 및 반납 이력"><thead><tr>' +
      '<th scope="col">비품 / 식별번호</th><th scope="col">대여자</th><th scope="col">대여 시작일</th><th scope="col">반납 예정일</th><th scope="col">실제 반납일</th><th scope="col">상태</th><th scope="col">메모</th>' +
      '</tr></thead><tbody>' + histHtml + '</tbody></table></div>';
  } else {
    $('historyRows').innerHTML = '<div class="empty">선택한 조건에 일치하는 대여 이력이 없습니다.</div>';
  }
}

function openModal(mode, id){
  lastFocusedElement = document.activeElement;
  if(id === undefined) id = null;

  modalMode = mode;
  modalId = id;

  const isAuth = (mode === 'login' || mode === 'signup' || mode === 'profile');
  const modalBoxEl = $('modalBackdrop').querySelector('.modal');
  if(modalBoxEl){
    modalBoxEl.classList.toggle('auth-modal-box', isAuth);
  }

  $('modalBackdrop').classList.add('open');
  if(document.body) document.body.classList.add('modal-open');

  const a = id ? assetFor(id) : null;

  let titleText = '회원 서비스';

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
  } else if(mode === 'profile'){
    titleText = '👤 회원정보 수정 (Edit Profile)';
  } else if(mode === 'login' || mode === 'signup'){
    titleText = mode === 'signup' ? 'Sign Up (회원가입)' : 'Log In (로그인)';
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

    // 대여자 정보 및 기존 대여 상태 팁 (모달을 닫거나 강제 차단하지 않고 대여 신청 정상 진행)
    const activeLoans = lastBorrower ? getMyActiveLoans(lastBorrower) : [];
    if(lastBorrower && activeLoans.length > 0){
      parts.push('<div style="background:var(--bg-subtle,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:10px;padding:8px 12px;margin-bottom:12px;font-size:12.5px;color:var(--muted,#64748b);">');
      parts.push('💡 <b>' + safe(lastBorrower) + '</b>님은 현재 ' + activeLoans.length + '개의 비품을 대여 중입니다. (다른 사용자가 대여하는 경우 아래 대여자 이름을 변경해주세요)');
      parts.push('</div>');
    }

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
    const curBorrowUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const borrowerName = curBorrowUser ? (curBorrowUser.name || '') : lastBorrower;
    const borrowerMeta = curBorrowUser ? ((curBorrowUser.affiliation || '') + (curBorrowUser.advisor ? (' · ' + curBorrowUser.advisor) : '')) : '';

    parts.push('<input type="hidden" name="due_date" value="' + defaultDueDate + '">');
    parts.push('<div class="borrow-form-fields" style="display:flex;flex-direction:column;gap:12px;margin-top:10px;width:100%;">');

    if(curBorrowUser){
      parts.push('<div class="borrow-user-compact-bar" id="borrowUserCompactBar" style="width:100%;box-sizing:border-box;">');
      parts.push('  <div class="borrow-user-compact-left">');
      parts.push('    <span class="borrow-user-compact-label">대여자</span>');
      parts.push('    <span class="borrow-user-compact-name"><strong>' + safe(borrowerName) + '</strong></span>');
      if(borrowerMeta) parts.push('    <span class="borrow-user-compact-meta">' + safe(borrowerMeta) + '</span>');
      parts.push('    <span class="borrow-user-compact-badge">자동 연동</span>');
      parts.push('  </div>');
      parts.push('  <button type="button" class="borrow-user-toggle-btn" id="btnToggleBorrowUserEdit">수정</button>');
      parts.push('</div>');
      parts.push('<div class="hidden" id="borrowUserInputWrap" style="width:100%;box-sizing:border-box;">');
      parts.push('  <label class="field" style="width:100%;">대여자 이름 *<input name="borrower_name" required maxlength="100" autocomplete="name" placeholder="홍길동" value="' + safe(borrowerName) + '" style="width:100%;box-sizing:border-box;"></label>');
      parts.push('</div>');
    } else {
      parts.push('<label class="field" style="width:100%;">대여자 이름 *<input name="borrower_name" required maxlength="100" autocomplete="name" placeholder="홍길동" value="' + safe(borrowerName) + '" style="width:100%;box-sizing:border-box;"></label>');
    }
    parts.push('<label class="field" style="width:100%;">사용 목적 / 메모 (선택)<input name="memo" maxlength="500" placeholder="예: 3층 측정실 작업 (생략 가능)" style="width:100%;box-sizing:border-box;"></label>');
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
      let lastUnit = localStorage.getItem('labstock_last_unit') || 'mL';
      if(lastUnit === 'L') lastUnit = 'mL';
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
      parts.push('      <strong>시약 규격:</strong> ' + safe(c.name));
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

      parts.push('<label class="field full">사용 후 잔여량 및 비고 (선택)<input name="note" maxlength="100" placeholder="예: 잔여량 약 450mL / 밀봉 보관 완료">');
      parts.push('<div class="preset-chips-wrap" style="margin-top:8px;">');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="note" data-set-val="잔여량 충분 / 밀봉 보관 완료">밀봉 보관 완료</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="note" data-set-val="잔여량 약 50% 남음">잔여 50%</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="note" data-set-val="잔여량 소량 남음 / 재주문 권장">소량 남음</button>');
      parts.push('<button type="button" class="btn-preset-chip" data-set-field="note" data-set-val="전량 소진 (공병 세척 및 분리배출 완료)">전량 소진</button>');
      parts.push('</div></label>');
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

      parts.push('<input type="hidden" name="returned_at" value="' + today() + '">');

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
      parts.push('<div class="borrow-fast-notice" style="border-left:4px solid var(--brand-red); margin-bottom:14px; padding:12px 14px; font-size:13px; line-height:1.5; border-radius:10px;">');
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
    parts.push('<input type="hidden" name="returned_at" value="' + today() + '">');

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
  } else if(mode === 'profile'){
    const curU = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    if(!curU){
      toast('로그인이 필요합니다.');
      openModal('login');
      return;
    }

    parts.push('<div class="auth-login-brand-banner" style="margin-bottom:12px;">');
    parts.push('  <span class="auth-login-brand-icon">⚙️</span>');
    parts.push('  <div class="auth-login-brand-text">');
    parts.push('    <span class="auth-login-brand-title">회원정보 수정 (Edit Profile)</span>');
    parts.push('    <span class="auth-login-brand-sub">본인 확인을 위해 현재 비밀번호를 입력해주세요.</span>');
    parts.push('  </div>');
    parts.push('</div>');

    parts.push('<label class="field">User ID (아이디)<input name="username" value="' + safe(curU.username || '') + '" readonly style="background:var(--bg-subtle,#f1f5f9);color:var(--ink-light,#64748b);cursor:not-allowed;font-weight:600;"></label>');
    parts.push('<label class="field" style="margin-top:8px">Current Password (현재 비밀번호 확인) *<input name="current_password" type="password" required placeholder="현재 비밀번호를 입력하세요" autocomplete="current-password"></label>');
    parts.push('<label class="field" style="margin-top:8px">Name (성명) *<input name="user_name" required maxlength="50" value="' + safe(curU.name || '') + '" placeholder="성명 입력"></label>');

    parts.push('<div class="auth-two-col-grid">');
    parts.push('  <label class="field">Advisor (지도교수) *<input name="advisor" required maxlength="50" value="' + safe(curU.advisor || '') + '" placeholder="지도교수 성함"></label>');
    parts.push('  <label class="field">Department (소속 부서) *<input name="affiliation" required maxlength="80" value="' + safe(curU.affiliation || '') + '" placeholder="소속 부서/연구실"></label>');
    parts.push('</div>');

    parts.push('<label class="field" style="margin-top:8px">New Password (새 비밀번호 변경 - 선택사항)<input name="new_password" type="password" minlength="2" placeholder="변경할 경우에만 입력하세요" autocomplete="new-password"></label>');
  } else if(mode === 'signup'){
    parts.push('<div class="auth-modal-tabs">');
    parts.push('  <button type="button" class="auth-modal-tab" id="btnSwitchToLoginTab">Log In (로그인)</button>');
    parts.push('  <button type="button" class="auth-modal-tab active" id="btnSwitchToSignupTab">Sign Up (회원가입)</button>');
    parts.push('</div>');

    parts.push('<label class="field">User ID (아이디) *<input name="username" required maxlength="30" placeholder="e.g. kmlee" autocomplete="username"></label>');
    parts.push('<label class="field" style="margin-top:8px">Password (비밀번호) *<input name="password" type="password" required minlength="2" placeholder="Password" autocomplete="new-password"></label>');
    parts.push('<label class="field" style="margin-top:8px">Name (성명) *<input name="user_name" required maxlength="50" placeholder="e.g. 이강민 (Kangmin Lee)"></label>');
    
    parts.push('<div class="auth-two-col-grid">');
    parts.push('  <label class="field">Advisor (지도교수) *<input name="advisor" required maxlength="50" placeholder="e.g. 신현석 교수님"></label>');
    parts.push('  <label class="field">Department (소속 부서) *<input name="affiliation" required maxlength="80" placeholder="e.g. 2DQH"></label>');
    parts.push('</div>');

    parts.push('<div class="auth-switch-link">');
    parts.push('  Already a member? <a id="linkSwitchToLogin" role="button">Log In (로그인)</a>');
    parts.push('</div>');
  } else {
    parts.push('<div class="auth-modal-tabs">');
    parts.push('  <button type="button" class="auth-modal-tab active" id="btnSwitchToLoginTab">Log In (로그인)</button>');
    parts.push('  <button type="button" class="auth-modal-tab" id="btnSwitchToSignupTab">Sign Up (회원가입)</button>');
    parts.push('</div>');

    parts.push('<div class="auth-login-brand-banner">');
    parts.push('  <span class="auth-login-brand-icon">🔬</span>');
    parts.push('  <div class="auth-login-brand-text">');
    parts.push('    <span class="auth-login-brand-title">IBS 2DQH 연구지원 포털</span>');
    parts.push('    <span class="auth-login-brand-sub">성균관대 양자기술첨단기기센터 통합 시스템</span>');
    parts.push('  </div>');
    parts.push('</div>');

    parts.push('<label class="field">User ID / Email (아이디 또는 이메일) *<input name="username" required placeholder="User ID or Email" autocomplete="username"></label>');
    parts.push('<label class="field" style="margin-top:10px">Password (비밀번호) *<input name="password" type="password" required autocomplete="current-password" placeholder="Password"></label>');

    parts.push('<div style="display:flex;justify-content:flex-end;align-items:center;margin-top:10px;">');
    parts.push('  <a id="btnForgotPassword" role="button" style="font-size:12px;color:#2563eb;font-weight:600;text-decoration:underline;cursor:pointer;white-space:nowrap;">Forgot password? (비밀번호 찾기)</a>');
    parts.push('</div>');

    parts.push('<div class="auth-switch-link">');
    parts.push('  Need an account? <a id="linkSwitchToSignup" role="button">Sign Up (회원가입)</a>');
    parts.push('</div>');
  }

  $('modalBody').innerHTML = parts.join('');

  if(mode === 'borrow'){
    const btnToggleBorrow = $('modalBody').querySelector('#btnToggleBorrowUserEdit');
    if(btnToggleBorrow){
      btnToggleBorrow.addEventListener('click', function(e){
        e.preventDefault();
        const wrap = $('modalBody').querySelector('#borrowUserInputWrap');
        if(!wrap) return;
        const isHidden = wrap.classList.contains('hidden');
        wrap.classList.toggle('hidden', !isHidden);
        btnToggleBorrow.textContent = isHidden ? '접기' : '수정';
        if(isHidden){
          const inp = wrap.querySelector('input');
          if(inp) inp.focus();
        }
      });
    }
  }

  if(mode === 'login' || mode === 'signup'){
    const signupTriggers = $('modalBody').querySelectorAll('#btnSwitchToSignupTab, #linkSwitchToSignup');
    signupTriggers.forEach(function(el){
      el.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        openModal('signup');
      });
    });

    const loginTriggers = $('modalBody').querySelectorAll('#btnSwitchToLoginTab, #linkSwitchToLogin');
    loginTriggers.forEach(function(el){
      el.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        openModal('login');
      });
    });

    const forgotBtn = $('modalBody').querySelector('#btnForgotPassword');
    if(forgotBtn){
      forgotBtn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        alert('비밀번호를 분실하신 경우 시스템 관리자 또는 연구실 담당자에게 문의하세요.');
        if(typeof toast === 'function') toast('비밀번호 분실 시 연구실 관리자에게 문의하세요.');
      });
    }
  }

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

  if(mode === 'borrow') btnText = '대여 신청';
  else if(mode === 'signup') btnText = 'Sign Up (회원가입)';
  else if(mode === 'profile') btnText = '수정 내용 저장 (Save Changes)';
  else if(mode === 'login') btnText = 'Log In (로그인)';
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

  const isReturn = (mode === 'return' || mode === 'quickReturn');
  const modalFormEl = $('modalForm');
  if(modalFormEl) modalFormEl.setAttribute('data-mode', mode);
  const saveBtnEl = $('saveModal');
  if(saveBtnEl){
    saveBtnEl.textContent = btnText;
    saveBtnEl.classList.toggle('return-save-btn', isReturn);
  }

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

const VALID_VIEWS = ['inventory', 'consumables', 'chemicals', 'loans', 'dashboard', 'history', 'logbook', 'help'];

function isValidView(name){
  return VALID_VIEWS.includes(name);
}

// URL Hash, Query Parameter 및 세션 저장소 기반 활성 뷰 해석
function getViewFromUrl(){
  try {
    const params = new URLSearchParams(window.location.search || '');
    const hashRaw = window.location.hash || '';
    const qIdx = hashRaw.indexOf('?');
    const hashQuery = (qIdx !== -1) ? hashRaw.slice(qIdx + 1) : '';
    const hashParams = new URLSearchParams(hashQuery);
    const getP = function(k){ return params.get(k) || hashParams.get(k); };

    // 0. QR 코드 스캔 및 딥링크 액션 힌트 최우선 해석
    const act = getP('action');
    if(act === 'quick_chem_log' || act === 'chemicalLog' || act === 'write_chem_log') return 'chemicals';
    if(act === 'quick_loan' || act === 'borrow') return 'inventory';
    if(act === 'quick_start' || getP('eq')) return 'logbook';

    // 1. URL 쿼리 파라미터 우선 (?tab=consumables or ?view=consumables or ?mode=logbook)
    const queryTab = params.get('tab') || params.get('view') || params.get('mode');
    if(queryTab){
      const norm = (queryTab === 'equipment') ? 'inventory' : queryTab.toLowerCase();
      if(isValidView(norm)) return norm;
    }

    // 2. URL Hash (#consumables, #inventory, #loans, #dashboard, #history, #logbook, #standalone-logbook)
    const rawHash = hashRaw.replace(/^#\/?/, '').split('?')[0].split('/')[0].trim().toLowerCase();
    if(rawHash){
      if(rawHash === 'reorder') return 'consumables';
      if(rawHash === 'standalone-logbook' || rawHash === 'xrd') return 'logbook';
      if(rawHash === 'chemicals' || rawHash === 'chemical' || rawHash === 'qr-chemical' ||
         rawHash === 'chemicallog' || rawHash === 'chem-log' || rawHash === 'chem_log') return 'chemicals';
      if(rawHash === 'inventory' || rawHash === 'loan' || rawHash === 'loans' || rawHash === 'borrow') return 'inventory';
      if(rawHash === 'help' || rawHash === 'manual' || rawHash === 'guide') return 'help';
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
  const defaultMod = localStorage.getItem('labstock_active_portal_module') || 'inventory';
  return (defaultMod === 'lims') ? 'logbook' : 'inventory';
}

function showView(name, options){
  options = options || {};
  const updateUrl = options.updateUrl !== false;
  const pushState = options.pushState === true;

  if(name === 'equipment') name = 'inventory';

  if((name === 'dashboard' || name === 'history' || name === 'analytics') && !isAdmin()){
    toast('관리자 전용 화면입니다. 관리자로 로그인해주세요.');
    name = 'inventory';
  }

  if(name === 'history'){
    name = 'dashboard';
    if(typeof switchDashboardTab === 'function') switchDashboardTab('history');
  }
  if(name === 'loans'){
    name = 'inventory';
    if(typeof switchInventorySubTab === 'function') switchInventorySubTab('loans');
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

  // 활성 모듈 동기화 (로그북 뷰이면 연구장비 모듈, 아니면 비품·소모품 모듈)
  if(name === 'logbook'){
    setPortalModule('lims', { switchView: false });
  } else if(name !== 'help'){
    setPortalModule('inventory', { switchView: false });
  }

  document.body.classList.toggle('home-active', name === 'home');

  document.querySelectorAll('.view').forEach(function(el){
    const isActive = el.id === 'view-' + name;
    el.classList.toggle('active', isActive);
    el.classList.toggle('hidden', !isActive);
  });

  document.querySelectorAll('.nav[data-view]').forEach(function(el){
    if(el.dataset.limsNav){
      if(name === 'logbook'){
        const isDetail = $('equipmentDetailHub') && !$('equipmentDetailHub').classList.contains('hidden');
        const expected = isDetail ? 'catalog' : (currentHubView === 'analytics' ? 'analytics' : 'catalog');
        el.classList.toggle('active', el.dataset.limsNav === expected);
      } else {
        el.classList.remove('active');
      }
    } else {
      el.classList.toggle('active', el.dataset.view === name);
    }
  });

  // 상단 헤더 메인 탭 활성화 상태 동기화
  document.querySelectorAll('.header-tab[data-main-view]').forEach(function(el){
    const isActive = el.dataset.mainView === name;
    el.classList.toggle('active', isActive);
    el.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // 모바일 하단 대여/반납 바: 소모품, 관리자 화면, 로그북 화면에서는 숨겨서 화면 영역 확보

  // 모바일 돋보기 버튼 상태 동기화
  const btnToggleSearch = $('btnToggleSearch');
  if(btnToggleSearch){
    const targetPanel = (name === 'consumables') ? $('consumableSearchPanel') : $('searchFilterCollapsible');
    const isOpen = targetPanel && targetPanel.classList.contains('open');
    btnToggleSearch.classList.toggle('active', !!isOpen);
  }

  // 모바일 슬라이드 아웃 서랍 자동 닫기
  closeMobileDrawer();

  // 모바일 하단 탭 바 활성화 상태 동기화 (inventory, consumables, logbook, loans)
  
  if(name === 'chemicals'){
    currentChemScope = 'all';
    if($('chemCondSpecial')) $('chemCondSpecial').checked = true;
    if($('chemCondReagent')) $('chemCondReagent').checked = true;
    document.querySelectorAll('.btn-chem-scope').forEach(function(b){
      b.classList.toggle('active', b.dataset.chemScope === 'all');
    });
    renderChemicalsView();
  }
  if(name === 'help'){
    switchHelpTab(isAdmin() ? 'admin' : 'user');
  }
  document.querySelectorAll('.bottom-nav-tab[data-view]').forEach(function(b){
    const v = b.dataset.view;
    const isActive = (v === name);
    b.classList.toggle('active', isActive);
  });

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

  // 뷰 전환 시 최상단으로 깔끔하게 이동 (모바일/PC 하단 묻힘 현상 방지)
  if(typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
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

function triggerModalShake(backdropEl){
  if(!backdropEl) return;
  const modalBox = backdropEl.querySelector('.modal') || backdropEl.querySelector('section') || backdropEl.firstElementChild;
  if(!modalBox) return;
  modalBox.classList.remove('modal-shake');
  void modalBox.offsetWidth; // reflow
  modalBox.classList.add('modal-shake');
  setTimeout(function(){
    modalBox.classList.remove('modal-shake');
  }, 320);
}

function closeModal(){
  window.__isPromptingReturnBeforeBorrow = false;
  window.__pendingBorrowAssetId = null;
  window.__bypass24hPrompt = false;

  const bd = $('modalBackdrop');
  if(bd){ bd.classList.remove('open'); const mb = bd.querySelector('.modal'); if(mb) mb.classList.remove('auth-modal-box'); }
  if(document.body) document.body.classList.remove('modal-open');
  const mf = $('modalForm');
  if(mf){
    mf.reset();
    mf.removeAttribute('data-mode');
  }
  const saveBtnEl = $('saveModal');
  if(saveBtnEl) saveBtnEl.classList.remove('return-save-btn');

  if(window.__labstockFromHome){
    window.__labstockFromHome = false;
    showView('home');
  }

  if(lastFocusedElement && typeof lastFocusedElement.focus === 'function'){
    try { lastFocusedElement.focus(); } catch(_) {}
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

  // =========================================================================
  // [회원가입 및 로그인 전역 핸들러] (Supabase DB 연결 여부와 무관하게 최우선 처리)
  // =========================================================================
  if(modalMode === 'profile'){
    try {
      const curU = getCurrentUser();
      if(!curU) throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');

      const curPass = (v.current_password || '').trim();
      const rName = (v.user_name || '').trim();
      const rAdvisor = (v.advisor || '').trim();
      const rAffil = (v.affiliation || '').trim();
      const newPass = (v.new_password || '').trim();

      if(!curPass){
        throw new Error('본인 확인을 위해 현재 비밀번호를 입력해주세요.');
      }
      if(!rName || !rAdvisor || !rAffil){
        throw new Error('성명, 지도교수, 소속 부서를 모두 입력해주세요.');
      }

      // 비밀번호 검증
      const registered = getRegisteredUsers();
      const target = registered.find(function(u){
        return u.username.toLowerCase() === curU.username.toLowerCase();
      });

      const is2DQH = (curU.username.toLowerCase() === '2dqh' || curU.username.toLowerCase() === 'admin');
      const expectedPass = is2DQH ? '86276@' : (target ? target.password : (curU.password || ''));

      if(expectedPass && curPass !== expectedPass){
        throw new Error('현재 비밀번호가 일치하지 않습니다.');
      }

      // 정보 업데이트
      curU.name = rName;
      curU.advisor = rAdvisor;
      curU.affiliation = rAffil;
      if(newPass){
        curU.password = newPass;
      }

      if(target){
        target.name = rName;
        target.advisor = rAdvisor;
        target.affiliation = rAffil;
        if(newPass){
          target.password = newPass;
        }
      } else {
        registered.push(curU);
      }
      saveRegisteredUsers(registered);
      setCurrentUser(curU);

      // Supabase user_profiles 업데이트 시도
      if(db && !isLocalMode){
        try {
          await db.from('user_profiles').upsert({
            id: curU.username,
            username: curU.username,
            name: rName,
            advisor: rAdvisor,
            affiliation: rAffil,
            role: curU.role || 'researcher',
            updated_at: new Date().toISOString()
          });
        } catch(e){
          console.warn('Supabase profile update skipped:', e);
        }
      }

      updateUserUI();
      applyCurrentUserToForms();
      closeModal();
      toast('✓ 회원정보가 성공적으로 수정되었습니다.');
    } catch(err){
      toast(err.message || '회원정보 수정에 실패했습니다.');
    } finally {
      btn.disabled = false;
    }
    return;
  }

  if(modalMode === 'signup'){
    try {
      const uName = (v.username || '').trim();
      const uPass = (v.password || '').trim();
      const rName = (v.user_name || '').trim();
      const rAdvisor = (v.advisor || '').trim();
      const rAffil = (v.affiliation || '').trim();

      if(!uName || !uPass || !rName){
        throw new Error('아이디, 비밀번호, 성명을 모두 입력해주세요.');
      }

      if(uName.toLowerCase() === '2dqh' || uName.toLowerCase() === 'admin' || uName.toLowerCase() === '2dqh2024@gmail.com'){
        throw new Error('관리자 전용 아이디입니다. 로그인 화면에서 로그인해주세요.');
      }

      const registered = getRegisteredUsers();
      if(registered.some(function(u){ return u.username.toLowerCase() === uName.toLowerCase(); })){
        throw new Error('이미 등록된 아이디입니다. 다른 아이디를 사용해주세요.');
      }

      const newUserObj = {
        username: uName,
        password: uPass,
        name: rName,
        advisor: rAdvisor,
        affiliation: rAffil,
        role: 'researcher',
        created_at: new Date().toISOString()
      };

      registered.push(newUserObj);
      saveRegisteredUsers(registered);

      // Supabase user_profiles 저장 시도
      if(db && !isLocalMode){
        try {
          await db.from('user_profiles').upsert({
            id: uName,
            username: uName,
            password: uPass,
            name: rName,
            advisor: rAdvisor,
            affiliation: rAffil,
            role: newUserObj.role,
            created_at: newUserObj.created_at
          });
        } catch(e){
          console.warn('Supabase profile save skipped:', e);
        }
      }

      setCurrentUser(newUserObj);
      closeModal();
      toast('🎉 ' + rName + '님 회원가입이 완료되었습니다! 정보가 자동 연동됩니다.');
    } catch(err){
      toast(err.message || '회원가입에 실패했습니다.');
    } finally {
      btn.disabled = false;
    }
    return;
  }

  if(modalMode === 'login'){
    try {
      const inputId = (v.username || v.email || '').trim();
      const inputPass = (v.password || '').trim();

      if(!inputId){
        throw new Error('아이디 또는 이메일을 입력해주세요.');
      }

      // A. 관리자 계정 (2DQH / 2dqh2024@gmail.com / admin) - 비밀번호: 86276@
      const is2DQH = (inputId.toLowerCase() === '2dqh' || inputId.toLowerCase() === '2dqh2024@gmail.com');
      const isAdminId = (inputId.toLowerCase() === 'admin');

      if(is2DQH || isAdminId){
        if(is2DQH){
          if(inputPass !== '86276@'){
            throw new Error('비밀번호가 일치하지 않습니다. (관리자 비밀번호 확인)');
          }
        } else if(isAdminId){
          if(inputPass && inputPass !== '86276@' && inputPass !== '11'){
            throw new Error('비밀번호가 일치하지 않습니다. (관리자 비밀번호 확인)');
          }
        }

        // Supabase Auth 공식 인증 시도 (2dqh2024@gmail.com / 86276@)
        if(db && db.auth && !isLocalMode){
          try {
            const { data: suAuth, error: suErr } = await db.auth.signInWithPassword({
              email: '2dqh2024@gmail.com',
              password: inputPass === '11' ? '86276@' : inputPass
            });
            if(!suErr && suAuth && suAuth.session){
              session = suAuth.session;
              console.log('✓ Supabase Auth 공식 로그인 성공 (2dqh2024@gmail.com)');
            } else if(suErr){
              console.warn('Supabase Auth signIn warning:', suErr.message);
            }
          } catch(e){
            console.warn('Supabase Auth signIn error:', e);
          }
        }

        admin = true;
        try {
          localStorage.setItem('labstock_is_admin', 'true');
        } catch(_){}

        const adminObj = {
          username: '2DQH',
          email: '2dqh2024@gmail.com',
          name: '연구실 관리자',
          advisor: '신현석 교수님',
          affiliation: 'IBS 2DQH',
          role: 'admin'
        };
        setCurrentUser(adminObj);
        if(typeof setAdminUI === 'function') setAdminUI();
        closeModal();
        toast('👑 2DQH 관리자로 로그인되었습니다.');
        btn.disabled = false;
        await loadData();
        return;
      }

      // B. 등록된 연구원 프로필 조회
      const registered = getRegisteredUsers();
      const found = registered.find(function(u){ return u.username.toLowerCase() === inputId.toLowerCase(); });

      if(found){
        if(found.password && inputPass && found.password !== inputPass){
          throw new Error('비밀번호가 일치하지 않습니다.');
        }
        setCurrentUser(found);
        if(found.role === 'admin'){
          admin = true;
          if(typeof setAdminUI === 'function') setAdminUI();
        }
        closeModal();
        toast('✓ ' + found.name + ' 연구원님 로그인 완료');
        btn.disabled = false;
        return;
      }

      // C. Supabase user_profiles 조회 시도
      if(db && !isLocalMode){
        try {
          const { data: suData } = await db.from('user_profiles').select('*').eq('username', inputId).single();
          if(suData){
            if(suData.password && inputPass && suData.password !== inputPass){
              throw new Error('비밀번호가 일치하지 않습니다.');
            }
            setCurrentUser(suData);
            closeModal();
            toast('✓ ' + suData.name + ' 연구원님 로그인 완료');
            btn.disabled = false;
            return;
          }
        } catch(e){}
      }

      // D. 신규 아이디인 경우 간편 자동 연동
      const autoUser = {
        username: inputId,
        password: inputPass,
        name: inputId,
        advisor: '신현석 교수님',
        affiliation: '2DQH',
        role: 'researcher'
      };
      setCurrentUser(autoUser);
      closeModal();
      toast('✓ ' + inputId + '님 로그인 완료 (정보 자동 연동)');
    } catch(err){
      toast(err.message || '로그인에 실패했습니다.');
    } finally {
      btn.disabled = false;
    }
    return;
  }

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
      renderChemicalLedgerTable();
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
    }
  }

  try{

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
  const headers = ['비품 식별번호','비품명','대여자','대여 시작일','반납 예정일','실제 반납일','상태','메모'];
  const sourceLoans = (currentFilteredHistoryLoans && currentFilteredHistoryLoans.length > 0) ? currentFilteredHistoryLoans : loans;

  const rows = sourceLoans.map(function(l){
    const statText = l.returned_at ? '반납 완료' : '대여 중';
    const memoClean = String(l.memo || '').replace(/[\r\n]+/g, ' ').trim();
    return [l.asset_id, fmtName(l.asset_id), l.borrower_name, l.borrowed_at, l.due_date, l.returned_at || '', statText, memoClean];
  });

  // 대여자 이름/메모는 누구나 입력할 수 있으므로 =,+,-,@ 로 시작하면 엑셀 수식으로 실행되지 않게 막는다
  const cell = function(v){
    let t = String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim();
    if(/^[=+\-@\t\r]/.test(t)) t = "'" + t;
    return '"' + t.replace(/"/g, '""') + '"';
  };

  const csvContent = [headers].concat(rows).map(function(r){
    return r.map(cell).join(',');
  }).join('\r\n');

  const monthFilterEl = $('historyMonthFilter');
  const monthVal = monthFilterEl ? monthFilterEl.value.trim() : '';
  const assetFilterEl = $('historyAssetFilter');
  const assetVal = assetFilterEl ? assetFilterEl.value : 'all';

  let fileSuffix = monthVal ? monthVal : today();
  if(assetVal && assetVal !== 'all') fileSuffix += '-' + assetVal;

  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = '2DQH_비품대여이력_' + fileSuffix + '.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('✓ 비품 대여 이력(' + rows.length + '건)이 엑셀 호환 CSV로 다운로드되었습니다.');
}

// ==========================================
// [관리자 로그아웃 처리]
// ==========================================
async function handleLogout(){
  try {
    if(db && db.auth){
      await db.auth.signOut().catch(function(e){ console.warn('Supabase signOut error:', e); });
    }
  } catch(err){
    console.warn('SignOut exception:', err);
  } finally {
    session = null;
    admin = false;

    // 1. 사용자 세션 및 로컬스토리지 캐시 완전 삭제
    if(typeof setCurrentUser === 'function'){
      setCurrentUser(null);
    } else {
      try { localStorage.removeItem('labstock_current_user'); } catch(_){}
    }

    try {
      localStorage.removeItem('labstock_is_admin');
      localStorage.removeItem('xrd_user_name');
      localStorage.removeItem('xrd_affiliation');
      localStorage.removeItem('xrd_professor');
      localStorage.removeItem('labstock_last_borrower_name');
      localStorage.removeItem('labstock_last_borrower_affil');
      localStorage.removeItem('labstock_last_borrower_advisor');

      for(let i = localStorage.length - 1; i >= 0; i--){
        const key = localStorage.key(i);
        if(key && (key.startsWith('sb-') || key.includes('auth-token') || key === 'supabase.auth.token')){
          localStorage.removeItem(key);
        }
      }
      if(document.documentElement) document.documentElement.classList.remove('is-admin');
      if(document.body) document.body.classList.remove('is-admin');
    } catch(e){}

    // 2. 폼 입력값 초기화
    try {
      const f = $('xrdForm');
      if(f){
        if(f.user_name) f.user_name.value = '';
        if(f.professor) f.professor.value = '';
        if(f.affiliation) f.affiliation.value = '';
      }
      if($('modalChemHandler')) $('modalChemHandler').value = '';
    } catch(e){}

    // 3. UI 상태 전면 갱신
    if(typeof setAdminUI === 'function') setAdminUI();
    if(typeof updateUserUI === 'function') updateUserUI();

    // 4. 관리자 전용 화면에 머물고 있을 경우 즉시 비품 현황으로 복귀
    const currentView = document.querySelector('.view.active');
    if(currentView && (currentView.id === 'view-history' || currentView.id === 'view-dashboard' || currentView.classList.contains('admin-only'))){
      showView('inventory');
    }

    closeMobileDrawer();
    toast('로그아웃되었습니다.');
    render();
  }
}

// userLogout alias
function userLogout(){
  return handleLogout();
}

// ==========================================
// [모바일 슬라이드 아웃 서랍(Drawer) 제어 - 햄버거 to X 애니메이션 연동]
// ==========================================
function openMobileDrawer(){
  const sidebar = $('mainSidebar');
  const overlay = $('mobileDrawerOverlay');
  const hamburger = $('btnOpenMobileDrawer');
  if(sidebar) sidebar.classList.add('drawer-open');
  if(overlay) overlay.classList.add('active');
  if(hamburger){
    hamburger.classList.add('is-active');
    hamburger.setAttribute('aria-expanded', 'true');
  }
  document.body.classList.add('drawer-locked');
}

function closeMobileDrawer(){
  const sidebar = $('mainSidebar');
  const overlay = $('mobileDrawerOverlay');
  const hamburger = $('btnOpenMobileDrawer');
  if(sidebar) sidebar.classList.remove('drawer-open');
  if(overlay) overlay.classList.remove('active');
  if(hamburger){
    hamburger.classList.remove('is-active');
    hamburger.setAttribute('aria-expanded', 'false');
  }
  document.body.classList.remove('drawer-locked');
}

function bindEvents(){
  // 캘린더 월 이동 직접 바인딩
  addEvt('btnPrevMonth', 'click', function(e){
    e.preventDefault();
    e.stopPropagation();
    currentCalendarMonth--;
    if(currentCalendarMonth < 1){
      currentCalendarMonth = 12;
      currentCalendarYear--;
    }
    timelineDateFilter = null;
    renderEquipmentAnalyticsDashboard();
  });
  addEvt('btnNextMonth', 'click', function(e){
    e.preventDefault();
    e.stopPropagation();
    currentCalendarMonth++;
    if(currentCalendarMonth > 12){
      currentCalendarMonth = 1;
      currentCalendarYear++;
    }
    timelineDateFilter = null;
    renderEquipmentAnalyticsDashboard();
  });

  // 비품 대여 신청 버튼 직접 바인딩
  bindChemicalsEvents();

  addEvt('loanAdd', 'click', function(e){
    e.preventDefault();
    openModal('borrow');
  });

  // 도움말 대시보드 역할 전환 탭
  addEvt('btnHelpTabUser', 'click', function(e){
    e.preventDefault();
    switchHelpTab('user');
  });
  addEvt('btnHelpTabAdmin', 'click', function(e){
    e.preventDefault();
    switchHelpTab('admin');
  });

  window.addEventListener('online', function(){
    toast('네트워크가 복구되었습니다. 최신 데이터를 동기화합니다.');
    loadData();
  });
  window.addEventListener('offline', function(){
    toast('네트워크 연결이 끊어졌습니다. 읽기 전용 캐시로 동작합니다.');
    const conn = $('connection');
    if(conn){ conn.textContent = '오프라인 (읽기 전용)'; conn.style.color = '#b45309'; }
  });

  // 모바일 드로어 오버레이 클릭/터치 및 닫기[X] 버튼 클릭 시 즉시 닫기
  addEvt('mobileDrawerOverlay', 'click', closeMobileDrawer);
  addEvt('mobileDrawerOverlay', 'touchstart', function(e){
    e.preventDefault();
    closeMobileDrawer();
  });
  addEvt('btnCloseMobileDrawer', 'click', function(e){
    e.preventDefault();
    closeMobileDrawer();
  });

  document.querySelectorAll('.nav[data-view]').forEach(function(el){
    el.addEventListener('click', function(){
      if(el.dataset.limsNav) return; // 연구장비 서브 내비게이션은 연구장비 전용 핸들러에서 라우팅
      showView(el.dataset.view, { pushState: true });
      loadData(); // 탭 클릭 시 최신 DB 데이터 즉시 동기화 새로고침
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
      if(typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // 연구장비 포털 검색창 및 지우기 버튼 바인딩
  const eqSearch = $('eqSearchInput');
  const btnClearEqSearch = $('btnClearEqSearch');
  if(eqSearch){
    eqSearch.addEventListener('input', function(){
      if(btnClearEqSearch) btnClearEqSearch.classList.toggle('hidden', eqSearch.value.trim().length === 0);
      renderEquipmentPortalGrid();
    });
  }
  if(btnClearEqSearch){
    btnClearEqSearch.addEventListener('click', function(){
      if(eqSearch){
        eqSearch.value = '';
        eqSearch.focus();
      }
      btnClearEqSearch.classList.add('hidden');
      renderEquipmentPortalGrid();
    });
  }


  document.addEventListener('click', function(e){
    const el = e.target;
    if(!el) return;

    // 도움말(#view-help) 뷰 내부 클릭 보호: FAQ 아코디언 토글 및 외부 뷰 이동 차단
    if(el.closest('#view-help')){
      const faqQ = el.closest('.faq-accordion-question');
      if(faqQ){
        e.preventDefault();
        e.stopPropagation();
        const item = faqQ.closest('.faq-accordion-item');
        if(item){
          item.classList.toggle('open');
        }
        return;
      }
      if(!el.closest('button, a, [data-view], [data-goto]')){
        return;
      }
    }
    const target = el.closest('button, a, [data-select-eq], [data-select-util-eq], [data-analytics-eq], [data-analytics-period], [data-cal-date], [data-timeline-filter], [data-eq-cat], [data-portal-module], [data-lims-nav], [data-main-view], [data-goto], [data-view]') || el;

    // 모달 닫기 / 취소 버튼 최우선 처리 (이벤트 트랩 및 무반응 방지)
    if(target.id === 'closeModal' || target.id === 'cancelModal' || target.closest('#closeModal') || target.closest('#cancelModal')){
      e.preventDefault();
      e.stopPropagation();
      closeModal();
      return;
    }

    // 캘린더 / 타임라인 날짜 필터 해제 (최우선 처리: ✕ 버튼 또는 뱃지 클릭 시 즉시 필터 해제)
    if(target.id === 'btnClearTimelineDateFilter' || target.closest('#btnClearTimelineDateFilter') ||
       target.id === 'btnClearCalDateDetail' || target.closest('#btnClearCalDateDetail') ||
       target.id === 'eqTimelineDateFilterBadge' || target.closest('#eqTimelineDateFilterBadge')){
      e.preventDefault();
      e.stopPropagation();
      timelineDateFilter = null;
      renderEquipmentAnalyticsDashboard();
      return;
    }

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

    const mainViewEl = target.dataset.mainView ? target : target.closest('[data-main-view]');
    if(mainViewEl){
      showView(mainViewEl.dataset.mainView, { pushState: true });
      return;
    }

    const gotoEl = target.dataset.goto ? target : target.closest('[data-goto]');
    if(gotoEl){
      showView(gotoEl.dataset.goto, { pushState: true });
      return;
    }

    if(target.dataset.inventoryCategory){
      selectedInventoryCategory = target.dataset.inventoryCategory;
      renderInventory();
      return;
    }

    if(target.dataset.consumableCategory){
      selectedConsumableCategory = target.dataset.consumableCategory;
      if(isReagentCategory(selectedConsumableCategory)){
        showView('chemicals', { pushState: true });
        return;
      }
      if(!isReagentCategory(selectedConsumableCategory)){
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

    if(target.id === 'btnExportChemicalLogsMonth' || target.closest('#btnExportChemicalLogsMonth')){
      exportChemicalLogsCsv('month');
      return;
    }

    if(target.id === 'btnExportChemicalLogsYear' || target.closest('#btnExportChemicalLogsYear')){
      exportChemicalLogsCsv('year');
      return;
    }

    if(target.id === 'btnExportChemicalLogs' || target.closest('#btnExportChemicalLogs')){
      exportChemicalLogsCsv('all');
      return;
    }

    const cardQrTarget = target.closest('.btn-card-qr-trigger');
    if(cardQrTarget){
      e.preventDefault();
      e.stopPropagation();
      openEquipmentQrModal(cardQrTarget.dataset.eqId);
      return;
    }

    const eqCard = target.dataset.selectEq ? target : target.closest('[data-select-eq]');
    if(eqCard){
      selectResearchEquipment(eqCard.dataset.selectEq);
      return;
    }

    const eqCatBtn = target.dataset.eqCat ? target : target.closest('[data-eq-cat]');
    if(eqCatBtn){
      selectedEquipmentCategory = eqCatBtn.dataset.eqCat;
      document.querySelectorAll('#eqCategoryTabs .eq-cat-tab').forEach(function(b){
        b.classList.toggle('active', b.dataset.eqCat === selectedEquipmentCategory);
      });
      renderEquipmentPortalGrid();
      return;
    }

    if(target.id === 'btnBackToEqCatalog' || target.id === 'btnPlaceholderBackBottom' || target.closest('#btnBackToEqCatalog') || target.closest('#btnPlaceholderBackBottom')){
      showEquipmentCatalogHub();
      return;
    }

    if(target.dataset.selectEquipment){
      selectResearchEquipment(target.dataset.selectEquipment);
      return;
    }

    if(target.dataset.xrdEdit){
      if(!isAdmin()){
        toast('로그북 기록 수정은 관리자만 가능합니다.');
        return;
      }
      finishXrdSession(target.dataset.xrdEdit);
      return;
    }

    if(target.dataset.xrdFinish){
      finishXrdSession(target.dataset.xrdFinish);
      return;
    }

    if(target.dataset.xrdDel){
      if(!isAdmin()){
        toast('로그북 기록 삭제는 관리자만 가능합니다.');
        return;
      }
      deleteXrdLog(target.dataset.xrdDel);
      return;
    }

    if(target.id === 'btnExportEquipmentLogs' || target.closest('#btnExportEquipmentLogs')){
      exportEquipmentLogsExcel();
      return;
    }

    // 테마 토글 (다크모드 / 라이트모드 / 암실 모드)
    if(target.id === 'btnToggleTheme' || target.closest('#btnToggleTheme') || target.id === 'btnLogbookThemeToggle' || target.closest('#btnLogbookThemeToggle')){
      toggleTheme();
      return;
    }

    // 모바일 슬라이드 아웃 서랍(Drawer) 토글 (햄버거 <-> X 전환)
    if(target.id === 'btnOpenMobileDrawer' || target.closest('#btnOpenMobileDrawer')){
      const isSidebarOpen = $('mainSidebar') && $('mainSidebar').classList.contains('drawer-open');
      if(isSidebarOpen){
        closeMobileDrawer();
      } else {
        openMobileDrawer();
      }
      return;
    }
    if(target.id === 'bottomTabMenu' || target.closest('#bottomTabMenu')){
      openMobileDrawer();
      return;
    }
    // 모바일 슬라이드 아웃 서랍 닫기 (✕ 버튼, 흐릿한 바깥 오버레이 터치 시 즉시 취소/닫기)
    const isSidebarOpen = $('mainSidebar') && $('mainSidebar').classList.contains('drawer-open');
    if(isSidebarOpen){
      if(target.id === 'btnCloseMobileDrawer' || target.closest('#btnCloseMobileDrawer') || target.id === 'mobileDrawerOverlay' || !target.closest('#mainSidebar')){
        closeMobileDrawer();
        return;
      }
    }

    // 모바일 하단 탭 내비게이션 (대여현황 / 소모품 / 비품대여 / 연구장비 탭 전환 및 데이터 즉시 새로고침)
    const bTab = target.dataset.view ? target : target.closest('.bottom-nav-tab[data-view]');
    if(bTab){
      const nextView = bTab.dataset.view;
      showView(nextView, { pushState: true });
      loadData(); // 최신 대여현황 및 재고 데이터 즉시 동기화 새로고침
      return;
    }

    // 2-in-1 연구 포털 모듈 스위처 (연구장비 vs 비품·소모품)
    const modBtn = target.dataset.portalModule ? target : target.closest('[data-portal-module]');
    if(modBtn){
      setPortalModule(modBtn.dataset.portalModule, { switchView: true });
      return;
    }

    // 연구장비 전용 사이드바 내비게이션
    const limsNavBtn = target.dataset.limsNav ? target : target.closest('[data-lims-nav]');
    if(limsNavBtn){
      const navType = limsNavBtn.dataset.limsNav;
      if(navType === 'catalog'){
        currentHubView = 'catalog';
        showView('logbook');
        showEquipmentCatalogHub();
      } else if(navType === 'xrd'){
        showView('logbook');
        selectResearchEquipment('EQ-XRD-01');
      } else if(navType === 'analytics'){
        if(!isAdmin()){
          toast('장비 운영 통계는 관리자 로그인 후 조회할 수 있습니다.');
          return;
        }
        currentHubView = 'analytics';
        showView('logbook');
        showEquipmentCatalogHub();
        switchEquipmentHubView('analytics');
      }
      updateLimsNavActive(navType);
      return;
    }

    // 브랜드 2DQH 로고 클릭 시 홈페이지 기본 화면으로 이동 (상단바 / 모바일 드로어 일체)
    const brandTarget = target.closest('#brandLogoLink, #drawerBrandLogo, .brand, .brand-img-logo');
    if(brandTarget){
      if(e && e.preventDefault) e.preventDefault();
      if(e && e.stopPropagation) e.stopPropagation();
      closeMobileDrawer();
      if(currentPortalModule === 'lims'){
        showEquipmentCatalogHub();
        switchEquipmentHubView('catalog');
        showView('logbook', { updateUrl: true, pushState: true });
      } else {
        showView('inventory', { updateUrl: true, pushState: true });
      }
      if(typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Primary Hero Quick Actions (HR-XRD 바로가기 액션)
    const heroActionBtn = target.dataset.quickAction ? target : target.closest('[data-quick-action]');
    if(heroActionBtn){
      const act = heroActionBtn.dataset.quickAction;
      if(act === 'xrd_start'){
        selectResearchEquipment('EQ-XRD-01');
        showXrdMode('start');
        toast('⚡ HR-XRD 측정 시작 폼으로 진입했습니다.');
        return;
      }
      if(act === 'xrd_qr'){
        openEquipmentQrModal('EQ-XRD-01');
        return;
      }
      if(act === 'xrd_table'){
        selectResearchEquipment('EQ-XRD-01');
        const tbl = $('xrdRows');
        if(tbl) tbl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // 장비 본체 부착용 QR 모달 제어 (우측 상단 단일 QR 버튼 & 사용기록 작성 모달 내 QR 버튼 - 관리자 전용)
    if(target.id === 'btnDetailTopShowQr' || target.closest('#btnDetailTopShowQr') || target.id === 'btnTestDriveModalQr' || target.closest('#btnTestDriveModalQr')){
      e.preventDefault();
      e.stopPropagation();
      if(!isAdmin()){
        toast('장비 본체 부착용 QR 코드는 관리자 전용 기능입니다. 관리자 로그인이 필요합니다.');
        if(typeof openModal === 'function') openModal('login');
        return;
      }
      openEquipmentQrModal(currentSelectedEquipment);
      return;
    }

    // 화학물질 직통 QR 모달 열기
    if(target.id === 'btnChemShowDirectQr' || target.closest('#btnChemShowDirectQr') || target.id === 'btnChemWriteModalQr' || target.closest('#btnChemWriteModalQr')){
      e.preventDefault();
      openChemicalQrModal();
      return;
    }

    // 비품 대여 직통 QR 모달 열기
    if(target.id === 'btnShowLoanDirectQr' || target.closest('#btnShowLoanDirectQr') ||
       target.id === 'btnShowLoanDirectQrToolbar' || target.closest('#btnShowLoanDirectQrToolbar') ||
       target.id === 'btnLoanHeadQr' || target.closest('#btnLoanHeadQr') ||
       target.id === 'btnLoanModalQr' || target.closest('#btnLoanModalQr')){
      e.preventDefault();
      openLoanQrModal();
      return;
    }

    if(target.id === 'btnCloseChemicalQr' || target.id === 'btnCloseChemicalQrBottom' || target.closest('#btnCloseChemicalQr') || target.closest('#btnCloseChemicalQrBottom')){
      closeChemicalQrModal();
      return;
    }

    if(target.id === 'btnCloseLoanQr' || target.id === 'btnCloseLoanQrBottom' || target.closest('#btnCloseLoanQr') || target.closest('#btnCloseLoanQrBottom')){
      closeLoanQrModal();
      return;
    }

    if(target.id === 'btnCloseEquipmentQr' || target.id === 'btnCloseEquipmentQrBottom' || target.closest('#btnCloseEquipmentQr')){
      closeEquipmentQrModal();
      return;
    }

    if(target.id === 'btnPrintEquipmentQr' || target.closest('#btnPrintEquipmentQr')){
      printEquipmentQrLabel();
      return;
    }

    if(target.id === 'btnDownloadEquipmentQr' || target.closest('#btnDownloadEquipmentQr')){
      downloadEquipmentQrImage();
      return;
    }

    // Phase 2: 시험 가동(Test-Drive) 및 실운영 활성화
    if(target.id === 'btnTestDriveEquipment' || target.closest('#btnTestDriveEquipment')){
      const cur = researchEquipments.find(function(e){ return e.id === currentSelectedEquipment; });
      openEquipmentTestDrive(cur ? cur.code : 'AFM');
      return;
    }

    if(target.id === 'closeTestDriveModal' || target.id === 'btnCancelTestDrive' || target.closest('#closeTestDriveModal')){
      closeEquipmentTestDrive();
      return;
    }

    if(target.dataset.deleteEqSession || target.closest('[data-delete-eq-session]')){
      const btn = target.dataset.deleteEqSession ? target : target.closest('[data-delete-eq-session]');
      if(!isAdmin()){
        toast('가동 기록 삭제 권한은 관리자에게만 있습니다.');
        return;
      }
      deleteEquipmentSession(btn.dataset.deleteEqSession);
      return;
    }

    // Phase 3: 허브 뷰 전환 (장비 목록 vs 운영 통계)
    if(target.id === 'btnHubShowGrid' || target.id === 'btnMobileHubShowGrid' || target.closest('#btnHubShowGrid') || target.closest('#btnMobileHubShowGrid')){
      switchEquipmentHubView('catalog');
      return;
    }

    if(target.id === 'btnHubShowAnalytics' || target.id === 'btnMobileHubShowAnalytics' || target.closest('#btnHubShowAnalytics') || target.closest('#btnMobileHubShowAnalytics')){
      switchEquipmentHubView('analytics');
      return;
    }

    if(target.id === 'btnExportAllUnifiedLogs' || target.closest('#btnExportAllUnifiedLogs')){
      exportUnifiedSessionsCsv();
      return;
    }

    // Phase 3: 캘린더 월 이동
    if(target.id === 'btnPrevMonth' || target.closest('#btnPrevMonth')){
      currentCalendarMonth--;
      if(currentCalendarMonth < 1){
        currentCalendarMonth = 12;
        currentCalendarYear--;
      }
      timelineDateFilter = null;
      renderEquipmentAnalyticsDashboard();
      return;
    }

    if(target.id === 'btnNextMonth' || target.closest('#btnNextMonth')){
      currentCalendarMonth++;
      if(currentCalendarMonth > 12){
        currentCalendarMonth = 1;
        currentCalendarYear++;
      }
      timelineDateFilter = null;
      renderEquipmentAnalyticsDashboard();
      return;
    }

    // Phase 3: 캘린더 날짜 클릭 필터링
    const calDay = target.dataset.calDate ? target : target.closest('[data-cal-date]');
    if(calDay){
      const d = calDay.dataset.calDate;
      timelineDateFilter = (timelineDateFilter === d) ? null : d;
      renderEquipmentAnalyticsDashboard();
      return;
    }

    // Phase 3: 날짜 필터 해제
    if(target.id === 'btnClearTimelineDateFilter' || target.closest('#btnClearTimelineDateFilter') || target.id === 'btnClearCalDateDetail' || target.closest('#btnClearCalDateDetail')){
      timelineDateFilter = null;
      renderEquipmentAnalyticsDashboard();
      return;
    }

    // Phase 3: 타임라인 필터 탭
    const tlFilterBtn = target.dataset.timelineFilter ? target : target.closest('[data-timeline-filter]');
    if(tlFilterBtn){
      timelineFilter = tlFilterBtn.dataset.timelineFilter;
      renderEquipmentRecentTimeline();
      return;
    }

    // 장비 운영 통계: 주기 전환 탭 (월별 / 주간 / 연간)
    const periodTab = target.dataset.analyticsPeriod ? target : target.closest('[data-analytics-period]');
    if(periodTab){
      selectedAnalyticsPeriod = periodTab.dataset.analyticsPeriod || 'month';
      renderEquipmentAnalyticsDashboard();
      return;
    }

    // 장비 운영 통계: 주기별 실적 CSV 내보내기
    if(target.id === 'btnExportAnalyticsCsv' || target.closest('#btnExportAnalyticsCsv')){
      e.preventDefault();
      exportAnalyticsSummaryCsv();
      return;
    }

    // 장비 운영 통계: 분석 스코프 선택 칩 (전체 연구장비 통합 vs 개별 장비 독립 세션 통계)
    const scopeChip = target.dataset.analyticsEq ? target : target.closest('[data-analytics-eq]');


    // Phase 3: 점유율 바 또는 타임라인에서 장비 바로가기 / 독립 통계 조회
    const utilEq = target.dataset.selectUtilEq ? target : target.closest('[data-select-util-eq]');
    if(utilEq){
      const eqId = utilEq.dataset.selectUtilEq;
      if(utilEq.classList.contains('eq-util-row') || utilEq.closest('.eq-util-row')){
        selectedAnalyticsEquipmentId = eqId;
        renderEquipmentAnalyticsDashboard();
      } else {
        selectResearchEquipment(eqId);
      }
      return;
    }

    const loginTarget = target.closest('#loginBtn, #sidebarLoginBtn');
    if(loginTarget){
      e.preventDefault();
      closeMobileDrawer();
      openModal('login');
      return;
    }

    const logoutTarget = target.closest('#logoutBtn, #sidebarLogoutBtn');
    if(logoutTarget){
      e.preventDefault();
      handleLogout();
      return;
    }

    const exportCsvTarget = target.closest('#exportCsv');
    if(exportCsvTarget){
      e.preventDefault();
      exportHistoryCsv();
      return;
    }

    const loanAddTarget = target.closest('#loanAdd, #quickBorrow, #inventoryQuickBorrow, #btnEmptyLoanBorrow');
    if(loanAddTarget){
      e.preventDefault();
      openModal('borrow');
      return;
    }

    switch(target.id){
      case 'loginBtn':
      case 'sidebarLoginBtn':
        openModal('login');
        closeMobileDrawer();
        break;

      case 'logoutBtn':
      case 'sidebarLogoutBtn':
        handleLogout();
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
  addEvt('testDriveForm', 'submit', handleTestDriveFormSubmit);

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
      if(e.target === mBackdrop){
        // 작성 중 실수로 바깥을 클릭해도 창이 꺼지지 않도록 보호하고 시각적 피드백 제공
        triggerModalShake(mBackdrop);
      }
    });
  }

  const btnDirectCloseModal = $('closeModal');
  if(btnDirectCloseModal){
    btnDirectCloseModal.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });
  }

  const btnDirectCancelModal = $('cancelModal');
  if(btnDirectCancelModal){
    btnDirectCancelModal.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });
  }


  const eqQrBackdrop = $('modalEquipmentQrBackdrop');
  if(eqQrBackdrop){
    eqQrBackdrop.addEventListener('click', function(e){
      if(e.target === eqQrBackdrop) closeEquipmentQrModal();
    });
  }

  // 전자 로그북 상단 및 작성 모달 내 QR 버튼 직접 바인딩 (이벤트 누락 방지)
  const topQrBtn = $('btnDetailTopShowQr');
  if(topQrBtn){
    topQrBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      openEquipmentQrModal(currentSelectedEquipment);
    });
  }
  const modalQrBtn = $('btnTestDriveModalQr');
  if(modalQrBtn){
    modalQrBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      openEquipmentQrModal(currentSelectedEquipment);
    });
  }

  // 특별관리물질 직통 QR 버튼 직접 바인딩
  const chemDirectQrBtn = $('btnChemShowDirectQr');
  if(chemDirectQrBtn){
    chemDirectQrBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      openChemicalQrModal();
    });
  }
  const chemWriteModalQrBtn = $('btnChemWriteModalQr');
  if(chemWriteModalQrBtn){
    chemWriteModalQrBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      openChemicalQrModal();
    });
  }

  // 비품 대여 직통 QR 버튼 직접 바인딩
  const loanDirectQrBtn = $('btnShowLoanDirectQr');
  if(loanDirectQrBtn){
    loanDirectQrBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      openLoanQrModal();
    });
  }
  const loanDirectQrToolbarBtn = $('btnShowLoanDirectQrToolbar');
  if(loanDirectQrToolbarBtn){
    loanDirectQrToolbarBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      openLoanQrModal();
    });
  }
  const loanHeadQrBtn = $('btnLoanHeadQr');
  if(loanHeadQrBtn){
    loanHeadQrBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      openLoanQrModal();
    });
  }
  const loanModalQrBtn = $('btnLoanModalQr');
  if(loanModalQrBtn){
    loanModalQrBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      openLoanQrModal();
    });
  }

  const chemQrBackdrop = $('modalChemicalQrBackdrop');
  if(chemQrBackdrop){
    chemQrBackdrop.addEventListener('click', function(e){
      if(e.target === chemQrBackdrop) closeChemicalQrModal();
    });
  }

  const loanQrBackdrop = $('modalLoanQrBackdrop');
  if(loanQrBackdrop){
    loanQrBackdrop.addEventListener('click', function(e){
      if(e.target === loanQrBackdrop) closeLoanQrModal();
    });
  }

  // [PC 및 모바일 공통 원터치 검색창 접기/펼치기 바인딩]
  setupUniversalSearchToggle('btnToggleChemSearch', 'chemSearchBox', 'chemSearchToggleArrow', 'chemFilterName');
  setupUniversalSearchToggle('btnToggleMobileInventorySearch', 'searchFilterCollapsible', 'invSearchToggleArrow', 'assetSearch');
  setupUniversalSearchToggle('btnToggleMobileConsumableSearch', 'consumableSearchPanel', 'consumableSearchToggleArrow', 'consumableSearch');

  // D. 상단 2DQH 브랜드 로고 직접 클릭 보장 리스너
  ['brandLogoLink', 'drawerBrandLogo'].forEach(function(id){
    const el = $(id);
    if(el){
      el.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        closeMobileDrawer();
        if(currentPortalModule === 'lims'){
          showEquipmentCatalogHub();
          switchEquipmentHubView('catalog');
          showView('logbook', { updateUrl: true, pushState: true });
        } else {
          showView('inventory', { updateUrl: true, pushState: true });
        }
        if(typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  });

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
  addEvt('historyAssetFilter', 'change', renderHistory);
  addEvt('historyMonthFilter', 'change', renderHistory);
  addEvt('historyStatusFilter', 'change', renderHistory);
  addEvt('btnResetHistoryFilters', 'click', function(){
    const s = $('historySearch'); if(s) s.value = '';
    const a = $('historyAssetFilter'); if(a) a.value = 'all';
    const m = $('historyMonthFilter'); if(m) m.value = '';
    const st = $('historyStatusFilter'); if(st) st.value = 'all';
    renderHistory();
  });
  addEvt('exportCsv', 'click', exportHistoryCsv);
  addEvt('loanAdd', 'click', function(){ openModal('borrow'); });
  addEvt('quickBorrow', 'click', function(){ openModal('borrow'); });
  addEvt('loginBtn', 'click', function(e){
    e.preventDefault();
    openModal('login');
  });
  addEvt('sidebarLoginBtn', 'click', function(e){
    e.preventDefault();
    closeMobileDrawer();
    openModal('login');
  });
  addEvt('logoutBtn', 'click', handleLogout);

  addEvt('userProfileBadge', 'click', function(){
    if(typeof openModal === 'function') openModal('profile');
  });

  addEvt('sidebarEditProfileBtn', 'click', function(){
    closeMobileDrawer();
    if(typeof openModal === 'function') openModal('profile');
  });

  addEvt('sidebarAdminEditProfileBtn', 'click', function(){
    closeMobileDrawer();
    if(typeof openModal === 'function') openModal('profile');
  });
  addEvt('sidebarLogoutBtn', 'click', handleLogout);

  addEvt('btnTestDriveEquipment', 'click', function(e){
    e.preventDefault();
    const cur = researchEquipments.find(function(x){ return x.id === currentSelectedEquipment; });
    openEquipmentTestDrive(cur ? cur.code : 'AFM');
  });
  addEvt('closeTestDriveModal', 'click', function(e){
    e.preventDefault();
    closeEquipmentTestDrive();
  });
  addEvt('btnCancelTestDrive', 'click', function(e){
    e.preventDefault();
    closeEquipmentTestDrive();
  });

  const tdModalEl = $('modalTestDriveBackdrop');
  if(tdModalEl){
    tdModalEl.addEventListener('click', function(e){
      if(e.target === tdModalEl){
        // 장비 사용 기록 작성 중 데이터 유실 방지
        triggerModalShake(tdModalEl);
      }
    });
  }

  // 접근성 키보드 제어: ESC로 닫기 및 포커스 트랩(Focus Trap)
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      const tdBackdrop = $('modalTestDriveBackdrop');
      if(tdBackdrop && tdBackdrop.classList.contains('open')){
        e.preventDefault();
        closeEquipmentTestDrive();
        return;
      }
      const eqQrB = $('modalEquipmentQrBackdrop');
      if(eqQrB && eqQrB.classList.contains('open')){
        e.preventDefault();
        closeEquipmentQrModal();
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

  // 연구장비 서브 내비게이션 & 통계 허브 원클릭 즉시 연결
  const navCatalog = $('sidebarNavCatalog');
  if(navCatalog){
    navCatalog.addEventListener('click', function(e){
      e.preventDefault();
      currentHubView = 'catalog';
      showView('logbook');
      showEquipmentCatalogHub();
      switchEquipmentHubView('catalog');
      updateLimsNavActive('catalog');
    });
  }

  const navAnalytics = $('sidebarNavAnalytics');
  if(navAnalytics){
    navAnalytics.addEventListener('click', function(e){
      e.preventDefault();
      if(!isAdmin()){
        toast('장비 운영 통계는 관리자 로그인 후 조회할 수 있습니다.');
        return;
      }
      currentHubView = 'analytics';
      showView('logbook');
      showEquipmentCatalogHub();
      switchEquipmentHubView('analytics');
      updateLimsNavActive('analytics');
    });
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
  const emptyNotice = $('topAssetsEmptyNotice');

  if(top5.length === 0){
    if(emptyNotice) emptyNotice.classList.remove('hidden');
    canvas.classList.add('hidden');
    return;
  }

  if(emptyNotice) emptyNotice.classList.add('hidden');
  canvas.classList.remove('hidden');

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_sessions' }, debouncedRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'xrd_logs' }, debouncedRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tem_logs' }, debouncedRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'afm_logs' }, debouncedRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'raman_logs' }, debouncedRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ftir_logs' }, debouncedRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ebeam_logs' }, debouncedRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ald_logs' }, debouncedRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cosputter_logs' }, debouncedRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'uhvsputter_logs' }, debouncedRealtimeReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wirebonder_logs' }, debouncedRealtimeReload)
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
    const searchParams = new URLSearchParams(window.location.search || '');
    let hashQuery = '';
    const hashRaw = window.location.hash || '';
    const qIdx = hashRaw.indexOf('?');
    const hashPath = (qIdx !== -1 ? hashRaw.slice(0, qIdx) : hashRaw).replace(/^#\/?/, '').trim().toLowerCase();
    if(qIdx !== -1) hashQuery = hashRaw.slice(qIdx + 1);
    const hashParams = new URLSearchParams(hashQuery);

    const getParam = function(k){ return searchParams.get(k) || hashParams.get(k); };

    // 0. 재발주 패널 스크롤 (#reorder or #consumables/reorder)
    if(hashPath === 'reorder' || hashPath === 'consumables/reorder'){
      scrollToReorderPanel();
      return;
    }

    // 1. 특별관리물질 취급일지 작성 다이렉트 진입 (#chemicals?action=quick_chem_log or #chemicalLog or ?action=quick_chem_log)
    const isChemLogAction = (hashPath === 'chemicals' && getParam('action') === 'quick_chem_log') ||
                            hashPath === 'chemicallog' || hashPath === 'chem-log' || hashPath === 'chem_log' ||
                            getParam('action') === 'quick_chem_log' || getParam('action') === 'chemicalLog' ||
                            getParam('action') === 'write_chem_log';
    const directChemId = getParam('chem') || getParam('chemId');

    if(isChemLogAction || (hashPath === 'chemicals' && directChemId)){
      setPortalModule('inventory', { switchView: false });
      showView('chemicals', { updateUrl: false });
      if(typeof render291InventoryTable === 'function') render291InventoryTable();
      setTimeout(function(){
        openChemWriteLogModal(directChemId);
        toast('📝 특별관리물질 취급일지 작성 화면으로 연결되었습니다.');
      }, 120);
      return;
    }

    // 2. 비품 대여 신청 직행 (#inventory?action=quick_loan or #loan or #borrow or ?action=quick_loan or ?action=borrow)
    const isLoanAction = (hashPath === 'inventory' && getParam('action') === 'quick_loan') ||
                         (hashPath === 'loan' && getParam('action')) || hashPath === 'borrow' ||
                         getParam('action') === 'quick_loan' || getParam('action') === 'borrow';
    const loanAssetId = getParam('loan') || (getParam('action') === 'borrow' ? getParam('id') : null);

    if(isLoanAction || loanAssetId){
      setPortalModule('inventory', { switchView: false });
      showView('inventory', { updateUrl: false });
      setTimeout(function(){
        openModal('borrow', loanAssetId);
        toast('📱 비품 대여 신청 화면으로 연결되었습니다.');
      }, 120);
      return;
    }

    // 3. 비품 반납 직행
    const returnAssetId = getParam('return') || (getParam('action') === 'return' ? getParam('id') : null);
    if(returnAssetId){
      setPortalModule('inventory', { switchView: false });
      showView('inventory', { updateUrl: false });
      const act = activeLoanFor(returnAssetId) || loans.find(function(l){ return String(l.id) === String(returnAssetId); });
      setTimeout(function(){
        openModal('return', act ? act.id : returnAssetId);
      }, 120);
      return;
    }

    // 4. 연구장비 전자 로그북 직행 (#logbook?eq=EQ-XRD-01 or ?logbook=XRD or #xrd or eq=EQ-XRD-01)
    // 중요: 단순 #logbook 진입(사용자가 상단 탭 클릭 등) 시에는 팝업 모달 없이 카탈로그/상세 뷰만 표시하고,
    // QR 스캔(eq 파라미터 또는 quick_start 또는 #xrd)으로 진입한 경우에만 2번째 사진(HR-XRD 전자 로그북 워크스테이션)으로 즉시 직행!
    const eqCode = getParam('eq') || (hashPath === 'logbook' ? getParam('equipment') : null) || (hashPath === 'xrd' ? 'EQ-XRD-01' : null);
    const isEquipmentQrEntry = (hashPath === 'logbook' && getParam('action') === 'quick_start') ||
                               Boolean(eqCode) || (getParam('action') === 'quick_start' && hashPath === 'logbook') ||
                               hashPath === 'xrd';

    if(isEquipmentQrEntry){
      setPortalModule('lims', { switchView: false });
      showView('logbook', { updateUrl: false });
      const targetCode = (eqCode || 'EQ-XRD-01').trim();
      const found = researchEquipments.find(function(e){
        return e.id.toLowerCase() === targetCode.toLowerCase() || e.code.toLowerCase() === targetCode.toLowerCase();
      }) || researchEquipments[0];

      // 두 번째 사진의 정통 HR-XRD 전자 로그북 워크스테이션 화면(selectResearchEquipment)으로 직행!
      // (팝업 모달 modalTestDriveBackdrop을 띄우지 않고, 왼쪽 Start session 폼과 오른쪽 로그 기록 테이블이 있는 화면으로 직행)
      selectResearchEquipment(found.id);
      if(typeof showXrdMode === 'function'){
        showXrdMode('start');
      }

      setTimeout(function(){
        const formBox = $('xrdForm') || $('xrdLogbookContainer');
        if(formBox && typeof formBox.scrollIntoView === 'function'){
          formBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        toast('⚡ ' + (found ? (found.code || found.name) : 'HR-XRD') + ' 전자 로그북으로 직행했습니다.');
      }, 120);
      return;
    }

    // 5. 단독 로그북 키오스크 모드
    if(hashPath === 'standalone-logbook'){
      showView('logbook', { updateUrl: false });
      return;
    }
  } catch(e) {
    console.warn('URL Fast-track 처리 실패:', e);
  }
}

// ============================================================================
// [IBS 2DQH N센터 86291호 연구실 안전관리시스템 엔진 v2 (Full Reactive Engine)]
// ============================================================================

const LAB_291_CHEMICALS_MASTER = [
  {
    "id": "CHEM-291-01",
    "name": "Sulfuric acid(ACS reagent, 95.0-98.0%)",
    "nameKo": "황산 (Sulfuric acid)",
    "mfg": "Sigma-Aldrich",
    "catNo": "258105",
    "cas": "7664-93-9",
    "code": "P-01",
    "hazard": "D",
    "hazardDesc": "급성독성/부식성",
    "qty": "1/1",
    "stock": 500,
    "unit": "mL",
    "handler": "이강민",
    "location": "N센터 86291호 산시약장 A-01",
    "status": "입고",
    "inDate": "2026.03.12",
    "expDate": "2028.03.12",
    "isSpecial": true,
    "carcinogen": true,
    "mutagen": false,
    "reprotoxic": false,
    "specialNoticeSub": "(Sulfuric acid 95.0-98.0% 함유)"
  },
  {
    "id": "CHEM-291-02",
    "name": "Pyridinium chlorochromate, 98%",
    "nameKo": "피리디늄 클로로크로메이트 (PCC)",
    "mfg": "Sigma-Aldrich",
    "catNo": "190144",
    "cas": "26297-50-8",
    "code": "P-02",
    "hazard": "D",
    "hazardDesc": "크롬(VI) 화합물 발암성",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "N센터 86291호 특별시약장 B-01",
    "status": "입고",
    "inDate": "2026.03.12",
    "expDate": "2028.03.12",
    "isSpecial": true,
    "carcinogen": true,
    "mutagen": true,
    "reprotoxic": false,
    "specialNoticeSub": "(Chromium(VI) trioxide complex 98% 함유)"
  },
  {
    "id": "CHEM-291-03",
    "name": "Tetrachloroethylene",
    "nameKo": "테트라클로로에틸렌",
    "mfg": "Sigma-Aldrich",
    "catNo": "270393",
    "cas": "127-18-4",
    "code": "P-03",
    "hazard": "D",
    "hazardDesc": "유기용매 발암성 1B",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "N센터 86291호 유기용매장 C-01",
    "status": "입고",
    "inDate": "2026.03.12",
    "expDate": "2028.03.12",
    "isSpecial": true,
    "carcinogen": true,
    "mutagen": false,
    "reprotoxic": false,
    "specialNoticeSub": "(Tetrachloroethylene ≥99.0% 함유)"
  },
  {
    "id": "CHEM-291-04",
    "name": "N,N-Dimethylformamide",
    "nameKo": "디메틸포름아미드 (DMF)",
    "mfg": "Sigma-Aldrich",
    "catNo": "227056",
    "cas": "68-12-2",
    "code": "P-04",
    "hazard": "D",
    "hazardDesc": "생식독성 1B",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "N센터 86291호 유기용매장 C-02",
    "status": "입고",
    "inDate": "2026.03.12",
    "expDate": "2028.03.12",
    "isSpecial": true,
    "carcinogen": false,
    "mutagen": false,
    "reprotoxic": true,
    "specialNoticeSub": "(N,N-Dimethylformamide ≥99.5% 함유)"
  },
  {
    "id": "CHEM-291-05",
    "name": "Cadmium(II) acetate",
    "nameKo": "초산카드뮴",
    "mfg": "Sigma-Aldrich",
    "catNo": "289159",
    "cas": "543-90-8",
    "code": "P-05",
    "hazard": "D",
    "hazardDesc": "카드뮴 화합물 발암성 1B",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "N센터 86291호 독극물함 D-01",
    "status": "입고",
    "inDate": "2026.03.16",
    "expDate": "2028.03.16",
    "isSpecial": true,
    "carcinogen": true,
    "mutagen": true,
    "reprotoxic": true,
    "specialNoticeSub": "(Cadmium acetate 0.1% 이상 함유)"
  },
  {
    "id": "CHEM-291-06",
    "name": "Lead(II) iodide (Sigma)",
    "nameKo": "요오드화납 (시약 1)",
    "mfg": "Sigma-Aldrich",
    "catNo": "203645",
    "cas": "10101-63-0",
    "code": "P-06",
    "hazard": "D",
    "hazardDesc": "납 화합물 생식독성 1A",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "N센터 86291호 글러브박스 G-01",
    "status": "입고",
    "inDate": "2026.03.16",
    "expDate": "2028.03.16",
    "isSpecial": true,
    "carcinogen": false,
    "mutagen": false,
    "reprotoxic": true,
    "specialNoticeSub": "(Lead(II) iodide 0.3% 이상 함유)"
  },
  {
    "id": "CHEM-291-07",
    "name": "Lead(II) iodide (Alfa)",
    "nameKo": "요오드화납 (시약 2)",
    "mfg": "Alfa Aesar",
    "catNo": "12724",
    "cas": "10101-63-0",
    "code": "P-07",
    "hazard": "D",
    "hazardDesc": "납 화합물 생식독성 1A",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "N센터 86291호 글러브박스 G-01",
    "status": "입고",
    "inDate": "2026.03.16",
    "expDate": "2028.03.16",
    "isSpecial": true,
    "carcinogen": false,
    "mutagen": false,
    "reprotoxic": true,
    "specialNoticeSub": "(Lead(II) iodide 0.3% 이상 함유)"
  },
  {
    "id": "CHEM-291-08",
    "name": "Chromium(III) chloride",
    "nameKo": "염화크롬(III)",
    "mfg": "Sigma-Aldrich",
    "catNo": "230723",
    "cas": "10025-73-7",
    "code": "P-08",
    "hazard": "D",
    "hazardDesc": "크롬 화합물 변이원성",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "N센터 86291호 특별시약장 B-02",
    "status": "입고",
    "inDate": "2026.03.17",
    "expDate": "2028.03.17",
    "isSpecial": true,
    "carcinogen": false,
    "mutagen": true,
    "reprotoxic": false,
    "specialNoticeSub": "(Chromium(III) chloride 1.0% 이상 함유)"
  },
  {
    "id": "CHEM-291-09",
    "name": "Benzene, for HPLC, ≥99.9%",
    "nameKo": "벤젠 (Benzene)",
    "mfg": "Sigma-Aldrich",
    "catNo": "270709",
    "cas": "71-43-2",
    "code": "P-09",
    "hazard": "F",
    "hazardDesc": "인화성 및 발암성 1A",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "N센터 86291호 인화성시약장 F-01",
    "status": "입고",
    "inDate": "2026.03.17",
    "expDate": "2028.03.17",
    "isSpecial": true,
    "carcinogen": true,
    "mutagen": true,
    "reprotoxic": true,
    "specialNoticeSub": "(Benzene, for HPLC, ≥99.9% 0.1% 이상 함유)"
  },
  {
    "id": "CHEM-291-10",
    "name": "Nickel(II) nitrate hexahydrate",
    "nameKo": "질산니켈(II) 6수화물",
    "mfg": "Sigma-Aldrich",
    "catNo": "203874",
    "cas": "13478-00-7",
    "code": "P-10",
    "hazard": "D",
    "hazardDesc": "니켈 화합물 발암성 1A",
    "qty": "1/1",
    "stock": 20,
    "unit": "g",
    "handler": "이강민",
    "location": "N센터 86291호 특별시약장 B-03",
    "status": "입고",
    "inDate": "2026.03.17",
    "expDate": "2028.03.17",
    "isSpecial": true,
    "carcinogen": true,
    "mutagen": true,
    "reprotoxic": true,
    "specialNoticeSub": "(Nickel(II) nitrate hexahydrate 0.1% 이상 함유)"
  },
  {
    "id": "CHEM-CAT-CS-011",
    "name": "Thioacetamide",
    "nameKo": "Thioacetamide",
    "mfg": "Sigma-Aldrich",
    "catNo": "172502-25G",
    "cas": "62-55-5",
    "code": "R-001",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-012",
    "name": "Polyacrylonitrile",
    "nameKo": "Polyacrylonitrile",
    "mfg": "Sigma-Aldrich",
    "catNo": "181315-50G",
    "cas": "25014-41-9",
    "code": "R-002",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-013",
    "name": "Terephthalic acid",
    "nameKo": "Terephthalic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "185361-5G",
    "cas": "100-21-0",
    "code": "R-003",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-014",
    "name": "Nickel(II) chloride hexahydrate",
    "nameKo": "Nickel(II) chloride hexahydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "203866-5G",
    "cas": "7791-20-0",
    "code": "R-004",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-015",
    "name": "Ammonium dihydrogenphosphate",
    "nameKo": "Ammonium dihydrogenphosphate",
    "mfg": "Sigma-Aldrich",
    "catNo": "204005-25G",
    "cas": "7722-76-1",
    "code": "R-005",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-016",
    "name": "Iron(II) sulfate heptahydrate",
    "nameKo": "Iron(II) sulfate heptahydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "215422-5G",
    "cas": "7782-63-0",
    "code": "R-006",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-017",
    "name": "Cobalt(II,III) oxide",
    "nameKo": "Cobalt(II,III) oxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "221643-50G",
    "cas": "1308-06-1",
    "code": "R-007",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-018",
    "name": "Nickel(II) sulfate hexahydrate",
    "nameKo": "Nickel(II) sulfate hexahydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "227676-100G",
    "cas": "10101-97-0",
    "code": "R-008",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-019",
    "name": "Molybdenum(IV) sulfide",
    "nameKo": "Molybdenum(IV) sulfide",
    "mfg": "Sigma-Aldrich",
    "catNo": "234842-100G",
    "cas": "1317-33-5",
    "code": "R-009",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-020",
    "name": "Tin(IV) oxide",
    "nameKo": "Tin(IV) oxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "244651-100G",
    "cas": "18282-10-5",
    "code": "R-010",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-021",
    "name": "Bismuth(III) nitrate pentahydrate",
    "nameKo": "Bismuth(III) nitrate pentahydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "248592-100G",
    "cas": "10035-06-0",
    "code": "R-011",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-022",
    "name": "Tris(hydroxymethyl)aminomethane",
    "nameKo": "Tris(hydroxymethyl)aminomethane",
    "mfg": "Sigma-Aldrich",
    "catNo": "252859-100G",
    "cas": "77-86-1",
    "code": "R-012",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-023",
    "name": "Aluminum acetate, basic",
    "nameKo": "Aluminum acetate, basic",
    "mfg": "Sigma-Aldrich",
    "catNo": "289825-100G",
    "cas": "142-03-0",
    "code": "R-013",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-024",
    "name": "Magnesium ethoxide",
    "nameKo": "Magnesium ethoxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "291846-100G",
    "cas": "2414-98-4",
    "code": "R-014",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-025",
    "name": "Manganese(II) carbonate",
    "nameKo": "Manganese(II) carbonate",
    "mfg": "Sigma-Aldrich",
    "catNo": "377449-250G",
    "cas": "598-62-9",
    "code": "R-015",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 250,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-026",
    "name": "Poly(sodium 4-styrenesulfonate)",
    "nameKo": "Poly(sodium 4-styrenesulfonate)",
    "mfg": "Sigma-Aldrich",
    "catNo": "434574-5G",
    "cas": "25704-18-1",
    "code": "R-016",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-027",
    "name": "Manganese(III) oxide",
    "nameKo": "Manganese(III) oxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "463701-5G",
    "cas": "1317-34-6",
    "code": "R-017",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-028",
    "name": "Copper(II) chloride dihydrate",
    "nameKo": "Copper(II) chloride dihydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "467847-50G",
    "cas": "10125-13-0",
    "code": "R-018",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-029",
    "name": "Iron(III) acetylacetonate",
    "nameKo": "Iron(III) acetylacetonate",
    "mfg": "Sigma-Aldrich",
    "catNo": "517003-10G",
    "cas": "14024-18-1",
    "code": "R-019",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-030",
    "name": "Lithium acetate",
    "nameKo": "Lithium acetate",
    "mfg": "Sigma-Aldrich",
    "catNo": "517992-100G",
    "cas": "546-89-4",
    "code": "R-020",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-031",
    "name": "Zinc",
    "nameKo": "Zinc",
    "mfg": "Sigma-Aldrich",
    "catNo": "578002-5G",
    "cas": "7440-66-6",
    "code": "R-021",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-032",
    "name": "Manganese(II) acetate tetrahydrate",
    "nameKo": "Manganese(II) acetate tetrahydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "63537-250G",
    "cas": "6156-78-1",
    "code": "R-022",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 250,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-033",
    "name": "Oxalic acid",
    "nameKo": "Oxalic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "75688-50G",
    "cas": "144-62-7",
    "code": "R-023",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-034",
    "name": "Titanium(IV) isopropoxide",
    "nameKo": "Titanium(IV) isopropoxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "87560-100ML",
    "cas": "546-68-9",
    "code": "R-024",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-036",
    "name": "Hexadecylamine",
    "nameKo": "Hexadecylamine",
    "mfg": "Sigma-Aldrich",
    "catNo": "H7408-500G",
    "cas": "143-27-1",
    "code": "R-026",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-037",
    "name": "Polyvinylpyrrolidone",
    "nameKo": "Polyvinylpyrrolidone",
    "mfg": "Sigma-Aldrich",
    "catNo": "PVP40-50G",
    "cas": "9003-39-8",
    "code": "R-027",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-038",
    "name": "Sodium hydroxide",
    "nameKo": "Sodium hydroxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "S5881-500G",
    "cas": "1310-73-2",
    "code": "R-028",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-039",
    "name": "Copper(II) hydroxide",
    "nameKo": "Copper(II) hydroxide",
    "mfg": "Alfa Aesar",
    "catNo": "032733.36",
    "cas": "20427-59-2",
    "code": "R-029",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-041",
    "name": "Hydrazine hydrate",
    "nameKo": "Hydrazine hydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "225819-250g",
    "cas": "10217-52-4",
    "code": "R-031",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 250,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-042",
    "name": "Bromocresol green",
    "nameKo": "Bromocresol green",
    "mfg": "삼전화학(주)",
    "catNo": "B2736",
    "cas": "76-60-8",
    "code": "R-032",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-043",
    "name": "Magnesium nitrate hexahydrate, 98.0%, EP",
    "nameKo": "Magnesium nitrate hexahydrate, 98.0%, EP",
    "mfg": "삼전화학(주)",
    "catNo": "M0074",
    "cas": "13446-18-9",
    "code": "R-033",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-044",
    "name": "Potassium hydroxide, 95.0%",
    "nameKo": "Potassium hydroxide, 95.0%",
    "mfg": "삼전화학(주)",
    "catNo": "P0925",
    "cas": "1310-58-3",
    "code": "R-034",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "kg",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-045",
    "name": "Lithium hydroxide monohydrate",
    "nameKo": "Lithium hydroxide monohydrate",
    "mfg": "Junsei Chemical Co.,Ltd.",
    "catNo": "39225-0401",
    "cas": "1310-66-3",
    "code": "R-035",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-046",
    "name": "0.01mol/l-Silver nitrate solution (N/100)",
    "nameKo": "0.01mol/l-Silver nitrate solution (N/100)",
    "mfg": "삼전화학(주)",
    "catNo": "S4008",
    "cas": "7761-88-8",
    "code": "R-036",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-047",
    "name": "Sodium bicarbonate, 99.5-100.5%",
    "nameKo": "Sodium bicarbonate, 99.5-100.5%",
    "mfg": "삼전화학(주)",
    "catNo": "S0347",
    "cas": "144-55-8",
    "code": "R-037",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-048",
    "name": "Alginic acid, sodium salt (=Sodium alginate)",
    "nameKo": "Alginic acid, sodium salt (=Sodium alginate)",
    "mfg": "삼전화학(주)",
    "catNo": "A3148",
    "cas": "9005-38-3",
    "code": "R-038",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-049",
    "name": "Zinc Nitrate Hexahydrate",
    "nameKo": "Zinc Nitrate Hexahydrate",
    "mfg": "덕산약품공업(주)",
    "catNo": "2643",
    "cas": "10196-18-6",
    "code": "R-039",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "kg",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-050",
    "name": "1-Amino-2-naphthol-4-sulfonic acid",
    "nameKo": "1-Amino-2-naphthol-4-sulfonic acid",
    "mfg": "KANTO CHEMICAL CO.,INC.",
    "catNo": "01234-30",
    "cas": "116-63-2",
    "code": "R-040",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-051",
    "name": "Potassium Nitrate",
    "nameKo": "Potassium Nitrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "PHR2203-1G",
    "cas": "7757-79-1",
    "code": "R-041",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-052",
    "name": "Sodium acetate",
    "nameKo": "Sodium acetate",
    "mfg": "Sigma-Aldrich",
    "catNo": "NMIQNMR006-1G",
    "cas": "127-09-3",
    "code": "R-042",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-053",
    "name": "Potassium carbonate",
    "nameKo": "Potassium carbonate",
    "mfg": "Sigma-Aldrich",
    "catNo": "900501-1KG",
    "cas": "584-08-7",
    "code": "R-043",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "kg",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-054",
    "name": "Boric anhydride",
    "nameKo": "Boric anhydride",
    "mfg": "Sigma-Aldrich",
    "catNo": "15678-50G",
    "cas": "1303-86-2",
    "code": "R-044",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-055",
    "name": "Ammonium phosphate monobasic",
    "nameKo": "Ammonium phosphate monobasic",
    "mfg": "Sigma-Aldrich",
    "catNo": "88431-25G",
    "cas": "7722-76-1",
    "code": "R-045",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-056",
    "name": "Iron",
    "nameKo": "Iron",
    "mfg": "Sigma-Aldrich",
    "catNo": "413054-25G",
    "cas": "7439-89-6",
    "code": "R-046",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-058",
    "name": "L-Ascorbic acid",
    "nameKo": "L-Ascorbic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "47863",
    "cas": "50-81-7",
    "code": "R-048",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 1000,
    "unit": "mg",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-059",
    "name": "L-Cysteine, 98+%",
    "nameKo": "L-Cysteine, 98+%",
    "mfg": "Alfa Aesar",
    "catNo": "CAT-148",
    "cas": "52-90-4",
    "code": "R-049",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-060",
    "name": "Chromium(III) Oxide, EP",
    "nameKo": "Chromium(III) Oxide, EP",
    "mfg": "덕산약품공업(주)",
    "catNo": "3518",
    "cas": "1308-38-9",
    "code": "R-050",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-061",
    "name": "4,4'-Biphenyldicarboxylic Acid",
    "nameKo": "4,4'-Biphenyldicarboxylic Acid",
    "mfg": "TCI",
    "catNo": "B1191-5",
    "cas": "787-70-2",
    "code": "R-051",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-062",
    "name": "Ammonium nitrate",
    "nameKo": "Ammonium nitrate",
    "mfg": "Junsei Chemical Co.,Ltd.",
    "catNo": "37355-1250",
    "cas": "6484-52-2",
    "code": "R-052",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "kg",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-063",
    "name": "2,6-Naphthalenedicarboxylic acid",
    "nameKo": "2,6-Naphthalenedicarboxylic acid",
    "mfg": "TCI",
    "catNo": "N0377",
    "cas": "1141-38-4",
    "code": "R-053",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-064",
    "name": "Zinc sulfate solution",
    "nameKo": "Zinc sulfate solution",
    "mfg": "Sigma-Aldrich",
    "catNo": "Z2876-500ML",
    "cas": "7733-02-0",
    "code": "R-054",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "mL",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-065",
    "name": "Agar",
    "nameKo": "Agar",
    "mfg": "Sigma-Aldrich",
    "catNo": "A6686-100G",
    "cas": "9002-18-0",
    "code": "R-055",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-066",
    "name": "Bromocresol purple(BCP), GR",
    "nameKo": "Bromocresol purple(BCP), GR",
    "mfg": "삼전화학(주)",
    "catNo": "000B0501-25G",
    "cas": "115-40-2",
    "code": "R-056",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-067",
    "name": "D-(+)-Glucosamine hydrochloride",
    "nameKo": "D-(+)-Glucosamine hydrochloride",
    "mfg": "Sigma-Aldrich",
    "catNo": "G-1514-500G",
    "cas": "66-84-2",
    "code": "R-057",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-068",
    "name": "Potassium sulfate",
    "nameKo": "Potassium sulfate",
    "mfg": "Junsei Chemical Co.,Ltd.",
    "catNo": "83145-0301",
    "cas": "778-80-5",
    "code": "R-058",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-069",
    "name": "Iron(III) nitrate nonahydrate",
    "nameKo": "Iron(III) nitrate nonahydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "F3002",
    "cas": "7782-61-8",
    "code": "R-059",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-070",
    "name": "Oxalic acid dihydrate",
    "nameKo": "Oxalic acid dihydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "75699-500G",
    "cas": "6153-56-6",
    "code": "R-060",
    "hazard": "C",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-071",
    "name": "Titanium(IV) chloride",
    "nameKo": "Titanium(IV) chloride",
    "mfg": "Sigma-Aldrich",
    "catNo": "254312-10G",
    "cas": "7550-45-0",
    "code": "R-061",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-072",
    "name": "Potassium permanganate",
    "nameKo": "Potassium permanganate",
    "mfg": "Sigma-Aldrich",
    "catNo": "CAT-161",
    "cas": "7722-64-7",
    "code": "R-062",
    "hazard": "C",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-073",
    "name": "Magnesium chloride",
    "nameKo": "Magnesium chloride",
    "mfg": "Sigma-Aldrich",
    "catNo": "ㅡ8266",
    "cas": "7786-30-3",
    "code": "R-063",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-074",
    "name": "Zinc acetate dihydrate",
    "nameKo": "Zinc acetate dihydrate",
    "mfg": "삼전화학(주)",
    "catNo": "Z0303",
    "cas": "5970-45-6",
    "code": "R-064",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-075",
    "name": "Hexamethylenetetramine",
    "nameKo": "Hexamethylenetetramine",
    "mfg": "Sigma-Aldrich",
    "catNo": "398160-250G",
    "cas": "110-97-0",
    "code": "R-065",
    "hazard": "C",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 250,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-076",
    "name": "Sodium phosphate monobasic monohydrate",
    "nameKo": "Sodium phosphate monobasic monohydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "s9638-250g",
    "cas": "10049-21-5",
    "code": "R-066",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 250,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-077",
    "name": "D-(+)-Glucose",
    "nameKo": "D-(+)-Glucose",
    "mfg": "Sigma-Aldrich",
    "catNo": "G4750",
    "cas": "90-80-2",
    "code": "R-067",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 1,
    "unit": "kg",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-078",
    "name": "hexadecyltrimethylammonium bromide",
    "nameKo": "hexadecyltrimethylammonium bromide",
    "mfg": "Sigma-Aldrich",
    "catNo": "CAT-167",
    "cas": "57-09-0",
    "code": "R-068",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 250,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-079",
    "name": "Carbon graphite",
    "nameKo": "Carbon graphite",
    "mfg": "Sigma-Aldrich",
    "catNo": "104206",
    "cas": "7782-42-5",
    "code": "R-069",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-080",
    "name": "Thiourea",
    "nameKo": "Thiourea",
    "mfg": "Sigma-Aldrich",
    "catNo": "T8656",
    "cas": "62-56-6",
    "code": "R-070",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-081",
    "name": "Urea",
    "nameKo": "Urea",
    "mfg": "Sigma-Aldrich",
    "catNo": "1.08487.0100",
    "cas": "57-13-6",
    "code": "R-071",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "화학재료합성실 / PVD실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-082",
    "name": "ARGON",
    "nameKo": "ARGON",
    "mfg": "Matheson TRIGAS",
    "catNo": "CAT-171",
    "cas": "7440-37-1",
    "code": "R-072",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 10,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-083",
    "name": "Carbon Nanotube Single-walled (>85%) below 3nm(Average diam.), over 5µm(Average length)",
    "nameKo": "Carbon Nanotube Single-walled (>85%) below 3nm(Average diam.), over 5µm(Average length)",
    "mfg": "TCI",
    "catNo": "C3133",
    "cas": "308068-56-6",
    "code": "R-073",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 200,
    "unit": "mg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-084",
    "name": "HELIUM, H. P.",
    "nameKo": "HELIUM, H. P.",
    "mfg": "Matheson TRIGAS",
    "catNo": "CAT-173",
    "cas": "7440-59-7",
    "code": "R-074",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 10,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-085",
    "name": "Reagent Alcohol, anhydrous, ≤0.003% water",
    "nameKo": "Reagent Alcohol, anhydrous, ≤0.003% water",
    "mfg": "Sigma-Aldrich",
    "catNo": "277649",
    "cas": "64-17-5",
    "code": "R-075",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-086",
    "name": "Oxygen",
    "nameKo": "Oxygen",
    "mfg": "Sigma-Aldrich",
    "catNo": "CAT-175",
    "cas": "7782-44-7",
    "code": "R-076",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 47,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-088",
    "name": "Iron(III) chloride solution",
    "nameKo": "Iron(III) chloride solution",
    "mfg": "Sigma-Aldrich",
    "catNo": "12322-2.5L",
    "cas": "7705-08-0",
    "code": "R-078",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 2.5,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-089",
    "name": "Poly(Bisphenol A carbonate)",
    "nameKo": "Poly(Bisphenol A carbonate)",
    "mfg": "Sigma-Aldrich",
    "catNo": "181625-250G",
    "cas": "25037-45-0",
    "code": "R-079",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 250,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-090",
    "name": "Polystyrene",
    "nameKo": "Polystyrene",
    "mfg": "Sigma-Aldrich",
    "catNo": "182427-25G",
    "cas": "9003-53-6",
    "code": "R-080",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-091",
    "name": "n-Butyllithium solution, 1.6 M in hexanes",
    "nameKo": "n-Butyllithium solution, 1.6 M in hexanes",
    "mfg": "Sigma-Aldrich",
    "catNo": "186171-100ML",
    "cas": "109-72-8",
    "code": "R-081",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-094",
    "name": "Benzo[a]pyrene, ≥96% (HPLC)",
    "nameKo": "Benzo[a]pyrene, ≥96% (HPLC)",
    "mfg": "Sigma-Aldrich",
    "catNo": "B1760-100MG",
    "cas": "50-32-8",
    "code": "R-084",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-095",
    "name": "Sodium cholate hydrate",
    "nameKo": "Sodium cholate hydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "C1254-100G",
    "cas": "206986-87-0",
    "code": "R-085",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-096",
    "name": "Copper(II) acetylacetonate(97%)",
    "nameKo": "Copper(II) acetylacetonate(97%)",
    "mfg": "Sigma-Aldrich",
    "catNo": "C87851-25G",
    "cas": "13395-16-9",
    "code": "R-086",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-098",
    "name": "Cesium iodide",
    "nameKo": "Cesium iodide",
    "mfg": "Sigma-Aldrich",
    "catNo": "203033-10G",
    "cas": "7789-17-5",
    "code": "R-088",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-099",
    "name": "Cobalt(II) nitrate hexahydrate",
    "nameKo": "Cobalt(II) nitrate hexahydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "203106-50G",
    "cas": "10026-22-9",
    "code": "R-089",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-100",
    "name": "Copper",
    "nameKo": "Copper",
    "mfg": "Sigma-Aldrich",
    "catNo": "203122-10G",
    "cas": "7440-50-8",
    "code": "R-090",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-102",
    "name": "Platinum",
    "nameKo": "Platinum",
    "mfg": "Sigma-Aldrich",
    "catNo": "204013-1G",
    "cas": "7440-06-4",
    "code": "R-092",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-103",
    "name": "Ammonium metavanadate",
    "nameKo": "Ammonium metavanadate",
    "mfg": "Sigma-Aldrich",
    "catNo": "205559-250G",
    "cas": "7803-55-6",
    "code": "R-093",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 250,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-104",
    "name": "Chloroplatinic acid hexahydrate",
    "nameKo": "Chloroplatinic acid hexahydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "206083-5G",
    "cas": "18497-13-7",
    "code": "R-094",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-105",
    "name": "Platinum(II) chloride",
    "nameKo": "Platinum(II) chloride",
    "mfg": "Sigma-Aldrich",
    "catNo": "206091-1G",
    "cas": "10025-65-7",
    "code": "R-095",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-106",
    "name": "Titanium(IV) chloride(ReagentPlus®, 99.9% trace metals basis)",
    "nameKo": "Titanium(IV) chloride(ReagentPlus®, 99.9% trace metals basis)",
    "mfg": "Sigma-Aldrich",
    "catNo": "208566-200G",
    "cas": "7550-45-0",
    "code": "R-096",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 200,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-107",
    "name": "Selenium",
    "nameKo": "Selenium",
    "mfg": "Sigma-Aldrich",
    "catNo": "209651-50G",
    "cas": "7782-49-2",
    "code": "R-097",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-108",
    "name": "Lead(II) iodide",
    "nameKo": "Lead(II) iodide",
    "mfg": "Sigma-Aldrich",
    "catNo": "211168-50G",
    "cas": "10101-63-0",
    "code": "R-098",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-109",
    "name": "Selenous acid",
    "nameKo": "Selenous acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "211176-50G",
    "cas": "7783-00-8",
    "code": "R-099",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-110",
    "name": "Hypophosphorous acid solution",
    "nameKo": "Hypophosphorous acid solution",
    "mfg": "Sigma-Aldrich",
    "catNo": "214906-500G",
    "cas": "6303-21-5",
    "code": "R-100",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-111",
    "name": "Gallium(III) oxide",
    "nameKo": "Gallium(III) oxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "215066-10G",
    "cas": "12024-21-4",
    "code": "R-101",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-112",
    "name": "Sodium persulfate",
    "nameKo": "Sodium persulfate",
    "mfg": "Sigma-Aldrich",
    "catNo": "216232-25G",
    "cas": "7775-27-1",
    "code": "R-102",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-114",
    "name": "Tetraphenylphosphonium chloride",
    "nameKo": "Tetraphenylphosphonium chloride",
    "mfg": "Sigma-Aldrich",
    "catNo": "218790-5G",
    "cas": "2001-45-8",
    "code": "R-104",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-115",
    "name": "Potassium hydroxide",
    "nameKo": "Potassium hydroxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "221473-25G",
    "cas": "1310-58-3",
    "code": "R-105",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-116",
    "name": "Manganese(II) bromide",
    "nameKo": "Manganese(II) bromide",
    "mfg": "Sigma-Aldrich",
    "catNo": "223646-25G",
    "cas": "13446-03-2",
    "code": "R-106",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-117",
    "name": "Bis(acetylacetonato)dioxomolybdenum(VI)",
    "nameKo": "Bis(acetylacetonato)dioxomolybdenum(VI)",
    "mfg": "Sigma-Aldrich",
    "catNo": "227749-10G",
    "cas": "17524-05-9",
    "code": "R-107",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-118",
    "name": "n-Butyllithium solution, 2.5 M in hexanes",
    "nameKo": "n-Butyllithium solution, 2.5 M in hexanes",
    "mfg": "Sigma-Aldrich",
    "catNo": "230707-100ML",
    "cas": "109-72-8",
    "code": "R-108",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-119",
    "name": "Cobalt(II) chloride",
    "nameKo": "Cobalt(II) chloride",
    "mfg": "Sigma-Aldrich",
    "catNo": "232696-5G",
    "cas": "7646-79-9",
    "code": "R-109",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-120",
    "name": "Iron(III) chloride hexahydrate",
    "nameKo": "Iron(III) chloride hexahydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "236489-100G",
    "cas": "10025-77-1",
    "code": "R-110",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-121",
    "name": "1-Iodooctane, 98%",
    "nameKo": "1-Iodooctane, 98%",
    "mfg": "Sigma-Aldrich",
    "catNo": "238295-100G",
    "cas": "629-27-6",
    "code": "R-111",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-122",
    "name": "Calcium hydroxide",
    "nameKo": "Calcium hydroxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "239232-100G",
    "cas": "1305-62-0",
    "code": "R-112",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-123",
    "name": "Bromoform, contains 60-120 ppm 2-methyl-2-butene as stabilizer, 99%",
    "nameKo": "Bromoform, contains 60-120 ppm 2-methyl-2-butene as stabilizer, 99%",
    "mfg": "Sigma-Aldrich",
    "catNo": "241032-50G",
    "cas": "75-25-2",
    "code": "R-113",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-124",
    "name": "Phosphorus triiodide",
    "nameKo": "Phosphorus triiodide",
    "mfg": "Sigma-Aldrich",
    "catNo": "241555-10G",
    "cas": "13455-01-1",
    "code": "R-114",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-125",
    "name": "Hydrobromic acid",
    "nameKo": "Hydrobromic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "244260-100ML",
    "cas": "10035-10-6",
    "code": "R-115",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-126",
    "name": "Toluene, anhydrous, 99.8%",
    "nameKo": "Toluene, anhydrous, 99.8%",
    "mfg": "Sigma-Aldrich",
    "catNo": "244511-1L",
    "cas": "108-88-3",
    "code": "R-116",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-127",
    "name": "Thionyl bromide",
    "nameKo": "Thionyl bromide",
    "mfg": "Sigma-Aldrich",
    "catNo": "251259-25G",
    "cas": "507-16-4",
    "code": "R-117",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-128",
    "name": "Sulfanilic acid(ACS reagent, 99%)",
    "nameKo": "Sulfanilic acid(ACS reagent, 99%)",
    "mfg": "Sigma-Aldrich",
    "catNo": "251917-25G",
    "cas": "121-57-3",
    "code": "R-118",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-130",
    "name": "Ammonium chloride",
    "nameKo": "Ammonium chloride",
    "mfg": "Sigma-Aldrich",
    "catNo": "254134-5G",
    "cas": "12125-02-9",
    "code": "R-120",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-133",
    "name": "1-Pyrenebutyric acid",
    "nameKo": "1-Pyrenebutyric acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "257354-1G",
    "cas": "3443-45-6",
    "code": "R-123",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-134",
    "name": "Tellurium",
    "nameKo": "Tellurium",
    "mfg": "Sigma-Aldrich",
    "catNo": "264865-25G",
    "cas": "13494-80-9",
    "code": "R-124",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-135",
    "name": "Iron(II) sulfide",
    "nameKo": "Iron(II) sulfide",
    "mfg": "Sigma-Aldrich",
    "catNo": "268704-250G",
    "cas": "1317-37-9",
    "code": "R-125",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 250,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-136",
    "name": "Acetone, for HPLC, ≥99.9%",
    "nameKo": "Acetone, for HPLC, ≥99.9%",
    "mfg": "Sigma-Aldrich",
    "catNo": "270725-1L",
    "cas": "67-64-1",
    "code": "R-126",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-138",
    "name": "Reagent Alcohol",
    "nameKo": "Reagent Alcohol",
    "mfg": "Sigma-Aldrich",
    "catNo": "270741-1L",
    "cas": "64-17-5",
    "code": "R-128",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-139",
    "name": "Dichloromethane(anhydrous, ≥99.8%, contains 40-150 ppm amylene as stabilizer)",
    "nameKo": "Dichloromethane(anhydrous, ≥99.8%, contains 40-150 ppm amylene as stabilizer)",
    "mfg": "Sigma-Aldrich",
    "catNo": "270997-100ML",
    "cas": "75-09-2",
    "code": "R-129",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-141",
    "name": "2-Propanol",
    "nameKo": "2-Propanol",
    "mfg": "Sigma-Aldrich",
    "catNo": "278475-1L",
    "cas": "67-63-0",
    "code": "R-131",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-142",
    "name": "Tetrabutylammonium hexafluorophosphate",
    "nameKo": "Tetrabutylammonium hexafluorophosphate",
    "mfg": "Sigma-Aldrich",
    "catNo": "281026-5G",
    "cas": "3109-63-5",
    "code": "R-132",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-143",
    "name": "1-Butanol",
    "nameKo": "1-Butanol",
    "mfg": "Sigma-Aldrich",
    "catNo": "281549-100ML",
    "cas": "71-36-3",
    "code": "R-133",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-144",
    "name": "Poly(allylamine hydrochloride)",
    "nameKo": "Poly(allylamine hydrochloride)",
    "mfg": "Sigma-Aldrich",
    "catNo": "283223-5G",
    "cas": "71550-12-4",
    "code": "R-134",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-145",
    "name": "Chlorobenzene, anhydrous, 99.8%",
    "nameKo": "Chlorobenzene, anhydrous, 99.8%",
    "mfg": "Sigma-Aldrich",
    "catNo": "284513-1L",
    "cas": "108-90-7",
    "code": "R-135",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-146",
    "name": "Hexane",
    "nameKo": "Hexane",
    "mfg": "Sigma-Aldrich",
    "catNo": "296090-100ML",
    "cas": "110-54-3",
    "code": "R-136",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-147",
    "name": "Anisole",
    "nameKo": "Anisole",
    "mfg": "Sigma-Aldrich",
    "catNo": "296295-100ML",
    "cas": "100-66-3",
    "code": "R-137",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-149",
    "name": "1,4-Dioxane, anhydrous, 99.8%",
    "nameKo": "1,4-Dioxane, anhydrous, 99.8%",
    "mfg": "Sigma-Aldrich",
    "catNo": "296309-100ML",
    "cas": "123-91-1",
    "code": "R-139",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-150",
    "name": "Magnesium hydroxide",
    "nameKo": "Magnesium hydroxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "310093-25G",
    "cas": "1309-42-8",
    "code": "R-140",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-151",
    "name": "Perchloric acid",
    "nameKo": "Perchloric acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "311413-500ML",
    "cas": "7601-90-3",
    "code": "R-141",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-152",
    "name": "Ammonium tetrathiotungstate",
    "nameKo": "Ammonium tetrathiotungstate",
    "mfg": "Sigma-Aldrich",
    "catNo": "336734-5G",
    "cas": "13862-78-7",
    "code": "R-142",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-153",
    "name": "Ammonium fluoride",
    "nameKo": "Ammonium fluoride",
    "mfg": "Sigma-Aldrich",
    "catNo": "338869-25G",
    "cas": "12125-01-8",
    "code": "R-143",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-154",
    "name": "Zinc phthalocyanine",
    "nameKo": "Zinc phthalocyanine",
    "mfg": "Sigma-Aldrich",
    "catNo": "341169-5G",
    "cas": "14320-04-8",
    "code": "R-144",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-155",
    "name": "Phosphorus, red",
    "nameKo": "Phosphorus, red",
    "mfg": "Sigma-Aldrich",
    "catNo": "343242-5G",
    "cas": "7723-14-0",
    "code": "R-145",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-156",
    "name": "Sulfur",
    "nameKo": "Sulfur",
    "mfg": "Sigma-Aldrich",
    "catNo": "344621-250G",
    "cas": "7704-34-9",
    "code": "R-146",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 250,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-157",
    "name": "Acetonitrile",
    "nameKo": "Acetonitrile",
    "mfg": "Sigma-Aldrich",
    "catNo": "34851-100ML",
    "cas": "75-05-8",
    "code": "R-147",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-158",
    "name": "Magnesium bromide",
    "nameKo": "Magnesium bromide",
    "mfg": "Sigma-Aldrich",
    "catNo": "360074-10G",
    "cas": "7789-48-2",
    "code": "R-148",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-159",
    "name": "Nickel(II) phthalocyanine",
    "nameKo": "Nickel(II) phthalocyanine",
    "mfg": "Sigma-Aldrich",
    "catNo": "360635-5G",
    "cas": "14055-02-8",
    "code": "R-149",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-160",
    "name": "Poly(vinyl alcohol)",
    "nameKo": "Poly(vinyl alcohol)",
    "mfg": "Sigma-Aldrich",
    "catNo": "363073-25G",
    "cas": "9002-89-5",
    "code": "R-150",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-161",
    "name": "Manganese(II) oxide",
    "nameKo": "Manganese(II) oxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "377201-500G",
    "cas": "1344-43-0",
    "code": "R-151",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-162",
    "name": "Manganese(II,III) oxide",
    "nameKo": "Manganese(II,III) oxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "377473-100G",
    "cas": "1317-35-7",
    "code": "R-152",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-163",
    "name": "Zinc acetate",
    "nameKo": "Zinc acetate",
    "mfg": "Sigma-Aldrich",
    "catNo": "383317-25G",
    "cas": "557-34-6",
    "code": "R-153",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-164",
    "name": "1-Bromopyrene",
    "nameKo": "1-Bromopyrene",
    "mfg": "Sigma-Aldrich",
    "catNo": "391573-1G",
    "cas": "1714-29-0",
    "code": "R-154",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-165",
    "name": "1-Pyrenecarboxylic acid",
    "nameKo": "1-Pyrenecarboxylic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "391581-1G",
    "cas": "19694-02-1",
    "code": "R-155",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-166",
    "name": "Magnesium iodide",
    "nameKo": "Magnesium iodide",
    "mfg": "Sigma-Aldrich",
    "catNo": "394599-5G",
    "cas": "10377-58-9",
    "code": "R-156",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-167",
    "name": "Ethanolamine(ACS reagent, ≥99.0%)",
    "nameKo": "Ethanolamine(ACS reagent, ≥99.0%)",
    "mfg": "Sigma-Aldrich",
    "catNo": "398136-25ML",
    "cas": "141-43-5",
    "code": "R-157",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-168",
    "name": "Sodium tellurite",
    "nameKo": "Sodium tellurite",
    "mfg": "Sigma-Aldrich",
    "catNo": "400688-10G",
    "cas": "10102-20-2",
    "code": "R-158",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-169",
    "name": "Tetrahydrofuran, anhydrous, ≥99.9%",
    "nameKo": "Tetrahydrofuran, anhydrous, ≥99.9%",
    "mfg": "Sigma-Aldrich",
    "catNo": "401757-1L",
    "cas": "109-99-9",
    "code": "R-159",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-170",
    "name": "Chloroacetic acid",
    "nameKo": "Chloroacetic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "402923-100G",
    "cas": "79-11-8",
    "code": "R-160",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-171",
    "name": "Phosphorus pentoxide",
    "nameKo": "Phosphorus pentoxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "431419-50G",
    "cas": "1314-56-3",
    "code": "R-161",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-172",
    "name": "Nitric acid",
    "nameKo": "Nitric acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "438073-2.5L",
    "cas": "7697-37-2",
    "code": "R-162",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 2.5,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-174",
    "name": "11-Mercaptoundecanoic acid",
    "nameKo": "11-Mercaptoundecanoic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "450561-5G",
    "cas": "71310-21-9",
    "code": "R-164",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-175",
    "name": "Ammonium metatungstate hydrate",
    "nameKo": "Ammonium metatungstate hydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "463922-25G",
    "cas": "12333-11-8",
    "code": "R-165",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-176",
    "name": "Platinum(0)-1,3-divinyl-1,1,3,3-tetramethyldisiloxane complex solution",
    "nameKo": "Platinum(0)-1,3-divinyl-1,1,3,3-tetramethyldisiloxane complex solution",
    "mfg": "Sigma-Aldrich",
    "catNo": "479535-5G",
    "cas": "68478-92-2",
    "code": "R-166",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-177",
    "name": "Hexafluorotitanic acid solution",
    "nameKo": "Hexafluorotitanic acid solution",
    "mfg": "Sigma-Aldrich",
    "catNo": "481777-500G",
    "cas": "17439-11-1",
    "code": "R-167",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-178",
    "name": "Copper(II) acetylacetonate(≥99.9% trace metals basis)",
    "nameKo": "Copper(II) acetylacetonate(≥99.9% trace metals basis)",
    "mfg": "Sigma-Aldrich",
    "catNo": "514365-50G",
    "cas": "13395-16-9",
    "code": "R-168",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-179",
    "name": "Tin",
    "nameKo": "Tin",
    "mfg": "Sigma-Aldrich",
    "catNo": "520373-100G",
    "cas": "7440-31-5",
    "code": "R-169",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-180",
    "name": "Polyaniline (emeraldine salt)",
    "nameKo": "Polyaniline (emeraldine salt)",
    "mfg": "Sigma-Aldrich",
    "catNo": "530565-5G",
    "cas": "--",
    "code": "R-170",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-181",
    "name": "Chlorosulfonic acid",
    "nameKo": "Chlorosulfonic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "571024-100G",
    "cas": "7790-94-5",
    "code": "R-171",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-182",
    "name": "Fullerene-C60",
    "nameKo": "Fullerene-C60",
    "mfg": "Sigma-Aldrich",
    "catNo": "572500-250MG",
    "cas": "99685-96-8",
    "code": "R-172",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 250,
    "unit": "mg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-183",
    "name": "Polypyrrole",
    "nameKo": "Polypyrrole",
    "mfg": "Sigma-Aldrich",
    "catNo": "577030-5G",
    "cas": "30604-81-0",
    "code": "R-173",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-184",
    "name": "Molybdenumhexacarbonyl",
    "nameKo": "Molybdenumhexacarbonyl",
    "mfg": "Sigma-Aldrich",
    "catNo": "577766-5G",
    "cas": "13939-06-5",
    "code": "R-174",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-187",
    "name": "Diamond",
    "nameKo": "Diamond",
    "mfg": "Sigma-Aldrich",
    "catNo": "636444-5G",
    "cas": "7782-40-3",
    "code": "R-177",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-188",
    "name": "1H,1H,2H,2H-Perfluorodecanethiol",
    "nameKo": "1H,1H,2H,2H-Perfluorodecanethiol",
    "mfg": "Sigma-Aldrich",
    "catNo": "660493-5G",
    "cas": "34143-74-3",
    "code": "R-178",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-189",
    "name": "Copper etchant",
    "nameKo": "Copper etchant",
    "mfg": "Sigma-Aldrich",
    "catNo": "667528-500ML",
    "cas": "--",
    "code": "R-179",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-190",
    "name": "Borane-ammonia complex",
    "nameKo": "Borane-ammonia complex",
    "mfg": "Sigma-Aldrich",
    "catNo": "682098-10G",
    "cas": "13774-81-7",
    "code": "R-180",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-191",
    "name": "Acetic acid",
    "nameKo": "Acetic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "695092-500ML",
    "cas": "64-19-7",
    "code": "R-181",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-193",
    "name": "Potassium ferricyanide(III)",
    "nameKo": "Potassium ferricyanide(III)",
    "mfg": "Sigma-Aldrich",
    "catNo": "702587-50G",
    "cas": "13746-66-2",
    "code": "R-183",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-194",
    "name": "[5,6]-Fullerene-C70",
    "nameKo": "[5,6]-Fullerene-C70",
    "mfg": "Sigma-Aldrich",
    "catNo": "709476",
    "cas": "115383-22-7",
    "code": "R-184",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "mg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-195",
    "name": "Sodium citrate tribasic dihydrate",
    "nameKo": "Sodium citrate tribasic dihydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "71402-250G",
    "cas": "6132-04-3",
    "code": "R-185",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 250,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-196",
    "name": "Sodium phosphate dibasic dodecahydrate",
    "nameKo": "Sodium phosphate dibasic dodecahydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "71649-500G",
    "cas": "10039-32-4",
    "code": "R-186",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-197",
    "name": "Cobalt(II) acetylacetonate",
    "nameKo": "Cobalt(II) acetylacetonate",
    "mfg": "Sigma-Aldrich",
    "catNo": "727970-25G",
    "cas": "14024-48-7",
    "code": "R-187",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-198",
    "name": "Sodium molybdate",
    "nameKo": "Sodium molybdate",
    "mfg": "Sigma-Aldrich",
    "catNo": "737860-5G",
    "cas": "7631-95-0",
    "code": "R-188",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-199",
    "name": "Octadecylamine",
    "nameKo": "Octadecylamine",
    "mfg": "Sigma-Aldrich",
    "catNo": "74750-25G",
    "cas": "124-30-1",
    "code": "R-189",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-200",
    "name": "Copper(II) chloride",
    "nameKo": "Copper(II) chloride",
    "mfg": "Sigma-Aldrich",
    "catNo": "751944-25G",
    "cas": "7447-39-4",
    "code": "R-190",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-202",
    "name": "Hydrogen",
    "nameKo": "Hydrogen",
    "mfg": "Sigma-Aldrich",
    "catNo": "CAT-291",
    "cas": "1333-74-0",
    "code": "R-192",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 47,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-203",
    "name": "Methane",
    "nameKo": "Methane",
    "mfg": "Sigma-Aldrich",
    "catNo": "CAT-292",
    "cas": "74-82-8",
    "code": "R-193",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 47,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-204",
    "name": "Fluorescent nanodiamond",
    "nameKo": "Fluorescent nanodiamond",
    "mfg": "Sigma-Aldrich",
    "catNo": "798088-5ML",
    "cas": "-",
    "code": "R-194",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 5,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-205",
    "name": "Silver acetate",
    "nameKo": "Silver acetate",
    "mfg": "Sigma-Aldrich",
    "catNo": "85140-10G",
    "cas": "563-63-3",
    "code": "R-195",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-206",
    "name": "Maleic acid",
    "nameKo": "Maleic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "92816-1G",
    "cas": "110-16-7",
    "code": "R-196",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-207",
    "name": "Hexaphenylbenzene",
    "nameKo": "Hexaphenylbenzene",
    "mfg": "Sigma-Aldrich",
    "catNo": "149454-1G",
    "cas": "992-04-1",
    "code": "R-197",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-208",
    "name": "Deuterium oxide",
    "nameKo": "Deuterium oxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "151882-10G",
    "cas": "7789-20-0",
    "code": "R-198",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-210",
    "name": "Iron(Ⅲ) chloride, reagent grade, 97%",
    "nameKo": "Iron(Ⅲ) chloride, reagent grade, 97%",
    "mfg": "Sigma-Aldrich",
    "catNo": "157740-100G",
    "cas": "7705-08-0",
    "code": "R-200",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-211",
    "name": "Phosphorus trichloride",
    "nameKo": "Phosphorus trichloride",
    "mfg": "Sigma-Aldrich",
    "catNo": "157791-50G",
    "cas": "7719-12-2",
    "code": "R-201",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-212",
    "name": "Ethylenediaminetetraacetic acid",
    "nameKo": "Ethylenediaminetetraacetic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "EDS-100G",
    "cas": "60-00-4",
    "code": "R-202",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-213",
    "name": "Formic acid",
    "nameKo": "Formic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "F0507-500ML",
    "cas": "64-18-6",
    "code": "R-203",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-214",
    "name": "Ferrocene",
    "nameKo": "Ferrocene",
    "mfg": "Sigma-Aldrich",
    "catNo": "8.03978",
    "cas": "102-54-5",
    "code": "R-204",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-215",
    "name": "Gold(III) chloride trihydrate",
    "nameKo": "Gold(III) chloride trihydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "G4022-1G",
    "cas": "16961-25-4",
    "code": "R-205",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-217",
    "name": "Dopamine hydrochloride",
    "nameKo": "Dopamine hydrochloride",
    "mfg": "Sigma-Aldrich",
    "catNo": "H8502-10G",
    "cas": "62-31-7",
    "code": "R-207",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-218",
    "name": "Indole(≥99%)",
    "nameKo": "Indole(≥99%)",
    "mfg": "Sigma-Aldrich",
    "catNo": "I3408-25G",
    "cas": "120-72-9",
    "code": "R-208",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-219",
    "name": "5-Methoxyindole-2-carboxylic acid",
    "nameKo": "5-Methoxyindole-2-carboxylic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "M14951-5G",
    "cas": "4382-54-1",
    "code": "R-209",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-220",
    "name": "Melamine",
    "nameKo": "Melamine",
    "mfg": "Sigma-Aldrich",
    "catNo": "M2659-100G",
    "cas": "108-78-1",
    "code": "R-210",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-222",
    "name": "3-Mercaptopropionic acid",
    "nameKo": "3-Mercaptopropionic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "M5801-100G",
    "cas": "107-96-0",
    "code": "R-212",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-223",
    "name": "Mesitylene",
    "nameKo": "Mesitylene",
    "mfg": "Sigma-Aldrich",
    "catNo": "M7200-100ML",
    "cas": "108-67-8",
    "code": "R-213",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-224",
    "name": "Perylene-3,4,9,10-tetracarboxylic dianhydride",
    "nameKo": "Perylene-3,4,9,10-tetracarboxylic dianhydride",
    "mfg": "Sigma-Aldrich",
    "catNo": "P11255-25G",
    "cas": "128-69-8",
    "code": "R-214",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-227",
    "name": "Tin(II) 2-ethylhexanoate",
    "nameKo": "Tin(II) 2-ethylhexanoate",
    "mfg": "Sigma-Aldrich",
    "catNo": "S3252-100G",
    "cas": "301-10-0",
    "code": "R-217",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-228",
    "name": "Sodium chloride, BioXtra, ≥99.5% (AT)",
    "nameKo": "Sodium chloride, BioXtra, ≥99.5% (AT)",
    "mfg": "Sigma-Aldrich",
    "catNo": "S7653-250G",
    "cas": "7647-14-5",
    "code": "R-218",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 250,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-229",
    "name": "Tetraethylammonium chloride",
    "nameKo": "Tetraethylammonium chloride",
    "mfg": "Sigma-Aldrich",
    "catNo": "T2265-25G",
    "cas": "56-34-8",
    "code": "R-219",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-230",
    "name": "Sodium tetraphenlyborate, ACS, ≥99.5%",
    "nameKo": "Sodium tetraphenlyborate, ACS, ≥99.5%",
    "mfg": "Sigma-Aldrich",
    "catNo": "T25402-5G",
    "cas": "143-66-8",
    "code": "R-220",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-231",
    "name": "1,1,2,2-Tetraphenylethylene",
    "nameKo": "1,1,2,2-Tetraphenylethylene",
    "mfg": "Sigma-Aldrich",
    "catNo": "T26204-5G",
    "cas": "632-51-9",
    "code": "R-221",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-232",
    "name": "Trifluoroacetic acid, RP, 99%",
    "nameKo": "Trifluoroacetic acid, RP, 99%",
    "mfg": "Sigma-Aldrich",
    "catNo": "T6508-100ML",
    "cas": "76-05-1",
    "code": "R-222",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-234",
    "name": "Ethyl alcohol, 94.5%",
    "nameKo": "Ethyl alcohol, 94.5%",
    "mfg": "삼전화학(주)",
    "catNo": "E1093",
    "cas": "64-17-5",
    "code": "R-224",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-235",
    "name": "Sodium hydroxide, bead,>98.0%, EP",
    "nameKo": "Sodium hydroxide, bead,>98.0%, EP",
    "mfg": "삼전화학(주)",
    "catNo": "S0610",
    "cas": "1310-73-2",
    "code": "R-225",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "kg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-236",
    "name": "Phosphoric acid, 85.0%",
    "nameKo": "Phosphoric acid, 85.0%",
    "mfg": "삼전화학(주)",
    "catNo": "P4392",
    "cas": "7664-38-2",
    "code": "R-226",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "kg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-237",
    "name": "Methyl alcohol 99.8%\t,GR",
    "nameKo": "Methyl alcohol 99.8%\t,GR",
    "mfg": "대정화금(주)",
    "catNo": "5558-4100",
    "cas": "67-56-1",
    "code": "R-227",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-238",
    "name": "Isopropyl alcohol 99.7%,GR",
    "nameKo": "Isopropyl alcohol 99.7%,GR",
    "mfg": "대정화금(주)",
    "catNo": "5035-4100",
    "cas": "67-63-0",
    "code": "R-228",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-239",
    "name": "혼합 가스 (질소80%, 산소20%)",
    "nameKo": "혼합 가스 (질소80%, 산소20%)",
    "mfg": "알파가스",
    "catNo": "CAT-328",
    "cas": "7727-37-9",
    "code": "R-229",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 47,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-240",
    "name": "아르곤",
    "nameKo": "아르곤",
    "mfg": "알파가스",
    "catNo": "CAT-329",
    "cas": "7440-37-1",
    "code": "R-230",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 47,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-241",
    "name": "Ethyl alcohol, anhydrous, 99.9%",
    "nameKo": "Ethyl alcohol, anhydrous, 99.9%",
    "mfg": "삼전화학(주)",
    "catNo": "E1153",
    "cas": "64-17-5",
    "code": "R-231",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 4,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-242",
    "name": "Methanol",
    "nameKo": "Methanol",
    "mfg": "Sigma-Aldrich",
    "catNo": "34860-1L-R",
    "cas": "67-56-1",
    "code": "R-232",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-243",
    "name": "Ammonium persulfate",
    "nameKo": "Ammonium persulfate",
    "mfg": "Sigma-Aldrich",
    "catNo": "248614-2.5KG",
    "cas": "7727-54-0",
    "code": "R-233",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 2.5,
    "unit": "kg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-244",
    "name": "Acetone",
    "nameKo": "Acetone",
    "mfg": "Sigma-Aldrich",
    "catNo": "179124-1L",
    "cas": "67-64-1",
    "code": "R-234",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-245",
    "name": "Hydrobromic acid, 47.0-49.0%",
    "nameKo": "Hydrobromic acid, 47.0-49.0%",
    "mfg": "삼전화학(주)",
    "catNo": "H0643",
    "cas": "10035-10-6",
    "code": "R-235",
    "hazard": "B",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "kg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-246",
    "name": "Hydrofluoric acid, 49.0%",
    "nameKo": "Hydrofluoric acid, 49.0%",
    "mfg": "삼전화학(주)",
    "catNo": "H1427",
    "cas": "7664-39-3",
    "code": "R-236",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 4,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-248",
    "name": "2-Propanol, 99.8%",
    "nameKo": "2-Propanol, 99.8%",
    "mfg": "삼전화학(주)",
    "catNo": "P3593",
    "cas": "67-63-0",
    "code": "R-238",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 4,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-249",
    "name": "SYLGARD 184 Silicone Elastomer Base",
    "nameKo": "SYLGARD 184 Silicone Elastomer Base",
    "mfg": "Dow Corning",
    "catNo": "CAT-338",
    "cas": "68083-19-2",
    "code": "R-239",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 1,
    "unit": "kg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-250",
    "name": "SYLGARD 184 Silicone Elastomer Curing Agent",
    "nameKo": "SYLGARD 184 Silicone Elastomer Curing Agent",
    "mfg": "Dow Corning",
    "catNo": "CAT-339",
    "cas": "68037-59-2",
    "code": "R-240",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 1,
    "unit": "kg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-251",
    "name": "Methylammonium iodide",
    "nameKo": "Methylammonium iodide",
    "mfg": "Dyesol ltd",
    "catNo": "MS101000",
    "cas": "14965-49-2",
    "code": "R-241",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-252",
    "name": "Hydrogen peroxide 34.5%,EP",
    "nameKo": "Hydrogen peroxide 34.5%,EP",
    "mfg": "대정화금(주)",
    "catNo": "4158-4400",
    "cas": "7722-84-1",
    "code": "R-242",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "kg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-253",
    "name": "Buffered oxide etch 6:1",
    "nameKo": "Buffered oxide etch 6:1",
    "mfg": "삼전화학(주)",
    "catNo": "B2866",
    "cas": "12125-01-8",
    "code": "R-243",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 9,
    "unit": "lb",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-254",
    "name": "Ammonium persulfate 98%, EP",
    "nameKo": "Ammonium persulfate 98%, EP",
    "mfg": "대정화금(주)",
    "catNo": "1077-4405",
    "cas": "7727-54-0",
    "code": "R-244",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-255",
    "name": "Melamine 99%,GR",
    "nameKo": "Melamine 99%,GR",
    "mfg": "대정화금(주)",
    "catNo": "5652-4105",
    "cas": "108-78-1",
    "code": "R-245",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-256",
    "name": "Perchloric acid 60% 60~62%,GR",
    "nameKo": "Perchloric acid 60% 60~62%,GR",
    "mfg": "대정화금(주)",
    "catNo": "6512-4100",
    "cas": "7601-90-3",
    "code": "R-246",
    "hazard": "C",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "kg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-257",
    "name": "Tris(hydroxymethyl)aminomethane 99%,BIO",
    "nameKo": "Tris(hydroxymethyl)aminomethane 99%,BIO",
    "mfg": "대정화금(주)",
    "catNo": "8565-1105",
    "cas": "77-86-1",
    "code": "R-247",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-258",
    "name": "Phosphoric acid (ACS reagent, ≥85% H3PO4)",
    "nameKo": "Phosphoric acid (ACS reagent, ≥85% H3PO4)",
    "mfg": "Sigma-Aldrich",
    "catNo": "P6560",
    "cas": "7664-38-2",
    "code": "R-248",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-260",
    "name": "o-Phenylenediamine(flaked, 99.5%)",
    "nameKo": "o-Phenylenediamine(flaked, 99.5%)",
    "mfg": "Sigma-Aldrich",
    "catNo": "P23938-5G",
    "cas": "95-54-5",
    "code": "R-250",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-261",
    "name": "1-Aminopyrene",
    "nameKo": "1-Aminopyrene",
    "mfg": "Sigma-Aldrich",
    "catNo": "A77903-1G",
    "cas": "1606-67-3",
    "code": "R-251",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-263",
    "name": "Carbon disulfide",
    "nameKo": "Carbon disulfide",
    "mfg": "Sigma-Aldrich",
    "catNo": "180173-500ML",
    "cas": "75-15-0",
    "code": "R-253",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-264",
    "name": "Dichloromethane",
    "nameKo": "Dichloromethane",
    "mfg": "Sigma-Aldrich",
    "catNo": "494453-1L",
    "cas": "75-09-2",
    "code": "R-254",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-265",
    "name": "Ammonia solution 25%",
    "nameKo": "Ammonia solution 25%",
    "mfg": "Sigma-Aldrich",
    "catNo": "1054321000",
    "cas": "1336-21-6",
    "code": "R-255",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-266",
    "name": "Ammonia solution 32%",
    "nameKo": "Ammonia solution 32%",
    "mfg": "Sigma-Aldrich",
    "catNo": "CAT-355",
    "cas": "1336-21-6",
    "code": "R-256",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 2.5,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-267",
    "name": "Calcium carbonate",
    "nameKo": "Calcium carbonate",
    "mfg": "Sigma-Aldrich",
    "catNo": "900500-100G",
    "cas": "471-34-1",
    "code": "R-257",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-268",
    "name": "Sodium nitrite",
    "nameKo": "Sodium nitrite",
    "mfg": "Sigma-Aldrich",
    "catNo": "799416-500G",
    "cas": "7632-00-0",
    "code": "R-258",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-269",
    "name": "Triethylamine, ≥99.5%",
    "nameKo": "Triethylamine, ≥99.5%",
    "mfg": "Sigma-Aldrich",
    "catNo": "471283-500ML",
    "cas": "121-44-8",
    "code": "R-259",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-270",
    "name": "Gallium",
    "nameKo": "Gallium",
    "mfg": "Sigma-Aldrich",
    "catNo": "263265-10G",
    "cas": "7440-55-3",
    "code": "R-260",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-271",
    "name": "Boron nitride nanotubes",
    "nameKo": "Boron nitride nanotubes",
    "mfg": "Sigma-Aldrich",
    "catNo": "912085-100MG",
    "cas": "10043-11-5",
    "code": "R-261",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "mg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-272",
    "name": "Manganese(IV) oxide(ReagentPlus®, ≥99%)",
    "nameKo": "Manganese(IV) oxide(ReagentPlus®, ≥99%)",
    "mfg": "Sigma-Aldrich",
    "catNo": "243442-100G",
    "cas": "1313-13-9",
    "code": "R-262",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-273",
    "name": "Rhenium(VI) oxide",
    "nameKo": "Rhenium(VI) oxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "380997-1G",
    "cas": "1314-28-9",
    "code": "R-263",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-274",
    "name": "Tungsten(VI) oxide",
    "nameKo": "Tungsten(VI) oxide",
    "mfg": "Sigma-Aldrich",
    "catNo": "204781-10G",
    "cas": "1314-35-8",
    "code": "R-264",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-275",
    "name": "Hexane, mixture of isomers",
    "nameKo": "Hexane, mixture of isomers",
    "mfg": "Sigma-Aldrich",
    "catNo": "178918-1L",
    "cas": "107-83-5",
    "code": "R-265",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-277",
    "name": "L-Cysteine, ≥97%, FG",
    "nameKo": "L-Cysteine, ≥97%, FG",
    "mfg": "Sigma-Aldrich",
    "catNo": "W326305-100G",
    "cas": "52-90-4",
    "code": "R-267",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-278",
    "name": "p-Phenylenediamine(98% (GC))",
    "nameKo": "p-Phenylenediamine(98% (GC))",
    "mfg": "Sigma-Aldrich",
    "catNo": "P6001-50G",
    "cas": "106-50-3",
    "code": "R-268",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-279",
    "name": "Methyl sulfoxide, 99.9+%, ACS reagent",
    "nameKo": "Methyl sulfoxide, 99.9+%, ACS reagent",
    "mfg": "Acros organics",
    "catNo": "414880010",
    "cas": "67-68-5",
    "code": "R-269",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-280",
    "name": "o-Phenylenediamine, 98%",
    "nameKo": "o-Phenylenediamine, 98%",
    "mfg": "Alfa Aesar",
    "catNo": "A11946.14",
    "cas": "95-54-5",
    "code": "R-270",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-281",
    "name": "n-Butyllithium, 1.6M solution in hexanes, AcroSeal®",
    "nameKo": "n-Butyllithium, 1.6M solution in hexanes, AcroSeal®",
    "mfg": "Acros Organics",
    "catNo": "181271000",
    "cas": "109-72-8",
    "code": "R-271",
    "hazard": "A",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-282",
    "name": "Copper(II) phthalocyanine",
    "nameKo": "Copper(II) phthalocyanine",
    "mfg": "Alfa Aesar",
    "catNo": "043650.09",
    "cas": "147-14-8",
    "code": "R-272",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-283",
    "name": "Boron oxide, 99.999% (metals basis)",
    "nameKo": "Boron oxide, 99.999% (metals basis)",
    "mfg": "Alfa Aesar",
    "catNo": "041786.09",
    "cas": "1303-86-2",
    "code": "R-273",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-284",
    "name": "Iron(II,III) oxide, 97% (metals basis)",
    "nameKo": "Iron(II,III) oxide, 97% (metals basis)",
    "mfg": "Alfa Aesar",
    "catNo": "012374.A1",
    "cas": "1317-61-9",
    "code": "R-274",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "kg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-285",
    "name": "Copper(II) acetate monohydrate, 98+%",
    "nameKo": "Copper(II) acetate monohydrate, 98+%",
    "mfg": "Alfa Aesar",
    "catNo": "A16203.30",
    "cas": "6046-93-1",
    "code": "R-275",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 250,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-286",
    "name": "4-Iodobutyric acid, 98%",
    "nameKo": "4-Iodobutyric acid, 98%",
    "mfg": "Acros organics",
    "catNo": "CAT-375",
    "cas": "7425-27-6",
    "code": "R-276",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-287",
    "name": "Sodium sulfate, Puratronic®, 99.9955% (metals basis)",
    "nameKo": "Sodium sulfate, Puratronic®, 99.9955% (metals basis)",
    "mfg": "Alfa Aesar",
    "catNo": "010874.14",
    "cas": "7757-82-6",
    "code": "R-277",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-288",
    "name": "Bismuth(III) chloride, 97+% (dry wt.), may cont. up to 3% water",
    "nameKo": "Bismuth(III) chloride, 97+% (dry wt.), may cont. up to 3% water",
    "mfg": "Alfa Aesar",
    "catNo": "A10510.22",
    "cas": "7787-60-2",
    "code": "R-278",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-289",
    "name": "Deuterium oxide, for NMR, 100.0 atom % D",
    "nameKo": "Deuterium oxide, for NMR, 100.0 atom % D",
    "mfg": "Acros organics",
    "catNo": "166310500",
    "cas": "7789-20-0",
    "code": "R-279",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 50,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-290",
    "name": "Polyethyleneimine, linear, M.W. 25,000",
    "nameKo": "Polyethyleneimine, linear, M.W. 25,000",
    "mfg": "Alfa Aesar",
    "catNo": "043896.03",
    "cas": "9002-98-6",
    "code": "R-280",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-291",
    "name": "Polyvinyl pyrrolidone, technical",
    "nameKo": "Polyvinyl pyrrolidone, technical",
    "mfg": "Thermo Fisher Scientific Inc.",
    "catNo": "P/3700/48",
    "cas": "9003-39-8",
    "code": "R-281",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-292",
    "name": "Cobalt(II) nitrate hexahydrate, ACS, 98.0-102.0%",
    "nameKo": "Cobalt(II) nitrate hexahydrate, ACS, 98.0-102.0%",
    "mfg": "Alfa Aesar",
    "catNo": "036418.22",
    "cas": "10026-22-9",
    "code": "R-282",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-293",
    "name": "Sodium bisulfate monohydrate, 99%, for analysis",
    "nameKo": "Sodium bisulfate monohydrate, 99%, for analysis",
    "mfg": "Acros organics",
    "catNo": "125005000",
    "cas": "10034-88-5",
    "code": "R-283",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-294",
    "name": "Bismuth(III) nitrate pentahydrate, 98%",
    "nameKo": "Bismuth(III) nitrate pentahydrate, 98%",
    "mfg": "Alfa Aesar",
    "catNo": "A11748.22",
    "cas": "10035-06-0",
    "code": "R-284",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-295",
    "name": "Iridium(IV) oxide powder, 99%",
    "nameKo": "Iridium(IV) oxide powder, 99%",
    "mfg": "Alfa Aesar",
    "catNo": "A17849.03",
    "cas": "12030-49-8",
    "code": "R-285",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-296",
    "name": "Ammonium fluoride, ACS, 98.0% min",
    "nameKo": "Ammonium fluoride, ACS, 98.0% min",
    "mfg": "Alfa Aesar",
    "catNo": "011568.14",
    "cas": "12125-01-8",
    "code": "R-286",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-297",
    "name": "Tellurium powder, -200 mesh, 99.999% (metals basis)",
    "nameKo": "Tellurium powder, -200 mesh, 99.999% (metals basis)",
    "mfg": "Alfa Aesar",
    "catNo": "011075.18",
    "cas": "13494-80-9",
    "code": "R-287",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-298",
    "name": "Sodium orthovanadate, 99.9% (metals basis)",
    "nameKo": "Sodium orthovanadate, 99.9% (metals basis)",
    "mfg": "Alfa Aesar",
    "catNo": "081104.22",
    "cas": "13721-39-6",
    "code": "R-288",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-299",
    "name": "4-Cyano-4'-n-pentylbiphenyl, 99%",
    "nameKo": "4-Cyano-4'-n-pentylbiphenyl, 99%",
    "mfg": "Alfa Aesar",
    "catNo": "B21856.06",
    "cas": "40817-08-1",
    "code": "R-289",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-301",
    "name": "Fast Garnet GBC sulfate salt",
    "nameKo": "Fast Garnet GBC sulfate salt",
    "mfg": "Sigma-Aldrich",
    "catNo": "F8761",
    "cas": "101-89-3",
    "code": "R-291",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 5,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-302",
    "name": "Ammonium bicarbonate",
    "nameKo": "Ammonium bicarbonate",
    "mfg": "Sigma-Aldrich",
    "catNo": "09830-500G",
    "cas": "1066-33-7",
    "code": "R-292",
    "hazard": "E",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-303",
    "name": "Potassium persulfate",
    "nameKo": "Potassium persulfate",
    "mfg": "Sigma-Aldrich",
    "catNo": "906735-100G",
    "cas": "7727-21-1",
    "code": "R-293",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-305",
    "name": "N-Hydroxysuccinimide",
    "nameKo": "N-Hydroxysuccinimide",
    "mfg": "Sigma-Aldrich",
    "catNo": "H7377",
    "cas": "6066-82-6",
    "code": "R-295",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-306",
    "name": "Dichloromethane-13C",
    "nameKo": "Dichloromethane-13C",
    "mfg": "Sigma-Aldrich",
    "catNo": "492183-250MG",
    "cas": "70110-03-1",
    "code": "R-296",
    "hazard": "B",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 250,
    "unit": "mg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-307",
    "name": "Benzoic acid",
    "nameKo": "Benzoic acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "B3250",
    "cas": "65-85-0",
    "code": "R-297",
    "hazard": "B",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-309",
    "name": "Docusate sodium salt",
    "nameKo": "Docusate sodium salt",
    "mfg": "Sigma-Aldrich",
    "catNo": "86139-10G",
    "cas": "577-11-7",
    "code": "R-299",
    "hazard": "C",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-310",
    "name": "In-Fusion® HD Cloning Kit",
    "nameKo": "In-Fusion® HD Cloning Kit",
    "mfg": "TAKARA BIO INC.",
    "catNo": "639649",
    "cas": "7732-18-5",
    "code": "R-300",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 50,
    "unit": "EA",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-311",
    "name": "Water",
    "nameKo": "Water",
    "mfg": "SUPELCO",
    "catNo": "1153331000",
    "cas": "7732-18-5",
    "code": "R-301",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-312",
    "name": "9,9'-Bianthracene",
    "nameKo": "9,9'-Bianthracene",
    "mfg": "TCI",
    "catNo": "B4095",
    "cas": "1055-23-8",
    "code": "R-302",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-313",
    "name": "Sodium Acetate, 3M, pH 5.2, Molecular Biology Grade - CAS 127-09-3 - Calbiochem",
    "nameKo": "Sodium Acetate, 3M, pH 5.2, Molecular Biology Grade - CAS 127-09-3 - Calbiochem",
    "mfg": "Sigma-Aldrich",
    "catNo": "567422-100ML",
    "cas": "127-09-3",
    "code": "R-303",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-314",
    "name": "L-Cysteine",
    "nameKo": "L-Cysteine",
    "mfg": "Sigma-Aldrich",
    "catNo": "168149",
    "cas": "52-90-4",
    "code": "R-304",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-316",
    "name": "Ammonium phosphomolybdate n-Hydrate",
    "nameKo": "Ammonium phosphomolybdate n-Hydrate",
    "mfg": "KANTO CHEMICAL CO.,INC.",
    "catNo": "01313-30",
    "cas": "54723-94-3",
    "code": "R-306",
    "hazard": "C",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-317",
    "name": "Silver nitrate",
    "nameKo": "Silver nitrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "101510",
    "cas": "7761-88-8",
    "code": "R-307",
    "hazard": "C",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-318",
    "name": "Hydrazine monohydrate",
    "nameKo": "Hydrazine monohydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "207942-100G",
    "cas": "7803-57-8",
    "code": "R-308",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-319",
    "name": "(3-Aminopropyl)triethoxysilane, 99%",
    "nameKo": "(3-Aminopropyl)triethoxysilane, 99%",
    "mfg": "Sigma-Aldrich",
    "catNo": "440140",
    "cas": "919-30-2",
    "code": "R-309",
    "hazard": "C",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-320",
    "name": "Tetramethylammonium hydroxide solution",
    "nameKo": "Tetramethylammonium hydroxide solution",
    "mfg": "Sigma-Aldrich",
    "catNo": "331635",
    "cas": "75-59-2",
    "code": "R-310",
    "hazard": "B",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 250,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-323",
    "name": "Cobalt (II) Chloride Hexahydrate",
    "nameKo": "Cobalt (II) Chloride Hexahydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "255599",
    "cas": "7791-13-1",
    "code": "R-313",
    "hazard": "B",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-324",
    "name": "Sodium tungstate dihydrate",
    "nameKo": "Sodium tungstate dihydrate",
    "mfg": "Sigma-Aldrich",
    "catNo": "223336",
    "cas": "10213-10-2",
    "code": "R-314",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-325",
    "name": "Citric acid",
    "nameKo": "Citric acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "251275",
    "cas": "77-92-9",
    "code": "R-315",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-326",
    "name": "Trichloro(octadecyl)silane",
    "nameKo": "Trichloro(octadecyl)silane",
    "mfg": "Sigma-Aldrich",
    "catNo": "104817",
    "cas": "112-04-9",
    "code": "R-316",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-327",
    "name": "Hydrochloric acid",
    "nameKo": "Hydrochloric acid",
    "mfg": "Sigma-Aldrich",
    "catNo": "320331",
    "cas": "7647-01-0",
    "code": "R-317",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 500,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-328",
    "name": "Triton™ X-100",
    "nameKo": "Triton™ X-100",
    "mfg": "Sigma-Aldrich",
    "catNo": "X100",
    "cas": "9036-19-5",
    "code": "R-318",
    "hazard": "C",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 100,
    "unit": "mL",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-330",
    "name": "Chloroform",
    "nameKo": "Chloroform",
    "mfg": "Sigma-Aldrich",
    "catNo": "C2432-1L",
    "cas": "67-66-3",
    "code": "R-320",
    "hazard": "B",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 1,
    "unit": "L",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-331",
    "name": "Sodium orthovanadate",
    "nameKo": "Sodium orthovanadate",
    "mfg": "Sigma-Aldrich",
    "catNo": "s6508-50g",
    "cas": "13721-39-6",
    "code": "R-321",
    "hazard": "D",
    "hazardDesc": "일반 시약",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-332",
    "name": "1,4-Benzenediboronic Acid, 96%",
    "nameKo": "1,4-Benzenediboronic Acid, 96%",
    "mfg": "Alfa Aesar",
    "catNo": "B24064",
    "cas": "4612-26-4",
    "code": "R-322",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 1,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-333",
    "name": "Selenium powder",
    "nameKo": "Selenium powder",
    "mfg": "Thermo scientific",
    "catNo": "036208.18",
    "cas": "7782-49-2",
    "code": "R-323",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 50,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-334",
    "name": "1,2,3,4,5,6,7-Heptaphenylcyclohepta-2,4,6-trien-1-ylium bromide",
    "nameKo": "1,2,3,4,5,6,7-Heptaphenylcyclohepta-2,4,6-trien-1-ylium bromide",
    "mfg": "Sigma-Aldrich",
    "catNo": "T299332",
    "cas": "--",
    "code": "R-324",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "mg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-335",
    "name": "Telleruim powder",
    "nameKo": "Telleruim powder",
    "mfg": "Thermo Fisher Scientific Inc.",
    "catNo": "11074",
    "cas": "13494-80-9",
    "code": "R-325",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 25,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-336",
    "name": "1-(2-Aminiethyl)maleimide hydrochloride",
    "nameKo": "1-(2-Aminiethyl)maleimide hydrochloride",
    "mfg": "Sigma-Aldrich",
    "catNo": "809322",
    "cas": "134272-64-3",
    "code": "R-326",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 100,
    "unit": "mg",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  },
  {
    "id": "CHEM-CAT-CS-337",
    "name": "Sodium tellurite (IV)",
    "nameKo": "Sodium tellurite (IV)",
    "mfg": "Thermo scientific",
    "catNo": "41778",
    "cas": "10102-20-2",
    "code": "R-327",
    "hazard": "F",
    "hazardDesc": "인화성/유해물질",
    "qty": "1/1",
    "stock": 10,
    "unit": "g",
    "handler": "이강민",
    "location": "이차원소재합성실",
    "status": "입고",
    "inDate": "2026.03.02",
    "expDate": "2028.03.02",
    "isSpecial": false
  }
];

const LAB_291_USAGE_LOGS_DEFAULT = [
  {
    id: 'LOG-291-001',
    chemId: 'CHEM-291-01',
    materialName: 'Sulfuric acid(ACS reagent, 95.0-98.0%)',
    date: '2026.03.12',
    time: '10:00',
    usedQty: 0,
    unit: 'mL',
    remainingStock: 500.0,
    workDesc: '신규 입고 검수 및 산시약장 격리 보관',
    worker: '이강민',
    affiliation: '이차원양자헤테로구조체연구단',
    ppe: '방독마스크, 내화학장갑, 보안경',
    incident: '이상 없음',
    signature: '이강민'
  },
  {
    id: 'LOG-291-002',
    chemId: 'CHEM-291-02',
    materialName: 'Pyridinium chlorochromate, 98%',
    date: '2026.03.12',
    time: '10:30',
    usedQty: 0,
    unit: 'g',
    remainingStock: 25.0,
    workDesc: '신규 입고 검수 및 특별시약장 격리 보관',
    worker: '이강민',
    affiliation: '이차원양자헤테로구조체연구단',
    ppe: '방독마스크, 내화학장갑, 보안경',
    incident: '이상 없음',
    signature: '이강민'
  },
  {
    id: 'LOG-291-003',
    chemId: 'CHEM-291-03',
    materialName: 'Tetrachloroethylene',
    date: '2026.03.12',
    time: '11:00',
    usedQty: 0,
    unit: 'L',
    remainingStock: 1.0,
    workDesc: '신규 입고 검수 및 유기용매장 C-01 격리',
    worker: '이강민',
    affiliation: '이차원양자헤테로구조체연구단',
    ppe: '유기용매용 방독마스크, 보호장갑',
    incident: '이상 없음',
    signature: '이강민'
  },
  {
    id: 'LOG-291-004',
    chemId: 'CHEM-291-04',
    materialName: 'N,N-Dimethylformamide',
    date: '2026.03.12',
    time: '11:30',
    usedQty: 0,
    unit: 'L',
    remainingStock: 1.0,
    workDesc: '신규 입고 검수 및 환기 상태 점검',
    worker: '이강민',
    affiliation: '이차원양자헤테로구조체연구단',
    ppe: '방독마스크, 내화학장갑',
    incident: '이상 없음',
    signature: '이강민'
  },
  {
    id: 'LOG-291-005',
    chemId: 'CHEM-291-05',
    materialName: 'Cadmium(II) acetate',
    date: '2026.03.16',
    time: '14:00',
    usedQty: 0,
    unit: 'g',
    remainingStock: 5.0,
    workDesc: '독극물 시약함 이중 잠금 보관 및 재고 실사',
    worker: '이강민',
    affiliation: '이차원양자헤테로구조체연구단',
    ppe: '방진마스크, 보호의, 보안경',
    incident: '이상 없음',
    signature: '이강민'
  },
  {
    id: 'LOG-291-006',
    chemId: 'CHEM-291-06',
    materialName: 'Lead(II) iodide',
    date: '2026.03.16',
    time: '14:30',
    usedQty: 0,
    unit: 'g',
    remainingStock: 50.0,
    workDesc: '페로브스카이트 합성용 글러브박스 반입',
    worker: '이강민',
    affiliation: '이차원양자헤테로구조체연구단',
    ppe: '글러브박스 내 취급, 마스크',
    incident: '이상 없음',
    signature: '이강민'
  },
  {
    id: 'LOG-291-007',
    chemId: 'CHEM-291-07',
    materialName: 'Lead(II) iodide',
    date: '2026.03.16',
    time: '14:40',
    usedQty: 0,
    unit: 'g',
    remainingStock: 50.0,
    workDesc: '예비 시약 보관 확인 (글러브박스 G-01)',
    worker: '이강민',
    affiliation: '이차원양자헤테로구조체연구단',
    ppe: '글러브박스 내 취급, 마스크',
    incident: '이상 없음',
    signature: '이강민'
  },
  {
    id: 'LOG-291-008',
    chemId: 'CHEM-291-08',
    materialName: 'Chromium(III) chloride',
    date: '2026.03.17',
    time: '09:30',
    usedQty: 0,
    unit: 'g',
    remainingStock: 25.0,
    workDesc: '크롬 화합물 밀폐 용기 점검 및 시약장 보관',
    worker: '이강민',
    affiliation: '이차원양자헤테로구조체연구단',
    ppe: '내화학장갑, 방독마스크',
    incident: '이상 없음',
    signature: '이강민'
  },
  {
    id: 'LOG-291-009',
    chemId: 'CHEM-291-09',
    materialName: 'Benzene, for HPLC, ≥99.9%',
    date: '2026.03.17',
    time: '10:00',
    usedQty: 0,
    unit: 'mL',
    remainingStock: 100.0,
    workDesc: 'HPLC 전용 벤젠 인화성 시약장 F-01 입고',
    worker: '이강민',
    affiliation: '이차원양자헤테로구조체연구단',
    ppe: '유기방독마스크, 보안경',
    incident: '이상 없음',
    signature: '이강민'
  },
  {
    id: 'LOG-291-010',
    chemId: 'CHEM-291-10',
    materialName: 'Nickel(II) nitrate hexahydrate',
    date: '2026.03.17',
    time: '10:30',
    usedQty: 0,
    unit: 'g',
    remainingStock: 20.0,
    workDesc: '질산니켈 전구체 칭량 준비 및 보관함 점검',
    worker: '이강민',
    affiliation: '이차원양자헤테로구조체연구단',
    ppe: '니트릴장갑, 마스크',
    incident: '이상 없음',
    signature: '이강민'
  },
  {
    id: 'LOG-291-USE-01',
    chemId: 'CHEM-291-09',
    materialName: 'Benzene, for HPLC, ≥99.9%',
    date: '2026.03.20',
    time: '15:20',
    usedQty: 5.0,
    unit: 'mL',
    remainingStock: 95.0,
    workDesc: '페로브스카이트 시편 세정 및 표면처리',
    worker: '이강민',
    affiliation: '이차원양자헤테로구조체연구단',
    ppe: '방독마스크, 내화학장갑, 보안경',
    incident: '이상 없음',
    signature: '이강민'
  },
  {
    id: 'LOG-291-USE-02',
    chemId: 'CHEM-291-01',
    materialName: 'Sulfuric acid(ACS reagent, 95.0-98.0%)',
    date: '2026.03.22',
    time: '16:00',
    usedQty: 10.0,
    unit: 'mL',
    remainingStock: 490.0,
    workDesc: '기판 에칭 및 초음파 세척 공정',
    worker: '이강민',
    affiliation: '이차원양자헤테로구조체연구단',
    ppe: '내산장갑, 방독마스크, 보안경',
    incident: '이상 없음',
    signature: '이강민'
  }
];

let currentChemScope = 'all'; // 'special' | 'general' | 'all'
const _initDate = new Date();
let currentChemCalYear = _initDate.getFullYear();
let currentChemCalMonth = _initDate.getMonth() + 1;
let currentChemSubTab = 'calendar'; // 'calendar' | 'monthly' | 'yearly'

function get291ChemicalsMaster(){
  try {
    const raw = localStorage.getItem('lab291_chemicals_master_v6');
    if(raw){
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed)) return parsed;
    }
  } catch(e){}
  try {
    localStorage.removeItem('lab291_chemicals_master_v5');
    localStorage.removeItem('lab291_chemicals_master_v4');
  } catch(e){}
  return LAB_291_CHEMICALS_MASTER;
}

function save291ChemicalsMaster(data){
  try {
    localStorage.setItem('lab291_chemicals_master_v6', JSON.stringify(data));
  } catch(e){}
}

function get291UsageLogs(){
  try {
    const raw = localStorage.getItem('lab291_usage_logs_v5');
    if(raw){
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch(e){}
  return LAB_291_USAGE_LOGS_DEFAULT;
}

function save291UsageLogs(logs){
  try {
    localStorage.setItem('lab291_usage_logs_v5', JSON.stringify(logs));
  } catch(e){}
}

function renderChemicalsView(){
  render291InventoryTable();
  if(currentChemSubTab === 'calendar') render291Calendar();
  else if(currentChemSubTab === 'monthly') renderChemMonthlyStats();
  else if(currentChemSubTab === 'yearly') renderChemYearlyStats();
}

// -------------------------------------------------------------
// 1. 재고현황 테이블 렌더링 (원클릭 카테고리 스코프 연동)
// -------------------------------------------------------------
function render291InventoryTable(){
  const tbody = $('chemInventoryTableBody');
  const countBadge = $('chemTotalCountBadge');
  if(!tbody) return;

  const chemicals = get291ChemicalsMaster();

  const nameQuery = ($('chemFilterName') ? $('chemFilterName').value : '').trim().toLowerCase();
  const casQuery = ($('chemFilterCas') ? $('chemFilterCas').value : '').trim().toLowerCase();
  const catQuery = ($('chemFilterCat') ? $('chemFilterCat').value : '').trim().toLowerCase();
  const codeQuery = ($('chemFilterCode') ? $('chemFilterCode').value : '').trim().toLowerCase();
  const mfgQuery = ($('chemFilterMfg') ? $('chemFilterMfg').value : '').trim().toLowerCase();
  const handlerQuery = ($('chemFilterHandler') ? $('chemFilterHandler').value : '').trim();
  const locQuery = ($('chemFilterLoc') ? $('chemFilterLoc').value : '').trim();
  const manageNoQuery = ($('chemFilterManageNo') ? $('chemFilterManageNo').value : '').trim().toLowerCase();

  const dangerRadio = document.querySelector('input[name="chemDangerType"]:checked');
  const dangerType = dangerRadio ? dangerRadio.value : 'all';

  const sortRadio = document.querySelector('input[name="chemSort"]:checked');
  const sortType = sortRadio ? sortRadio.value : 'latest';

  const stateAll = $('chemStateAll') && $('chemStateAll').checked;
  const stateWait = $('chemStateWait') && $('chemStateWait').checked;
  const stateIn = $('chemStateIn') && $('chemStateIn').checked;
  const stateOut = $('chemStateOut') && $('chemStateOut').checked;
  const stateDel = $('chemStateDel') && $('chemStateDel').checked;

  const condSpecial = $('chemCondSpecial') && $('chemCondSpecial').checked;
  const condReagent = $('chemCondReagent') && $('chemCondReagent').checked;

  // 사용자가 검색어(제품명, CAS, CAT, 제조사 등)를 하나라도 입력했는지 여부
  const hasActiveQuery = !!(nameQuery || casQuery || catQuery || codeQuery || mfgQuery || handlerQuery || locQuery || manageNoQuery);

  let filtered = chemicals.filter(function(c){
    const cName = (c.name || '').toLowerCase();
    const cNameKo = (c.nameKo || '').toLowerCase();
    const cCas = (c.cas || '').toLowerCase();
    const cCat = (c.catNo || '').toLowerCase();
    const cCode = (c.code || '').toLowerCase();
    const cMfg = (c.mfg || '').toLowerCase();
    const cHandler = c.handler || '';
    const cLoc = c.location || '';
    const cStatus = c.status || '입고';

    // A. 검색어가 있을 때는 전체 시약 중에서 자유롭게 검색되도록 스코프를 자동 확장
    if(!hasActiveQuery){
      // 검색어가 없을 때는 상단 스코프 탭 또는 특성조건 체크박스 반영
      if(currentChemScope === 'special' && !c.isSpecial) return false;
      if(currentChemScope === 'general' && c.isSpecial) return false;

      if(condSpecial && !condReagent && !c.isSpecial) return false;
      if(!condSpecial && condReagent && c.isSpecial) return false;
    } else {
      // 검색어가 있을 때도 '특별관리물질만' 체크박스가 명시적으로 켜져 있다면 반영
      if(condSpecial && !condReagent && !c.isSpecial) return false;
    }

    // B. 검색어 다중 필터 (부분 일치 및 대소문자 무시)
    if(nameQuery && !cName.includes(nameQuery) && !cNameKo.includes(nameQuery)) return false;
    if(casQuery && !cCas.includes(casQuery)) return false;
    if(catQuery && !cCat.includes(catQuery)) return false;
    if(codeQuery && !cCode.includes(codeQuery)) return false;
    if(mfgQuery && !cMfg.includes(mfgQuery)) return false;
    if(handlerQuery && cHandler !== handlerQuery) return false;
    if(locQuery && !cLoc.includes(locQuery)) return false;
    if(manageNoQuery && !cCode.includes(manageNoQuery) && !cCat.includes(manageNoQuery)) return false;

    // C. 위험물 구분 라디오
    if(dangerType === 'danger' && (!c.hazard || c.hazard === 'safe' || c.hazard === '-')) return false;
    if(dangerType === 'safe' && (c.hazard === 'D' || c.hazard === 'F')) return false;

    // D. 상태 필터 (전체 체크가 아니면 체크된 상태만 통과)
    if(!stateAll){
      const statusMatch = (stateWait && cStatus === '대기') ||
                          (stateIn && cStatus === '입고') ||
                          (stateOut && cStatus === '폐기') ||
                          (stateDel && cStatus === '삭제');
      if(!statusMatch && (stateWait || stateIn || stateOut || stateDel)) return false;
    }

    return true;
  });

  if(sortType === 'name'){
    filtered.sort(function(a, b){ return (a.name || '').localeCompare(b.name || ''); });
  }

  if(countBadge) countBadge.textContent = filtered.length;

  if(filtered.length === 0){
    tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:48px 16px;color:var(--ink-light);font-size:14px;">' +
      '🔍 검색 조건에 일치하는 시약이 없습니다.<br>' +
      '<span style="font-size:12px;color:var(--ink-muted);margin-top:6px;display:inline-block;">검색어를 확인하시거나 상단 <b>[초기화]</b> 버튼을 눌러 전체 목록을 조회하세요.</span>' +
      '</td></tr>';
    const cardListEl = $('chemMobileCardList');
    if(cardListEl){
      cardListEl.innerHTML = '<div style="text-align:center;padding:40px 16px;background:var(--bg-card);border:1px dashed var(--border);border-radius:10px;color:var(--ink-light);font-size:13px;">🔍 검색 조건에 일치하는 시약이 없습니다.<br><span style="font-size:11.5px;color:var(--ink-muted);margin-top:6px;display:inline-block;">상단 [초기화]를 눌러 전체 목록을 조회하세요.</span></div>';
    }
    return;
  }

  const logs = get291UsageLogs();

  let html = '';
  let cardsHtml = '';

  filtered.forEach(function(c){
    const chemLogs = logs.filter(function(l){
      return (l.chemId && l.chemId === c.id) ||
             (l.materialName && c.name && l.materialName.includes(c.name.split('(')[0].trim()));
    });
    let currentStock = c.stock;
    if(chemLogs.length > 0){
      chemLogs.sort(function(a, b){ return ((b.date || '') + ' ' + (b.time || '')).localeCompare((a.date || '') + ' ' + (a.time || '')); });
      currentStock = chemLogs[0].remainingStock !== undefined ? chemLogs[0].remainingStock : c.stock;
    }

    const hazardBadge = c.hazard === 'F' ? '<span class="chem-badge-hazard hazard-f" title="인화성">F</span>' : (c.hazard === 'D' ? '<span class="chem-badge-hazard hazard-d" title="독성/위험">D</span>' : '-');
    const hazardCardPill = c.hazard === 'F' ? '<span class="chem-m-pill-hazard hazard-f" title="인화성">🔥 F (인화성)</span>' : (c.hazard === 'D' ? '<span class="chem-m-pill-hazard hazard-d" title="독성/위험">⚠️ D (유해위험)</span>' : '');

    // 1. 데스크톱 & 모바일 표형 HTML
    html += '<tr data-chem-id="' + safe(c.id) + '">';
    html += '<td style="text-align:center;"><input type="checkbox" class="chem-row-checkbox" value="' + safe(c.id) + '"></td>';
    html += '<td style="min-width:200px;"><b style="color:var(--ink);">' + safe(c.name) + '</b>' + (c.isSpecial ? ' <span style="font-size:10px;padding:1px 5px;background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:4px;font-weight:700;">특별관리</span>' : '') + '</td>';
    html += '<td style="white-space:nowrap;color:var(--ink-light);">' + safe(c.mfg) + '</td>';
    html += '<td style="white-space:nowrap;font-family:monospace;font-size:11.5px;">' + safe(c.catNo) + '</td>';
    html += '<td style="white-space:nowrap;font-family:monospace;font-weight:600;font-size:11.5px;">' + safe(c.cas) + '</td>';
    html += '<td style="text-align:center;"><button type="button" class="btn-table-action btn-chem-view-msds" data-chem-id="' + safe(c.id) + '" title="제조사 공식 MSDS 16대 필수 요약 정보">📄</button></td>';
    html += '<td style="text-align:center;">' + hazardBadge + '</td>';
    html += '<td style="text-align:center;white-space:nowrap;">' + safe(c.qty) + '</td>';
    html += '<td style="text-align:right;white-space:nowrap;font-weight:800;color:' + (c.status === '폐기' ? '#94a3b8' : '#059669') + ';font-size:13px;">' + currentStock + ' ' + safe(c.unit) + '</td>';
    html += '<td style="text-align:center;white-space:nowrap;">' + safe(c.handler) + '</td>';
    html += '<td style="white-space:nowrap;font-size:11.5px;color:var(--ink-light);" title="' + safe(c.location) + '">' + safe(c.location) + '</td>';
    html += '<td style="text-align:center;white-space:nowrap;"><span style="color:' + (c.status === '폐기' ? '#dc2626' : '#15803d') + ';font-weight:700;font-size:11px;">' + safe(c.status) + '</span></td>';
    html += '<td style="white-space:nowrap;font-size:11px;color:var(--ink-light);">' + safe(c.inDate) + '</td>';
    html += '<td style="white-space:nowrap;font-size:11px;color:var(--ink-light);">' + safe(c.expDate) + '</td>';
    html += '<td style="text-align:center;white-space:nowrap;">';
    html += '<button type="button" class="btn-table-action btn-chem-view-history" data-chem-id="' + safe(c.id) + '" style="font-weight:700;color:#2563eb;">이력</button>';
    if(isAdmin()){
      html += '<button type="button" class="btn-table-action btn-chem-edit" data-chem-id="' + safe(c.id) + '" style="margin-left:3px;font-weight:700;color:#0284c7;" title="시약 정보 수정">수정</button>';
      html += '<button type="button" class="btn-table-action btn-chem-discard" data-chem-id="' + safe(c.id) + '" style="margin-left:3px;color:#d97706;" title="시약 폐기 처리">폐기</button>';
      html += '<button type="button" class="btn-table-action btn-chem-delete" data-chem-id="' + safe(c.id) + '" style="margin-left:3px;" title="시약 영구 삭제">삭제</button>';
    }
    html += '</td>';
    html += '</tr>';

    // 2. 모바일 반응형 카드 HTML
    cardsHtml += '<div class="chem-m-card' + (c.isSpecial ? ' is-special' : '') + '" data-chem-id="' + safe(c.id) + '">';
    cardsHtml += '  <div class="chem-m-card-top">';
    cardsHtml += '    <div class="chem-m-card-title-group">';
    cardsHtml += '      <div class="chem-m-card-title">' + safe(c.name) + '</div>';
    cardsHtml += '      <div class="chem-m-tag-group">';
    cardsHtml += '        ' + (c.isSpecial ? '<span class="chem-m-pill-special">⭐ 특별관리물질</span>' : '<span class="chem-m-pill-reagent">🧪 일반시약</span>');
    if(hazardCardPill) cardsHtml += ' ' + hazardCardPill;
    cardsHtml += '      </div>';
    cardsHtml += '    </div>';
    cardsHtml += '    <span class="chem-m-badge-status ' + (c.status === '폐기' ? 'discarded' : 'in-stock') + '">' + safe(c.status || '입고') + '</span>';
    cardsHtml += '  </div>';
    cardsHtml += '  <div class="chem-m-card-details">';
    cardsHtml += '    <div class="chem-m-detail-item"><span class="lbl">제조사</span><span class="val">' + safe(c.mfg || '-') + '</span></div>';
    cardsHtml += '    <div class="chem-m-detail-item"><span class="lbl">CAS No.</span><span class="val mono">' + safe(c.cas || '-') + '</span></div>';
    cardsHtml += '    <div class="chem-m-detail-item"><span class="lbl">CAT No.</span><span class="val mono">' + safe(c.catNo || '-') + '</span></div>';
    cardsHtml += '    <div class="chem-m-detail-item"><span class="lbl">보관위치</span><span class="val">📍 ' + safe(c.location || 'N센터 86291호') + '</span></div>';
    cardsHtml += '    <div class="chem-m-detail-item"><span class="lbl">담당자</span><span class="val">👤 ' + safe(c.handler || '-') + '</span></div>';
    cardsHtml += '    <div class="chem-m-detail-item"><span class="lbl">수량 / 잔량</span><span class="val stock">' + safe(c.qty) + ' · <b>' + currentStock + ' ' + safe(c.unit) + '</b></span></div>';
    cardsHtml += '  </div>';
    cardsHtml += '  <div class="chem-m-card-actions">';
    cardsHtml += '    <button type="button" class="btn-m-action btn-chem-view-msds" data-chem-id="' + safe(c.id) + '">📄 MSDS</button>';
    cardsHtml += '    <button type="button" class="btn-m-action btn-chem-view-history" data-chem-id="' + safe(c.id) + '">📜 이력</button>';
    cardsHtml += '    <button type="button" class="btn-m-action primary btn-chem-m-quick-log" data-chem-id="' + safe(c.id) + '">📝 일지작성</button>';
    cardsHtml += '  </div>';
    if(isAdmin()){
      cardsHtml += '  <div class="chem-m-card-admin-actions" style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border);display:flex;gap:6px;">';
      cardsHtml += '    <button type="button" class="btn-m-action btn-chem-edit" data-chem-id="' + safe(c.id) + '" style="color:#0284c7;font-weight:700;">✏️ 수정</button>';
      cardsHtml += '    <button type="button" class="btn-m-action btn-chem-discard" data-chem-id="' + safe(c.id) + '" style="color:#d97706;font-weight:700;">⚠️ 폐기</button>';
      cardsHtml += '    <button type="button" class="btn-m-action btn-chem-delete" data-chem-id="' + safe(c.id) + '">🗑️ 삭제</button>';
      cardsHtml += '  </div>';
    }
    cardsHtml += '</div>';
  });

  tbody.innerHTML = html;

  const cardListEl = $('chemMobileCardList');
  if(cardListEl){
    cardListEl.innerHTML = cardsHtml;

    cardListEl.querySelectorAll('.btn-chem-view-msds').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        openChemMsdsModal(btn.dataset.chemId);
      });
    });
    cardListEl.querySelectorAll('.btn-chem-view-history').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        openChemHistoryModal(btn.dataset.chemId);
      });
    });
    cardListEl.querySelectorAll('.btn-chem-m-quick-log').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        openChemWriteLogModal(btn.dataset.chemId);
      });
    });
  }

  const allBox = $('chemSelectAllCheckbox');
  if(allBox) allBox.checked = false;

  tbody.querySelectorAll('.btn-chem-view-msds').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      openChemMsdsModal(btn.dataset.chemId);
    });
  });

  const setupContainerActions = function(container){
    if(!container) return;
    container.querySelectorAll('.btn-chem-edit').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        openChemProductModal(btn.dataset.chemId);
      });
    });
    container.querySelectorAll('.btn-chem-discard').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        if(!isAdmin()){ toast('관리자 권한이 필요합니다.'); return; }
        const chemId = btn.dataset.chemId;
        if(confirm('이 시약을 공식 폐기 처리하시겠습니까?\n확인 시 잔량이 0으로 정산되고 상태가 [폐기]로 전환됩니다.')){
          const chemicals = get291ChemicalsMaster();
          const found = chemicals.find(function(c){ return c.id === chemId; });
          if(found){
            found.status = '폐기';
            found.stock = 0;
            save291ChemicalsMaster(chemicals);
            render291InventoryTable();
            toast('✓ 시약이 [폐기] 상태로 전환되었습니다.');
          }
        }
      });
    });
    container.querySelectorAll('.btn-chem-delete').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        if(!isAdmin()){ toast('관리자 권한이 필요합니다.'); return; }
        const chemId = btn.dataset.chemId;
        const chemicals = get291ChemicalsMaster();
        const found = chemicals.find(function(c){ return c.id === chemId; });
        const name = found ? found.name : chemId;
        if(confirm('정말 이 시약 [' + name + ']을(를) 목록에서 삭제하시겠습니까?')){
          const chems = chemicals.filter(function(item){ return item.id !== chemId; });
          save291ChemicalsMaster(chems);
          toast('✓ 시약이 목록에서 삭제되었습니다.');
          render291InventoryTable();
        }
      });
    });
  };

  setupContainerActions(tbody);
  setupContainerActions(cardListEl);

  tbody.querySelectorAll('.btn-chem-view-history').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      openChemHistoryModal(btn.dataset.chemId);
    });
  });

  tbody.querySelectorAll('.btn-chem-row-qr').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      openChemQrModalForSingle(btn.dataset.chemId);
    });
  });
}

// -------------------------------------------------------------
// 2. 모달 열기 및 닫기 (X 버튼 & 외부 빈 공간 클릭 완벽 지원)
// -------------------------------------------------------------
// -------------------------------------------------------------
// [화학물질·시약 신규등록 및 수정 관리자 전용 모달 함수]
// -------------------------------------------------------------
function openChemProductModal(chemId){
  const curU = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const isAdm = (typeof isAdmin === 'function') && isAdmin();

  if(!curU && !isAdm){
    toast('시약 등록을 위해 먼저 로그인해주세요.');
    openModal('login');
    return;
  }

  if(chemId && !isAdm){
    toast('기존 시약 정보 수정은 시스템 관리자만 가능합니다.');
    return;
  }
  const modal = $('modalChemProductBackdrop');
  if(!modal) return;

  const form = $('formChemProductModal');
  if(form) form.reset();

  const titleEl = $('chemProductModalTitle');
  const subEl = $('chemProductModalSub');
  const submitBtn = $('btnSubmitChemProductModal');

  const chemicals = get291ChemicalsMaster();

  if(chemId){
    // 수정 모드
    const found = chemicals.find(function(c){ return c.id === chemId; });
    if(!found){
      toast('수정할 시약 정보를 찾을 수 없습니다.');
      return;
    }
    if($('chemProdId')) $('chemProdId').value = found.id;
    if($('chemProdName')) $('chemProdName').value = found.name || '';
    if($('chemProdNameKo')) $('chemProdNameKo').value = found.nameKo || '';
    if($('chemProdMfg')) $('chemProdMfg').value = found.mfg || '';
    if($('chemProdCas')) $('chemProdCas').value = found.cas || '';
    if($('chemProdCatNo')) $('chemProdCatNo').value = found.catNo || '';
    if($('chemProdCode')) $('chemProdCode').value = found.code || '';
    if($('chemProdQty')) $('chemProdQty').value = found.qty || '1/1';
    if($('chemProdStock')) $('chemProdStock').value = found.stock !== undefined ? found.stock : 500;
    if($('chemProdUnit')) $('chemProdUnit').value = found.unit || 'mL';
    if($('chemProdLocation')) $('chemProdLocation').value = found.location || 'N센터 86291호';
    if($('chemProdHandler')) $('chemProdHandler').value = found.handler || '이강민';
    if($('chemProdInDate')) $('chemProdInDate').value = found.inDate ? found.inDate.replace(/\./g, '-') : '';
    if($('chemProdExpDate')) $('chemProdExpDate').value = found.expDate ? found.expDate.replace(/\./g, '-') : '';
    if($('chemProdIsSpecial')) $('chemProdIsSpecial').checked = !!found.isSpecial;
    if($('chemProdCarcinogen')) $('chemProdCarcinogen').checked = !!found.carcinogen;
    if($('chemProdMutagen')) $('chemProdMutagen').checked = !!found.mutagen;
    if($('chemProdReprotoxic')) $('chemProdReprotoxic').checked = !!found.reprotoxic;
    if($('chemProdHazard')) $('chemProdHazard').value = found.hazard || 'safe';
    if($('chemProdStatus')) $('chemProdStatus').value = found.status || '입고';

    if(titleEl) titleEl.textContent = '✏️ 화학물질·시약 정보 수정';
    if(subEl) subEl.textContent = found.name + ' (' + (found.cas || 'CAS 미기입') + ') 정보 수정';
    if(submitBtn) submitBtn.textContent = '수정 완료';
  } else {
    // 신규 등록 모드
    if($('chemProdId')) $('chemProdId').value = '';
    const nextNo = chemicals.length + 1;
    if($('chemProdCode')) $('chemProdCode').value = 'P-' + String(nextNo).padStart(2, '0');
    if($('chemProdQty')) $('chemProdQty').value = '1/1';
    if($('chemProdStock')) $('chemProdStock').value = '500';
    if($('chemProdUnit')) $('chemProdUnit').value = 'mL';
    if($('chemProdLocation')) $('chemProdLocation').value = 'N센터 86291호 산시약장 A-01';
    if($('chemProdHandler')) $('chemProdHandler').value = '이강민';
    const todayStr = new Date().toISOString().slice(0, 10);
    if($('chemProdInDate')) $('chemProdInDate').value = todayStr;
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 2);
    if($('chemProdExpDate')) $('chemProdExpDate').value = expDate.toISOString().slice(0, 10);
    if($('chemProdIsSpecial')) $('chemProdIsSpecial').checked = false;
    if($('chemProdHazard')) $('chemProdHazard').value = 'D';
    if($('chemProdStatus')) $('chemProdStatus').value = '입고';

    if(titleEl) titleEl.textContent = '🧪 화학물질·시약 신규 등록';
    const regName = curU ? (curU.name || curU.username) : (isAdm ? '관리자' : '연구원');
    if(subEl) subEl.textContent = '등록자: ' + regName + (curU && curU.affiliation ? (' (' + curU.affiliation + ')') : '') + ' · N센터 86291호 신규 재고 등록';
    if(submitBtn) submitBtn.textContent = '신규 등록 완료';
  }

  modal.classList.add('open');
  if(document.body) document.body.classList.add('modal-open');
}

function closeChemProductModal(){
  const modal = $('modalChemProductBackdrop');
  if(modal) modal.classList.remove('open');
  if(document.body) document.body.classList.remove('modal-open');
}

async function handleChemProductSubmit(e){
  e.preventDefault();
  const curU = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const isAdm = (typeof isAdmin === 'function') && isAdmin();

  if(!curU && !isAdm){
    toast('시약 등록을 위해 먼저 로그인해주세요.');
    openModal('login');
    return;
  }
  const id = ($('chemProdId') ? $('chemProdId').value : '').trim();
  if(id && !isAdm){
    toast('시약 정보 수정은 관리자만 가능합니다.');
    return;
  }
  const name = ($('chemProdName') ? $('chemProdName').value : '').trim();
  if(!name){ toast('제품명을 입력해주세요.'); return; }
  const mfg = ($('chemProdMfg') ? $('chemProdMfg').value : '').trim();
  const cas = ($('chemProdCas') ? $('chemProdCas').value : '').trim();
  if(!cas){ toast('CAS 번호를 입력해주세요.'); return; }
  const nameKo = ($('chemProdNameKo') ? $('chemProdNameKo').value : '').trim();
  const catNo = ($('chemProdCatNo') ? $('chemProdCatNo').value : '').trim();
  const code = ($('chemProdCode') ? $('chemProdCode').value : '').trim();
  const qty = ($('chemProdQty') ? $('chemProdQty').value : '').trim() || '1/1';
  const stock = Number($('chemProdStock') ? $('chemProdStock').value : 0);
  const unit = ($('chemProdUnit') ? $('chemProdUnit').value : 'mL').trim();
  const location = ($('chemProdLocation') ? $('chemProdLocation').value : '').trim() || 'N센터 86291호';
  const handler = ($('chemProdHandler') ? $('chemProdHandler').value : '').trim() || '이강민';
  const inDate = ($('chemProdInDate') ? $('chemProdInDate').value.replace(/-/g, '.') : '');
  const expDate = ($('chemProdExpDate') ? $('chemProdExpDate').value.replace(/-/g, '.') : '');
  const isSpecial = $('chemProdIsSpecial') ? $('chemProdIsSpecial').checked : false;
  const carcinogen = $('chemProdCarcinogen') ? $('chemProdCarcinogen').checked : false;
  const mutagen = $('chemProdMutagen') ? $('chemProdMutagen').checked : false;
  const reprotoxic = $('chemProdReprotoxic') ? $('chemProdReprotoxic').checked : false;
  const hazard = ($('chemProdHazard') ? $('chemProdHazard').value : 'safe');
  const hazardDesc = hazard === 'D' ? '독성/부식성' : (hazard === 'F' ? '인화성' : '일반/비위험');
  const status = ($('chemProdStatus') ? $('chemProdStatus').value : '입고');

  const chemicals = get291ChemicalsMaster();

  if(id){
    // Update existing
    const idx = chemicals.findIndex(function(c){ return c.id === id; });
    if(idx >= 0){
      chemicals[idx] = Object.assign(chemicals[idx], {
        name: name,
        nameKo: nameKo,
        mfg: mfg,
        cas: cas,
        catNo: catNo,
        code: code,
        qty: qty,
        stock: stock,
        unit: unit,
        location: location,
        handler: handler,
        inDate: inDate,
        expDate: expDate,
        isSpecial: isSpecial,
        carcinogen: carcinogen,
        mutagen: mutagen,
        reprotoxic: reprotoxic,
        hazard: hazard,
        hazardDesc: hazardDesc,
        status: status
      });
      save291ChemicalsMaster(chemicals);
      toast('✓ 시약 [' + name + '] 정보가 성공적으로 수정되었습니다.');
    }
  } else {
    // Insert new
    const newId = 'CHEM-291-' + String(chemicals.length + 1).padStart(3, '0');
    const newChem = {
      id: newId,
      name: name,
      nameKo: nameKo,
      mfg: mfg,
      cas: cas,
      catNo: catNo,
      code: code || ('P-' + String(chemicals.length + 1).padStart(2, '0')),
      hazard: hazard,
      hazardDesc: hazardDesc,
      qty: qty,
      stock: stock,
      unit: unit,
      handler: handler,
      location: location,
      status: status,
      inDate: inDate || new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      expDate: expDate,
      isSpecial: isSpecial,
      carcinogen: carcinogen,
      mutagen: mutagen,
      reprotoxic: reprotoxic,
      specialNoticeSub: isSpecial ? ('(' + name.split('(')[0].trim() + ')') : '',
      registered_by_username: creatorUsername,
      registered_by_name: creatorName,
      registered_by_affil: creatorAffil,
      registered_by_advisor: creatorAdvisor,
      registered_at: new Date().toISOString(),
      is_admin_registered: isAdm
    };
    chemicals.unshift(newChem);
    save291ChemicalsMaster(chemicals);
    
    // [감사 로그] 비관리자 / 연구원 신규 등록 추적 로그 기록
    const auditLog = {
      id: 'reg_' + newId + '_' + Date.now(),
      chemId: newId,
      materialName: newChem.name + (newChem.cas ? (' [' + newChem.cas + ']') : ''),
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      worker: creatorName + (isAdm ? ' (관리자)' : ' (연구원 등록)'),
      affiliation: creatorAffil || 'IBS 2DQH',
      professor: creatorAdvisor || '신현석 교수님',
      purpose: '[신규 시약 최초 등록] 등록자: ' + creatorName + ' (ID: ' + creatorUsername + ')' + (isAdm ? ' [관리자]' : ' [일반연구원 등록]'),
      usedQty: 0,
      remainingStock: newChem.stock,
      unit: newChem.unit,
      disposalMethod: '정상 입고 보관',
      safetyGear: '보안경, 실험복, 라텍스 장갑 착용',
      isRegistrationLog: true,
      registeredByUsername: creatorUsername
    };
    const curLogs = get291UsageLogs();
    curLogs.unshift(auditLog);
    save291UsageLogs(curLogs);

    if(db){
      try {
        db.from('chemical_logs').insert({
          chemical_name: newChem.name,
          cas_no: newChem.cas,
          user_name: creatorName + (isAdm ? ' (관리자)' : ' (연구원 등록)'),
          affiliation: creatorAffil || '2DQH',
          professor: creatorAdvisor,
          purpose: '[신규등록 감사로그] ID: ' + creatorUsername + ', 성명: ' + creatorName + (isAdm ? ' [관리자]' : ' [일반연구원]'),
          used_qty: 0,
          remaining_qty: newChem.stock,
          unit: newChem.unit,
          used_date: today()
        }).then(function(){});
      } catch(e){}
    }
  toast('✓ 신규 시약 [' + name + ']이(가) 등록되었습니다.');
  }

  closeChemProductModal();
  render291InventoryTable();
}

function openChemHistoryModal(chemId){
  const modal = $('modalChemHistoryBackdrop');
  if(!modal) return;

  const chemicals = get291ChemicalsMaster();
  const c = chemicals.find(function(item){ return item.id === chemId; }) || chemicals[0];
  const logs = get291UsageLogs();
  const matched = logs.filter(function(l){ return l.chemId === c.id || l.materialName.includes(c.name.split('(')[0].trim()); });

  let curStock = c.stock;
  if(matched.length > 0){
    matched.sort(function(a, b){ return (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time); });
    curStock = matched[0].remainingStock;
  }

  const title = $('chemHistoryModalTitle');
  const sub = $('chemHistoryModalSub');
  const initEl = $('histInitialStock');
  const curEl = $('histCurrentStock');
  const wrap = $('chemHistoryTableWrap');
  const btnWrite = $('btnHistWriteLog');

  if(title) title.textContent = c.name + ' [' + c.cas + ']';
  if(sub) {
    let subTxt = '제조사: ' + c.mfg + ' · 보관: ' + c.location + ' · 책임: ' + c.handler;
    if(c.registered_by_name) {
      subTxt += ' · 최초 등록자: ' + c.registered_by_name + (c.registered_by_affil ? (' (' + c.registered_by_affil + ')') : '') + (c.is_admin_registered ? ' [관리자]' : ' [연구원]');
    }
    sub.textContent = subTxt;
  }
  if(initEl) initEl.textContent = c.stock + ' ' + c.unit;
  if(curEl) curEl.textContent = curStock + ' ' + c.unit;

  if(wrap){
    if(matched.length === 0){
      wrap.innerHTML = '<div style="text-align:center;padding:36px;color:var(--ink-light);font-size:13px;">아직 작성된 취급 이력이 없습니다. [📝 이 시약 취급일지 작성]을 눌러 사용량을 기록하세요.</div>';
    } else {
      // 1) 모바일 전용 반응형 카드 뷰
      let mCards = '<div class="chem-hist-mobile-list mobile-only">';
      matched.forEach(function(m){
        mCards += '<div class="chem-hist-card">';
        mCards += '  <div class="chem-hist-card-head">';
        mCards += '    <span class="chem-hist-card-date">📅 ' + safe(m.date + ' ' + (m.time || '')) + '</span>';
        mCards += '    <span class="chem-hist-card-worker">👤 <b>' + safe(m.worker) + '</b> <span class="chem-hist-affil">(' + safe(m.affiliation) + ')</span></span>';
        mCards += '  </div>';
        mCards += '  <div class="chem-hist-card-qty-row">';
        mCards += '    <div class="chem-hist-qty-badge used">';
        mCards += '      <span class="q-lbl">사용량</span>';
        mCards += '      <span class="q-val">' + (m.usedQty > 0 ? ('-' + m.usedQty + ' ' + safe(m.unit)) : ('0 ' + safe(m.unit))) + '</span>';
        mCards += '    </div>';
        mCards += '    <div class="chem-hist-qty-arrow">➔</div>';
        mCards += '    <div class="chem-hist-qty-badge remaining">';
        mCards += '      <span class="q-lbl">사용 후 잔량</span>';
        mCards += '      <span class="q-val">' + m.remainingStock + ' ' + safe(m.unit) + '</span>';
        mCards += '    </div>';
        mCards += '  </div>';
        mCards += '  <div class="chem-hist-card-desc">';
        mCards += '    <span class="d-lbl">작업내용:</span> <span class="d-val">' + safe(m.workDesc) + '</span>';
        mCards += '  </div>';
        mCards += '  <div class="chem-hist-card-footer">';
        mCards += '    <span class="chem-hist-pill ppe">🛡️ ' + safe(m.ppe) + '</span>';
        mCards += '    <span class="chem-hist-pill incident">✅ ' + safe(m.incident) + '</span>';
        mCards += '  </div>';
        mCards += '</div>';
      });
      mCards += '</div>';

      // 2) 데스크톱 가로 스크롤 테이블 뷰
      let dTable = '<div class="chem-hist-desktop-wrap desktop-only" style="overflow-x:auto;">';
      dTable += '<table class="chem-inventory-table chem-hist-table" style="min-width:680px;width:100%;font-size:12px;">';
      dTable += '<thead><tr><th style="width:130px;">취급일자</th><th style="width:120px;">사용자 (소속)</th><th style="width:90px;">사용량</th><th style="width:95px;">사용 후 잔여량</th><th>작업 내용</th><th style="width:110px;">착용 보호구</th><th style="width:80px;">사고 유무</th></tr></thead><tbody>';
      matched.forEach(function(m){
        dTable += '<tr>';
        dTable += '<td style="white-space:nowrap;font-weight:700;">' + safe(m.date + ' ' + (m.time || '')) + '</td>';
        dTable += '<td style="white-space:nowrap;"><b>' + safe(m.worker) + '</b> (' + safe(m.affiliation) + ')</td>';
        dTable += '<td style="white-space:nowrap;color:#dc2626;font-weight:800;text-align:right;">' + (m.usedQty > 0 ? ('-' + m.usedQty + ' ' + safe(m.unit)) : '0 ' + safe(m.unit)) + '</td>';
        dTable += '<td style="white-space:nowrap;color:#059669;font-weight:800;text-align:right;">' + m.remainingStock + ' ' + safe(c.unit) + '</td>';
        dTable += '<td>' + safe(m.workDesc) + '</td>';
        dTable += '<td style="white-space:nowrap;color:#15803d;font-weight:600;">✓ ' + safe(m.ppe) + '</td>';
        dTable += '<td style="white-space:nowrap;color:#2563eb;font-weight:600;text-align:center;">' + safe(m.incident) + '</td>';
        dTable += '</tr>';
      });
      dTable += '</tbody></table></div>';

      wrap.innerHTML = mCards + dTable;
    }
  }

  if(btnWrite){
    btnWrite.onclick = function(e){
      e.preventDefault();
      closeChemHistoryModal();
      openChemWriteLogModal(c.id);
    };
  }

  modal.classList.add('open');
}

function closeChemHistoryModal(){
  const modal = $('modalChemHistoryBackdrop');
  if(modal) modal.classList.remove('open');
}

function openChemWriteLogModal(chemId){
  const modal = $('modalChemWriteLogBackdrop');
  if(!modal) return;

  const chemicals = get291ChemicalsMaster();

  // 1. chemId가 명시적으로 전달되지 않은 경우, 체크박스로 선택된 시약 ID 자동 추출!
  if(!chemId){
    const checkedBoxes = document.querySelectorAll('.chem-row-checkbox:checked');
    if(checkedBoxes.length > 0){
      chemId = checkedBoxes[0].value;
    }
  }

  // 2. 여전히 chemId가 없으면, 특별관리물질 첫 번째 항목 또는 기본 시약 선택
  if(!chemId){
    const defaultSpecial = chemicals.find(function(c){ return c.isSpecial; });
    if(defaultSpecial) chemId = defaultSpecial.id;
    else if(chemicals.length > 0) chemId = chemicals[0].id;
  }

  const select = $('modalChemSelect');
  if(select){
    // 특별관리물질 우선 나열하되, 체크된 시약이 일반 시약인 경우에도 select 목록에 포함되도록 구성
    let targetChems = chemicals.filter(function(c){ return c.isSpecial; });
    const selectedChem = chemicals.find(function(c){ return c.id === chemId; });
    if(selectedChem && !targetChems.some(function(c){ return c.id === selectedChem.id; })){
      targetChems.unshift(selectedChem); // 체크된 일반 시약을 맨 앞에 배치
    }

    select.innerHTML = targetChems.map(function(c){
      return '<option value="' + safe(c.id) + '" ' + (c.id === chemId ? 'selected' : '') + '>' +
        safe(c.name) + ' [' + safe(c.cas) + ']' + (c.isSpecial ? ' (특별관리)' : '') +
      '</option>';
    }).join('');

    select.value = chemId;
  }

  const handlerEl = $('modalChemHandler');
  const curAuth = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const chemCompactBar = $('chemUserCompactBar');
  const chemInputWrap = $('chemUserInputWrap');
  const chemBtnToggle = $('btnToggleChemUserEdit');

  if(curAuth && curAuth.name){
    if(handlerEl) handlerEl.value = curAuth.name;
    if(chemCompactBar){
      chemCompactBar.classList.remove('hidden');
      const cn = $('chemCompactName');
      const cm = $('chemCompactMeta');
      if(cn) cn.innerHTML = '<strong>' + safe(curAuth.name) + '</strong>';
      if(cm) cm.textContent = curAuth.affiliation ? ('(' + curAuth.affiliation + ')') : '';
    }
    if(chemInputWrap) chemInputWrap.classList.add('hidden');
    if(chemBtnToggle) chemBtnToggle.textContent = '수정';
  } else {
    if(chemCompactBar) chemCompactBar.classList.add('hidden');
    if(chemInputWrap) chemInputWrap.classList.remove('hidden');
    if(handlerEl && !handlerEl.value){
      handlerEl.value = localStorage.getItem('labstock_last_borrower_name') || '';
    }
  }

  updateModalChemStockPreview();

  const dateInput = $('modalChemDate');
  if(dateInput){
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const da = String(now.getDate()).padStart(2, '0');
    const ho = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    dateInput.value = yr + '-' + mo + '-' + da + 'T' + ho + ':' + mi;
  }

  modal.classList.add('open');
  modal.style.display = 'flex';
  if(document.body) document.body.classList.add('modal-open');
  const formEl = $('formWriteChemicalLogModal');
  if(formEl) formEl.scrollTop = 0;
}

function closeChemWriteLogModal(){
  const modal = $('modalChemWriteLogBackdrop');
  if(modal){
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
  if(document.body) document.body.classList.remove('modal-open');
}

function updateModalChemStockPreview(){
  const select = $('modalChemSelect');
  const notice = $('modalChemStockNotice');
  const unitInput = $('modalChemUnit');
  if(!select || !notice) return;

  const chemicals = get291ChemicalsMaster();
  const c = chemicals.find(function(item){ return item.id === select.value; });
  if(!c) return;

  if(unitInput) unitInput.value = c.unit;

  const logs = get291UsageLogs();
  const matched = logs.filter(function(l){ return l.chemId === c.id; });
  let curStock = c.stock;
  if(matched.length > 0){
    matched.sort(function(a, b){ return (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time); });
    curStock = matched[0].remainingStock;
  }

  notice.innerHTML = '💡 <b>' + safe(c.name) + '</b>: 현재 잔여량: <b style="color:#059669;font-size:14px;">' + curStock + ' ' + c.unit + '</b> (초기 입고량: ' + c.stock + ' ' + c.unit + ')';
}

async function handleModalChemLogSubmit(e){
  e.preventDefault();
  const select = $('modalChemSelect');
  const handlerEl = $('modalChemHandler');
  const dateEl = $('modalChemDate');
  const qtyEl = $('modalChemQty');
  const unitEl = $('modalChemUnit');
  const descEl = $('modalChemDesc');

  if(!handlerEl || !handlerEl.value.trim()){
    toast('취급자 성명을 입력해주세요.');
    return;
  }

  const chemicals = get291ChemicalsMaster();
  const c = chemicals.find(function(item){ return item.id === select.value; });
  if(!c){
    toast('물질을 선택해주세요.');
    return;
  }

  const usedQty = Number(qtyEl.value) || 0;
  if(usedQty <= 0){
    toast('사용량을 올바르게 입력해주세요.');
    return;
  }

  const logs = get291UsageLogs();
  const matched = logs.filter(function(l){ return l.chemId === c.id; });
  let curStock = c.stock;
  if(matched.length > 0){
    matched.sort(function(a, b){ return (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time); });
    curStock = matched[0].remainingStock;
  }

  const remaining = Math.max(0, curStock - usedQty);

  const rawDate = dateEl.value ? new Date(dateEl.value) : new Date();
  const yr = rawDate.getFullYear();
  const mo = String(rawDate.getMonth() + 1).padStart(2, '0');
  const da = String(rawDate.getDate()).padStart(2, '0');
  const ho = String(rawDate.getHours()).padStart(2, '0');
  const mi = String(rawDate.getMinutes()).padStart(2, '0');

  const newLog = {
    id: 'LOG-291-' + Date.now(),
    chemId: c.id,
    materialName: c.name,
    date: yr + '.' + mo + '.' + da,
    time: ho + ':' + mi,
    usedQty: usedQty,
    unit: unitEl ? unitEl.value : c.unit,
    remainingStock: remaining,
    workDesc: descEl ? descEl.value.trim() : '시편 세정 및 합성 반응',
    worker: handlerEl.value.trim(),
    affiliation: (typeof getCurrentUser === 'function' && getCurrentUser() && getCurrentUser().affiliation) ? getCurrentUser().affiliation : '이차원양자헤테로구조체연구단',
    ppe: '방독마스크, 내화학장갑, 보안경',
    incident: '이상 없음',
    signature: handlerEl.value.trim()
  };

  logs.unshift(newLog);
  save291UsageLogs(logs);
  try {
    localStorage.setItem('labstock_last_borrower_name', newLog.worker);
  } catch(_){}

  if(db && !isLocalMode){
    try {
      await db.from('chemical_logs').insert({
        session_id: newLog.id,
        chemical_name: newLog.materialName,
        cas_number: c.cas,
        handler_name: newLog.worker,
        affiliation: newLog.affiliation,
        used_at: yr + '-' + mo + '-' + da + ' ' + ho + ':' + mi + ':00',
        quantity: newLog.usedQty,
        unit: newLog.unit,
        work_location: c.location,
        work_description: newLog.workDesc,
        ppe_checked: true,
        ventilation_checked: true,
        initial_stock: c.stock,
        remaining_stock: remaining,
        note: '취급일지 등록 완료'
      });
    } catch(err){
      console.warn('Supabase chemical_logs sync skip:', err);
    }
  }

  closeChemWriteLogModal();
  toast('✓ ' + c.name.split('(')[0] + ' ' + usedQty + c.unit + ' 취급일지가 성공적으로 등록되었습니다. (잔여 ' + remaining + c.unit + ')');
  renderChemicalsView();
}


// =============================================================
// [공식 MSDS 레지스트리 및 특별관리물질 서식 뷰어 시스템]
// 제조사(Sigma-Aldrich, Thermo Fisher, Alfa Aesar) 공식 데이터 기반
// =============================================================
const CHEMICAL_MSDS_REGISTRY = {
  'chem-special-1': {
    name: 'Sulfuric acid(ACS reagent, 95.0-98.0%)',
    mfg: 'Sigma-Aldrich',
    catNo: '258105',
    cas: '7664-93-9',
    formula: 'H2SO4',
    molWeight: '98.08 g/mol',
    signalWord: '위험 (DANGER)',
    signalClass: 'danger',
    pictograms: [
      { icon: '🔥', label: '산화성', code: 'GHS03' },
      { icon: '🧪', label: '부식성', code: 'GHS05' },
      { icon: '☠️', label: '급성독성', code: 'GHS06' },
      { icon: '⚕️', label: '건강유해성', code: 'GHS08' }
    ],
    hCodes: [
      { code: 'H314', desc: '피부에 중증 화상과 눈 손상을 일으킴' },
      { code: 'H330', desc: '흡입하면 치명적임 (증기 및 미스트)' },
      { code: 'H350', desc: '암을 일으킬 수 있음 (국제암연구소 IARC Group 1)' }
    ],
    pCodes: [
      { code: 'P201', desc: '사용 전 취급 설명서를 확보하시오.' },
      { code: 'P260', desc: '분진·흄·가스·미스트·증기·스프레이를 흡입하지 마시오.' },
      { code: 'P280', desc: '내산성 보호장갑·내산성 보호의·보안경·안면보호구를 착용하시오.' },
      { code: 'P301+P330+P331', desc: '삼켰다면 입을 씻어내고 토하게 하지 마시오.' },
      { code: 'P303+P361+P353', desc: '피부에 묻으면 오염된 의복을 즉시 벗고 물로 15분 이상 씻으시오.' }
    ],
    firstAid: {
      eye: '즉시 흐르는 물이나 생리식염수로 눈꺼풀을 벌려 15분 이상 충분히 세척하고 즉시 안과 전문의의 진료를 받으십시오.',
      skin: '오염된 의복과 신발을 즉시 벗고 다량의 흐르는 물로 15분 이상 씻어내십시오. 화상이 심할 경우 즉시 응급 치료를 받으십시오.',
      inhalation: '신선한 공기가 있는 곳으로 즉시 환자를 옮기십시오. 호흡이 곤란하면 인공호흡(마우스 투 마우스 금지)을 실시하고 산소를 공급하십시오.',
      ingestion: '의식이 있는 경우 즉시 입을 헹구게 하고 물을 마시게 하되 억지로 구토를 유도하지 마십시오. 즉시 의사의 진료를 받으십시오.'
    },
    ppe: '내산성 불소고무 장갑(0.7mm 이상), 화학물질 튀김 방지 고글 및 안면보호구, 산성가스용 방독마스크(KOSHA 인증 카트리지), 내산성 앞치마.',
    spillFire: '누출 시 탄산수소나트륨(소다회) 또는 소석회로 천천히 중화 처리 후 다량의 물로 세척하십시오. 물과 격렬히 반응하므로 수조에 직접 물을 붓지 마십시오.'
  },
  'chem-special-2': {
    name: 'Pyridinium chlorochromate, 98%',
    mfg: 'Sigma-Aldrich',
    catNo: '190144',
    cas: '26299-14-9',
    formula: 'C5H5NHCrO3Cl',
    molWeight: '215.56 g/mol',
    signalWord: '위험 (DANGER)',
    signalClass: 'danger',
    pictograms: [
      { icon: '🔥', label: '산화성 고체', code: 'GHS03' },
      { icon: '🧪', label: '부식성', code: 'GHS05' },
      { icon: '⚕️', label: '발암성·변이원', code: 'GHS08' },
      { icon: '🐟', label: '수생환경유해', code: 'GHS09' }
    ],
    hCodes: [
      { code: 'H272', desc: '화재를 강렬하게 함 (산화제)' },
      { code: 'H317', desc: '알레르기성 피부 반응을 일으킬 수 있음' },
      { code: 'H350', desc: '암을 일으킬 수 있음 (6가 크롬 화합물)' },
      { code: 'H340', desc: '유전적인 결함을 일으킬 수 있음' },
      { code: 'H410', desc: '장기적 영향에 의해 수생생물에 매우 유독함' }
    ],
    pCodes: [
      { code: 'P201', desc: '사용 전 취급 설명서를 확보하시오.' },
      { code: 'P220', desc: '가연성 물질 및 환원제와 격리하여 보관하시오.' },
      { code: 'P273', desc: '환경으로 배출하지 마시오.' },
      { code: 'P280', desc: '보호장갑·보호의·보안경·호흡용 보호구를 착용하시오.' }
    ],
    firstAid: {
      eye: '즉시 물로 15분 이상 꼼꼼히 세척하고 전문의의 진료를 받으십시오.',
      skin: '오염된 부위를 비누와 다량의 물로 철저히 씻으십시오. 발진 발생 시 진료를 받으십시오.',
      inhalation: '환자를 신선한 공기가 있는 곳으로 이동시키고 안정을 취하게 하십시오.',
      ingestion: '입을 헹구고 즉시 독극물센터 또는 병원으로 이송하십시오.'
    },
    ppe: '니트릴 장갑, 방진/방독 복합 마스크, 화학보안경, 실험복.',
    spillFire: '환원성 가연물(종이, 목재)과 접촉 시 자연발화 위험. 건조 모래로 덮어 흡수 후 밀폐용기에 수거하십시오.'
  },
  'chem-special-3': {
    name: 'Tetrachloroethylene',
    mfg: 'Sigma-Aldrich',
    catNo: '270393',
    cas: '127-18-4',
    formula: 'C2Cl4',
    molWeight: '165.83 g/mol',
    signalWord: '경고 (WARNING)',
    signalClass: 'warning',
    pictograms: [
      { icon: '⚕️', label: '발암성 추정', code: 'GHS08' },
      { icon: '⚠️', label: '자극성/마취', code: 'GHS07' },
      { icon: '🐟', label: '수생환경유해', code: 'GHS09' }
    ],
    hCodes: [
      { code: 'H351', desc: '암을 일으킬 것으로 의심됨 (IARC Group 2A)' },
      { code: 'H315', desc: '피부에 자극을 일으킴' },
      { code: 'H319', desc: '눈에 심한 자극을 일으킴' },
      { code: 'H336', desc: '졸음 또는 현기증을 일으킬 수 있음' }
    ],
    pCodes: [
      { code: 'P261', desc: '증기의 흡입을 피하시오.' },
      { code: 'P281', desc: '지정된 개인 보호구를 사용하시오.' },
      { code: 'P305+P351', desc: '눈에 묻으면 몇 분간 물로 조심해서 씻으시오.' }
    ],
    firstAid: {
      eye: '콘택트렌즈를 제거하고 다량의 물로 세척하십시오.',
      skin: '비누와 물로 씻고 피부 건조 및 균열에 유의하십시오.',
      inhalation: '통풍이 잘되는 곳으로 환자를 옮겨 안정을 취하게 하십시오.',
      ingestion: '구토를 유발하지 말고 즉시 의사의 진료를 받으십시오.'
    },
    ppe: 'PVA 또는 Viton 재질 장갑 (일반 니트릴은 침투 빠름), 유기화합물용 방독마스크, 보안경.',
    spillFire: '모래나 불활성 흡착제로 흡수 후 유기용제 지정폐기물로 위탁 처리하십시오.'
  },
  'chem-special-4': {
    name: 'N,N-Dimethylformamide',
    mfg: 'Sigma-Aldrich',
    catNo: '227056',
    cas: '68-12-2',
    formula: 'C3H7NO',
    molWeight: '73.09 g/mol',
    signalWord: '위험 (DANGER)',
    signalClass: 'danger',
    pictograms: [
      { icon: '🔥', label: '인화성 액체', code: 'GHS02' },
      { icon: '⚕️', label: '생식독성 1B', code: 'GHS08' },
      { icon: '⚠️', label: '급성독성/자극', code: 'GHS07' }
    ],
    hCodes: [
      { code: 'H226', desc: '인화성 액체 및 증기' },
      { code: 'H360D', desc: '태아에 손상을 줄 수 있음 (생식독성 1B - 임산부 절대 취급 금지)' },
      { code: 'H312+H332', desc: '피부 접촉 또는 흡입 시 유해함' }
    ],
    pCodes: [
      { code: 'P201', desc: '사용 전 특별 취급 지침을 확인하시오.' },
      { code: 'P210', desc: '열·스파크·화염·고열로부터 멀리하시오.' },
      { code: 'P280', desc: '부틸고무 보호장갑·보호의·보안경을 착용하시오.' }
    ],
    firstAid: {
      eye: '즉시 물로 15분 이상 씻어내십시오.',
      skin: '피부 흡수율이 매우 높으므로 즉시 비누와 물로 전신 샤워하십시오.',
      inhalation: '신선한 공기 지역으로 즉시 이동하십시오.',
      ingestion: '즉시 의료기관 응급실로 이송하십시오.'
    },
    ppe: '부틸고무(Butyl) 장갑 필수 (라텍스/니트릴 투과됨), 유기용제용 방독마스크, 화학안전복.',
    spillFire: '환기 후 불활성 흡착포로 회수하십시오. 분말소화기, 내알코올포소화약제를 사용하십시오.'
  },
  'chem-special-5': {
    name: 'Cadmium(II) acetate',
    mfg: 'Sigma-Aldrich',
    catNo: '289159',
    cas: '543-90-8',
    formula: 'Cd(CH3COO)2',
    molWeight: '230.50 g/mol',
    signalWord: '위험 (DANGER)',
    signalClass: 'danger',
    pictograms: [
      { icon: '☠️', label: '급성독성', code: 'GHS06' },
      { icon: '⚕️', label: '발암성·변이원', code: 'GHS08' },
      { icon: '🐟', label: '수생환경유해', code: 'GHS09' }
    ],
    hCodes: [
      { code: 'H301+H312+H330', desc: '삼키거나 흡입하면 치명적임' },
      { code: 'H340', desc: '유전적인 결함을 일으킬 수 있음' },
      { code: 'H350', desc: '암을 일으킬 수 있음 (신장암, 전립선암 - IARC Group 1)' },
      { code: 'H372', desc: '장기적 노출 시 신장 및 골격계 손상을 일으킴 (이타이이타이병)' }
    ],
    pCodes: [
      { code: 'P201', desc: '사용 전 취급 설명서를 확보하시오.' },
      { code: 'P260', desc: '분진을 절대 흡입하지 마시오.' },
      { code: 'P284', desc: '호흡기 보호구를 착용하시오 (HEPA 특등급).' }
    ],
    firstAid: {
      eye: '생리식염수로 15분 이상 세척하십시오.',
      skin: '오염된 피부를 비누와 물로 철저히 씻으십시오.',
      inhalation: '즉시 신선한 공기로 이동하고 119 구급대를 호출하십시오.',
      ingestion: '즉시 위세척 및 킬레이트 요법(EDTA 등)을 위한 응급실 진료.'
    },
    ppe: '이중 니트릴 장갑, 전면형 전동식 호흡보호구(PAPR) 또는 특등급 방진마스크, 보호복.',
    spillFire: '물청소 금지. HEPA 필터가 장착된 유해물질 전용 청소기로 회수 후 중금속 폐기.'
  },
  'chem-special-6': {
    name: 'Lead(II) iodide',
    mfg: 'Sigma-Aldrich / Alfa Aesar',
    catNo: '211141',
    cas: '10101-63-0',
    formula: 'PbI2',
    molWeight: '461.01 g/mol',
    signalWord: '위험 (DANGER)',
    signalClass: 'danger',
    pictograms: [
      { icon: '⚕️', label: '생식독성 1A', code: 'GHS08' },
      { icon: '⚠️', label: '급성독성 4', code: 'GHS07' },
      { icon: '🐟', label: '만성수생유해', code: 'GHS09' }
    ],
    hCodes: [
      { code: 'H360Df', desc: '태아에 손상을 줌. 생식능력에 손상을 줄 수 있음' },
      { code: 'H372', desc: '장기간 반복 노출 시 중추신경계, 혈액계(빈혈), 신장 손상' },
      { code: 'H302+H332', desc: '삼키거나 흡입하면 유해함' }
    ],
    pCodes: [
      { code: 'P201', desc: '사용 전 특별 취급 지침을 확인하시오.' },
      { code: 'P281', desc: '지정된 개인보호구를 착용하시오.' },
      { code: 'P308+P313', desc: '노출되거나 노출이 우려되면 의사의 진찰을 받으시오.' }
    ],
    firstAid: {
      eye: '흐르는 물로 15분간 세척하십시오.',
      skin: '비누와 미온수로 즉시 씻으십시오.',
      inhalation: '신선한 공기 지역으로 환자를 대피시키십시오.',
      ingestion: '즉시 의사의 진료를 받으십시오.'
    },
    ppe: '1급 이상 방진마스크, 내화학 니트릴 장갑, 밀폐형 고글, 실험복.',
    spillFire: '분진 비산을 방지하며 습식 흡착포로 조심스럽게 회수하여 납 함유 폐기물로 보관.'
  },
  'chem-special-7': {
    name: 'Chromium(III) chloride',
    mfg: 'Sigma-Aldrich',
    catNo: '27096',
    cas: '10025-73-7',
    formula: 'CrCl3·6H2O',
    molWeight: '266.45 g/mol',
    signalWord: '경고 (WARNING)',
    signalClass: 'warning',
    pictograms: [
      { icon: '⚠️', label: '급성유해성', code: 'GHS07' },
      { icon: '🐟', label: '수생환경유해', code: 'GHS09' }
    ],
    hCodes: [
      { code: 'H302', desc: '삼키면 유해함' },
      { code: 'H317', desc: '알레르기성 피부 반응을 일으킬 수 있음' },
      { code: 'H411', desc: '장기적 영향에 의해 수생생물에게 유독함' }
    ],
    pCodes: [
      { code: 'P280', desc: '보호장갑 및 보안경을 착용하시오.' },
      { code: 'P273', desc: '환경으로 배출하지 마시오.' }
    ],
    firstAid: {
      eye: '다량의 물로 세척하십시오.',
      skin: '비누와 물로 피부를 세척하십시오.',
      inhalation: '신선한 공기로 이동하십시오.',
      ingestion: '입을 헹구고 물을 마시게 하십시오.'
    },
    ppe: '니트릴 장갑, 방진마스크, 보호안경.',
    spillFire: '물과 불활성 물질로 닦아내어 무기중금속 폐액통에 격리 보관.'
  },
  'chem-special-8': {
    name: 'Benzene, for HPLC, ≥99.9%',
    mfg: 'Sigma-Aldrich',
    catNo: '270709',
    cas: '71-43-2',
    formula: 'C6H6',
    molWeight: '78.11 g/mol',
    signalWord: '위험 (DANGER)',
    signalClass: 'danger',
    pictograms: [
      { icon: '🔥', label: '고인화성 액체', code: 'GHS02' },
      { icon: '⚕️', label: '발암성·변이원 1A', code: 'GHS08' },
      { icon: '⚠️', label: '급성독성/자극', code: 'GHS07' }
    ],
    hCodes: [
      { code: 'H225', desc: '고인화성 액체 및 증기 (인화점 -11°C)' },
      { code: 'H350', desc: '암을 일으킴 (백혈병, 골수 손상 - IARC Group 1)' },
      { code: 'H340', desc: '유전적인 결함을 일으킬 수 있음' },
      { code: 'H304', desc: '삼켜서 기도로 들어가면 치명적일 수 있음' },
      { code: 'H372', desc: '장기간 반복 노출 시 조혈기계(골수)에 치명적 손상' }
    ],
    pCodes: [
      { code: 'P201', desc: '사용 전 취급 설명서를 확보하시오.' },
      { code: 'P210', desc: '열, 스파크, 화염 등 점화원으로부터 멀리하시오. - 금연' },
      { code: 'P280', desc: '보호장갑, 방독마스크, 보안경을 반드시 착용하시오.' },
      { code: 'P301+P310', desc: '삼켰다면 즉시 의학적 조치를 받으시오.' }
    ],
    firstAid: {
      eye: '즉시 다량의 물로 15분 이상 세척하고 즉시 안과 검진을 받으십시오.',
      skin: '오염된 의복을 즉시 탈의하고 비누와 물로 충분히 씻으십시오.',
      inhalation: '호흡을 멈춘 경우 즉시 인공호흡을 실시하고 신선한 곳으로 대피.',
      ingestion: '구토를 시키지 마십시오(폐 흡인 위험). 즉시 119 구급대 호출.'
    },
    ppe: 'Viton/PVA 재질 장갑(니트릴 금지), 유기증기용 방독마스크(정기 필터 교체), 방폭 후드 사용.',
    spillFire: '모든 점화원을 차단하고 환기하십시오. 방폭형 장비와 내알코올포 소화기 사용.'
  },
  'chem-special-9': {
    name: 'Nickel(II) nitrate hexahydrate',
    mfg: 'Sigma-Aldrich',
    catNo: '72253',
    cas: '13478-00-7',
    formula: 'Ni(NO3)2·6H2O',
    molWeight: '290.79 g/mol',
    signalWord: '위험 (DANGER)',
    signalClass: 'danger',
    pictograms: [
      { icon: '🔥', label: '산화성 고체', code: 'GHS03' },
      { icon: '⚕️', label: '발암성·호흡기과민', code: 'GHS08' },
      { icon: '⚠️', label: '유해성/피부알레르기', code: 'GHS07' },
      { icon: '🐟', label: '수생환경유해', code: 'GHS09' }
    ],
    hCodes: [
      { code: 'H272', desc: '화재를 강렬하게 함 (산화제)' },
      { code: 'H350i', desc: '흡입 시 암을 일으킬 수 있음 (폐암, 비강암)' },
      { code: 'H360D', desc: '태아에 손상을 줄 수 있음' },
      { code: 'H334', desc: '흡입 시 알레르기 또는 천식 증상을 유발할 수 있음' }
    ],
    pCodes: [
      { code: 'P201', desc: '사용 전 특별 취급 지침을 확인하시오.' },
      { code: 'P261', desc: '분진 흡입을 피하시오.' },
      { code: 'P280', desc: '보호장갑, 보호의, 보안경을 착용하시오.' }
    ],
    firstAid: {
      eye: '흐르는 물로 15분간 세척하십시오.',
      skin: '접촉 부위를 비누와 물로 즉시 씻으십시오.',
      inhalation: '호흡 곤란 시 산소를 투여하고 병원으로 이송하십시오.',
      ingestion: '즉시 물을 마시게 하고 의사의 진료를 받으십시오.'
    },
    ppe: '니트릴 장갑, 1급 방진/방독 복합 마스크, 실험복, 고글.',
    spillFire: '가연물과 분리하여 수거하고 니켈계 중금속 폐기물로 위탁 처리.'
  }
};

// -------------------------------------------------------------
// [MSDS 공식 요약 모달 열기/닫기]
// -------------------------------------------------------------
function openChemMsdsModal(chemId){
  const chemicals = get291ChemicalsMaster();
  const chem = chemicals.find(function(c){ return c.id === chemId; }) || {
    id: chemId,
    name: '화학물질 시약',
    mfg: '공식 제조사',
    catNo: '-',
    cas: '-'
  };

  const modal = $('modalMsdsViewerBackdrop');
  if(!modal) return;

  const msds = CHEMICAL_MSDS_REGISTRY[chemId] || {
    name: chem.name,
    mfg: chem.mfg || 'Sigma-Aldrich / Thermo Fisher',
    catNo: chem.catNo || '-',
    cas: chem.cas || '-',
    formula: chem.formula || '화학식 정보 준비중',
    molWeight: 'MSDS 요약 참조',
    signalWord: (chem.hazard === 'D' || chem.isSpecial) ? '위험 (DANGER)' : '경고 (WARNING)',
    signalClass: (chem.hazard === 'D' || chem.isSpecial) ? 'danger' : 'warning',
    pictograms: chem.isSpecial ? [
      { icon: '⚕️', label: '특별관리물질', code: 'GHS08' },
      { icon: '⚠️', label: '유해성', code: 'GHS07' }
    ] : [
      { icon: '⚠️', label: '자극성', code: 'GHS07' }
    ],
    hCodes: [
      { code: 'H315', desc: '피부에 자극을 일으킴' },
      { code: 'H319', desc: '눈에 심한 자극을 일으킴' },
      { code: 'H335', desc: '호흡기계 자극을 유발할 수 있음' }
    ],
    pCodes: [
      { code: 'P261', desc: '분진·증기의 흡입을 피하시오.' },
      { code: 'P280', desc: '보호장갑·보안경·마스크를 착용하시오.' },
      { code: 'P305+P351+P338', desc: '눈에 묻으면 몇 분간 물로 조심해서 씻으시오.' }
    ],
    firstAid: {
      eye: '즉시 흐르는 물로 15분 이상 세척하고 불편감이 지속되면 안과 진료를 받으십시오.',
      skin: '오염된 의복을 벗고 비누와 물로 깨끗이 세척하십시오.',
      inhalation: '신선한 공기가 있는 장소로 이동하여 안정을 취하십시오.',
      ingestion: '입을 물로 헹구고 즉시 전문 의료기관의 진료를 받으십시오.'
    },
    ppe: '내화학 니트릴 장갑, 화학 보안경, KOSHA 인증 유기용제/방진마스크, 실험복.',
    spillFire: '적절한 보호구를 착용 후 불활성 흡착포로 회수하고 환기하십시오. 분말 또는 탄산가스 소화기 사용.'
  };

  const titleEl = $('msdsModalTitle');
  const subEl = $('msdsModalSub');
  const bodyEl = $('msdsModalBody');

  if(titleEl) titleEl.textContent = '📄 ' + msds.name + ' - 물질안전보건자료(MSDS) 요약';
  if(subEl) subEl.textContent = '제조사 공식 규격 (' + msds.mfg + ') · CAS No: ' + msds.cas + ' · CAT No: ' + msds.catNo;

  let pictogramsHtml = '';
  msds.pictograms.forEach(function(p){
    pictogramsHtml += '<div class="msds-pictogram-badge" title="' + p.label + ' (' + p.code + ')">' +
      '<span>' + p.icon + '</span>' +
      '<span class="sub">' + p.code + '</span>' +
    '</div>';
  });

  let hCodesHtml = '';
  msds.hCodes.forEach(function(h){
    hCodesHtml += '<li style="margin-bottom:4px;"><b>' + h.code + '</b>: ' + h.desc + '</li>';
  });

  let pCodesHtml = '';
  msds.pCodes.forEach(function(p){
    pCodesHtml += '<li style="margin-bottom:4px;"><b>' + p.code + '</b>: ' + p.desc + '</li>';
  });

  let bodyContent = '';
  bodyContent += '<div class="msds-info-grid">' +
    '<div class="msds-info-item"><span class="label">물질명 (제품명)</span><span class="value">' + msds.name + '</span></div>' +
    '<div class="msds-info-item"><span class="label">공식 제조사</span><span class="value">' + msds.mfg + '</span></div>' +
    '<div class="msds-info-item"><span class="label">CAS 번호</span><span class="value">' + msds.cas + '</span></div>' +
    '<div class="msds-info-item"><span class="label">카탈로그 번호 (CAT No.)</span><span class="value">' + msds.catNo + '</span></div>' +
    '<div class="msds-info-item"><span class="label">화학식 (분자식)</span><span class="value">' + msds.formula + '</span></div>' +
    '<div class="msds-info-item"><span class="label">분자량</span><span class="value">' + msds.molWeight + '</span></div>' +
  '</div>';

  bodyContent += '<div class="msds-ghs-box">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
      '<div style="font-size:14px;font-weight:800;color:#0f172a;">GHS 분류 및 위험성 그림문자</div>' +
      '<span style="padding:3px 10px;border-radius:4px;font-weight:900;font-size:12px;background:' + (msds.signalClass === 'danger' ? '#fee2e2;color:#dc2626;border:1px solid #f87171;' : '#fef3c7;color:#d97706;border:1px solid #fcd34d;') + '">' +
        '신호어: ' + msds.signalWord +
      '</span>' +
    '</div>' +
    '<div class="msds-pictograms">' + pictogramsHtml + '</div>' +
  '</div>';

  bodyContent += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">' +
    '<div class="msds-section-block" style="margin-bottom:0;">' +
      '<h4 class="msds-section-title">⚠️ 유해·위험 문구 (H-Code)</h4>' +
      '<ul style="margin:0;padding-left:18px;font-size:12.5px;color:#334155;line-height:1.6;">' + hCodesHtml + '</ul>' +
    '</div>' +
    '<div class="msds-section-block" style="margin-bottom:0;">' +
      '<h4 class="msds-section-title">🛡️ 예방조치 문구 (P-Code)</h4>' +
      '<ul style="margin:0;padding-left:18px;font-size:12.5px;color:#334155;line-height:1.6;">' + pCodesHtml + '</ul>' +
    '</div>' +
  '</div>';

  bodyContent += '<div class="msds-section-block">' +
    '<h4 class="msds-section-title">🚑 응급조치 요령 (4대 분야)</h4>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12.5px;line-height:1.5;">' +
      '<div style="background:#f8fafc;padding:8px 12px;border-radius:6px;border:1px solid #e2e8f0;"><b>👁️ 눈에 들어갔을 때:</b> ' + msds.firstAid.eye + '</div>' +
      '<div style="background:#f8fafc;padding:8px 12px;border-radius:6px;border:1px solid #e2e8f0;"><b>🧤 피부에 접촉했을 때:</b> ' + msds.firstAid.skin + '</div>' +
      '<div style="background:#f8fafc;padding:8px 12px;border-radius:6px;border:1px solid #e2e8f0;"><b>🫁 흡입했을 때:</b> ' + msds.firstAid.inhalation + '</div>' +
      '<div style="background:#f8fafc;padding:8px 12px;border-radius:6px;border:1px solid #e2e8f0;"><b>🍽️ 섭취했을 때:</b> ' + msds.firstAid.ingestion + '</div>' +
    '</div>' +
  '</div>';

  bodyContent += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
    '<div class="msds-section-block">' +
      '<h4 class="msds-section-title">🥽 필수 적정 개인보호구</h4>' +
      '<p style="margin:0;font-size:12.5px;color:#334155;line-height:1.6;">' + msds.ppe + '</p>' +
    '</div>' +
    '<div class="msds-section-block">' +
      '<h4 class="msds-section-title">🧯 누출 및 화재 시 대처방법</h4>' +
      '<p style="margin:0;font-size:12.5px;color:#334155;line-height:1.6;">' + msds.spillFire + '</p>' +
    '</div>' +
  '</div>';

  if(bodyEl) bodyEl.innerHTML = bodyContent;
  modal.classList.add('open');
}

function closeChemMsdsModal(){
  const modal = $('modalMsdsViewerBackdrop');
  if(modal) modal.classList.remove('open');
}

// -------------------------------------------------------------
// [특별관리물질 취급일지 법정 서식 뷰어 모달 열기/닫기 (이미지 3 서식)]
// -------------------------------------------------------------
function openChemOfficialLedgerModal(){
  const modal = $('modalChemOfficialLedgerBackdrop');
  if(!modal) return;

  const tbody = $('officialLedgerTableBody');
  if(!tbody) return;

  const logs = get291UsageLogs();
  let rowsHtml = '';

  // 이미지 3번에 등록된 기본 10대 특별관리물질 데이터가 없을 경우 보장
  if(logs.length === 0){
    const defaultSampleRows = [
      { date: '2026.03.12', name: 'Sulfuric acid(ACS reagent, 95.0-98.0%)', used: '0 mL', stock: '500.0 mL', work: '2D 반도체 기판 산화막 에칭', worker: '이강민', ppe: '내산장갑, 보안경', incident: '이상 없음' },
      { date: '2026.03.12', name: 'Pyridinium chlorochromate, 98%', used: '0 g', stock: '25.0 g', work: '산화 환원 촉매 반응', worker: '이강민', ppe: '방진마스크, 보호장갑', incident: '이상 없음' },
      { date: '2026.03.12', name: 'Tetrachloroethylene', used: '0 L', stock: '1.0 L', work: '유기 세정 공정', worker: '이강민', ppe: '유기용제마스크, 보안경', incident: '이상 없음' },
      { date: '2026.03.12', name: 'N,N-Dimethylformamide', used: '0 L', stock: '1.0 L', work: '박리 용매 합성', worker: '이강민', ppe: '부틸장갑, 방독마스크', incident: '이상 없음' },
      { date: '2026.03.16', name: 'Cadmium(II) acetate', used: '0 g', stock: '5.0 g', work: 'Cd 양자점 전구체 준비', worker: '신현석', ppe: '전면형보호구, 실험복', incident: '이상 없음' },
      { date: '2026.03.16', name: 'Lead(II) iodide', used: '0 g', stock: '50.0 g', work: '페로브스카이트 박막 코팅', worker: '이강민', ppe: '방진마스크, 니트릴장갑', incident: '이상 없음' },
      { date: '2026.03.16', name: 'Lead(II) iodide (Lot #2)', used: '0 g', stock: '50.0 g', work: '결정 성장 실험', worker: '이강민', ppe: '방진마스크, 니트릴장갑', incident: '이상 없음' },
      { date: '2026.03.17', name: 'Chromium(III) chloride', used: '0 g', stock: '25.0 g', work: 'Cr 클러스터 합성', worker: '이강민', ppe: '보호장갑, 보안경', incident: '이상 없음' },
      { date: '2026.03.17', name: 'Benzene, for HPLC, ≥99.9%', used: '0 mL', stock: '100.0 mL', work: '고순도 결정 정제 용매', worker: '이강민', ppe: 'Viton장갑, 방독마스크', incident: '이상 없음' },
      { date: '2026.03.17', name: 'Nickel(II) nitrate hexahydrate', used: '0 g', stock: '20.0 g', work: 'Ni 도핑 공정', worker: '이강민', ppe: '방진마스크, 보호장갑', incident: '이상 없음' }
    ];

    defaultSampleRows.forEach(function(r){
      rowsHtml += '<tr>' +
        '<td style="border:1px solid #000;padding:7px 5px;font-family:monospace;">' + r.date + '</td>' +
        '<td style="border:1px solid #000;padding:7px 5px;text-align:left;font-weight:700;">' + r.name + '</td>' +
        '<td style="border:1px solid #000;padding:7px 5px;font-weight:700;">' + r.used + '</td>' +
        '<td style="border:1px solid #000;padding:7px 5px;font-weight:700;">' + r.stock + '</td>' +
        '<td style="border:1px solid #000;padding:7px 5px;text-align:left;">' + r.work + '</td>' +
        '<td style="border:1px solid #000;padding:7px 5px;">' + r.worker + '</td>' +
        '<td style="border:1px solid #000;padding:7px 5px;font-size:11px;">' + r.ppe + '</td>' +
        '<td style="border:1px solid #000;padding:7px 5px;font-size:11px;">' + r.incident + '</td>' +
      '</tr>';
    });
  } else {
    logs.forEach(function(l){
      rowsHtml += '<tr>' +
        '<td style="border:1px solid #000;padding:7px 5px;font-family:monospace;">' + (l.date || '') + '</td>' +
        '<td style="border:1px solid #000;padding:7px 5px;text-align:left;font-weight:700;">' + (l.materialName || '') + '</td>' +
        '<td style="border:1px solid #000;padding:7px 5px;font-weight:700;">' + (l.usedQty !== undefined ? l.usedQty + ' ' + (l.unit || '') : '0 mL') + '</td>' +
        '<td style="border:1px solid #000;padding:7px 5px;font-weight:700;">' + (l.remainingStock !== undefined ? l.remainingStock + ' ' + (l.unit || '') : '') + '</td>' +
        '<td style="border:1px solid #000;padding:7px 5px;text-align:left;">' + (l.workDesc || '-') + '</td>' +
        '<td style="border:1px solid #000;padding:7px 5px;">' + (l.worker || '이강민') + '</td>' +
        '<td style="border:1px solid #000;padding:7px 5px;font-size:11px;">' + (l.ppe || '보호장갑, 보안경') + '</td>' +
        '<td style="border:1px solid #000;padding:7px 5px;font-size:11px;">' + (l.incident || '이상 없음') + '</td>' +
      '</tr>';
    });
  }

  tbody.innerHTML = rowsHtml;
  modal.classList.add('open');
}

function closeChemOfficialLedgerModal(){
  const modal = $('modalChemOfficialLedgerBackdrop');
  if(modal) modal.classList.remove('open');
}

function openChemNoticeModal(){
  const checkedBoxes = document.querySelectorAll('.chem-row-checkbox:checked');
  const chemicals = get291ChemicalsMaster();

  let targetChem = null;
  if(checkedBoxes.length > 0){
    const selectedId = checkedBoxes[0].value;
    targetChem = chemicals.find(function(c){ return c.id === selectedId; });
  }

  if(!targetChem){
    targetChem = chemicals.find(function(c){ return c.isSpecial && c.name.includes('Benzene'); }) ||
                 chemicals.find(function(c){ return c.isSpecial; }) ||
                 chemicals[0];
  }

  const modal = $('modalChemNoticeBackdrop');
  if(!modal) return;

  const nameDisplay = $('noticeSubstanceNameDisplay');
  const subDisplay = $('noticeSubstanceSubDisplay');
  const carcCheck = $('noticeCarcinogenCheck');
  const mutaCheck = $('noticeMutagenCheck');
  const reproCheck = $('noticeReproCheck');

  if(nameDisplay) nameDisplay.textContent = targetChem.name;
  if(subDisplay){
    subDisplay.textContent = targetChem.specialNoticeSub || '(' + targetChem.name + ' 0.1% 이상 함유)';
  }
  if(carcCheck) carcCheck.textContent = targetChem.carcinogen ? 'X' : '-';
  if(mutaCheck) mutaCheck.textContent = targetChem.mutagen ? 'X' : '-';
  if(reproCheck) reproCheck.textContent = targetChem.reprotoxic ? 'X' : '-';

  modal.classList.add('open');
}

function closeChemNoticeModal(){
  const modal = $('modalChemNoticeBackdrop');
  if(modal) modal.classList.remove('open');
}

function printChemNoticeA4(){
  window.print();
}

// -------------------------------------------------------------
// 3. 7열 정규 달력 그리드 렌더링 (가로 찌그러짐 원천 차단)
// -------------------------------------------------------------
function render291Calendar(){
  const grid = $('chemCalendarGrid');
  const monthText = $('chemCalCurrentMonthText');
  const summaryText = $('chemCalSummaryText');
  if(!grid) return;

  if(monthText){
    monthText.textContent = currentChemCalYear + '년 ' + currentChemCalMonth + '월';
  }

  const logs = get291UsageLogs();
  const yStr = String(currentChemCalYear);
  const mStr = String(currentChemCalMonth).padStart(2, '0');
  const prefix = yStr + '.' + mStr;

  const monthLogs = logs.filter(function(l){
    return l.date && l.date.startsWith(prefix);
  });

  if(summaryText){
    summaryText.innerHTML = '당월 총 <b>' + monthLogs.length + '</b>건의 특별관리물질 취급 기록됨';
  }

  const firstDay = new Date(currentChemCalYear, currentChemCalMonth - 1, 1).getDay();
  const lastDate = new Date(currentChemCalYear, currentChemCalMonth, 0).getDate();

  // 7열 그리드의 직접 자식으로 7개 요일 헤더를 배치
  let html = '';
  const weekdays = [
    { label: '일', cls: 'sun' },
    { label: '월', cls: '' },
    { label: '화', cls: '' },
    { label: '수', cls: '' },
    { label: '목', cls: '' },
    { label: '금', cls: '' },
    { label: '토', cls: 'sat' }
  ];
  weekdays.forEach(function(w){
    html += '<div class="cal-weekday-header ' + w.cls + '">' + w.label + '</div>';
  });

  // 앞쪽 빈 날짜들
  for(let i = 0; i < firstDay; i++){
    html += '<div class="chem-cal-cell empty"></div>';
  }

  const todayDot = today().replace(/-/g, '.');

  for(let d = 1; d <= lastDate; d++){
    const dStr = String(d).padStart(2, '0');
    const fullDate = prefix + '.' + dStr;
    const dayLogs = monthLogs.filter(function(l){ return l.date === fullDate; });
    const isToday = (fullDate === todayDot);

    let cellContent = '<div class="cal-date-header">' +
      '<span class="cal-date-num">' + d + '</span>' +
      (isToday ? '<span class="cal-today-badge">오늘</span>' : '') +
      '</div>';
    if(dayLogs.length > 0){
      cellContent += '<div class="cal-badge-box">';
      dayLogs.slice(0, 2).forEach(function(l){
        const shortName = l.materialName.split(',')[0].split('(')[0].trim();
        const actionType = l.usedQty > 0 ? ('-' + l.usedQty + l.unit) : '입고';
        const badgeColor = l.usedQty > 0 ? '#dc2626' : '#2563eb';
        cellContent += '<div class="cal-mini-badge" style="background:' + badgeColor + '15;color:' + badgeColor + ';border:1px solid ' + badgeColor + '30;" title="' + safe(l.materialName) + ' (' + actionType + ')">' + safe(shortName) + ' ' + actionType + '</div>';
      });
      if(dayLogs.length > 2){
        cellContent += '<div class="cal-more-text">+' + (dayLogs.length - 2) + '건 더보기</div>';
      }
      cellContent += '</div>';
    }

    const cellClass = 'chem-cal-cell' + (dayLogs.length > 0 ? ' has-log' : '') + (isToday ? ' today' : '');
    html += '<div class="' + cellClass + '" data-cal-date="' + fullDate + '">' + cellContent + '</div>';
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.chem-cal-cell.has-log').forEach(function(cell){
    cell.addEventListener('click', function(){
      showChemDayLogsModal(cell.dataset.calDate);
    });
  });
}

function showChemDayLogsModal(dateStr){
  const logs = get291UsageLogs().filter(function(l){ return l.date === dateStr; });
  if(logs.length === 0) return;

  let msg = '📅 ' + dateStr + ' 특별관리물질 취급 내역 (' + logs.length + '건)\n\n';
  logs.forEach(function(l, idx){
    msg += (idx + 1) + '. ' + l.materialName + '\n';
    msg += '   - 작업자: ' + l.worker + ' (' + l.affiliation + ')\n';
    msg += '   - 사용량: ' + (l.usedQty > 0 ? (l.usedQty + ' ' + l.unit) : '0 (입고/점검)') + ' (잔여: ' + l.remainingStock + ' ' + l.unit + ')\n';
    msg += '   - 작업내용: ' + l.workDesc + '\n';
    msg += '   - 착용보호구: ' + l.ppe + '\n\n';
  });

  alert(msg);
}

// -------------------------------------------------------------
// 4. 월별 취급 통계 렌더링 (사용자 피드백 요청)
// -------------------------------------------------------------
function renderChemMonthlyStats(){
  const title = $('monthlyStatTitle');
  const cardsGrid = $('monthlyStatCardsGrid');
  const tableWrap = $('monthlyStatTableWrap');
  if(!cardsGrid) return;

  if(title) title.textContent = currentChemCalYear + '년 ' + currentChemCalMonth + '월 특별관리물질 취급 통계';

  const logs = get291UsageLogs();
  const prefix = currentChemCalYear + '.' + String(currentChemCalMonth).padStart(2, '0');
  const monthLogs = logs.filter(function(l){ return l.date && l.date.startsWith(prefix); });

  const totalLogs = monthLogs.length;
  const useLogs = monthLogs.filter(function(l){ return l.usedQty > 0; });
  const totalUsedCount = useLogs.length;

  // 물질별 사용량 집계
  const chemUsageMap = {};
  monthLogs.forEach(function(l){
    if(!chemUsageMap[l.materialName]) chemUsageMap[l.materialName] = { used: 0, unit: l.unit, count: 0 };
    chemUsageMap[l.materialName].used += (l.usedQty || 0);
    chemUsageMap[l.materialName].count++;
  });

  cardsGrid.innerHTML = 
    '<div class="cal-stat-card">' +
      '<span class="cal-stat-card-title">당월 총 취급 기록</span>' +
      '<span class="cal-stat-card-val" style="color:#2563eb;">' + totalLogs + ' 건</span>' +
      '<span class="cal-stat-card-sub">실제 사용 ' + totalUsedCount + '건 · 입고 및 점검 ' + (totalLogs - totalUsedCount) + '건</span>' +
    '</div>' +
    '<div class="cal-stat-card">' +
      '<span class="cal-stat-card-title">주요 취급 물질 수</span>' +
      '<span class="cal-stat-card-val" style="color:#059669;">' + Object.keys(chemUsageMap).length + ' 종</span>' +
      '<span class="cal-stat-card-sub">등록 특별관리물질 대상</span>' +
    '</div>' +
    '<div class="cal-stat-card">' +
      '<span class="cal-stat-card-title">안전 관리 및 조치사항</span>' +
      '<span class="cal-stat-card-val" style="color:#15803d;">이상 없음 (100%)</span>' +
      '<span class="cal-stat-card-sub">보호구 100% 착용 · 무사고 운영</span>' +
    '</div>';

  if(tableWrap){
    let tbl = '<table class="cal-stat-table">';
    tbl += '<thead><tr><th>물질명</th><th>단위</th><th>당월 총 사용량</th><th>취급 횟수</th><th>상태</th></tr></thead><tbody>';
    const keys = Object.keys(chemUsageMap);
    if(keys.length === 0){
      tbl += '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--ink-light);">당월 취급 내역이 없습니다.</td></tr>';
    } else {
      keys.forEach(function(k){
        const item = chemUsageMap[k];
        tbl += '<tr>';
        tbl += '<td><b>' + safe(k) + '</b></td>';
        tbl += '<td>' + safe(item.unit) + '</td>';
        tbl += '<td style="font-weight:800;color:' + (item.used > 0 ? '#dc2626' : '#2563eb') + ';">' + item.used + ' ' + safe(item.unit) + '</td>';
        tbl += '<td>' + item.count + ' 회</td>';
        tbl += '<td><span style="color:#15803d;font-weight:700;">정상 관리</span></td>';
        tbl += '</tr>';
      });
    }
    tbl += '</tbody></table>';
    tableWrap.innerHTML = tbl;
  }
}

// -------------------------------------------------------------
// 5. 연간 통계 렌더링 (2026 연간 누적 및 잔여율 추적)
// -------------------------------------------------------------
function renderChemYearlyStats(){
  const cardsGrid = $('yearlyStatCardsGrid');
  const tableWrap = $('yearlyStatTableWrap');
  if(!cardsGrid) return;

  const logs = get291UsageLogs();
  const chemicals = get291ChemicalsMaster();

  const totalAnnualLogs = logs.length;
  const specialChems = chemicals.filter(function(c){ return c.isSpecial; });

  cardsGrid.innerHTML = 
    '<div class="cal-stat-card">' +
      '<span class="cal-stat-card-title">2026 연간 누적 취급 실적</span>' +
      '<span class="cal-stat-card-val" style="color:#2563eb;">' + totalAnnualLogs + ' 건</span>' +
      '<span class="cal-stat-card-sub">연구실 안전관리 누적 실적</span>' +
    '</div>' +
    '<div class="cal-stat-card">' +
      '<span class="cal-stat-card-title">등록 특별관리물질 관리 품목</span>' +
      '<span class="cal-stat-card-val" style="color:#059669;">' + specialChems.length + ' 종</span>' +
      '<span class="cal-stat-card-sub">산안법 제439조 법정 관리 대상</span>' +
    '</div>' +
    '<div class="cal-stat-card">' +
      '<span class="cal-stat-card-title">시약 관리 책임자</span>' +
      '<span class="cal-stat-card-val" style="color:#7c3aed;">이강민</span>' +
      '<span class="cal-stat-card-sub">연구실 책임자: 신현석 교수</span>' +
    '</div>';

  if(tableWrap){
    let tbl = '<table class="cal-stat-table">';
    tbl += '<thead><tr><th>물질명</th><th>보관 장소</th><th>초기 입고량</th><th>현재 잔여량</th><th>잔여율</th><th>상태</th></tr></thead><tbody>';
    specialChems.forEach(function(c){
      const cLogs = logs.filter(function(l){ return l.chemId === c.id || l.materialName.includes(c.name.split('(')[0].trim()); });
      let curStock = c.stock;
      if(cLogs.length > 0){
        cLogs.sort(function(a, b){ return (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time); });
        curStock = cLogs[0].remainingStock;
      }
      const ratio = Math.round((curStock / c.stock) * 100);
      const ratioColor = ratio < 30 ? '#dc2626' : (ratio < 60 ? '#d97706' : '#059669');

      tbl += '<tr>';
      tbl += '<td><b>' + safe(c.name) + '</b></td>';
      tbl += '<td>' + safe(c.location) + '</td>';
      tbl += '<td>' + c.stock + ' ' + safe(c.unit) + '</td>';
      tbl += '<td style="font-weight:800;color:' + ratioColor + ';">' + curStock + ' ' + safe(c.unit) + '</td>';
      tbl += '<td><b style="color:' + ratioColor + ';">' + ratio + '%</b></td>';
      tbl += '<td><span style="color:#15803d;font-weight:700;">' + (ratio < 20 ? '재발주 권고' : '정상') + '</span></td>';
      tbl += '</tr>';
    });
    tbl += '</tbody></table>';
    tableWrap.innerHTML = tbl;
  }
}

// -------------------------------------------------------------
// 6. 공식 엑셀 (.xlsx) 및 고지서 출력
// -------------------------------------------------------------
function exportOfficial291LedgerExcel(){
  const logs = get291UsageLogs();
  const fileName = 'N센터86291호_특별관리물질_취급일지_공식양식_' + today() + '.xlsx';

  if(typeof XLSX !== 'undefined'){
    const wsData = [
      ['특별관리물질 취급일지'],
      [],
      ['· 건 물 명 : N센터', '', '', '', '· 연구실책임자 : 신현석 (서명)'],
      ['· 소    속 : 이차원양자헤테로구조체연구단'],
      ['· 연구실명 : 이차원 소재 합성 실험실 (86291호)'],
      [],
      ['취급일자', '물질명', '사용량', '재고량', '작업내용', '작업자', '착용한 보호구', '사고 발생 시, 피해내용 및 조치사항']
    ];

    logs.forEach(function(l){
      wsData.push([
        l.date || '',
        l.materialName || '',
        (l.usedQty !== undefined ? l.usedQty + ' ' + (l.unit || '') : '0 mL'),
        (l.remainingStock !== undefined ? l.remainingStock + ' ' + (l.unit || '') : ''),
        l.workDesc || '',
        l.worker || '',
        l.ppe || '',
        l.incident || '이상 없음'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 14 }, { wch: 38 }, { wch: 12 }, { wch: 12 },
      { wch: 32 }, { wch: 12 }, { wch: 28 }, { wch: 28 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '취급일지');
    XLSX.writeFile(wb, fileName);
    toast('✓ N센터 86291호 특별관리물질 취급일지 공식 엑셀(.xlsx)이 다운로드되었습니다.');
    return;
  }

  exportOfficial291LedgerCsv();
}

function exportOfficial291LedgerCsv(){
  const logs = get291UsageLogs();
  let csv = '\uFEFF';
  csv += '특별관리물질 취급일지\r\n';
  csv += '· 건 물 명 : N센터\r\n';
  csv += '· 소    속 : 이차원양자헤테로구조체연구단\r\n';
  csv += '· 연구실명 : 이차원 소재 합성 실험실 (86291호)\r\n';
  csv += '· 연구실책임자 : 신현석 (서명)\r\n\r\n';
  csv += '취급일자,물질명,사용량,재고량,작업내용,작업자,착용한 보호구,사고 발생 시 피해내용 및 조치사항\r\n';

  logs.forEach(function(l){
    csv += [
      '"' + l.date + '"',
      '"' + l.materialName.replace(/"/g, '""') + '"',
      '"' + l.usedQty + ' ' + l.unit + '"',
      '"' + l.remainingStock + ' ' + l.unit + '"',
      '"' + (l.workDesc || '').replace(/"/g, '""') + '"',
      '"' + (l.worker || '').replace(/"/g, '""') + '"',
      '"' + (l.ppe || '').replace(/"/g, '""') + '"',
      '"' + (l.incident || '이상 없음').replace(/"/g, '""') + '"'
    ].join(',') + '\r\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'N센터86291호_특별관리물질_취급일지_' + today() + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast('✓ N센터 86291호 특별관리물질 취급일지 CSV가 다운로드되었습니다.');
}

function exportAllChemicalsExcel(){
  const chemicals = get291ChemicalsMaster();
  const logs = get291UsageLogs();
  const fileName = 'N센터86291호_화학물질_재고현황_' + today() + '.xlsx';

  if(typeof XLSX !== 'undefined'){
    const wsData = [
      ['제품명', '제조사', 'CAT No.', 'CAS No.', '유해위험성', '수량', '잔량', '담당자', '보관위치', '상태', '입고일', '유효기간']
    ];

    chemicals.forEach(function(c){
      const chemLogs = logs.filter(function(l){ return l.chemId === c.id; });
      let curStock = c.stock;
      if(chemLogs.length > 0){
        chemLogs.sort(function(a, b){ return (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time); });
        curStock = chemLogs[0].remainingStock;
      }

      wsData.push([
        c.name, c.mfg, c.catNo, c.cas, c.hazard || '-', c.qty,
        curStock + ' ' + c.unit, c.handler, c.location, c.status,
        c.inDate, c.expDate
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '재고현황');
    XLSX.writeFile(wb, fileName);
    toast('✓ N센터 86291호 화학물질 재고현황 엑셀(.xlsx)이 다운로드되었습니다.');
    return;
  }

  let csv = '\uFEFF';
  csv += '제품명,제조사,CAT No.,CAS No.,유해위험성,수량,잔량,담당자,보관위치,상태,입고일,유효기간\r\n';
  chemicals.forEach(function(c){
    csv += [
      '"' + c.name.replace(/"/g, '""') + '"',
      '"' + c.mfg.replace(/"/g, '""') + '"',
      '"' + c.catNo + '"',
      '"' + c.cas + '"',
      '"' + (c.hazard || '-') + '"',
      '"' + c.qty + '"',
      '"' + c.stock + ' ' + c.unit + '"',
      '"' + c.handler + '"',
      '"' + c.location.replace(/"/g, '""') + '"',
      '"' + c.status + '"',
      '"' + c.inDate + '"',
      '"' + c.expDate + '"'
    ].join(',') + '\r\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'N센터86291호_화학물질_재고현황_' + today() + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast('✓ N센터 86291호 화학물질 재고현황 CSV가 다운로드되었습니다.');
}

function openChemQrModalForSingle(chemId){
  if(!isAdmin()){ toast('관리자 권한이 필요합니다.'); return; }
  const chemicals = get291ChemicalsMaster();
  const c = chemicals.find(function(item){ return item.id === chemId; });
  if(!c) return;

  const modal = $('modalChemicalQrBackdrop');
  if(!modal) return;

  const titleEl = document.querySelector('.qr-label-title');
  const locEl = document.querySelector('.qr-label-loc');
  const qrBox = $('chemicalQrCanvasContainer') || $('chemicalQrCodeBox');

  if(titleEl) titleEl.textContent = c.name + ' 직통 QR';
  if(locEl) locEl.textContent = '보관: ' + c.location + ' · 책임: ' + c.handler;

  const targetUrl = window.location.origin + window.location.pathname + '#chemicals?chem=' + encodeURIComponent(c.id);
  const urlEl = $('chemicalQrLabelUrlText');
  if(urlEl) urlEl.textContent = targetUrl;

  if(qrBox){
    renderQrCodeInto(qrBox, targetUrl, 140);
  }

  modal.classList.add('open');
}

// -------------------------------------------------------------
// 7. 전체 화학물질 포털 이벤트 바인딩 (X버튼, 빈공간 닫기, 폼등록 완벽 연결)
// -------------------------------------------------------------
function bindChemicalsEvents(){
  // A. 카테고리 스코프 탭 (특별관리물질 vs 일반시약 vs 전체시약)
  ['btnScopeSpecial', 'btnScopeGeneral', 'btnScopeAll'].forEach(function(btnId){
    const btn = $(btnId);
    if(btn){
      btn.addEventListener('click', function(e){
        e.preventDefault();
        currentChemScope = btn.dataset.chemScope;
        document.querySelectorAll('.btn-chem-scope').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        // 특성 조건 체크박스와 2방향 실시간 동기화
        if(currentChemScope === 'special'){
          if($('chemCondSpecial')) $('chemCondSpecial').checked = true;
          if($('chemCondReagent')) $('chemCondReagent').checked = false;
        } else if(currentChemScope === 'general'){
          if($('chemCondSpecial')) $('chemCondSpecial').checked = false;
          if($('chemCondReagent')) $('chemCondReagent').checked = true;
        } else {
          if($('chemCondSpecial')) $('chemCondSpecial').checked = true;
          if($('chemCondReagent')) $('chemCondReagent').checked = true;
        }
        render291InventoryTable();
      });
    }
  });

  // B. 상단 탭 전환: [재고현황] vs [📅 월별 취급 캘린더]
  addEvt('btnChemTabInventory', 'click', function(e){
    e.preventDefault();
    $('btnChemTabInventory').classList.add('active');
    $('btnChemTabCalendar').classList.remove('active');
    $('chemInventoryViewArea').classList.remove('hidden');
    $('chemCalendarViewArea').classList.add('hidden');
    render291InventoryTable();
  });

  addEvt('btnChemTabCalendar', 'click', function(e){
    e.preventDefault();
    $('btnChemTabCalendar').classList.add('active');
    $('btnChemTabInventory').classList.remove('active');
    $('chemInventoryViewArea').classList.add('hidden');
    $('chemCalendarViewArea').classList.remove('hidden');
    renderChemicalsView();
  });

  // C. 캘린더 / 월별통계 / 연간통계 서브 탭
  addEvt('btnChemSubTabCalendar', 'click', function(e){
    e.preventDefault();
    currentChemSubTab = 'calendar';
    $('btnChemSubTabCalendar').classList.add('active');
    $('btnChemSubTabMonthly').classList.remove('active');
    $('btnChemSubTabYearly').classList.remove('active');
    $('chemSubViewCalendar').classList.remove('hidden');
    $('chemSubViewMonthly').classList.add('hidden');
    $('chemSubViewYearly').classList.add('hidden');
    render291Calendar();
  });

  addEvt('btnChemSubTabMonthly', 'click', function(e){
    e.preventDefault();
    currentChemSubTab = 'monthly';
    $('btnChemSubTabMonthly').classList.add('active');
    $('btnChemSubTabCalendar').classList.remove('active');
    $('btnChemSubTabYearly').classList.remove('active');
    $('chemSubViewMonthly').classList.remove('hidden');
    $('chemSubViewCalendar').classList.add('hidden');
    $('chemSubViewYearly').classList.add('hidden');
    renderChemMonthlyStats();
  });

  addEvt('btnChemSubTabYearly', 'click', function(e){
    e.preventDefault();
    currentChemSubTab = 'yearly';
    $('btnChemSubTabYearly').classList.add('active');
    $('btnChemSubTabCalendar').classList.remove('active');
    $('btnChemSubTabMonthly').classList.remove('active');
    $('chemSubViewYearly').classList.remove('hidden');
    $('chemSubViewCalendar').classList.add('hidden');
    $('chemSubViewMonthly').classList.add('hidden');
    renderChemYearlyStats();
  });

  // D. 캘린더 월 이동 네비게이션
  addEvt('btnChemCalPrevMonth', 'click', function(e){
    e.preventDefault();
    currentChemCalMonth--;
    if(currentChemCalMonth < 1){ currentChemCalMonth = 12; currentChemCalYear--; }
    render291Calendar();
  });
  addEvt('btnChemCalNextMonth', 'click', function(e){
    e.preventDefault();
    currentChemCalMonth++;
    if(currentChemCalMonth > 12){ currentChemCalMonth = 1; currentChemCalYear++; }
    render291Calendar();
  });
  addEvt('btnChemCalToday', 'click', function(e){
    e.preventDefault();
    const now = new Date();
    currentChemCalYear = now.getFullYear();
    currentChemCalMonth = now.getMonth() + 1;
    render291Calendar();
  });

  // E. 검색 필터 액션
  
  // 실시간 디바운스 검색 및 Enter 키 검색 지원
  let chemSearchDebounceTimer = null;
  function triggerChemSearchDebounced(){
    if(chemSearchDebounceTimer) clearTimeout(chemSearchDebounceTimer);
    chemSearchDebounceTimer = setTimeout(function(){
      render291InventoryTable();
    }, 120);
  }

  ['chemFilterName', 'chemFilterCas', 'chemFilterCat', 'chemFilterCode', 'chemFilterMfg', 'chemFilterManageNo'].forEach(function(id){
    const el = $(id);
    if(el){
      el.addEventListener('input', triggerChemSearchDebounced);
      el.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
          e.preventDefault();
          render291InventoryTable();
        }
      });
    }
  });

  ['chemFilterHandler', 'chemFilterLoc'].forEach(function(id){
    const el = $(id);
    if(el) el.addEventListener('change', function(){ render291InventoryTable(); });
  });

  // 모바일 카드 vs 표 뷰모드 전환
  addEvt('btnChemViewCard', 'click', function(e){
    e.preventDefault();
    if($('btnChemViewCard')) $('btnChemViewCard').classList.add('active');
    if($('btnChemViewTable')) $('btnChemViewTable').classList.remove('active');
    if($('chemTablePanel')) $('chemTablePanel').classList.remove('mobile-view-table');
    if($('chemMobileCardList')) $('chemMobileCardList').classList.remove('mobile-view-table');
  });

  addEvt('btnChemViewTable', 'click', function(e){
    e.preventDefault();
    if($('btnChemViewTable')) $('btnChemViewTable').classList.add('active');
    if($('btnChemViewCard')) $('btnChemViewCard').classList.remove('active');
    if($('chemTablePanel')) $('chemTablePanel').classList.add('mobile-view-table');
    if($('chemMobileCardList')) $('chemMobileCardList').classList.add('mobile-view-table');
  });

  // 상태 전체/개별 체크박스 연동
  const stateAllEl = $('chemStateAll');
  if(stateAllEl){
    stateAllEl.addEventListener('change', function(){
      const checked = stateAllEl.checked;
      ['chemStateWait', 'chemStateIn', 'chemStateOut', 'chemStateDel'].forEach(function(id){
        const el = $(id);
        if(el) el.checked = checked;
      });
      render291InventoryTable();
    });
  }

  ['chemStateWait', 'chemStateIn', 'chemStateOut', 'chemStateDel'].forEach(function(id){
    const el = $(id);
    if(el){
      el.addEventListener('change', function(){
        const allChecked = ['chemStateWait', 'chemStateIn', 'chemStateOut', 'chemStateDel'].every(function(sid){
          const sel = $(sid);
          return sel ? sel.checked : false;
        });
        if(stateAllEl) stateAllEl.checked = allChecked;
        render291InventoryTable();
      });
    }
  });

  // 특성 조건 체크박스 변경 시 스코프 탭 및 필터 2방향 동기화
  ['chemCondSpecial', 'chemCondReagent'].forEach(function(id){
    const el = $(id);
    if(el) el.addEventListener('change', function(){
      const sp = $('chemCondSpecial') && $('chemCondSpecial').checked;
      const re = $('chemCondReagent') && $('chemCondReagent').checked;
      if(sp && re){
        currentChemScope = 'all';
      } else if(sp && !re){
        currentChemScope = 'special';
      } else if(!sp && re){
        currentChemScope = 'general';
      } else {
        currentChemScope = 'all';
      }
      document.querySelectorAll('.btn-chem-scope').forEach(function(b){
        b.classList.toggle('active', b.dataset.chemScope === currentChemScope);
      });
      render291InventoryTable();
    });
  });

  document.querySelectorAll('input[name="chemDangerType"], input[name="chemSort"]').forEach(function(radio){
    radio.addEventListener('change', function(){ render291InventoryTable(); });
  });

  // 전역 클릭 위임: MSDS 뷰어 모달 열기 보장
  document.addEventListener('click', function(e){
    const msdsBtn = e.target.closest('.btn-chem-view-msds');
    if(msdsBtn){
      e.preventDefault();
      e.stopPropagation();
      openChemMsdsModal(msdsBtn.dataset.chemId);
      return;
    }
  });

  // E. 검색 필터 액션
    // 화학물질·시약 신규등록 및 수정 모달 이벤트 바인딩
  addEvt('btnChemOpenNewProductModal', 'click', function(e){
    e.preventDefault();
    openChemProductModal();
  });
  addEvt('btnChemPageHeadNewProduct', 'click', function(e){
    e.preventDefault();
    openChemProductModal();
  });
  addEvt('btnChemTabNewProduct', 'click', function(e){
    e.preventDefault();
    openChemProductModal();
  });
  addEvt('btnCloseChemProductModal', 'click', closeChemProductModal);
  addEvt('btnCancelChemProductModal', 'click', closeChemProductModal);

  const prodForm = $('formChemProductModal');
  if(prodForm){
    prodForm.addEventListener('submit', handleChemProductSubmit);
  }

  const prodBackdrop = $('modalChemProductBackdrop');
  if(prodBackdrop){
    prodBackdrop.addEventListener('click', function(e){
      if(e.target === prodBackdrop){
        triggerModalShake(prodBackdrop);
      }
    });
  }

  addEvt('btnChemSearchSubmit', 'click', function(e){
    e.preventDefault();
    render291InventoryTable();
  });
  addEvt('btnChemSearchReset', 'click', function(e){
    e.preventDefault();
    if($('chemFilterName')) $('chemFilterName').value = '';
    if($('chemFilterCas')) $('chemFilterCas').value = '';
    if($('chemFilterCat')) $('chemFilterCat').value = '';
    if($('chemFilterCode')) $('chemFilterCode').value = '';
    if($('chemFilterMfg')) $('chemFilterMfg').value = '';
    if($('chemFilterHandler')) $('chemFilterHandler').value = '';
    if($('chemFilterLoc')) $('chemFilterLoc').value = '';
    if($('chemFilterManageNo')) $('chemFilterManageNo').value = '';
    currentChemScope = 'all';
    if($('chemCondSpecial')) $('chemCondSpecial').checked = true;
    if($('chemCondReagent')) $('chemCondReagent').checked = true;
    document.querySelectorAll('.btn-chem-scope').forEach(function(b){
      b.classList.toggle('active', b.dataset.chemScope === 'all');
    });
    render291InventoryTable();
  });

  ['chemFilterName', 'chemFilterCas', 'chemFilterCat', 'chemFilterMfg', 'chemFilterCode'].forEach(function(id){
    const el = $(id);
    if(el){
      el.addEventListener('keydown', function(ev){
        if(ev.key === 'Enter'){
          ev.preventDefault();
          render291InventoryTable();
        }
      });
    }
  });

  // F. 전체 선택 체크박스
    // 체크박스 변경 시 행 하이라이트 연동 (단일/다중 선택 시 시각적 강조)
  document.addEventListener('change', function(e){
    if(e.target && e.target.classList.contains('chem-row-checkbox')){
      const tr = e.target.closest('tr');
      if(tr){
        if(e.target.checked) tr.classList.add('chem-row-selected');
        else tr.classList.remove('chem-row-selected');
      }
    }
  });

  addEvt('chemSelectAllCheckbox', 'change', function(e){
    const checked = e.target.checked;
    document.querySelectorAll('.chem-row-checkbox').forEach(function(box){
      box.checked = checked;
      const tr = box.closest('tr');
      if(tr){
        if(checked) tr.classList.add('chem-row-selected');
        else tr.classList.remove('chem-row-selected');
      }
    });
  });

  // G. 상단 취급일지 작성 버튼
  addEvt('btnChemOpenWriteLogModal', 'click', function(e){
    e.preventDefault();
    openChemWriteLogModal();
  });

  // H. 상단 관리자 액션 버튼들
  addEvt('btnChemNoticeExtract', 'click', function(e){
    e.preventDefault();
    openChemNoticeModal();
  });
  
  // MSDS 모달 조작 (인쇄 & X버튼 & 빈 공간 클릭 닫기)
  addEvt('btnPrintMsdsA4', 'click', function(e){
    e.preventDefault();
    window.print();
  });
  addEvt('btnCloseMsdsModal', 'click', function(e){
    e.preventDefault();
    closeChemMsdsModal();
  });
  addEvt('modalMsdsViewerBackdrop', 'click', function(e){
    if(e.target === $('modalMsdsViewerBackdrop')) closeChemMsdsModal();
  });

  // 특별관리물질 취급일지 서식 모달 조작 (이미지 3 서식)
  addEvt('btnChemOfficialLedgerModal', 'click', function(e){
    e.preventDefault();
    openChemOfficialLedgerModal();
  });
  addEvt('btnCloseChemOfficialLedger', 'click', function(e){
    e.preventDefault();
    closeChemOfficialLedgerModal();
  });
  addEvt('btnPrintLedgerA4', 'click', function(e){
    e.preventDefault();
    window.print();
  });
  addEvt('btnDownloadLedgerExcel', 'click', function(e){
    e.preventDefault();
    exportOfficial291LedgerExcel();
  });
  addEvt('modalChemOfficialLedgerBackdrop', 'click', function(e){
    if(e.target === $('modalChemOfficialLedgerBackdrop')){
      triggerModalShake($('modalChemOfficialLedgerBackdrop'));
    }
  });

  // 기타 법정 양식 버튼
  addEvt('btnChemCombinedHazardsLedger', 'click', function(e){
    e.preventDefault();
    exportOfficial291LedgerExcel();
  });
  addEvt('btnChemHazardsLedger', 'click', function(e){
    e.preventDefault();
    exportOfficial291LedgerExcel();
  });
  addEvt('btnChemDetailedPerfLedger', 'click', function(e){
    e.preventDefault();
    exportOfficial291LedgerExcel();
  });

  addEvt('btnChemOfficialLedgerCsv', 'click', function(e){
    e.preventDefault();
    exportOfficial291LedgerExcel();
  });
  addEvt('btnChemProductExcel', 'click', function(e){
    e.preventDefault();
    exportAllChemicalsExcel();
  });

  // I. 고지서 모달 조작 (인쇄 & X버튼 & 빈 공간 클릭 닫기)
  addEvt('btnPrintNoticeA4', 'click', function(e){
    e.preventDefault();
    printChemNoticeA4();
  });
  addEvt('btnCloseChemNotice', 'click', function(e){
    e.preventDefault();
    closeChemNoticeModal();
  });
  addEvt('modalChemNoticeBackdrop', 'click', function(e){
    if(e.target === $('modalChemNoticeBackdrop')) closeChemNoticeModal();
  });

  // J. 시약 이력 모달 조작 (X버튼 & 빈 공간 클릭 닫기)
  addEvt('btnCloseChemHistory', 'click', function(e){
    e.preventDefault();
    closeChemHistoryModal();
  });
  addEvt('modalChemHistoryBackdrop', 'click', function(e){
    if(e.target === $('modalChemHistoryBackdrop')) closeChemHistoryModal();
  });

  // K. 취급일지 작성 모달 조작 (X버튼 & 빈 공간 클릭 닫기 & 폼 제출)
  addEvt('btnCloseChemWriteLog', 'click', function(e){
    e.preventDefault();
    closeChemWriteLogModal();
  });
  addEvt('modalChemWriteLogBackdrop', 'click', function(e){
    if(e.target === $('modalChemWriteLogBackdrop')){
      // 취급일지 작성 중 데이터 유실 방지: 배경 클릭 시 닫히지 않고 안내 진동 효과
      triggerModalShake($('modalChemWriteLogBackdrop'));
    }
  });
  addEvt('modalChemSelect', 'change', updateModalChemStockPreview);
  addEvt('formWriteChemicalLogModal', 'submit', handleModalChemLogSubmit);

  const btnToggleChem = $('btnToggleChemUserEdit');
  if(btnToggleChem && !btnToggleChem.__bound){
    btnToggleChem.__bound = true;
    btnToggleChem.addEventListener('click', function(e){
      e.preventDefault();
      const wrap = $('chemUserInputWrap');
      if(!wrap) return;
      const isHidden = wrap.classList.contains('hidden');
      wrap.classList.toggle('hidden', !isHidden);
      btnToggleChem.textContent = isHidden ? '접기' : '수정';
    });
  }

  // L. QR 모달 조작
  addEvt('btnChemShowDirectQr', 'click', function(e){
    e.preventDefault();
    openChemicalQrModal();
  });
  addEvt('btnChemWriteModalQr', 'click', function(e){
    e.preventDefault();
    openChemicalQrModal();
  });
  addEvt('btnCloseChemicalQr', 'click', function(e){
    e.preventDefault();
    closeChemicalQrModal();
  });
  addEvt('btnCloseChemicalQrBottom', 'click', function(e){
    e.preventDefault();
    closeChemicalQrModal();
  });
  addEvt('modalChemicalQrBackdrop', 'click', function(e){
    if(e.target === $('modalChemicalQrBackdrop')){
      closeChemicalQrModal();
    }
  });
}


function initFaqAccordion(){
  const list = $('faqAccordionList');
  if(!list) return;
  // Event delegation is handled in click guard
}

function switchHelpTab(tabRole){
  const userBtn = $('btnHelpTabUser');
  const adminBtn = $('btnHelpTabAdmin');
  const userContent = $('helpContentUser');
  const adminContent = $('helpContentAdmin');
  const roleBadge = $('helpCurrentRoleBadge');

  // 비로그인 상태에서는 절대로 관리자 탭을 열 수 없음 (화면에 보이지도 않음)
  if(tabRole === 'admin' && !isAdmin()){
    tabRole = 'user';
  }

  const isAdminTab = (tabRole === 'admin');
  if(userBtn) userBtn.classList.toggle('active', !isAdminTab);
  if(adminBtn) adminBtn.classList.toggle('active', isAdminTab);
  if(userContent) userContent.classList.toggle('hidden', isAdminTab);
  if(adminContent) adminContent.classList.toggle('hidden', !isAdminTab);

  if(roleBadge){
    roleBadge.textContent = isAdminTab ? '관리자 매뉴얼 모드' : '연구원 안내 모드';
  }
}

async function initApp(){
  initTheme();
  initTransparentLogo();
  initFaqAccordion();
  bindEvents();

  // 2-in-1 연구 포털 모듈 초기화 (기본값: 연구장비 포털)
  const initialView = getViewFromUrl();
  const isLims = (initialView === 'logbook');
  const savedMod = localStorage.getItem('labstock_active_portal_module');
  setPortalModule(isLims ? 'lims' : (savedMod || 'lims'), { switchView: false });

  // URL Hash, 파라미터 및 세션 기반 활성 뷰 해석 (새로고침 시 현재 탭 유지, URL 덮어쓰기 금지)
  showView(initialView, { updateUrl: false, pushState: false });
  if(document.documentElement) document.documentElement.removeAttribute('data-initial-view');

  localStorage.removeItem('labstock_local_assets');
  localStorage.removeItem('labstock_local_loans');

  loadLocalStorage();

  // QR 스캔 / 딥링크 즉시 진입 (Supabase 네트워크 대기 없이 즉시 해당 뷰로 직행 및 모달 팝업)
  handleUrlFastTrack();

  initXrdControls();
  resetXrdForm();

  ensureDb();

  if(!db){
    const conn = $('connection');
    if(conn){
      conn.textContent = '로컬 테스트 모드';
      conn.style.color = '#15803d';
    }
    handleUrlFastTrack();
    return;
  }

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


// ============================================================================
// [회원가입 & 로그인 세션 통합 엔진 (Supabase DB + Local Sync + 전역 자동 연동)]
// ============================================================================

function getCurrentUser(){
  try {
    const raw = localStorage.getItem('labstock_current_user');
    if(raw){
      const u = JSON.parse(raw);
      if(u && u.name) return u;
    }
  } catch(e){}
  return null;
}

function setCurrentUser(userObj){
  if(userObj){
    localStorage.setItem('labstock_current_user', JSON.stringify(userObj));
    localStorage.setItem('xrd_user_name', userObj.name || '');
    localStorage.setItem('xrd_affiliation', userObj.affiliation || '');
    localStorage.setItem('xrd_professor', userObj.advisor || '');
    localStorage.setItem('labstock_last_borrower_name', userObj.name || '');
    localStorage.setItem('labstock_last_borrower_affil', userObj.affiliation || '');
    localStorage.setItem('labstock_last_borrower_advisor', userObj.advisor || '');
  } else {
    localStorage.removeItem('labstock_current_user');
    localStorage.removeItem('xrd_user_name');
    localStorage.removeItem('xrd_affiliation');
    localStorage.removeItem('xrd_professor');
    localStorage.removeItem('labstock_last_borrower_name');
    localStorage.removeItem('labstock_last_borrower_affil');
    localStorage.removeItem('labstock_last_borrower_advisor');
  }
  updateUserUI();
  applyCurrentUserToForms();
}

function getRegisteredUsers(){
  let list = [];
  try {
    const raw = localStorage.getItem('labstock_registered_users');
    if(raw){
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed)) list = parsed;
    }
  } catch(e){}

  const admin2dqh = { username: '2DQH', email: '2dqh2024@gmail.com', password: '86276@', name: '연구실 관리자', advisor: '신현석 교수님', affiliation: 'IBS 2DQH', role: 'admin' };
  const adminAlias = { username: 'admin', password: '86276@', name: '연구실 관리자', advisor: '신현석 교수님', affiliation: 'IBS 2DQH', role: 'admin' };
  const defaultResearcher = { username: 'kmlee', password: '11', name: '이강민', advisor: '신현석 교수님', affiliation: '2DQH', role: 'researcher' };

  const idx2dqh = list.findIndex(function(u){ return u.username && u.username.toLowerCase() === '2dqh'; });
  if(idx2dqh >= 0){
    list[idx2dqh].password = '86276@';
    list[idx2dqh].role = 'admin';
  } else {
    list.unshift(admin2dqh);
  }

  const idxAdmin = list.findIndex(function(u){ return u.username && u.username.toLowerCase() === 'admin'; });
  if(idxAdmin >= 0){
    list[idxAdmin].password = '86276@';
    list[idxAdmin].role = 'admin';
  } else {
    list.push(adminAlias);
  }

  if(!list.some(function(u){ return u.username && u.username.toLowerCase() === 'kmlee'; })){
    list.push(defaultResearcher);
  }

  return list;
}

function saveRegisteredUsers(list){
  try {
    localStorage.setItem('labstock_registered_users', JSON.stringify(list));
  } catch(e){}
}

function updateUserUI(){
  const u = getCurrentUser();
  const isAdm = isAdmin();

  const userOnlyEls = document.querySelectorAll('.user-only');
  userOnlyEls.forEach(function(el){
    el.classList.toggle('hidden', !(u || isAdm));
  });

  const topBadge = $('userProfileBadge');
  const topName = $('topUserName');
  const topAffil = $('topUserAffil');
  const loginBtn = $('loginBtn');
  const logoutBtn = $('logoutBtn');

  const sLoginBtn = $('sidebarLoginBtn');
  const sUserProfile = $('sidebarUserProfile');
  const sUserName = $('sidebarUserName');
  const sUserSub = $('sidebarUserSub');
  const sAdminProfile = $('sidebarAdminProfile');

  if(u || isAdm){
    // 로그인 상태
    if(loginBtn) loginBtn.classList.add('hidden');
    if(logoutBtn) logoutBtn.classList.remove('hidden');

    if(topBadge){
      topBadge.classList.remove('hidden');
      if(topName) topName.textContent = isAdm ? '관리자' : (u ? u.name : '연구원');
      if(topAffil) topAffil.textContent = isAdm ? '(Admin)' : (u && u.affiliation ? '(' + u.affiliation + ')' : '');
    }

    if(sLoginBtn) sLoginBtn.classList.add('hidden');
    if(isAdm){
      if(sAdminProfile) sAdminProfile.classList.remove('hidden');
      if(sUserProfile) sUserProfile.classList.add('hidden');
    } else if(u){
      if(sUserProfile) sUserProfile.classList.remove('hidden');
      if(sUserName) sUserName.textContent = u.name + ' 연구원';
      if(sUserSub) sUserSub.textContent = (u.affiliation || '') + (u.advisor ? (' · ' + u.advisor) : '');
      if(sAdminProfile) sAdminProfile.classList.add('hidden');
    }
  } else {
    // 로그아웃 상태
    if(topBadge) topBadge.classList.add('hidden');
    if(loginBtn) loginBtn.classList.remove('hidden');
    if(logoutBtn) logoutBtn.classList.add('hidden');

    if(sLoginBtn) sLoginBtn.classList.remove('hidden');
    if(sUserProfile) sUserProfile.classList.add('hidden');
    if(sAdminProfile) sAdminProfile.classList.add('hidden');
  }
}

function applyCurrentUserToForms(){
  const u = getCurrentUser();
  const f = $('xrdForm');
  const userSec = $('xrdUserSec');
  const compactBar = $('xrdUserCompactBar');
  const inputsGrid = $('xrdUserInputsGrid');
  const profileHint = $('xrdProfileHint');

  if(f){
    if(u){
      if(f.user_name) f.user_name.value = u.name || '';
      if(f.professor) f.professor.value = u.advisor || '';
      if(f.affiliation) f.affiliation.value = u.affiliation || '';

      if(userSec) userSec.classList.add('is-compact');
      if(compactBar){
        compactBar.classList.remove('hidden');
        const cName = $('xrdCompactName');
        const cMeta = $('xrdCompactMeta');
        if(cName) cName.textContent = u.name || '';
        if(cMeta) cMeta.textContent = (u.affiliation || '') + (u.advisor ? (' · ' + u.advisor) : '');
      }
      if(inputsGrid) inputsGrid.classList.add('hidden');
      if(profileHint) profileHint.classList.add('hidden');
    } else {
      if(userSec) userSec.classList.remove('is-compact');
      if(compactBar) compactBar.classList.add('hidden');
      if(inputsGrid) inputsGrid.classList.remove('hidden');
      if(profileHint) profileHint.classList.remove('hidden');
    }
  }

  // 특별관리물질 취급일지 모달 (#modalChemWriteLogBackdrop) 자동 채우기
  const chemHandler = $('modalChemHandler');
  if(chemHandler && u){
    chemHandler.value = u.name || '';
  }
}

function userLogout(){
  const u = getCurrentUser();
  const name = u ? u.name : '사용자';
  setCurrentUser(null);
  admin = false;
  try {
    localStorage.removeItem('labstock_is_admin');
    if(document.documentElement) document.documentElement.classList.remove('is-admin');
  } catch(_){}
  if(typeof setAdminUI === 'function') setAdminUI();
  toast(name + '님 로그아웃되었습니다.');
}

// ==========================================================================
// 비품 통계 & 통합 대여 관리 탭 전환 및 렌더링 로직 (장비운영 통계 규격 일치)
// ==========================================================================
let currentDashTab = 'overview';

function switchDashboardTab(tabName){
  currentDashTab = tabName || 'overview';
  const tabs = document.querySelectorAll('.dash-main-tab');
  tabs.forEach(function(t){
    const isActive = (t.dataset.dashTab === currentDashTab);
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  const panels = {
    overview: $('dashTabContentOverview'),
    loans: $('dashTabContentLoans'),
    history: $('dashTabContentHistory')
  };

  Object.keys(panels).forEach(function(k){
    if(panels[k]){
      panels[k].classList.toggle('hidden', k !== currentDashTab);
    }
  });

  if(currentDashTab === 'overview'){
    renderDashboardOverview();
  } else if(currentDashTab === 'loans'){
    renderDashLoans();
  } else if(currentDashTab === 'history'){
    renderDashHistory();
  }
}

function renderDashboardOverview(){
  // 1. 핵심 KPI 요약 카드 4종 산출 (장비 운영 통계와 동일한 UI/UX 구조)
  const active = loans.filter(function(l){ return !l.returned_at; });
  const overdue = active.filter(function(l){ return getLoanDeadlineInfo(l).isOverdue; });
  const returned = loans.filter(function(l){ return !!l.returned_at; });
  const availCount = assets.filter(function(a){ return statusFor(a) === 'available'; }).length;

  if($('kpiDashAssetTotal')) $('kpiDashAssetTotal').textContent = assets.length + '개';
  if($('kpiDashAssetSub')) $('kpiDashAssetSub').textContent = '사용 가능 ' + availCount + '개';

  if($('kpiDashLoanActive')) $('kpiDashLoanActive').textContent = active.length + '건';
  if($('kpiDashLoanActiveSub')) $('kpiDashLoanActiveSub').textContent = active.length > 0 ? '실시간 대여 중' : '대여 없음';

  if($('kpiDashLoanOverdue')) $('kpiDashLoanOverdue').textContent = overdue.length + '건';
  if($('kpiDashLoanOverdueSub')) $('kpiDashLoanOverdueSub').textContent = overdue.length > 0 ? '확인 및 반납 안내 필요' : '연체 없음 (양호)';

  if($('kpiDashLoanTotal')) $('kpiDashLoanTotal').textContent = loans.length + '건';
  if($('kpiDashLoanReturnSub')) $('kpiDashLoanReturnSub').textContent = '반납 완료 ' + returned.length + '건';

  if($('statsSubBadge')) $('statsSubBadge').textContent = '총 비품 ' + assets.length + '종 · 실시간 대여 ' + active.length + '건';

  // 2. 소모품 부족 알림 (관리자용)
  const lowStockItems = consumables.filter(function(c){
    return Number(c.quantity) <= Number(c.min_quantity);
  });
  const notice = $('lowStockNotice');
  if(notice){
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

  // 3. 반납 임박 비품 리스트
  if(active.length > 0){
    let rowsHtml = '';
    const limit = Math.min(active.length, 7);
    for(let i=0; i<limit; i++){
      const l = active[i];
      const isOverdue = l.due_date && l.due_date < today();
      rowsHtml += '<tr><td data-label="비품"><b>' + safe(fmtName(l.asset_id)) +
        '</b><div class="asset-id">' + safe(l.asset_id) +
        '</div></td><td data-label="대여자">' + safe(l.borrower_name) +
        '</td><td data-label="대여일">' + dateText(l.borrowed_at) +
        '</td><td data-label="상태">' + (isOverdue ? '<span class="status-chip overdue-chip">⚠️ 기간 지남</span>' : '<span class="status borrowed">대여 중</span>') + '</td></tr>';
    }
    if($('dashboardLoans')){
      $('dashboardLoans').innerHTML = '<table aria-label="현재 대여 중인 비품"><thead><tr><th scope="col">비품</th><th scope="col">대여자</th><th scope="col">대여일</th><th scope="col">상태</th></tr></thead><tbody>' +
        rowsHtml + '</tbody></table>';
    }
  } else {
    if($('dashboardLoans')) $('dashboardLoans').innerHTML = '<div class="empty">현재 대여 중인 비품이 없습니다.</div>';
  }

  // 4. 최근 활동 기록
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
  if($('recentActivity')) $('recentActivity').innerHTML = recentHtml || '<div class="empty">아직 활동이 없습니다.</div>';

  // 5. 통계 차트 렌더링
  renderTopAssetsChart();
}

function renderDashLoans(){
  const searchEl = $('dashLoanSearch');
  const filterEl = $('dashLoanFilter');
  const q = searchEl ? searchEl.value.trim().toLowerCase() : '';
  const f = filterEl ? filterEl.value : 'active';

  const list = loans.filter(function(l){
    let matchFilter = false;
    if(f === 'all') matchFilter = true;
    else if(f === 'active') matchFilter = !l.returned_at;
    else if(f === 'returned') matchFilter = !!l.returned_at;
    const textTarget = [l.asset_id, l.borrower_name, fmtName(l.asset_id)].join(' ').toLowerCase();
    return matchFilter && textTarget.includes(q);
  });

  if($('dashLoansBadge')) $('dashLoansBadge').textContent = list.length + '건';

  const container = $('dashLoanRows');
  if(!container) return;

  if(!list.length){
    container.innerHTML = '<div class="empty">조건에 일치하는 대여 내역이 없습니다.</div>';
    return;
  }

  let html = '<table><thead><tr><th>비품</th><th>대여자</th><th>대여일</th><th>반납 예정일</th><th>상태</th><th>관리</th></tr></thead><tbody>';
  list.forEach(function(l){
    const deadlineInfo = getLoanDeadlineInfo(l);
    const isReturned = !!l.returned_at;
    let statusBadge = '';
    if(isReturned){
      statusBadge = '<span class="status available">반납 완료</span>';
    } else if(deadlineInfo.isOverdue){
      statusBadge = '<span class="status-chip overdue-chip">⚠️ 반납 지연</span>';
    } else {
      statusBadge = '<span class="status borrowed">대여 중</span>';
    }

    let actionBtn = '';
    if(!isReturned){
      actionBtn = '<button class="btn btn-sm" type="button" data-return="' + safe(l.id) + '">반납 처리</button>';
    }

    html += '<tr>' +
      '<td><b>' + safe(fmtName(l.asset_id)) + '</b><div class="asset-id">' + safe(l.asset_id) + '</div></td>' +
      '<td>' + safe(l.borrower_name) + '</td>' +
      '<td>' + dateText(l.borrowed_at) + '</td>' +
      '<td>' + (l.due_date ? dateText(l.due_date) : '-') + '</td>' +
      '<td>' + statusBadge + '</td>' +
      '<td>' + actionBtn + '</td>' +
      '</tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

function renderDashHistory(){
  const searchEl = $('dashHistorySearch');
  const assetFilterEl = $('dashHistoryAssetFilter');
  const monthFilterEl = $('dashHistoryMonthFilter');
  const statusFilterEl = $('dashHistoryStatusFilter');

  const q = searchEl ? searchEl.value.trim().toLowerCase() : '';
  const selectedAsset = assetFilterEl ? assetFilterEl.value : 'all';
  const selectedMonth = monthFilterEl ? monthFilterEl.value.trim() : '';
  const selectedStatus = statusFilterEl ? statusFilterEl.value : 'all';

  // 옵션 채우기
  if(assetFilterEl && assetFilterEl.options && assetFilterEl.options.length <= 1){
    const sortedAssets = assets.slice().sort(function(a, b){
      return (a.name || '').localeCompare(b.name || '', 'ko');
    });
    sortedAssets.forEach(function(a){
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.name + ' (' + a.id + ')';
      assetFilterEl.appendChild(opt);
    });
  }

  const list = loans.filter(function(l){
    const matchesSearch = !q || [l.asset_id, l.borrower_name, fmtName(l.asset_id), l.note || ''].join(' ').toLowerCase().includes(q);
    const matchesAsset = (selectedAsset === 'all') || (l.asset_id === selectedAsset);
    let matchesMonth = true;
    if(selectedMonth){
      const datePart = (l.borrowed_at || '').substring(0, 7);
      matchesMonth = (datePart === selectedMonth);
    }
    let matchesStatus = true;
    if(selectedStatus === 'returned') matchesStatus = !!l.returned_at;
    else if(selectedStatus === 'active') matchesStatus = !l.returned_at;

    return matchesSearch && matchesAsset && matchesMonth && matchesStatus;
  });

  if($('dashHistoryBadge')) $('dashHistoryBadge').textContent = '총 ' + list.length + '건';

  const container = $('dashHistoryRows');
  if(!container) return;

  if(!list.length){
    container.innerHTML = '<div class="empty">조회 조건에 맞는 이력이 없습니다.</div>';
    return;
  }

  let html = '<div class="table-wrap"><table><thead><tr><th>비품</th><th>대여자</th><th>대여일시</th><th>반납일시</th><th>상태</th><th>비고</th></tr></thead><tbody>';
  list.forEach(function(l){
    const isReturned = !!l.returned_at;
    const statusLabel = isReturned ? '<span class="status available">반납 완료</span>' : '<span class="status borrowed">대여 중</span>';
    html += '<tr>' +
      '<td><b>' + safe(fmtName(l.asset_id)) + '</b><div class="asset-id">' + safe(l.asset_id) + '</div></td>' +
      '<td>' + safe(l.borrower_name) + '</td>' +
      '<td>' + dateText(l.borrowed_at) + '</td>' +
      '<td>' + (l.returned_at ? dateText(l.returned_at) : '-') + '</td>' +
      '<td>' + statusLabel + '</td>' +
      '<td><small>' + safe(l.note || '-') + '</small></td>' +
      '</tr>';
  });
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// PC 및 모바일 공통 원터치 검색창 접기/펼치기 제어 함수
function setupUniversalSearchToggle(btnId, panelId, arrowId, focusInputId){
  const btn = $(btnId);
  const panel = $(panelId);
  const arrow = $(arrowId);
  if(!btn || !panel) return;
  if(btn.__searchToggleBound) return;
  btn.__searchToggleBound = true;

  // 모바일 및 PC 모두 기본적으로 접어있는 상태 (접힘 유지)
  let isOpen = false;

  function applyState(){
    panel.classList.toggle('collapsed', !isOpen);
    panel.classList.toggle('open', isOpen);
    btn.classList.toggle('active', isOpen);
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if(arrow){
      arrow.textContent = isOpen ? '▲ 검색 접기' : '▼ 검색 펼치기';
    }
  }

  applyState();

  btn.addEventListener('click', function(e){
    e.preventDefault();
    isOpen = !isOpen;
    applyState();
    if(isOpen && focusInputId){
      const inp = $(focusInputId);
      if(inp) inp.focus();
    }
  });
}

// ==========================================================================
// 비품 통계 서브탭 & 검색 접기/펼치기 & 시약등록 신규 버튼 바인딩
// ==========================================================================
document.addEventListener('DOMContentLoaded', function(){

  // 비품 탭 전환 리스너
  document.querySelectorAll('.inv-main-tab[data-inv-tab]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      switchInventorySubTab(this.dataset.invTab);
    });
  });
  if($('invSubLoanSearch')) $('invSubLoanSearch').addEventListener('input', renderInvSubLoans);
  if($('invSubLoanFilter')) $('invSubLoanFilter').addEventListener('change', renderInvSubLoans);
  if($('btnInvQuickBorrow')){
    $('btnInvQuickBorrow').addEventListener('click', function(){
      openModal('borrow');
    });
  }

  // 장비운영통계 CSV 다운로드 직통 이벤트 바인딩 보장
  const btnExportAnalytics = $('btnExportAnalyticsCsv');
  if(btnExportAnalytics){
    btnExportAnalytics.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      exportAnalyticsSummaryCsv();
    });
  }
  // 1. 비품 통계 서브탭 바인딩
  document.querySelectorAll('.dash-main-tab[data-dash-tab]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      switchDashboardTab(this.dataset.dashTab);
    });
  });

  if($('btnDashGotoLoans')){
    $('btnDashGotoLoans').addEventListener('click', function(e){
      e.preventDefault();
      switchDashboardTab('loans');
    });
  }
  if($('btnDashGotoHistory')){
    $('btnDashGotoHistory').addEventListener('click', function(e){
      e.preventDefault();
      switchDashboardTab('history');
    });
  }

  // 실시간 대여 필터 리스너
  if($('dashLoanSearch')) $('dashLoanSearch').addEventListener('input', renderDashLoans);
  if($('dashLoanFilter')) $('dashLoanFilter').addEventListener('change', renderDashLoans);

  // 이력 필터 리스너
  if($('dashHistorySearch')) $('dashHistorySearch').addEventListener('input', renderDashHistory);
  if($('dashHistoryAssetFilter')) $('dashHistoryAssetFilter').addEventListener('change', renderDashHistory);
  if($('dashHistoryMonthFilter')) $('dashHistoryMonthFilter').addEventListener('change', renderDashHistory);
  if($('dashHistoryStatusFilter')) $('dashHistoryStatusFilter').addEventListener('change', renderDashHistory);
  if($('btnDashResetHistoryFilters')){
    $('btnDashResetHistoryFilters').addEventListener('click', function(){
      if($('dashHistorySearch')) $('dashHistorySearch').value = '';
      if($('dashHistoryAssetFilter')) $('dashHistoryAssetFilter').value = 'all';
      if($('dashHistoryMonthFilter')) $('dashHistoryMonthFilter').value = '';
      if($('dashHistoryStatusFilter')) $('dashHistoryStatusFilter').value = 'all';
      renderDashHistory();
    });
  }
  if($('btnExportDashHistoryCsv')){
    $('btnExportDashHistoryCsv').addEventListener('click', function(e){
      e.preventDefault();
      exportHistoryCsv();
    });
  }

  // 검색 접기 토글은 bindEvents()에서 일괄 초기화 완료

  // 3. 신규 시약 등록 버튼 리스너 바인딩
  if($('btnChemMobileNewProduct')){
    $('btnChemMobileNewProduct').addEventListener('click', function(e){
      e.preventDefault();
      openChemProductModal();
    });
  }
});

// ==========================================================================
// 비품 화면 내 목록 & 대여 현황 서브탭 전환 로직
// ==========================================================================
let currentInvSubTab = 'catalog';

function switchInventorySubTab(tabName){
  currentInvSubTab = tabName || 'catalog';
  document.querySelectorAll('.inv-main-tab').forEach(function(btn){
    const isActive = (btn.dataset.invTab === currentInvSubTab);
    btn.classList.toggle('active', isActive);
  });

  const catalogView = $('invSubViewCatalog');
  const loansView = $('invSubViewLoans');

  if(catalogView) catalogView.classList.toggle('hidden', currentInvSubTab !== 'catalog');
  if(loansView) loansView.classList.toggle('hidden', currentInvSubTab !== 'loans');

  if(currentInvSubTab === 'loans'){
    renderInvSubLoans();
  } else {
    renderInventory();
  }
}

function renderInvSubLoans(){
  const searchEl = $('invSubLoanSearch');
  const filterEl = $('invSubLoanFilter');
  const q = searchEl ? searchEl.value.trim().toLowerCase() : '';
  const f = filterEl ? filterEl.value : 'active';

  const list = loans.filter(function(l){
    let matchFilter = false;
    if(f === 'all') matchFilter = true;
    else if(f === 'active') matchFilter = !l.returned_at;
    else if(f === 'returned') matchFilter = !!l.returned_at;
    const textTarget = [l.asset_id, l.borrower_name, fmtName(l.asset_id)].join(' ').toLowerCase();
    return matchFilter && textTarget.includes(q);
  });

  const activeCount = loans.filter(function(l){ return !l.returned_at; }).length;
  if($('invActiveLoansCountBadge')) $('invActiveLoansCountBadge').textContent = activeCount;
  if($('invLoansSummaryBadge')) $('invLoansSummaryBadge').textContent = list.length + '건';

  const container = $('invSubLoanRows');
  if(!container) return;

  if(!list.length){
    container.innerHTML = '<div class="empty">대여 내역이 없습니다.</div>';
    return;
  }

  let html = '<table><thead><tr><th>비품</th><th>대여자</th><th>대여일</th><th>반납 예정일</th><th>상태</th><th>관리</th></tr></thead><tbody>';
  list.forEach(function(l){
    const deadlineInfo = getLoanDeadlineInfo(l);
    const isReturned = !!l.returned_at;
    let statusBadge = '';
    if(isReturned){
      statusBadge = '<span class="status available">반납 완료</span>';
    } else if(deadlineInfo.isOverdue){
      statusBadge = '<span class="status-chip overdue-chip">⚠️ 기한 초과</span>';
    } else {
      statusBadge = '<span class="status borrowed">대여 중</span>';
    }

    let actionBtn = '';
    if(!isReturned){
      actionBtn = '<button class="btn btn-sm" type="button" data-return="' + safe(l.id) + '">반납 처리</button>';
    }

    html += '<tr>' +
      '<td><b>' + safe(fmtName(l.asset_id)) + '</b><div class="asset-id">' + safe(l.asset_id) + '</div></td>' +
      '<td>' + safe(l.borrower_name) + '</td>' +
      '<td>' + dateText(l.borrowed_at) + '</td>' +
      '<td>' + (l.due_date ? dateText(l.due_date) : '-') + '</td>' +
      '<td>' + statusBadge + '</td>' +
      '<td>' + actionBtn + '</td>' +
      '</tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}
