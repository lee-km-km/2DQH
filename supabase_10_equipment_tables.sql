-- ============================================================================
-- [IBS 2DQH & SESS AQT] 10대 첨단 연구장비 전용 개별 로그 테이블 및 통합 뷰 셋업 스크립트
-- Supabase Dashboard -> SQL Editor -> 'New query' 에 전체 복사 후 'Run' 클릭!
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. [EQ-XRD-01] HR-XRD (고분해능 X선 회절분석기 - Rigaku SmartLab 9kW)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.xrd_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE DEFAULT ('XRD-' || floor(extract(epoch from now()))::text || '-' || floor(random() * 1000)::text),
    used_on DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL DEFAULT '10:00',
    end_time TIME DEFAULT '11:30',
    duration_min INTEGER NOT NULL DEFAULT 90,
    status TEXT NOT NULL DEFAULT 'done',
    
    -- 기본 연구원 정보
    user_name TEXT NOT NULL,
    affiliation TEXT DEFAULT '2DQH',
    professor TEXT DEFAULT '신현석 교수님',
    
    -- 시료 및 목적
    sample_name TEXT DEFAULT 'MoS2 단결정 박막',
    sample_count INTEGER DEFAULT 1,
    purpose TEXT DEFAULT 'Rocking curve 격자 구조 분석',
    memo TEXT DEFAULT '',
    
    -- [XRD 전용 고유 파라미터 컬럼]
    chiller_start NUMERIC(4,1) DEFAULT 22.0,    -- 칠러 온도 (°C)
    vacuum_start INTEGER DEFAULT 92,            -- 진공도 (mV)
    optical_align TEXT DEFAULT 'PB',            -- 광학계 (PB / BB)
    scan_type TEXT DEFAULT 'θ/2θ',              -- 스캔 축 (θ/2θ, 2θ/ω, ω, φ 등)
    xray_max_ok BOOLEAN DEFAULT true,           -- 최대 전력 점검
    position_ok BOOLEAN DEFAULT true,           -- 초기 각도 복귀 점검
    xray_min_ok BOOLEAN DEFAULT true,           -- 최소 전력 전환 점검
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. [EQ-TEM-01] Cs-TEM (수차보정 투과전자현미경 - JEOL Grand ARM)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tem_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE DEFAULT ('TEM-' || floor(extract(epoch from now()))::text || '-' || floor(random() * 1000)::text),
    used_on DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL DEFAULT '13:00',
    end_time TIME DEFAULT '15:00',
    duration_min INTEGER NOT NULL DEFAULT 120,
    status TEXT NOT NULL DEFAULT 'done',
    user_name TEXT NOT NULL,
    affiliation TEXT DEFAULT '2DQH',
    professor TEXT DEFAULT '신현석 교수님',
    sample_name TEXT DEFAULT '2D Heterostructure 단면 TEM 시편',
    sample_count INTEGER DEFAULT 1,
    purpose TEXT DEFAULT '원자단위 격자 분해능 HAADF 이미징 및 EDS',
    memo TEXT DEFAULT '',
    
    -- [TEM 전용 고유 파라미터 컬럼]
    col_vacuum NUMERIC(5,2) DEFAULT 1.85,       -- 컬럼 진공도 (×10⁻⁵ Pa)
    emission_current_ua NUMERIC(6,1) DEFAULT 105.0, -- 에미션 전류 (μA)
    acc_voltage TEXT DEFAULT '200 kV',          -- 가속 전압 (80kV, 120kV, 200kV, 300kV)
    scan_type TEXT DEFAULT 'HR-TEM',            -- 측정 모드 (BF, DF, HR-TEM, SAED, EDS)
    cold_trap_ok BOOLEAN DEFAULT true,          -- 액체질소 트랩 점검
    gun_align_ok BOOLEAN DEFAULT true,          -- 전자총 정렬 상태 점검
    valves_closed_ok BOOLEAN DEFAULT true,      -- 빔 밸브 안전 폐쇄 확인
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. [EQ-AFM-01] AFM (원자간력현미경 - Bruker Dimension Icon)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.afm_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE DEFAULT ('AFM-' || floor(extract(epoch from now()))::text || '-' || floor(random() * 1000)::text),
    used_on DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL DEFAULT '14:00',
    end_time TIME DEFAULT '15:30',
    duration_min INTEGER NOT NULL DEFAULT 90,
    status TEXT NOT NULL DEFAULT 'done',
    user_name TEXT NOT NULL,
    affiliation TEXT DEFAULT '2DQH',
    professor TEXT DEFAULT '신현석 교수님',
    sample_name TEXT DEFAULT 'h-BN/Graphene 박막 표면',
    sample_count INTEGER DEFAULT 1,
    purpose TEXT DEFAULT '원자 스케일 단차 및 표면 거칠기 정밀 측정',
    memo TEXT DEFAULT '',
    
    -- [AFM 전용 고유 파라미터 컬럼]
    laser_sum NUMERIC(4,2) DEFAULT 6.8,         -- 레이저 시그널 SUM 값 (V)
    drive_amp NUMERIC(6,1) DEFAULT 240.0,       -- 캔틸레버 드라이브 진폭 (mV)
    scan_mode TEXT DEFAULT 'PeakForce',         -- 스캔 모드 (Tapping, Contact, PeakForce)
    scan_type TEXT DEFAULT 'Height (Topography)', -- 출력 채널
    tip_mounted_ok BOOLEAN DEFAULT true,        -- 팁 체결 및 정렬 확인
    tune_ok BOOLEAN DEFAULT true,               -- 공진 주파수 튜닝 확인
    parked_ok BOOLEAN DEFAULT true,             -- Z-스테이지 복귀 확인
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. [EQ-RAMAN-01] Laser Raman (마이크로 라만 분광기 - NanoBase)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.raman_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE DEFAULT ('RAMAN-' || floor(extract(epoch from now()))::text || '-' || floor(random() * 1000)::text),
    used_on DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL DEFAULT '11:00',
    end_time TIME DEFAULT '12:00',
    duration_min INTEGER NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'done',
    user_name TEXT NOT NULL,
    affiliation TEXT DEFAULT '2DQH',
    professor TEXT DEFAULT '신현석 교수님',
    sample_name TEXT DEFAULT 'MoS2 / WS2 Heterobilayer Flake',
    sample_count INTEGER DEFAULT 2,
    purpose TEXT DEFAULT 'E2g / A1g 피크 분리 및 2D 매핑 분석',
    memo TEXT DEFAULT '',
    
    -- [Raman 전용 고유 파라미터 컬럼]
    laser_power_pct NUMERIC(4,1) DEFAULT 10.0,  -- 레이저 감쇄 파워 (%)
    integration_time_sec NUMERIC(5,2) DEFAULT 5.0, -- 적분 시간 (초)
    laser_wavelength TEXT DEFAULT '532 nm (Green)', -- 레이저 파장 (532nm, 633nm, 785nm)
    objective_lens TEXT DEFAULT '50×',          -- 대물렌즈 배율
    scan_type TEXT DEFAULT 'XY Surface Mapping',-- 측정 형태
    si_calib_ok BOOLEAN DEFAULT true,           -- Si 520.7 cm⁻¹ 피크 캘리브레이션
    shutter_ok BOOLEAN DEFAULT true,            -- 레이저 안전 셔터 차단 확인
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. [EQ-FTIR-01] Vacuum FT-IR (진공 적외선 분광기 - Bruker Vertex 70v)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ftir_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE DEFAULT ('FTIR-' || floor(extract(epoch from now()))::text || '-' || floor(random() * 1000)::text),
    used_on DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL DEFAULT '15:00',
    end_time TIME DEFAULT '16:00',
    duration_min INTEGER NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'done',
    user_name TEXT NOT NULL,
    affiliation TEXT DEFAULT '2DQH',
    professor TEXT DEFAULT '신현석 교수님',
    sample_name TEXT DEFAULT '기능화 유기물 분말 시편',
    sample_count INTEGER DEFAULT 1,
    purpose TEXT DEFAULT '작용기 IR 흡수 스펙트럼 측정',
    memo TEXT DEFAULT '',
    
    -- [FT-IR 전용 고유 파라미터 컬럼]
    resolution NUMERIC(4,1) DEFAULT 4.0,        -- 분해능 (cm⁻¹)
    accum_scans INTEGER DEFAULT 32,             -- 적산 횟수 (scans)
    accessory TEXT DEFAULT 'ATR (Diamond)',     -- 측정 액세서리 (ATR, 투과, DRIFTS)
    scan_type TEXT DEFAULT 'Absorbance',        -- 신호 모드 (흡광도, 투과율)
    purge_ok BOOLEAN DEFAULT true,              -- 질소 퍼지 확인
    background_ok BOOLEAN DEFAULT true,         -- 백그라운드 스캔 확인
    crystal_cleaned_ok BOOLEAN DEFAULT true,    -- 크리스탈 세척 점검
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. [EQ-EBEAM-01] E-beam Evaporator (전자빔 진공 증착기 - KVE-T2000)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ebeam_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE DEFAULT ('EBEAM-' || floor(extract(epoch from now()))::text || '-' || floor(random() * 1000)::text),
    used_on DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL DEFAULT '09:30',
    end_time TIME DEFAULT '11:00',
    duration_min INTEGER NOT NULL DEFAULT 90,
    status TEXT NOT NULL DEFAULT 'done',
    user_name TEXT NOT NULL,
    affiliation TEXT DEFAULT '2DQH',
    professor TEXT DEFAULT '신현석 교수님',
    sample_name TEXT DEFAULT '전극 패터닝 Si Wafer 기판',
    sample_count INTEGER DEFAULT 4,
    purpose TEXT DEFAULT 'Ti/Au (5nm/50nm) 컨택 전극 고진공 증착',
    memo TEXT DEFAULT '',
    
    -- [E-beam Evaporator 전용 고유 파라미터 컬럼]
    base_vacuum_torr NUMERIC(6,2) DEFAULT 2.10, -- 기저 진공도 (×10⁻⁶ Torr)
    dep_rate_angs NUMERIC(4,2) DEFAULT 1.00,    -- 증착 속도 (Å/s)
    target_source TEXT DEFAULT 'Ti/Au',         -- 타겟 소스 금속 (Ti, Au, Cr, Ni, Pt)
    cooling_ok BOOLEAN DEFAULT true,            -- 냉각수 순환 점검
    pocket_ok BOOLEAN DEFAULT true,             -- 도가니 포켓 센터 정렬 확인
    shutter_ok BOOLEAN DEFAULT true,            -- 셔터 차단 및 냉각 확인
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. [EQ-ALD-01] Thermal ALD (원자층 박막 증착기 - Picosun R-200)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ald_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE DEFAULT ('ALD-' || floor(extract(epoch from now()))::text || '-' || floor(random() * 1000)::text),
    used_on DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL DEFAULT '13:00',
    end_time TIME DEFAULT '15:00',
    duration_min INTEGER NOT NULL DEFAULT 120,
    status TEXT NOT NULL DEFAULT 'done',
    user_name TEXT NOT NULL,
    affiliation TEXT DEFAULT '2DQH',
    professor TEXT DEFAULT '신현석 교수님',
    sample_name TEXT DEFAULT '2D FET 채널 소자 기판',
    sample_count INTEGER DEFAULT 2,
    purpose TEXT DEFAULT 'Al2O3 게이트 고유전율 절연막 증착 (15nm)',
    memo TEXT DEFAULT '',
    
    -- [ALD 전용 고유 파라미터 컬럼]
    chamber_temp_c NUMERIC(5,1) DEFAULT 250.0,  -- 챔버 반응 온도 (°C)
    pulse_time_ms NUMERIC(6,1) DEFAULT 100.0,   -- 전구체 펄스 타임 (ms)
    precursor_type TEXT DEFAULT 'TMA (Al2O3)',  -- 전구체 (TMA, TDMAH, DEZ 등)
    n2_flow_ok BOOLEAN DEFAULT true,            -- N₂ 캐리어 가스 유량 확인
    valves_ok BOOLEAN DEFAULT true,             -- 가스 밸브 개폐 상태 점검
    pump_exhaust_ok BOOLEAN DEFAULT true,       -- 진공 펌프 배기 상태 점검
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. [EQ-COSPUTTER-01] Multi-Cathode Sputter (다원 동시 스퍼터링 시스템)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cosputter_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE DEFAULT ('COSPUTTER-' || floor(extract(epoch from now()))::text || '-' || floor(random() * 1000)::text),
    used_on DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL DEFAULT '14:30',
    end_time TIME DEFAULT '16:00',
    duration_min INTEGER NOT NULL DEFAULT 90,
    status TEXT NOT NULL DEFAULT 'done',
    user_name TEXT NOT NULL,
    affiliation TEXT DEFAULT '2DQH',
    professor TEXT DEFAULT '신현석 교수님',
    sample_name TEXT DEFAULT '금속간 화합물 박막 기판',
    sample_count DEFAULT 1,
    purpose TEXT DEFAULT 'RF/DC 동시 스퍼터링 합금 박막 증착',
    memo TEXT DEFAULT '',
    
    -- [Co-sputter 전용 고유 파라미터 컬럼]
    sputter_power_w NUMERIC(6,1) DEFAULT 150.0, -- 스퍼터 파워 (W)
    ar_flow_sccm NUMERIC(5,1) DEFAULT 30.0,     -- Ar 가스 유량 (sccm)
    power_type TEXT DEFAULT 'DC 1',             -- 전원 공급 모드 (DC 1, DC 2, RF 1)
    rotation_ok BOOLEAN DEFAULT true,           -- 기판 회전 확인
    plasma_ignited_ok BOOLEAN DEFAULT true,     -- 플라즈마 방전 상태 점검
    shutter_closed_ok BOOLEAN DEFAULT true,     -- 프리 스퍼터링 셔터 차단 확인
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. [EQ-UHVSPUTTER-01] UHV Sputter (초고진공 마그네트론 스퍼터)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.uhvsputter_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE DEFAULT ('UHV-' || floor(extract(epoch from now()))::text || '-' || floor(random() * 1000)::text),
    used_on DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL DEFAULT '10:00',
    end_time TIME DEFAULT '12:00',
    duration_min INTEGER NOT NULL DEFAULT 120,
    status TEXT NOT NULL DEFAULT 'done',
    user_name TEXT NOT NULL,
    affiliation TEXT DEFAULT '2DQH',
    professor TEXT DEFAULT '신현석 교수님',
    sample_name TEXT DEFAULT '자성 초박막 이종접합 시편',
    sample_count INTEGER DEFAULT 1,
    purpose TEXT DEFAULT '초고진공 조건 강자성 박막 고순도 증착',
    memo TEXT DEFAULT '',
    
    -- [UHV Sputter 전용 고유 파라미터 컬럼]
    uhv_base_torr NUMERIC(6,2) DEFAULT 4.20,    -- 초고진공 기저 (×10⁻⁸ Torr)
    working_pressure_mtorr NUMERIC(5,2) DEFAULT 3.00, -- 공정 압력 (mTorr)
    loadlock_transferred_ok BOOLEAN DEFAULT true, -- 로드락 챔버 정상 이송 확인
    cryo_temp_ok BOOLEAN DEFAULT true,          -- 크라이오 펌프 극저온 (<15K) 확인
    gate_valve_isolated_ok BOOLEAN DEFAULT true, -- 메인 게이트 밸브 격리 확인
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. [EQ-BONDER-01] Wire Bonder (초음파 와이어본더 - West-Bond 7476E)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wirebonder_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE DEFAULT ('BONDER-' || floor(extract(epoch from now()))::text || '-' || floor(random() * 1000)::text),
    used_on DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL DEFAULT '16:00',
    end_time TIME DEFAULT '17:30',
    duration_min INTEGER NOT NULL DEFAULT 90,
    status TEXT NOT NULL DEFAULT 'done',
    user_name TEXT NOT NULL,
    affiliation TEXT DEFAULT '2DQH',
    professor TEXT DEFAULT '신현석 교수님',
    sample_name TEXT DEFAULT '2D 양자소자 칩 패키징 (LCC20)',
    sample_count INTEGER DEFAULT 2,
    purpose TEXT DEFAULT 'Au 와이어 웨지 본딩 전극 연결 (총 16채널)',
    memo TEXT DEFAULT '',
    
    -- [Wire Bonder 전용 고유 파라미터 컬럼]
    ultrasonic_power NUMERIC(5,1) DEFAULT 2.8,  -- 초음파 파워 (0~10 W)
    bonding_time_ms NUMERIC(6,1) DEFAULT 45.0,  -- 본딩 인가 시간 (ms)
    bonding_force_gf NUMERIC(5,1) DEFAULT 35.0, -- 본딩 하중 (gf)
    wire_type TEXT DEFAULT 'Au 1.0 mil',        -- 와이어 규격
    feeder_aligned_ok BOOLEAN DEFAULT true,     -- 와이어 피더 클램프 정렬 점검
    flame_off_spark_ok BOOLEAN DEFAULT true,    -- 스파크 방전 상태 점검
    pull_test_passed_ok BOOLEAN DEFAULT true,   -- 풀 테스트(인장 시험) 통과 확인
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 11. [핵심] 10대 장비 로그 자동 통합 가상 뷰 (view_equipment_sessions)
--     웹페이지의 캘린더, 실시간 가동 피드, 통계, 통합 CSV에 초고속 연동됩니다.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 11. [CHEMICAL_LOGS] 특별관리물질(법정 44종) 공용 취급대장 (산안법 제420조 · 30년 영구보존)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chemical_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE DEFAULT ('CHEM-' || floor(extract(epoch from now()))::text || '-' || floor(random() * 1000)::text),
    consumable_id TEXT,
    chemical_name TEXT NOT NULL,
    cas_number TEXT,
    handler_name TEXT NOT NULL,
    affiliation TEXT DEFAULT '2DQH',
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.0,
    unit TEXT NOT NULL DEFAULT 'mL',
    work_location TEXT DEFAULT '제1클린룸 습식 흄후드 A',
    work_description TEXT DEFAULT '시편 세정 및 합성 반응',
    ppe_checked BOOLEAN DEFAULT true,
    ventilation_checked BOOLEAN DEFAULT true,
    initial_stock NUMERIC(10,2) DEFAULT 500.0,
    remaining_stock NUMERIC(10,2) DEFAULT 450.0,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW public.view_equipment_sessions AS
