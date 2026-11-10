
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
    image: 'img/equipment/smartlab_xrd.jpg',
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
    image: 'img/equipment/jeol_tem.jpg',
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
    image: 'img/equipment/bruker_afm.jpg',
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
    image: 'img/equipment/ebeam_evap.jpg',
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
    image: 'img/equipment/sputter_system.jpg',
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
    image: 'img/equipment/uhv_sputter.jpg',
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
    image: 'img/equipment/wire_bonder.jpg',
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
let researchEquipments = [];
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
  }
};

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

  const SESS_EQUIP_DATA_VER = '20261109_sess_aqt_v5_bonder_img';
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
  const isAdm = isAdmin();
  try {
    if(isAdm){
      localStorage.setItem('labstock_is_admin', 'true');
      if(document.documentElement) document.documentElement.classList.add('is-admin');
    } else {
      localStorage.removeItem('labstock_is_admin');
      if(document.documentElement) document.documentElement.classList.remove('is-admin');
    }
  } catch(_){}

  if(document.body) document.body.classList.toggle('is-admin', isAdm);
  if($('loginBtn')) $('loginBtn').classList.toggle('hidden', isAdm);
  if($('logoutBtn')) $('logoutBtn').classList.toggle('hidden', !isAdm);

  if($('sidebarLoginBtn')) $('sidebarLoginBtn').classList.toggle('hidden', isAdm);
  if($('sidebarAdminProfile')) $('sidebarAdminProfile').classList.toggle('hidden', !isAdm);

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
      // 1. 범용 연구장비 세션 (equipment_sessions) 동기화
      try {
        const { data: remoteSessions, error: sessErr } = await db.from('equipment_sessions').select('*').order('used_on', { ascending: false });
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
}

