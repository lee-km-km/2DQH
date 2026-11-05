# 2DQH 비품 (2DQH Equipment Management)

**IBS 이차원양자헤테로구조체연구단(Center for 2D Quantum Heterostructures)** 연구원들을 위한 전용 비품 대여 및 소모품 관리 시스템입니다.

별도의 유료 백엔드 서버 없이 정적 호스팅([Vercel](https://vercel.com), GitHub Pages 등)과 [Supabase](https://supabase.com) 무료 플랜만으로 동작하며, 연구실 내 태블릿, 스마트폰, PC 어디서나 쾌적하게 사용할 수 있습니다.

---

## 🔬 핵심 설계 철학

1. **모바일 우선 초간편 퀵 대여 (Quick-Borrow First)**
   - 95%의 연구원 행동 패턴: *"비품 터치 ➔ 이름 확인 ➔ 대여 완료"*
   - 모바일 접속 시 복잡한 사이드바, 검색창, 거대한 현황 테이블을 배제하고 **68px 컴팩트 비품 카드**로 즉시 진입합니다.
   - 비품이 수십 개로 늘어나도 버벅임 없이 시원하게 스크롤 및 카테고리 필터링이 가능합니다.

2. **상호 신뢰 기반의 부드러운 반납 리마인드**
   - 불필요한 연체 독촉 메일이나 공개적인 연체자 망신 주기 기능을 배제했습니다.
   - 본인이 현재 빌린 비품이 있는 경우에만 화면 최상단에 **`💡 [연구원]님, 현재 [비품명] 사용 중입니다 [✓ 반납하기]`** 배너가 노출되어 1초 만에 제자리에 반납할 수 있습니다.

3. **이차원양자헤테로구조체연구단(2DQH) 공식 브랜딩**
   - 2DQH 공식 로고 및 시그니처 딥 크림슨 레드(`#C2272D`), 티타늄 차콜 그레이(`#58595B`) 디자인 토큰 적용.
   - 일반 연구원 화면에서 "공용 DB 연결됨", "관리자 로그인" 등의 시각적 소음을 걷어내고 정갈한 연구소풍 UI를 구현했습니다.

4. **365일 영구 무료 가동 (Supabase 7일 휴면 원천 방지)**
   - Supabase 무료 플랜의 7일 비활성 시 자동 일시 정지(Pause) 문제를 방지하기 위해, **GitHub Actions가 3일마다 자동으로 가벼운 Keep-Alive 핑**을 보내 영구 활성 상태를 유지합니다.

---

## 📋 주요 기능

### 1. 비품 관리 (Equipment)
- **비품 현황 조회**: 실시간 대여 가능 여부(`대여 가능` / `대여 중` / `수리 중`) 표시.
- **초간편 대여**: 비품 카드 터치 ➔ 이름 확인 ➔ 즉시 대여 등록.
- **안전한 중복 대여 방지**: 동일 비품의 동시 중복 대여를 데이터베이스(RLS & Unique Index) 레벨에서 원천 차단.
- **간편 반납**: 본인이 대여한 비품은 상단 배너 또는 현황 목록에서 클릭 한 번으로 반납 처리.

### 2. 소모품 관리 (Consumables - 선택적 활용)
- 피펫 팁, 시약, 장갑 등 연구실 소모품의 실시간 재고 관리.
- 연구원의 자율적인 사용 수량 입력 시 재고 자동 차감.
- 최소 보유량 이하 도달 시 "부족" 경고 표시.

### 3. 관리자 전용 기능 (Admin)
- 일반 사용자 화면을 방해하지 않도록 화면 최하단 서브푸터(`⚙️ 관리자`)로 로그인 분리.
- 비품 신규 등록 / 정보 수정 / 상태 변경(수리 중 등).
- 전체 대여 이력 조회 및 CSV 내보내기.

---

## 📁 파일 구조

```
2DQH-equipment/
├── index.html                           # 메인 웹앱 마크업 (2DQH 공식 헤더 및 뷰포트 구성)
├── style.css                            # 2DQH 디자인 시스템 CSS (딥 레드 토큰, 68px 퀵 카드)
├── app.js                              # 프론트엔드 비즈니스 로직 & Supabase 연동
├── logo_2dqh.jpg                       # IBS 이차원양자헤테로구조체연구단 공식 심볼 로고
├── vercel.json                         # Vercel 배포 보안 정책(CSP 헤더 설정)
├── supabase.sql                        # Supabase 기본 테이블(assets, loans, user_roles) 스키마
├── consumables_migration.sql           # 소모품/재고변동 함수 및 스키마
├── repair_rls.sql                      # RLS 권한 및 안전성 패치 스크립트
├── .github/
│   └── workflows/
│       └── supabase-keepalive.yml      # 3일 주기 자동 Keep-Alive 핑 (7일 휴면 방지)
└── README.md                           # 본 문서
```

---

## 🚀 설치 및 배포 가이드

### 1. Supabase 프로젝트 준비
1. [supabase.com](https://supabase.com)에 로그인하고 새 프로젝트를 생성합니다.
2. **Project Settings → API**에서 `Project URL`과 `anon (public) key`를 복사합니다.
3. `app.js` 상단의 연결 정보를 설정합니다:
   ```javascript
   const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR_PUBLISHABLE_ANON_KEY';
   ```
4. **SQL Editor**에서 `supabase.sql` 내용을 실행하여 테이블과 보안 정책을 구성합니다.

### 2. 관리자 계정 생성 (선택)
1. Supabase 대시보드 ➔ **Authentication ➔ Users ➔ Add user**에서 관리자 이메일/비밀번호 생성.
2. **SQL Editor**에서 해당 계정에 관리자 권한 부여:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, 'admin' FROM auth.users WHERE email = 'admin@example.com';
   ```

### 3. Vercel 또는 GitHub 배포
1. 본 리포지토리를 GitHub에 푸시합니다.
2. [Vercel](https://vercel.com)에서 GitHub 저장소를 연결하여 배포합니다 (`Framework Preset: Other / Static`).
3. 배포된 URL을 QR 코드로 만들어 연구실 비품실 출입문 또는 선반에 부착하면 모든 연구원이 스마트폰 카메라로 즉시 접속할 수 있습니다.

---

## ⚡ Supabase 7일 휴면 방지 자동화 (Keep-Alive)

이 리포지토리에는 [GitHub Actions Keep-Alive 워크플로우](.github/workflows/supabase-keepalive.yml)가 내장되어 있습니다.

- **작동 방식**: 매 3일마다 오전 0시(UTC)에 자동으로 실행되어 Supabase REST API에 가벼운 핑을 보내 프로젝트를 상시 활성 상태로 유지합니다.
- **수동 실행**: GitHub 저장소의 **Actions** 탭 ➔ **Supabase Keep-Alive** 선택 ➔ **Run workflow**를 누르면 언제든 즉시 핑을 테스트할 수 있습니다.
- **GitHub Secrets 설정 (선택 권장)**:
  - Repository **Settings ➔ Secrets and variables ➔ Actions**
  - `SUPABASE_URL`: `https://YOUR_PROJECT_REF.supabase.co`
  - `SUPABASE_ANON_KEY`: `YOUR_ANON_KEY`

---

## 💡 연구원 이용 안내 (Q&A)

**Q. 비품 대여 시 로그인이 필요한가요?**  
아닙니다. 연구원의 시간을 아끼기 위해 별도 회원가입/로그인 없이 본인 이름만 입력하면 1초 만에 대여할 수 있습니다.

**Q. 내가 빌린 비품을 반납하려면 어떻게 하나요?**  
대여했던 스마트폰이나 PC로 접속하시면 화면 상단에 **`[지금 반납하기]`** 배너가 자동으로 뜹니다. 해당 버튼을 누르면 즉시 반납 완료됩니다.

**Q. 다른 기기나 PC에서 반납하고 싶을 때는요?**  
목록에서 해당 비품을 찾거나, 화면 하단 `대여 현황`에서 본인 이름을 확인하고 반납 처리를 누르시면 됩니다.

---

© IBS 이차원양자헤테로구조체연구단 (Center for 2D Quantum Heterostructures)