SELECT 'EQ-XRD-01' AS equipment_id, 'XRD' AS equipment_code, 'HR-XRD (고분해능 X선 회절분석기)' AS equipment_name,
       id, session_id, used_on, start_time, end_time, duration_min, user_name, affiliation, professor, sample_name, sample_count, purpose, memo, created_at
FROM public.xrd_logs
UNION ALL
SELECT 'EQ-TEM-01' AS equipment_id, 'TEM' AS equipment_code, 'Cs-TEM (수차보정 투과전자현미경)' AS equipment_name,
       id, session_id, used_on, start_time, end_time, duration_min, user_name, affiliation, professor, sample_name, sample_count, purpose, memo, created_at
FROM public.tem_logs
UNION ALL
SELECT 'EQ-AFM-01' AS equipment_id, 'AFM' AS equipment_code, 'AFM (원자간력현미경)' AS equipment_name,
       id, session_id, used_on, start_time, end_time, duration_min, user_name, affiliation, professor, sample_name, sample_count, purpose, memo, created_at
FROM public.afm_logs
UNION ALL
SELECT 'EQ-RAMAN-01' AS equipment_id, 'RAMAN' AS equipment_code, 'Laser Raman (마이크로 라만 분광기)' AS equipment_name,
       id, session_id, used_on, start_time, end_time, duration_min, user_name, affiliation, professor, sample_name, sample_count, purpose, memo, created_at