// ==========================================
// [소모품 및 시약 목록 모듈]
// ==========================================
const CONSUMABLE_CATEGORIES = [
  '자주찾는 소모품',
  '시약',
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
        cat === '시약' ? '🧪' :
        cat === '보호구' ? '🧤' :
        cat === '배관·테이프' ? '🔧' : '📦'
      );
      const isReagent = isReagentCategory(cat);
      const isActive = (selected === cat) || (cat === '시약' && (selected === '시약·화학' || selected === '화학·시약')) || (cat === '보호구' && selected === '보호·클린룸');
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
    } else if(selectedConsumableCategory === '자주찾는 소모품'){
      // 기본 화면: 일상 핵심 소모품만 노출 (시약 제외)
      matchCategory = !isReagentCategory(c.category);
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
    modeTitle.textContent = m === 'start' ? 'Start session (세션 시작)' : (xrdFinishing ? 'Finish session (세션 종료)' : (xrdEditId ? 'Edit log (수정)' : 'Log finished session (완료 일지 직접 입력)'));
  }
  const modeLink = $('xrdModeLink');
  if(modeLink){
    modeLink.textContent = m === 'start' ? 'Log finished session (완료 일지 작성) →' : '← Back';
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
function openEquipmentQrModal(eqId){
  if(!isAdmin()){
    toast('장비 본체 부착용 QR 관리는 관리자 전용 기능입니다.');
    return;
  }
  eqId = eqId || currentSelectedEquipment || 'EQ-XRD-01';
  const eq = researchEquipments.find(function(e){ return e.id === eqId; }) || {
    id: 'EQ-XRD-01', code: 'HR-XRD', name: 'HR-XRD (고분해능 X선 회절분석기)', model: 'SmartLab / Rigaku', location: 'IBS 2DQH XRD실'
  };

  const modal = $('modalEquipmentQrBackdrop');
  if(!modal) return;

  const titleEl = $('qrLabelEquipName');
  const modelEl = $('qrLabelEquipModel');
  const urlEl = $('qrLabelUrlText');
  const container = $('equipmentQrCanvasContainer');

  if(titleEl) titleEl.textContent = eq.name;
  if(modelEl) modelEl.textContent = (eq.model || '') + ' · ' + (eq.location || '');

  // 생성될 직행 URL (HTTPS origin + 경로 + 해시 쿼리)
  const targetUrl = window.location.origin + window.location.pathname + '#logbook?eq=' + encodeURIComponent(eq.id) + '&action=quick_start';
  if(urlEl) urlEl.textContent = targetUrl;

  if(container){
    container.innerHTML = '';
    if(window.QRCode){
      new QRCode(container, {
        text: targetUrl,
        width: 180,
        height: 180,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      const img = document.createElement('img');
      img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(targetUrl);
      img.alt = 'QR Code';
      img.style.width = '180px';
      img.style.height = '180px';
      img.style.display = 'block';
      img.style.margin = '0 auto';
      container.appendChild(img);
    }
  }

  modal.classList.add('open');
}

function closeEquipmentQrModal(){
  const modal = $('modalEquipmentQrBackdrop');
  if(modal) modal.classList.remove('open');
}

function downloadEquipmentQrImage(){
  const container = $('equipmentQrCanvasContainer');
  if(!container) return;
  const canvas = container.querySelector('canvas');
  const img = container.querySelector('img');

  if(canvas){
    const a = document.createElement('a');
    a.download = 'HR-XRD_QR_Label.png';
    a.href = canvas.toDataURL('image/png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('✓ HR-XRD QR 라벨 이미지가 다운로드되었습니다.');
  } else if(img){
    const a = document.createElement('a');
    a.download = 'HR-XRD_QR_Label.png';
    a.href = img.src;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('✓ HR-XRD QR 라벨 이미지를 저장합니다.');
  } else {
    toast('QR 코드 이미지를 찾을 수 없습니다.');
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
    html += '<div style="margin-bottom:14px;padding:10px 14px;background:var(--card-subtle, #f8fafc);border-radius:8px;border:1px solid var(--border);display:flex;flex-wrap:wrap;gap:12px;font-size:12.5px;color:var(--ink-light);">';
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
  const currentEq = researchEquipments.find(function(e){ return e.id === currentSelectedEquipment; }) || {
    id: 'EQ-' + code, code: code, name: code
  };
  code = currentEq.code || code || 'AFM';
  const schema = EQUIPMENT_SCHEMAS[code] || EQUIPMENT_SCHEMAS['AFM'];

  const modal = $('modalTestDriveBackdrop');
  if(!modal) return;

  const titleEl = $('testDriveModalTitle');
  if(titleEl) titleEl.textContent = '📝 ' + currentEq.name + ' 사용 기록 작성';

  const container = $('testDriveFormDynamicContent');
  if(!container) return;

  const now = new Date();
  const defTime = pad(now.getHours()) + ':' + pad(now.getMinutes());
  const storedUser = localStorage.getItem('xrd_user_name') || '';
  const storedAffil = localStorage.getItem('xrd_affiliation') || '2DQH';
  const storedProf = localStorage.getItem('xrd_professor') || '신현석 교수님';

  let formHtml = '';

  // 1. 공통 필수 메타데이터 (시간, 사용자, 샘플)
  formHtml += '<div style="background:var(--bg);padding:12px;border-radius:8px;margin-bottom:14px;border:1px solid var(--border);">';
  formHtml += '<h4 style="margin:0 0 10px;font-size:13px;color:var(--ink);">📅 기본 세션 정보</h4>';
  formHtml += '<div class="xrd-grid xrd-c3" style="margin-bottom:8px;">';
  formHtml += '  <label class="xrd-mini">측정 날짜<input name="used_on" type="date" value="' + today() + '" required></label>';
  formHtml += '  <label class="xrd-mini">시작 시간<input name="start_time" type="time" value="' + defTime + '" required></label>';
  formHtml += '  <label class="xrd-mini">가동 시간(분)<input name="duration_min" type="number" min="5" step="5" value="60" required></label>';
  formHtml += '</div>';
  formHtml += '<div class="xrd-grid xrd-c3">';
  formHtml += '  <label class="xrd-mini">사용자 이름<input name="user_name" value="' + safe(storedUser) + '" placeholder="사용자 성명" required></label>';
  formHtml += '  <label class="xrd-mini">소속 연구실<input name="affiliation" value="' + safe(storedAffil) + '" placeholder="e.g. 2DQH"></label>';
  formHtml += '  <label class="xrd-mini">지도교수<input name="professor" value="' + safe(storedProf) + '" placeholder="e.g. 신현석 교수님"></label>';
  formHtml += '</div>';
  formHtml += '</div>';

  // 2. 샘플 정보
  formHtml += '<div style="background:var(--bg);padding:12px;border-radius:8px;margin-bottom:14px;border:1px solid var(--border);">';
  formHtml += '<h4 style="margin:0 0 10px;font-size:13px;color:var(--ink);">🧪 샘플 및 공정 정보</h4>';
  formHtml += '<div class="xrd-grid xrd-c2" style="margin-bottom:8px;">';
  formHtml += '  <label class="xrd-full">샘플명 / 공정명<input name="sample_name" placeholder="e.g. WS2 monolayer on SiO2" required></label>';
  formHtml += '  <label class="xrd-mini">샘플 수량<select name="sample_count"><option value="1" selected>1개</option><option value="2">2개</option><option value="3">3개</option><option value="4">4개</option><option value="5">5개 이상</option></select></label>';
  formHtml += '</div>';

  if(schema.scanTypes && schema.scanTypes.length){
    formHtml += '<label class="xrd-mini" style="display:block;margin-top:6px;">측정 / 스캔 모드<select name="scan_type">';
    schema.scanTypes.forEach(function(st){
      formHtml += '<option value="' + safe(st) + '">' + safe(st) + '</option>';
    });
    formHtml += '</select></label>';
  }
  formHtml += '</div>';

  // 3. 장비 고유 파라미터 (Dynamic Readings & Options)
  formHtml += '<div style="background:var(--bg);padding:12px;border-radius:8px;margin-bottom:14px;border:1px solid var(--border);">';
  formHtml += '<h4 style="margin:0 0 10px;font-size:13px;color:var(--primary);">⚡ ' + safe(schema.name) + ' 고유 측정 파라미터</h4>';

  if(schema.readings && schema.readings.length){
    formHtml += '<div class="xrd-grid xrd-c2" style="margin-bottom:10px;">';
    schema.readings.forEach(function(r){
      formHtml += '<label class="xrd-mini">' + safe(r.label) + ' (' + safe(r.unit) + ')';
      formHtml += '<div class="xrd-input-wrap">';
      formHtml += '<input name="param_reading_' + safe(r.key) + '" type="number" step="' + (r.step || 'any') + '" placeholder="' + (r.placeholder || '') + '" value="' + (r.placeholder || '') + '">';
      formHtml += '<span class="xrd-unit">' + safe(r.unit) + '</span>';
      formHtml += '</div></label>';
    });
    formHtml += '</div>';
  }

  if(schema.options && schema.options.length){
    formHtml += '<div class="xrd-grid xrd-c2" style="margin-bottom:10px;">';
    schema.options.forEach(function(opt){
      formHtml += '<label class="xrd-mini">' + safe(opt.label);
      formHtml += '<select name="param_opt_' + safe(opt.key) + '">';
      opt.choices.forEach(function(c){
        const sel = (c === opt.default) ? ' selected' : '';
        formHtml += '<option value="' + safe(c) + '"' + sel + '>' + safe(c) + '</option>';
      });
      formHtml += '</select></label>';
    });
    formHtml += '</div>';
  }

  // 4. SOP 체크리스트
  if(schema.checks && schema.checks.length){
    formHtml += '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);">';
    formHtml += '<b style="font-size:12px;color:var(--ink);display:block;margin-bottom:6px;">✅ SOP 안전 점검</b>';
    schema.checks.forEach(function(chk){
      formHtml += '<label style="display:flex;align-items:center;gap:8px;font-size:12.5px;margin-bottom:6px;cursor:pointer;">';
      formHtml += '<input type="checkbox" name="param_chk_' + safe(chk.key) + '" checked> ' + safe(chk.label);
      formHtml += '</label>';
    });
    formHtml += '</div>';
  }
  formHtml += '</div>';

  // 5. 메모
  formHtml += '<label class="xrd-mini" style="display:block;">비고 / 특이사항 (Memo)<textarea name="memo" rows="2" placeholder="측정 상태 및 특이사항 입력" style="width:100%;box-sizing:border-box;margin-top:4px;border:1px solid var(--border);border-radius:6px;padding:8px;font-size:13px;background:var(--card);color:var(--ink);"></textarea></label>';

  container.innerHTML = formHtml;
  modal.classList.add('open');
}

function closeEquipmentTestDrive(){
  const modal = $('modalTestDriveBackdrop');
  if(modal) modal.classList.remove('open');
}

async function handleTestDriveFormSubmit(e){
  e.preventDefault();
  const f = $('testDriveForm');
  if(!f) return;

  const currentEq = researchEquipments.find(function(eq){ return eq.id === currentSelectedEquipment; }) || {
    id: 'EQ-UNKNOWN', code: 'EQUIP'
  };
  const code = currentEq.code || 'AFM';
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
    equipment_id: currentEq.id,
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
      const payload = {
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
      const { data: inserted, error: insertErr } = await db.from('equipment_sessions').insert(payload).select();
      if(!insertErr && inserted && inserted[0]){
        sessionEntry.id = inserted[0].id;
        try { localStorage.setItem('labstock_equipment_sessions', JSON.stringify(equipmentSessions)); } catch(_) {}
      } else if(insertErr){
        console.warn('Supabase equipment_sessions insert fallback:', insertErr);
      }
    } catch(err){
      console.warn('Supabase equipment_sessions insert fallback:', err);
    }
  }

  closeEquipmentTestDrive();
  toast('✓ ' + currentEq.name + ' 사용 기록이 저장되었습니다.');
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
  if($('eqSecondaryCountBadge')) $('eqSecondaryCountBadge').textContent = cntAll + '대 보유';

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
    const isActive = (eq.status === 'active' || isXrd || isBonder);

    let actionBtnText = '📖 전자 로그북 열기';
    if(isXrd){
      actionBtnText = '📖 HR-XRD 전자 로그북 열기';
    } else if(isBonder){
      actionBtnText = '📖 Wire Bonder 전자 로그북 열기';
    } else if(isActive){
      actionBtnText = '📖 ' + safe(eq.code) + ' 전자 로그북 열기';
    }

    const actionBtnHtml = '<button type="button" class="btn btn-compact-view' + (isActive ? ' btn-view-active' : '') + '" data-select-eq="' + safe(eq.id) + '"' + (isActive ? ' style="background:#2563eb;color:#fff;border-color:#2563eb;font-weight:700;"' : '') + '>' + actionBtnText + '</button>';
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if(descEl) descEl.textContent = '전체 10대 연구장비 통합 운영 관리 오버뷰';
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
  renderEquipmentAnalyticsOverview(targetSessions, allSessions);

  // 4. 월간 가동 캘린더 렌더링 (선택된 스코프의 세션 전달)
  renderEquipmentCalendar(targetSessions);

  // 5. 최근 통합 타임라인 피드 렌더링 (선택된 스코프의 세션 전달)
  renderEquipmentRecentTimeline(targetSessions);
}

function renderEquipmentAnalyticsOverview(targetSessions, allSessions){
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
  targetSessions.forEach(function(s){
    const aff = s.affiliation || '2DQH';
    affilCounts[aff] = (affilCounts[aff] || 0) + (s.sample_count || 1);
    if(s.sample_name){
      sampleCounts[s.sample_name] = (sampleCounts[s.sample_name] || 0) + (s.sample_count || 1);
    }
  });

  const sortedAffils = Object.keys(affilCounts).sort(function(a, b){ return affilCounts[b] - affilCounts[a]; });
  const sortedSamples = Object.keys(sampleCounts).sort(function(a, b){ return sampleCounts[b] - sampleCounts[a]; });
  const totalSamplesAll = targetSessions.reduce(function(a, c){ return a + (c.sample_count || 1); }, 0);

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
  // 2. [전체 연구장비 통합 모드]: 전체 10대 장비 운용 관리 오버뷰 테이블
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
      '<span style="font-size:12px;color:var(--ink-light);">전체 10대 장비 기간 실적 및 최다 측정처 요약</span>' +
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
            '<td colspan="2">전체 10대 장비 기간 합계</td>' +
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
  const allSessions = getUnifiedEquipmentSessions();
  const isAll = (selectedAnalyticsEquipmentId === 'all');
  const selectedEq = isAll ? null : researchEquipments.find(function(e){ return e.id === selectedAnalyticsEquipmentId; });

  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const lines = [];
  const periodLabel = selectedAnalyticsPeriod === 'week' ? '주간' : (selectedAnalyticsPeriod === 'month' ? '월별' : '연간');
  const monthWeeks = getMonthWeeks(currentCalendarYear, currentCalendarMonth);
  let curWeek = null;
  if(timelineDateFilter){
    curWeek = monthWeeks.find(function(w){ return timelineDateFilter >= w.startDate && timelineDateFilter <= w.endDate; });
  }
  if(!curWeek){
    curWeek = monthWeeks.find(function(w){ return today() >= w.startDate && today() <= w.endDate; }) || monthWeeks[0];
  }

  const periodDesc = selectedAnalyticsPeriod === 'week'
    ? (currentCalendarYear + '년 ' + currentCalendarMonth + '월 ' + curWeek.label)
    : (selectedAnalyticsPeriod === 'month' ? (currentCalendarYear + '년 ' + currentCalendarMonth + '월') : (currentCalendarYear + '년 연간'));

  let filename = '2DQH_연구장비_운영통계_' + periodLabel + '_' + today() + '.csv';

  // 세션 스코프 필터링
  const targetSessions = isAll ? allSessions : allSessions.filter(function(s){
    return s.equipment_id === selectedAnalyticsEquipmentId || (selectedEq && s.equipment_code === selectedEq.code);
  });

  // 기간별 세션 추출
  let periodSessions = [];
  if(selectedAnalyticsPeriod === 'week'){
    periodSessions = targetSessions.filter(function(s){
      const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
      return d >= curWeek.startDate && d <= curWeek.endDate;
    });
  } else if(selectedAnalyticsPeriod === 'month'){
    const currentMonthStr = currentCalendarYear + '-' + pad(currentCalendarMonth);
    periodSessions = targetSessions.filter(function(s){
      const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
      return d.startsWith(currentMonthStr);
    });
  } else {
    const yrStr = String(currentCalendarYear);
    periodSessions = targetSessions.filter(function(s){
      const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
      return d.startsWith(yrStr);
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
  lines.push('"보고서 생성일시: ' + today() + '","분석 기준 주기: ' + periodLabel + ' 통계 (' + periodDesc + ')","대상: ' + (isAll ? '전체 10대 연구장비 통합' : (selectedEq.name + ' [' + selectedEq.code + ']')) + '"');
  lines.push('""');

  // ====================================================
  // 1. 전체 장비 총괄 운영 서머리
  // ====================================================
  lines.push('"[1. 연구장비 총괄 운영 서머리]"');
  lines.push('"항목","통계 집계 수치"');
  lines.push('"대상 연구장비","' + (isAll ? (researchEquipments.length + '대 통합 운영') : selectedEq.name) + '"');
  lines.push('"분석 기준 기간","' + periodDesc + ' (' + periodLabel + ')"');
  lines.push('"총 분석·가동 건수","' + periodSessions.length + '건 (전체 누적 ' + targetSessions.length + '건)"');
  lines.push('"총 가동시간 (시간)","' + (grandPeriodMins / 60).toFixed(1) + '시간"');
  lines.push('"총 가동시간 (분)","' + grandPeriodMins.toLocaleString() + '분"');
  lines.push('"총 측정 시료수","' + grandPeriodSamples + '개"');
  lines.push('"참여 연구원 수","' + userSet.size + '명"');
  lines.push('"최다 분석처 (소속)","' + topAffilOverall + '"');
  lines.push('""');

  // ====================================================
  // 2. 장비별 분석 실적 및 운영 현황 (핵심 필드만 깔끔하게 정돈)
  // ====================================================
  lines.push('"[2. 연구장비별 분석 실적 및 가동 현황]"');
  lines.push([
    '장비코드',
    '장비명',
    '설치위치',
    '운영상태',
    '분석·가동건수',
    '가동시간(h)',
    '가동(분)',
    '가동비중(%)',
    '측정시료수',
    '최다 분석처 (비중)',
    '주요 사용자'
  ].map(function(c){ return '"' + c + '"'; }).join(','));

  const targetEquipList = isAll ? researchEquipments : [selectedEq].filter(Boolean);

  targetEquipList.forEach(function(eq){
    const eqSessions = allSessions.filter(function(s){
      return s.equipment_id === eq.id || s.equipment_code === eq.code;
    });

    let pSessions = [];
    if(selectedAnalyticsPeriod === 'week'){
      pSessions = eqSessions.filter(function(s){
        const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
        return d >= curWeek.startDate && d <= curWeek.endDate;
      });
    } else if(selectedAnalyticsPeriod === 'month'){
      const currentMonthStr = currentCalendarYear + '-' + pad(currentCalendarMonth);
      pSessions = eqSessions.filter(function(s){
        const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
        return d.startsWith(currentMonthStr);
      });
    } else {
      const yrStr = String(currentCalendarYear);
      pSessions = eqSessions.filter(function(s){
        const d = normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : ''));
        return d.startsWith(yrStr);
      });
    }

    let pMins = 0;
    let pSamples = 0;
    const eqAffMap = {};
    const eqUserMap = {};

    pSessions.forEach(function(s){
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
        const pct = pSamples > 0 ? Math.round((eqAffMap[a] / pSamples) * 100) : 0;
        topEqAff = a + ' (' + maxA + '개, ' + pct + '%)';
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
      pSessions.length,
      (pMins / 60).toFixed(1),
      pMins,
      pctOfGrand + '%',
      pSamples,
      topEqAff,
      userSummary
    ].map(formatCsvCell).join(','));
  });

  if(isAll){
    lines.push([
      '합계(TOTAL)',
      '10대 연구장비 통합 총계',
      '2DQH 연구단',
      '정상 가동',
      periodSessions.length,
      (grandPeriodMins / 60).toFixed(1),
      grandPeriodMins,
      '100%',
      grandPeriodSamples,
      topAffilOverall,
      Array.from(userSet).slice(0, 3).join(', ') + (userSet.size > 3 ? ' 외 ' + (userSet.size - 3) + '명' : '')
    ].map(formatCsvCell).join(','));
  }
  lines.push('""');

  // ====================================================
  // 3. 소속/연구실별 측정 비중 (어디에서 많이 찍었는지)
  // ====================================================
  lines.push('"[3. 소속/연구실별 측정 비중 요약 (어디에서 가장 많이 찍었는지)]"');
  lines.push(['순위', '소속/연구실명', '측정 시료수(개)', '측정 비중(%)'].map(function(c){ return '"' + c + '"'; }).join(','));

  const sortedAffils = Object.keys(affilMap).sort(function(a, b){ return affilMap[b] - affilMap[a]; });
  if(sortedAffils.length > 0){
    sortedAffils.forEach(function(af, idx){
      const cnt = affilMap[af];
      const pct = grandPeriodSamples > 0 ? Math.round((cnt / grandPeriodSamples) * 100) : 0;
      lines.push([
        (idx + 1) + '위',
        af,
        cnt,
        pct + '%'
      ].map(formatCsvCell).join(','));
    });
  } else {
    lines.push(['-', '측정 기록 없음', 0, '0%'].map(formatCsvCell).join(','));
  }
  lines.push('""');

  // ====================================================
  // 4. 최근 개별 가동 세션 상세 내역
  // ====================================================
  lines.push('"[4. 최근 개별 가동 세션 상세 내역]"');
  lines.push([
    '사용일자',
    '시작시간',
    '장비명',
    '장비코드',
    '사용자',
    '소속/연구실',
    '책임교수',
    '가동시간(분)',
    '측정시료',
    '시료수',
    '측정목적'
  ].map(function(c){ return '"' + c + '"'; }).join(','));

  periodSessions.slice(0, 50).forEach(function(s){
    lines.push([
      normalizeExportDate(s.used_on || (s.created_at ? s.created_at.slice(0, 10) : '')),
      s.start_time || '10:00',
      s.equipment_name || s.equipment_code || '연구장비',
      s.equipment_code || '',
      s.user_name || '연구원',
      s.affiliation || '2DQH',
      s.professor || '',
      s.duration_min || 0,
      s.sample_name || '',
      s.sample_count || 1,
      s.purpose || s.scan_type || '연구장비 가동'
    ].map(formatCsvCell).join(','));
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
  toast('✓ ' + filename + ' 운영통계 CSV 파일이 다운로드되었습니다.');
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
    html += '  <div style="font-size:11.5px;color:var(--ink-light);margin-top:4px;">💡 달력에서 특정 일자(배지가 있는 날짜)를 클릭하면 해당 일자의 사용자 및 상세 측정 내역을 바로 확인할 수 있습니다.</div>';
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
    '[전체 10대 장비 종합 합계]',
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

  const selected = researchEquipments.find(function(e){ return e.id === currentSelectedEquipment; }) || researchEquipments[0];

  const catBadge = $('detailEqCategory');
  const statusBadge = $('detailEqStatus');
  const titleEl = $('detailEqPageTitle');
  const countBadge = $('logbookCountBadge');

  const isXrd = (selected.type === 'xrd' || selected.code === 'XRD');
  const isBonder = (selected.code === 'WireBonder');
  const isActive = (selected.status === 'active' || isXrd || isBonder);

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

  window.scrollTo({ top: 0, behavior: 'smooth' });
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

function exportEquipmentLogsCsv(){
  const selected = researchEquipments.find(function(e){ return e.id === currentSelectedEquipment; });
  if(selected && (selected.type === 'xrd' || selected.code === 'XRD')){
    exportXrdLogsCsv();
  } else {
    exportGeneralEquipmentLogsCsv();
  }
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
  if(assetFilterEl && assetFilterEl.options.length <= 1){
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
  } else {
    parts.push('<label class="field">관리자 이메일<input name="email" type="email" required autocomplete="username"></label>');
    parts.push('<label class="field" style="margin-top:12px">비밀번호<input name="password" type="password" required autocomplete="current-password"></label>');
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
  } else {
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
  window.__isPromptingReturnBeforeBorrow = false;
  window.__pendingBorrowAssetId = null;
  window.__bypass24hPrompt = false;

  const bd = $('modalBackdrop');
  if(bd) bd.classList.remove('open');
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
    // 로컬스토리지 잔여 Supabase auth 토큰 캐시 확실히 정리
    try {
      for(let i = localStorage.length - 1; i >= 0; i--){
        const key = localStorage.key(i);
        if(key && (key.startsWith('sb-') || key.includes('auth-token') || key === 'supabase.auth.token')){
          localStorage.removeItem(key);
        }
      }
    } catch(e){}

    setAdminUI();
    // 관리자 전용 화면에 머물고 있을 경우 즉시 비품 현황으로 복귀
    const currentView = document.querySelector('.view.active');
    if(currentView && (currentView.id === 'view-history' || currentView.id === 'view-dashboard' || currentView.classList.contains('admin-only'))){
      showView('inventory');
    }
    closeMobileDrawer();
    toast('로그아웃되었습니다.');
    render();
  }
}

// ==========================================
// [모바일 슬라이드 아웃 서랍(Drawer) 제어]
// ==========================================
function openMobileDrawer(){
  const sidebar = $('mainSidebar');
  const overlay = $('mobileDrawerOverlay');
  if(sidebar) sidebar.classList.add('drawer-open');
  if(overlay) overlay.classList.add('active');
  document.body.classList.add('drawer-locked');
}

function closeMobileDrawer(){
  const sidebar = $('mainSidebar');
  const overlay = $('mobileDrawerOverlay');
  if(sidebar) sidebar.classList.remove('drawer-open');
  if(overlay) overlay.classList.remove('active');
  document.body.classList.remove('drawer-locked');
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

  // 모바일 드로어 오버레이 클릭/터치 시 즉시 닫기
  addEvt('mobileDrawerOverlay', 'click', closeMobileDrawer);
  addEvt('mobileDrawerOverlay', 'touchstart', function(e){
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
      exportEquipmentLogsCsv();
      return;
    }

    // 테마 토글 (다크모드 / 라이트모드 / 암실 모드)
    if(target.id === 'btnToggleTheme' || target.closest('#btnToggleTheme') || target.id === 'btnLogbookThemeToggle' || target.closest('#btnLogbookThemeToggle')){
      toggleTheme();
      return;
    }

    // 모바일 슬라이드 아웃 서랍(Drawer) 열기
    if(target.id === 'btnOpenMobileDrawer' || target.closest('#btnOpenMobileDrawer') || target.id === 'bottomTabMenu' || target.closest('#bottomTabMenu')){
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

    // 브랜드 로고 클릭 시 홈 뷰 이동 (비품·소모품 모드에서는 비품 대여 직행)
    if(target.id === 'brandLogoLink' || target.closest('#brandLogoLink')){
      if(currentPortalModule === 'lims'){
        showEquipmentCatalogHub();
        switchEquipmentHubView('catalog');
        showView('logbook');
      } else {
        showView('inventory');
      }
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

    // 장비 본체 부착용 QR 모달 제어
    if(target.id === 'btnShowEquipmentQr' || target.closest('#btnShowEquipmentQr')){
      openEquipmentQrModal();
      return;
    }

    if(target.id === 'btnCloseEquipmentQr' || target.id === 'btnCloseEquipmentQrBottom' || target.closest('#btnCloseEquipmentQr')){
      closeEquipmentQrModal();
      return;
    }

    if(target.id === 'btnPrintEquipmentQr' || target.closest('#btnPrintEquipmentQr')){
      window.print();
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

    // 장비 운영 통계: 분석 스코프 선택 칩 (전체 10대 장비 통합 vs 개별 장비 독립 세션 통계)
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
      if(e.target === mBackdrop) closeModal();
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
      if(e.target === tdModalEl) closeEquipmentTestDrive();
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
      selectedConsumableCategory = '시약';
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

    // 4. 연구장비 전자 로그북 다이렉트 진입 (?logbook=XRD or #logbook/XRD or ?eq=EQ-XRD-01 or #logbook or #xrd)
    const hashEqLogMatch = hash.match(/^(?:logbook|equipmentlog)[\/\-](.+)$/i);
    const logbookCode = params.get('logbook') || params.get('eq') || (params.get('action') === 'logbook' ? params.get('id') : null) || (hashEqLogMatch ? hashEqLogMatch[1] : null);
    if(logbookCode || hash.startsWith('logbook') || hash.startsWith('xrd')){
      showView('logbook', { updateUrl: false });
      const found = researchEquipments.find(function(e){
        return logbookCode && (e.id.toLowerCase() === logbookCode.toLowerCase() || e.code.toLowerCase() === logbookCode.toLowerCase());
      });
      if(found){
        selectResearchEquipment(found.id);
      }
      if(params.get('action') === 'quick_start' || window.location.href.includes('quick_start')){
        showXrdMode('start');
        toast('⚡ HR-XRD 세션 시작 화면으로 직행했습니다.');
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
  initTheme();
  initTransparentLogo();
  bindEvents();

  // 2-in-1 연구 포털 모듈 초기화 (기본값: 연구장비 포털)
  const initialView = getViewFromUrl();
  const isLims = (initialView === 'logbook');
  const savedMod = localStorage.getItem('labstock_active_portal_module');
  setPortalModule(isLims ? 'lims' : (savedMod || 'lims'), { switchView: false });

  // URL Hash, 파라미터 및 세션 기반 활성 뷰 해석 (새로고침 시 현재 탭 유지)
  showView(initialView, { updateUrl: true, pushState: false });
  if(document.documentElement) document.documentElement.removeAttribute('data-initial-view');

  // 이전 로컬 테스트 잔여 목 데이터 캐시 제거 (Supabase DB 전용)
  localStorage.removeItem('labstock_local_assets');
  localStorage.removeItem('labstock_local_loans');

  // 1. 초기 렌더링
  loadLocalStorage();

  // HR-XRD 로그북 컨트롤 및 오늘 날짜/현재 시각 30분 단위 기본 세팅 즉시 초기화 (2DQH-XRD_log 공식)
  initXrdControls();
  resetXrdForm();

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
