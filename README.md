# 2DQH 연구실 비품 대여 및 시약 위치 안내 시스템 (LabStock)

> **IBS 이차원양자헤테로구조체연구단 (Center for 2D Quantum Heterostructures)**  
> 연구실 공용 비품 대여·반납 관리 및 327종 시약 보관 위치 안내, 산업안전보건법 특별관리물질 취급일지 관리 통합 웹앱

별도의 유료 서버 없이 정적 호스팅([Vercel](https://vercel.com), GitHub Pages)과 [Supabase](https://supabase.com) 무료 플랜만으로 완전하게 동작하며, 연구원들의 스마트폰, 태블릿, PC 어디서나 쾌적하게 사용할 수 있는 모바일 퍼스트 웹앱입니다.

---

## 🚀 주요 핵심 기능

### 1. 🛠️ 연구실 공용 비품 대여·반납 관리
- **모바일 원터치 대여 신청**: 연구원이 이동 중에도 스마트폰으로 간편 대여 (대여자 이름 자동 기억)
- **1인 3개 대여 한도 및 24시간 장기 대여 리마인드**: 특정 인원의 비품 독점을 방지하고 미반납 비품이 있을 경우 부드러운 우선 반납 유도
- **실시간 비품 상태 확인**: `대여 가능`, `대여 중 (대여자 및 반납 예정일 표시)`, `수리·점검 중` 실시간 시각화
- **QR / 바코드 스캔 지원**: 비품에 부착된 바코드·QR을 모바일 카메라로 즉시 스캔하여 대여/반납 연동
- **24시간 자동 휴면 방지**: GitHub Actions Keep-Alive 워크플로우를 내장하여 Supabase 무료 플랜 7일 미사용 자동 일시정지 완전 방지

### 2. 📍 327종 연구실 시약 위치 안내 도감 (Reagent Location Guide)
- **327종 실제 시약 데이터베이스 탑재**: 연구실 내 보관 중인 327종 화학 시약의 보관실(`화학재료합성실`, `PVD실`, `이차원소재합성실` 등) 및 상세 보관 위치(`시약 보관 선반`, `방화/유독물 전용 시약장`, `2D 합성 재료 보관함` 등) 즉시 확인
- **초고속 초성 및 영문 검색**: 시약명, CAS 번호, 제조사(Sigma-Aldrich, Alfa Aesar, TCI, Thermo 등) 실시간 인덱스 검색
- **연구실 실무 중심 UI (불필요한 복사 버튼 배제)**: 현장에서 스마트폰을 보며 캐비닛으로 이동하는 행동 패턴에 맞춰, 불필요한 클립보드 복사 버튼을 없애고 **`📍 위치 정보`** 가독성을 극대화
- **듀얼 뷰 모드 지원**:
  - **[📇 카드 뷰]**: 상세 정보(위치, CAS, 위험도 등급, 제조사, 규격)를 한눈에 보는 카드 레이아웃
  - **[📋 컴팩트 뷰]**: 좁은 모바일 화면에서도 수많은 시약을 스크롤 없이 빠르게 훑어볼 수 있는 고밀도 리스트 레이아웃

### 3. ⚠️ 산업안전보건기준에 관한 규칙 제420조 [별표 12] 특별관리물질 44종 법정 준수
- **법정 의무 준수**: 산업안전보건법 제123조 및 산업안전보건기준에 관한 규칙 제420조 [별표 12] 44종 물질 기준과 1:1 대조·엄밀 매칭
- **2DQH 보유 특별관리물질 16종 식별**: 벤젠(#8), 디메틸포름아미드(#3), 황산(#36), 니켈 무기화합물(#31), 납 무기화합물(#30), 카드뮴 화합물(#34), 6가크롬(PCC, #35), 히드라진 수화물(#29), 퍼클로로에틸렌(#24), 벤조(a)피렌(#40), 산화붕소(#43) 등 16종 품목을 법정 연번 및 관리범위와 함께 엄밀 연동
- **전용 필터 버튼 (`[⚠️ 특별관리물질만 (16종)]`)**: `[🧪 시약·화학]` 탭 진입 시 법정 안내 배너와 원클릭 필터를 통해 규제 물질만 즉시 확인
- **법정 취급일지 30년 보존 규정**: 카드 및 컴팩트 목록에서 `[📝 취급일지 작성]` 버튼을 통해 즉시 일지 작성 가능
- **모바일 원터치 취급일지 작성**:
  - 취급자 성명 자동완성 (이전 대여자명 연동)
  - 취급 일시 분 단위 자동 기입
  - 물질명 및 CAS 번호 자동 바인딩
  - **취급량(사용량) 및 단위 선택**: 연구실 실무 맞춤 3대 단위 (`mL`, `mg`, `g`) 지원
  - 작업 장소 및 작업 내용 빠른 입력 (기본값 제공)
  - **법정 안전조치 확인 필수 체크**: 개인보호구(내화학장갑, 보안경, 방진/방독마스크) 착용 및 국소배기장치(흄후드) 정상 작동 확인
- **고용노동부 법정 서식 호환 CSV 내보내기 (`[📥 취급일지 다운로드 (CSV)]`)**:
  - 산업안전보건기준에 관한 규칙 제439조 규격 12개 법정 컬럼을 준수한 CSV 즉시 생성
  - Excel 한글 깨짐 방지 **UTF-8 with BOM (`\uFEFF`)** 인코딩 적용으로 안전관리 포털 등록 및 법정 비치용 출력 바로 가능
- **30년 법정 보존 대비 이중 데이터 저장**:
  - **로컬 영구 스토리지 (`localStorage`)**: 네트워크 단절이나 오프라인 환경에서도 기기에 일지 영구 보존
  - **중앙 클라우드 DB (`chemical_logs`)**: Supabase 연동 시 클라우드 자동 동기화

### 4. 🔒 관리자 전용 기능 (Admin Controls)
- 화면 최하단 전용 로그인 모달 분리 (일반 연구원 사용 간섭 최소화)
- 비품 신규 등록, 정보 수정, 수리/점검 상태 변경
- 대여 이력 전체 조회 및 비품 대여 CSV 내보내기
- 시약 보관 위치 정보 수정 및 신규 소모품 등록

---

## 📁 프로젝트 파일 구조

```
2DQH-equipment/
├── index.html                   # 메인 웹앱 마크업 (모바일 뷰포트, 상단바, 바텀바)
├── style.css                    # 2DQH 디자인 시스템 CSS (브랜드 레드 테마, 특별관리물질 스타일)
├── app.js                       # 프론트엔드 비즈니스 로직 & 취급일지 모달 & Supabase 연동
├── consumables_catalog.js       # 2DQH 연구실 시약 327종 표준 도감 (특별관리물질 16종 법정 매칭)
├── create_chemical_logs.sql     # 특별관리물질 취급일지 법정 테이블 및 RLS 스키마
├── seed_reagents.sql            # 시약 327종 Supabase DB 적재용 쿼리
├── consumables_migration.sql    # 소모품/시약 위치 안내 테이블 마이그레이션
├── supabase.sql                 # 비품(assets), 대여(loans), 관리자(user_roles) 테이블 스키마
├── security_patch.sql           # Supabase 보안 및 RLS 강화 패치
├── logo_2dqh.jpg                # 2DQH 연구단 공식 로고
├── vercel.json                  # Vercel 배포 보안 정책 (CSP 헤더 설정)
└── .github/workflows/
    └── supabase-keepalive.yml   # Supabase 인스턴스 3일 주기 자동 Keep-Alive 핑
```

---

## 🛠️ 기술 스택

- **Frontend**: Vanilla JavaScript (ES6+), CSS3 (CSS Variables, Flexbox/Grid, Mobile First), HTML5
- **Backend / Database**: [Supabase](https://supabase.com) (PostgreSQL 15, Row Level Security, Trigram Full-Text Search)
- **Deployment**: [Vercel](https://vercel.com) / GitHub Pages
- **Automation**: GitHub Actions (Keep-Alive Cron Workflow)

---

## ⚙️ 설정 및 배포 방법

### 1. 로컬 환경 실행
별도의 빌드 도구(`npm install` 등) 없이 브라우저에서 `index.html`을 바로 열거나 로컬 웹 서버(`Live Server`, `python -m http.server`)로 즉시 구동할 수 있습니다.

### 2. 정적 웹 배포 (Vercel / GitHub Pages)
GitHub 저장소(`main` 브랜치)에 푸시하면 Vercel 또는 GitHub Pages를 통해 별도 설정 없이 즉시 자동 배포됩니다.

### 3. Supabase 연동 (선택 사항)
1. [supabase.com](https://supabase.com)에서 프로젝트를 생성합니다.
2. Supabase SQL Editor에서 아래 쿼리를 순차 실행합니다:
   - `supabase.sql` (비품 및 대여 기본 테이블)
   - `consumables_migration.sql` (시약/소모품 위치 안내 테이블)
   - `create_chemical_logs.sql` (특별관리물질 취급일지 법정 테이블)
3. `app.js` 상단의 `SUPABASE_URL`과 `SUPABASE_ANON_KEY`에 프로젝트 API 키를 입력합니다.  
   *(미입력 시에도 브라우저 로컬 저장소를 통해 100% 정상 작동합니다.)*