FROM public.raman_logs
UNION ALL
SELECT 'EQ-FTIR-01' AS equipment_id, 'FT-IR' AS equipment_code, 'Vacuum FT-IR (진공 적외선 분광기)' AS equipment_name,
       id, session_id, used_on, start_time, end_time, duration_min, user_name, affiliation, professor, sample_name, sample_count, purpose, memo, created_at
FROM public.ftir_logs
UNION ALL
SELECT 'EQ-EBEAM-01' AS equipment_id, 'Ebeamsputter' AS equipment_code, 'E-beam Evaporator (전자빔 진공 증착기)' AS equipment_name,
       id, session_id, used_on, start_time, end_time, duration_min, user_name, affiliation, professor, sample_name, sample_count, purpose, memo, created_at
FROM public.ebeam_logs
UNION ALL
SELECT 'EQ-ALD-01' AS equipment_id, 'ALD' AS equipment_code, 'Thermal ALD (원자층 박막 증착기)' AS equipment_name,
       id, session_id, used_on, start_time, end_time, duration_min, user_name, affiliation, professor, sample_name, sample_count, purpose, memo, created_at
FROM public.ald_logs
UNION ALL
SELECT 'EQ-COSPUTTER-01' AS equipment_id, 'Co-sputter' AS equipment_code, 'Multi-Cathode Sputter (다원 동시 스퍼터링 시스템)' AS equipment_name,
       id, session_id, used_on, start_time, end_time, duration_min, user_name, affiliation, professor, sample_name, sample_count, purpose, memo, created_at
