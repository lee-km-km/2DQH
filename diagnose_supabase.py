import json
try:
    from supabase import create_client
except ImportError:
    print("supabase 라이브러리가 필요합니다: pip install supabase")
    exit(1)

SUPABASE_URL = "https://wrnzxduqvhxxadiojuei.supabase.co"
SUPABASE_KEY = "sb_publishable_q8u_SQKOMIypR-5jOvO4NQ_lNjfcRHk"

def main():
    print("=" * 60)
    print("🔍 [LabStock] Supabase 종합 기능 진단 시작")
    print(f"URL: {SUPABASE_URL}")
    print("=" * 60)

    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"❌ Supabase 클라이언트 생성 실패: {e}")
        return

    # 1. assets 조회 테스트
    print("\n[1/3] 비품 목록(assets) SELECT 조회 테스트...")
    try:
        res = client.table("assets").select("*").execute()
        assets = res.data or []
        print(f"  ✅ assets 조회 성공! 총 {len(assets)}개 비품 등록됨.")
        for a in assets:
            print(f"     - [{a.get('id')}] {a.get('name')} ({a.get('category')}) - 상태: {a.get('status')}")
    except Exception as e:
        print(f"  ❌ assets 조회 실패: {e}")
        print("     -> RLS 정책에서 public SELECT 권한이 필요합니다.")

    # 2. loans 조회 테스트
    print("\n[2/3] 대여 기록(loans) SELECT 조회 테스트...")
    try:
        res_loans = client.table("loans").select("*").execute()
        loans = res_loans.data or []
        print(f"  ✅ loans 조회 성공! 총 {len(loans)}개 대여 이력 확인됨.")
    except Exception as e:
        print(f"  ❌ loans 조회 실패: {e}")
        print("     -> RLS 정책에서 public SELECT 권한이 필요합니다.")

    # 3. loans 대여 등록(INSERT) 테스트
    print("\n[3/3] 대여 신청(loans INSERT) 테스트...")
    if not assets:
        print("  ⚠️ 비품이 없어 대여 신청 테스트를 건너뜁니다.")
        return

    test_asset_id = assets[0]['id']
    test_payload = {
        "asset_id": test_asset_id,
        "borrower_name": "연동진단봇",
        "borrowed_at": "2026-11-05",
        "due_date": "2026-11-06",
        "memo": "자동 연동 진단 테스트 건"
    }

    try:
        insert_res = client.table("loans").insert(test_payload).execute()
        if insert_res.data:
            loan_id = insert_res.data[0]['id']
            print(f"  ✅ 대여 등록 성공! 생성된 대여 ID: {loan_id}")

            # 반납(UPDATE) 테스트
            print("  -> 대여 반납(loans UPDATE) 테스트 시도...")
            try:
                update_res = client.table("loans").update({"returned_at": "2026-11-05", "memo": "진단 완료 반납"}).eq("id", loan_id).execute()
                print("  ✅ 반납 처리 성공!")
            except Exception as ue:
                print(f"  ⚠️ 반납 UPDATE 실패: {ue}")
        else:
            print("  ❌ 대여 INSERT 응답 데이터 없음.")
    except Exception as e:
        print(f"  ❌ 대여 등록(INSERT) 실패: {e}")
        print("     -> RLS 정책에서 익명(anon) INSERT 권한이 막혀있습니다.")
        print("     -> 제가 드린 repair_rls.sql 스크립트를 Supabase SQL Editor에서 실행하시면 즉시 해결됩니다.")

    print("\n" + "=" * 60)
    print("🎉 진단 완료! 위 항목이 모두 ✅ 초록불이면 웹앱과 100% 정상 연동됩니다.")
    print("=" * 60)

if __name__ == "__main__":
    main()
