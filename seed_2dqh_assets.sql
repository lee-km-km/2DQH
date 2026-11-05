-- ==============================================================================
-- 2DQH 이차원양자헤테로구조체연구단 연구장비 및 공구 카탈로그 시드 데이터
-- 대상 테이블: public.assets
-- 실행 방법: Supabase 대시보드 -> SQL Editor -> 붙여넣기 후 'Run' 클릭
-- ==============================================================================

INSERT INTO public.assets (id, name, category, location, status, note) VALUES
('EQ-001', '디지털 멀티미터', '측정공구', '분석실 캐비넷 A', 'available', 'Fluke 87V 트루 RMS 정밀 멀티미터'),
('EQ-002', '버니어 캘리퍼스', '측정공구', '분석실 캐비넷 B', 'available', 'Mitutoyo 500-196-30 150mm 디지털 캘리퍼스'),
('EQ-003', '육각렌치 세트', '공구', '공용 공구함', 'available', 'PB Swiss Tools 볼포인트 L형 육각렌치 9종 세트 (1.5-10mm)'),
('EQ-004', '토크 드라이버 세트', '공구', '장비실 서랍 2', 'available', 'Wera 7440/41/42 정밀 가변 토크 스크루드라이버 & 비트 세트 (0.3-3.0 N·m)'),
('EQ-005', '고정밀 ESD 핀셋 세트', '공구', '클린룸 글러브박스 앞', 'available', 'Dumont 스위스제 정밀 비자성 핀셋 5종 (2D 플레이크 전사용)'),
('EQ-006', '디지털 오실로스코프', '실험장비', '3층 측정실 작업대 1', 'available', 'Tektronix MDO34 1GHz 4채널 혼합신호 오실로스코프'),
('EQ-007', 'DC 프로그래머블 전원공급기', '실험장비', '3층 측정실 작업대 2', 'available', 'Keithley 2230G-30-1 삼중출력 DC 파워서플라이 (30V/1.5A x 2, 6V/5A x 1)'),
('EQ-008', '정밀 광학현미경', '실험장비', '클린룸 광학실 1', 'available', 'Olympus BX53M 명시야/암시야 2D 헤테로구조 검사용 현미경'),
('EQ-009', '핫플레이트 가열교반기', '실험장비', '화학실험실 흄후드 3', 'available', 'Corning PC-420D 디지털 세라믹 가열교반기'),
('EQ-010', '초음파 세척기', '실험장비', '세척실 싱크대 B', 'available', 'Branson 2800 2.8L 정밀 탈기 초음파 배스 세척기'),
('EQ-011', '정밀 분석 전자저울', '측정공구', '칭량실 제진대', 'available', 'Mettler Toledo MS105DU 0.01mg 세미마이크로 분석저울'),
('EQ-012', '온도조절형 납땜 스테이션', '공구', '전자작업대 4', 'available', 'Hakko FX-888D 디지털 ESD 세이프 납땜 인두기'),
('EQ-013', '진공 척 스핀코터', '실험장비', '소자공정 클린룸 B', 'available', 'Laurell WS-650Mz 진공척 포토레지스트/폴리머 박막 코터'),
('EQ-014', '로터리 진공펌프', '실험장비', '진공챔버 라인 1', 'available', 'Edwards RV8 듀얼스테이지 오일 씰 로터리 펌프'),
('EQ-015', '비접촉 적외선 레이저 온도계', '측정공구', '분석실 캐비넷 B', 'available', 'Fluke 62 MAX+ 듀얼 레이저 적외선 온도계 (-30°C~650°C)'),
('EQ-016', '순환식 저온 냉각 칠러', '실험장비', '챔버 냉각라인', 'available', 'Thermo Scientific ThermoFlex 900 재순환 냉각 칠러')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  location = EXCLUDED.location,
  note = EXCLUDED.note;