FROM public.cosputter_logs
UNION ALL
SELECT 'EQ-UHVSPUTTER-01' AS equipment_id, 'UHVsputter' AS equipment_code, 'UHV Sputter (초고진공 마그네트론 스퍼터)' AS equipment_name,
       id, session_id, used_on, start_time, end_time, duration_min, user_name, affiliation, professor, sample_name, sample_count, purpose, memo, created_at
FROM public.uhvsputter_logs
UNION ALL
SELECT 'EQ-BONDER-01' AS equipment_id, 'WireBonder' AS equipment_code, 'Wire Bonder (초음파 와이어본더)' AS equipment_name,
       id, session_id, used_on, start_time, end_time, duration_min, user_name, affiliation, professor, sample_name, sample_count, purpose, memo, created_at
FROM public.wirebonder_logs;

-- ============================================================================
-- 12. RLS (Row Level Security) 설정 및 조회/수정/삭제 권한 부여
-- ============================================================================
ALTER TABLE public.xrd_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tem_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raman_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ftir_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebeam_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ald_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosputter_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uhvsputter_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wirebonder_logs ENABLE ROW LEVEL SECURITY;

-- 익명(anon) 및 로그인 사용자(authenticated) 모두 조회/추가 허용, 관리자 자유 삭제 허용
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'xrd_logs', 'tem_logs', 'afm_logs', 'raman_logs', 'ftir_logs',
        'ebeam_logs', 'ald_logs', 'cosputter_logs', 'uhvsputter_logs', 'wirebonder_logs', 'chemical_logs', 'chemical_logs'
    ]) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_all_policy', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl || '_all_policy', tbl);
        EXECUTE format('GRANT ALL ON public.%I TO anon, authenticated, service_role', tbl);
        EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role');
    END LOOP;
