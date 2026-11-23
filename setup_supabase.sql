-- ============================================================================
-- 2DQH 연구실 통합 관리 시스템 (Supabase DB 연동 & CSV/엑셀 내보내기용 스키마)
-- Supabase Dashboard > SQL Editor에 전체 복사 후 [Run]을 한 번만 실행하세요.
-- ============================================================================

-- 1. 회원 프로필 테이블 (연구단 / 교내외 / 에너지과학과 통계 구분 컬럼 추가)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  name TEXT,
  advisor TEXT,
  affiliation TEXT,
  is_center TEXT DEFAULT '연구단 소속',
  campus_type TEXT DEFAULT '교내',
  is_energy_dept TEXT DEFAULT '에너지과학과',
  role TEXT DEFAULT 'researcher',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_center TEXT DEFAULT '연구단 소속';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS campus_type TEXT DEFAULT '교내';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_energy_dept TEXT DEFAULT '에너지과학과';

-- 2. 장비 통합 세션 & 예약 테이블 (사용중 ACTIVE_USE / 예약 BOOKING / 완료 로그)
CREATE TABLE IF NOT EXISTS public.equipment_sessions (
  id BIGSERIAL PRIMARY KEY,
  equipment_id TEXT NOT NULL,
  equipment_code TEXT,
  used_on TEXT,
  start_time TEXT,
  end_time TEXT,
  duration_min INTEGER DEFAULT 0,
  sample_count INTEGER DEFAULT 1,
  user_name TEXT,
  affiliation TEXT,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.equipment_sessions ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE public.equipment_sessions ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE IF NOT EXISTS public.equipment_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- 3. HR-XRD 전용 로그북 테이블
CREATE TABLE IF NOT EXISTS public.xrd_logs (
  id BIGSERIAL PRIMARY KEY,
  used_on TEXT,
  start_time TEXT,
  end_time TEXT,
  duration_min INTEGER DEFAULT 0,
  sample_count INTEGER DEFAULT 1,
  chiller_start NUMERIC,
  chiller_end NUMERIC,
  vacuum_start NUMERIC,
  vacuum_end NUMERIC,
  alignment TEXT,
  scan_type TEXT,
  user_name TEXT,
  affiliation TEXT,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 실시간 공유를 위한 RLS 정책 (모든 사용자가 예약·사용현황·로그북을 조회/등록 가능)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xrd_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_all_user_profiles" ON public.user_profiles;
CREATE POLICY "public_all_user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_all_equipment_sessions" ON public.equipment_sessions;
CREATE POLICY "public_all_equipment_sessions" ON public.equipment_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_all_xrd_logs" ON public.xrd_logs;
CREATE POLICY "public_all_xrd_logs" ON public.xrd_logs FOR ALL USING (true) WITH CHECK (true);

-- 5. Supabase Table Editor에서 바로 CSV로 내려받기 좋은 통합 조회 뷰
CREATE OR REPLACE VIEW public.view_booking_summary AS
SELECT
  id,
  equipment_id AS "장비ID",
  used_on AS "예약날짜",
  user_name AS "예약자",
  duration_min AS "예약시간_분",
  notes AS "선택슬롯",
  created_at AS "등록일시"
FROM public.equipment_sessions
WHERE equipment_code = 'BOOKING'
ORDER BY used_on DESC, created_at DESC;
