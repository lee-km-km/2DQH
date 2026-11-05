-- ==============================================================================
-- 2DQH 소모품 위치 안내(도감) 시스템 전용 마이그레이션 (v2.0)
-- 복잡한 발주/재고 트랜잭션 없이 1초 초고속 위치 검색 및 관리자 관리 최적화
-- ==============================================================================

-- 1. Trigram 확장 모듈 활성화 (초고속 부분 일치 검색)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. 기존 레거시 발주/수량 테이블 정리
DROP TABLE IF EXISTS public.reorder_requests CASCADE;
DROP TABLE IF EXISTS public.consumables CASCADE;

-- 3. 위치 안내 전용 consumables 테이블 생성
CREATE TABLE public.consumables (
  id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 40),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 160),
  category TEXT NOT NULL DEFAULT '일반소모품',
  location TEXT NOT NULL DEFAULT '',           -- 주 보관 구역 (예: 클린룸, 화학실험실, 3층 측정실)
  sub_location TEXT NOT NULL DEFAULT '',       -- 상세 위치 (예: 캐비닛 B 3단, 데시케이터 A 2단)
  specification TEXT NOT NULL DEFAULT '',      -- 규격/설명/주의사항
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. 성능 최적화 인덱스 구축
CREATE INDEX IF NOT EXISTS idx_consumables_category_name ON public.consumables (category, name);
CREATE INDEX IF NOT EXISTS idx_consumables_search_gin ON public.consumables USING gin (
  (name || ' ' || location || ' ' || sub_location || ' ' || specification) gin_trgm_ops
);

-- 5. Row Level Security (RLS) 활성화 및 정책 구성
ALTER TABLE public.consumables ENABLE ROW LEVEL SECURITY;

-- 1) 일반 연구원 (익명 및 일반 세션): 읽기 전용 전면 허용
CREATE POLICY "Public Read Access for Consumables"
ON public.consumables
FOR SELECT
TO anon, authenticated
USING (true);

-- 2) 관리자: 추가/수정/삭제 권한 부여
CREATE POLICY "Admin Insert Consumables"
ON public.consumables
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admin Update Consumables"
ON public.consumables
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin Delete Consumables"
ON public.consumables
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 6. 2DQH 연구단 맞춤형 초기 소모품 위치 시드 데이터 (10선)
INSERT INTO public.consumables (id, name, category, location, sub_location, specification) VALUES
('CS-001', '4인치 Si/SiO2 웨이퍼 (300nm)', '기판·박리', '클린룸 광학실', '진공 데시케이터 A 2단', 'P-type, Boron doped, 500µm 두께'),
('CS-002', '고품위 벌크 그래파이트 (HOPG)', '기판·박리', '3층 측정실', '건식 보관함 1번', '기계적 박리용 샘플'),
('CS-003', 'Scotch 3M 매직테이프 (박리용)', '기판·박리', '클린룸 글러브박스 앞', '공용 공구함 서랍 1단', '2D flake exfoliation 전용'),
('CS-004', '니트릴 장갑 (M)', '클린룸·안전', '클린룸 입구', '선반 1열 상단', '파우더프리, 박스 단위 (100매)'),
('CS-005', '클린룸 와이퍼 (TX1009 9x9)', '클린룸·안전', '클린룸 벤치', '클린벤치 1번 하부 수납장', '폴리에스터 무발진 와이퍼'),
('CS-006', '초고순도 아세톤 (HPLC 등급)', '화학·시약', '화학실험실 흄후드 3', '유기용매 전용 방화 캐비닛', '세척 및 레지스트 제거용 (4L)'),
('CS-007', '이소프로필알코올 (IPA 99.9%)', '화학·시약', '화학실험실 흄후드 3', '유기용매 전용 방화 캐비닛', '기판 린스용 (4L)'),
('CS-008', 'KF25 진공 센터링 링 & O-Ring', '진공·배관', '장비실', '진공 피팅 부품함 서랍 C', 'FKM Viton 재질'),
('CS-009', '테프론(PTFE) 씰링 테이프', '진공·배관', '장비실', '가스 배관 작업대', '가스 라인 및 튜빙 씰링용'),
('CS-010', '킴와이프스 (소형 S-200)', '일반소모품', '3층 측정실 작업대 2', '측정대 상단 선반', '광학 부품 1차 린스 후 건조용')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  location = EXCLUDED.location,
  sub_location = EXCLUDED.sub_location,
  specification = EXCLUDED.specification;