END $$;

GRANT SELECT ON public.view_equipment_sessions TO anon, authenticated, service_role;

-- ============================================================================
-- 13. Supabase Realtime (실시간 웹소켓 구독) 활성화
-- ============================================================================
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'xrd_logs', 'tem_logs', 'afm_logs', 'raman_logs', 'ftir_logs',
        'ebeam_logs', 'ald_logs', 'cosputter_logs', 'uhvsputter_logs', 'wirebonder_logs'
    ]) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- 14. 2026년 11월 초기 샘플 가동 데이터 (시작 즉시 콘솔에서 확인 가능)
-- ============================================================================
INSERT INTO public.xrd_logs (used_on, start_time, end_time, duration_min, user_name, affiliation, sample_name, sample_count, purpose, chiller_start, vacuum_start, optical_align)
VALUES
('2026-11-10', '10:00', '11:30', 90, '이강민 연구원', '2DQH 페로브스카이트팀', 'CsPbBr3 무기 페로브스카이트 박막 회절분석', 2, '결정성 및 상전이 회절 분석', 22.0, 92, 'PB'),
('2026-11-09', '14:00', '15:30', 90, '박서준 연구원', '성균관대 양자기술연구소', 'MoS2 단결정 플레이크 박막', 1, 'In-plane 5축 고니오미터 회절 스캔', 22.3, 90, 'PB')
ON CONFLICT DO NOTHING;

