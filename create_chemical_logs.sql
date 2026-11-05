-- ==============================================================================
-- 2DQH 특별관리물질 취급일지 (법정 30년 보존) 전용 테이블 및 RLS 설정
-- 산업안전보건법 제123조 및 산업안전보건기준에 관한 규칙 제439조 준수
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.chemical_logs (
  id BIGSERIAL PRIMARY KEY,
  consumable_id TEXT REFERENCES public.consumables(id) ON DELETE SET NULL,
  chemical_name TEXT NOT NULL,
  cas_number TEXT NOT NULL DEFAULT '',
  handler_name TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'mL',               -- 'mL', 'g', 'mg', 'L', 'kg'
  work_location TEXT NOT NULL DEFAULT '',        -- 예: 3층 화학실험실 흄후드 3번
  work_description TEXT NOT NULL DEFAULT '',     -- 예: 2D flake 박리 기판 세척 및 린스
  ppe_checked BOOLEAN NOT NULL DEFAULT true,      -- 보호구(내화학장갑/보안경/마스크) 착용 여부
  ventilation_checked BOOLEAN NOT NULL DEFAULT true, -- 국소배기장치(흄후드) 정상 가동 여부
  remaining_qty TEXT NOT NULL DEFAULT '',        -- 사용 후 잔여량 (선택)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 설정
CREATE INDEX IF NOT EXISTS idx_chemical_logs_used_at_desc ON public.chemical_logs (used_at DESC);
CREATE INDEX IF NOT EXISTS idx_chemical_logs_handler ON public.chemical_logs (handler_name);
CREATE INDEX IF NOT EXISTS idx_chemical_logs_chem_name ON public.chemical_logs (chemical_name);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.chemical_logs ENABLE ROW LEVEL SECURITY;

-- 1) 일반 연구원: 일지 조회 및 작성(INSERT) 전면 허용
DROP POLICY IF EXISTS "chemical_logs_select_public" ON public.chemical_logs;
CREATE POLICY "chemical_logs_select_public"
  ON public.chemical_logs FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "chemical_logs_insert_public" ON public.chemical_logs;
CREATE POLICY "chemical_logs_insert_public"
  ON public.chemical_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(handler_name)) > 0 AND 
    length(trim(chemical_name)) > 0 AND
    quantity > 0
  );

-- 2) 관리자: 일지 관리 및 수정 권한
DROP POLICY IF EXISTS "chemical_logs_admin_manage" ON public.chemical_logs;
CREATE POLICY "chemical_logs_admin_manage"
  ON public.chemical_logs FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

GRANT SELECT, INSERT ON public.chemical_logs TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.chemical_logs_id_seq TO anon, authenticated;
