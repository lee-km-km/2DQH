-- ============================================================================
-- [LabStock] Supabase RLS (행 단위 보안) 및 익명/공개 권한 완벽 복구 스크립트
-- Supabase 대시보드 좌측 'SQL Editor'에 붙여넣고 [RUN]을 누르면 즉시 해결됩니다.
-- ============================================================================

-- 1. 스키마 및 기본 권한 부여
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. 비품 테이블 (assets) RLS 및 조회 권한
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.assets TO anon, authenticated;

DROP POLICY IF EXISTS assets_select_public ON public.assets;
CREATE POLICY assets_select_public
  ON public.assets
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. 대여 기록 테이블 (loans) RLS 및 조회/대여/반납 권한
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.loans TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

GRANT INSERT (asset_id, borrower_name, borrowed_at, due_date, memo, user_id)
  ON public.loans TO anon, authenticated;

GRANT UPDATE (borrower_name, due_date, returned_at, memo, updated_at)
  ON public.loans TO anon, authenticated;

-- 대여 목록 조회 정책
DROP POLICY IF EXISTS loans_select_public ON public.loans;
CREATE POLICY loans_select_public
  ON public.loans
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 대여 신청 (INSERT) 정책: 비로그인(anon) 연구원도 대여 신청 가능
DROP POLICY IF EXISTS loans_insert_public ON public.loans;
CREATE POLICY loans_insert_public
  ON public.loans
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    asset_id IS NOT NULL 
    AND returned_at IS NULL
  );

-- 반납 및 수정 (UPDATE) 정책
DROP POLICY IF EXISTS loans_update_public ON public.loans;
CREATE POLICY loans_update_public
  ON public.loans
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. 실시간(Realtime) 자동 반영 활성화 (다른 사람이 대여/반납 시 모든 화면에 실시간 자동 갱신)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.assets, public.loans;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 5. 현재 등록된 비품 수 확인
SELECT count(*) AS total_assets FROM public.assets;