INSERT INTO public.wirebonder_logs (used_on, start_time, end_time, duration_min, user_name, affiliation, sample_name, sample_count, purpose, ultrasonic_power, bonding_time_ms, bonding_force_gf, wire_type)
VALUES
('2026-11-10', '14:00', '15:30', 90, '신현석 교수님', '2DQH 연구단', '2D 밸리트로닉스 소자 패키징', 1, 'Au 와이어 웨지 본딩 전극 배선', 2.8, 45.0, 35.0, 'Au 1.0 mil'),
('2026-11-08', '11:00', '12:30', 90, '김유진 연구원', 'IBS 나노구조물리연구단', 'Graphene FET 전극 본딩', 2, '초음파 웨지 본딩 패키징', 2.5, 40.0, 30.0, 'Al 1.25 mil')
ON CONFLICT DO NOTHING;

INSERT INTO public.afm_logs (used_on, start_time, end_time, duration_min, user_name, affiliation, sample_name, sample_count, purpose, laser_sum, drive_amp, scan_mode)
VALUES
('2026-11-09', '16:00', '17:30', 90, '정민호 연구원', '2DQH 연구단', 'h-BN 단원자층 표면 토포그래피', 1, '원자 스케일 단차 및 거칠기 측정', 6.8, 240.0, 'PeakForce')
ON CONFLICT DO NOTHING;

