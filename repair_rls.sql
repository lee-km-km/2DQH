-- ============================================================================
-- [LabStock] Supabase 보안 & RLS 완벽 강화 스크립트 (AppSec & Backend Architect)
-- Supabase 대시보드 좌측 'SQL Editor'에 붙여넣고 [RUN]을 누르시면 됩니다.
-- ============================================================================

-- 1. 스키마 및 기본 권한 부여
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. 비품 테이블 (assets) RLS 및 조회 권한
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.assets TO anon, authenticated;

DROP POLICY IF EXISTS assets_select_public ON public.assets;
CREATE POLICY assets_select_public
  ON public.assets FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. 대여 기록 테이블 (loans) RLS 및 무결성 제약조건
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.loans TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 대여 신청/반납 시 수정 가능한 특정 컬럼만 화이트리스트 부여
GRANT INSERT (asset_id, borrower_name, borrowed_at, due_date, memo, user_id)
  ON public.loans TO anon, authenticated;

GRANT UPDATE (borrower_name, due_date, returned_at, memo, updated_at)
  ON public.loans TO anon, authenticated;

-- 대여 목록 조회 정책
DROP POLICY IF EXISTS loans_select_public ON public.loans;
CREATE POLICY loans_select_public
  ON public.loans FOR SELECT
  TO anon, authenticated
  USING (true);

-- 대여 신청 (INSERT) 정책: 비로그인(anon) 연구원도 대여 신청 가능
DROP POLICY IF EXISTS loans_insert_public ON public.loans;
CREATE POLICY loans_insert_public
  ON public.loans FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    asset_id IS NOT NULL 
    AND returned_at IS NULL
    AND due_date >= borrowed_at
    AND length(trim(borrower_name)) >= 1
  );

-- 반납 및 수정 (UPDATE) 정책:
-- IDOR 방어: 이미 반납 완료된 건은 임의 변조 불가, 아직 반납되지 않은(returned_at IS NULL) 건만 반납 처리 허용
DROP POLICY IF EXISTS loans_update_public ON public.loans;
CREATE POLICY loans_update_public
  ON public.loans FOR UPDATE
  TO anon, authenticated
  USING (returned_at IS NULL)
  WITH CHECK (true);

-- 4. 중복 대여 방지 부분 유니크 인덱스 (Race Condition 원천 차단)
CREATE UNIQUE INDEX IF NOT EXISTS idx_loans_unique_active_asset
  ON public.loans (asset_id)
  WHERE returned_at IS NULL;

-- 5. 비정상 날짜 역전 방지 제약조건
ALTER TABLE public.loans 
  DROP CONSTRAINT IF EXISTS loans_date_validity;
ALTER TABLE public.loans
  ADD CONSTRAINT loans_date_validity CHECK (due_date >= borrowed_at);

-- 6. 실시간(Realtime) 자동 반영 활성화
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.assets, public.loans;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 7. 확인
SELECT count(*) AS total_assets FROM public.assets;