INSERT INTO public.ebeam_logs (used_on, start_time, end_time, duration_min, user_name, affiliation, sample_name, sample_count, purpose, base_vacuum_torr, dep_rate_angs, target_source)
VALUES
('2026-11-07', '10:00', '11:30', 90, '최동욱 연구원', '성균관대 신소재공학과', 'Si/SiO2 기판 Cr/Au 전극 증착', 3, '소자 컨택 패드 전자빔 박막 증착', 2.10, 1.00, 'Cr/Au')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 15. [특별관리물질 공용 취급대장 초기 샘플 데이터]
-- ============================================================================
INSERT INTO public.chemical_logs (session_id, chemical_name, cas_number, handler_name, affiliation, used_at, quantity, unit, work_location, work_description, initial_stock, remaining_stock, note)
VALUES
('CHEM-20261110-01', '클로로포름 (Chloroform)', '67-66-3', '신현석 교수님', '2DQH 연구단', '2026-11-10 11:20:00+09', 50, 'mL', '제1클린룸 습식 흄후드 A', '2D 페로브스카이트 전구체 용액 제조 및 시편 세정', 500, 450, '작업 후 밀봉 보관 완료, 잔여 450mL'),
('CHEM-20261109-02', '디메틸포름아미드 (DMF)', '68-12-2', '박서준 연구원', '성균관대 양자기술연구소', '2026-11-09 16:45:00+09', 25, 'mL', '제1클린룸 유기용매 흄후드 B', 'CsPbBr3 용액 스핀코팅 전구체 교반', 500, 475, '질소 퍼지 후 냉장 시약장 보관'),
('CHEM-20261109-01', '하이드라진 수화물 (Hydrazine monohydrate)', '7803-57-8', '이강민 연구원', '2DQH 페로브스카이트팀', '2026-11-09 10:15:00+09', 10, 'mL', '화학합성실 특수 가스 배기 후드', '그래핀 옥사이드 환원 촉매 합성 반응', 250, 240, '방독마스크 착용, 전용 차광병 보관'),
('CHEM-20261108-01', '불산 (Hydrofluoric acid 49%)', '7664-39-3', '정민호 연구원', '2DQH 연구단', '2026-11-08 14:30:00+09', 5, 'mL', '산 세척 전용 테프론 흄후드', 'SiO2 기판 산화막 에칭 및 패턴 클리닝', 500, 495, '칼슘 글루코네이트 젤 비치 확인, 중화처리 완료'),
('CHEM-20261107-01', '황산 (Sulfuric acid 98%)', '7664-93-9', '김유진 연구원', 'IBS 나노구조물리연구단', '2026-11-07 15:20:00+09', 30, 'mL', '제1클린룸 피라냐 용액 제조대', '피라냐 용액(H2SO4:H2O2 = 3:1) 조제 및 기판 전처리', 1000, 970, '발열 반응 냉각 후 세척 완료')
ON CONFLICT DO NOTHING;
