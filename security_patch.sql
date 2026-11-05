-- LabStock v1.1 보안 패치 (이미 운영 중인 DB용)
-- Supabase Dashboard -> SQL Editor 에서 이 파일 전체를 한 번 실행하세요. 여러 번 실행해도 안전합니다.
-- 실행 전 DB 백업을 권장합니다. 기존 데이터는 삭제/변경하지 않습니다.
--
-- 포함 내용
--  1) 입고 기록을 DB에서도 관리자만 가능하도록 (RPC 직접 호출 차단)
--  2) 대여 등록은 본인 세션(user_id = auth.uid())으로만, 수정 가능한 컬럼 제한
--  3) 중복 대여 방지를 부분 유니크 인덱스로 교체, 수리 중 비품 대여 차단
--  4) 구매요청 상태 위조 방지 + 1시간 20건 제한(이메일 폭탄 방지) + 메모 길이 제한
--  5) updated_at 자동 갱신, SECURITY DEFINER 함수 search_path 고정

-- ============================================================
-- 0) 사전 점검: 이미 같은 비품에 진행 중인 대여가 2건 이상이면 중단
-- ============================================================
do $$
begin
  if exists (
    select 1 from public.loans where returned_at is null
    group by asset_id having count(*) > 1
  ) then
    raise exception '같은 비품에 반납되지 않은 대여 기록이 2건 이상 있습니다. 하나를 반납 처리한 뒤 다시 실행하세요.';
  end if;
end $$;

-- ============================================================
-- 1) 공통: updated_at 자동 갱신 함수
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- 2) loans: 권한/정책/제약
-- ============================================================
alter table public.loans drop constraint if exists loans_memo_len;
alter table public.loans add constraint loans_memo_len check (length(memo) <= 2000) not valid;

revoke all on public.loans from anon, authenticated;
grant select on public.loans to anon, authenticated;
grant insert (asset_id, borrower_name, borrowed_at, due_date, memo, user_id)
  on public.loans to authenticated;
grant update (borrower_name, due_date, returned_at, memo, updated_at)
  on public.loans to authenticated;
grant delete on public.loans to authenticated;
revoke usage, select on sequence public.loans_id_seq from anon;
grant usage, select on sequence public.loans_id_seq to authenticated;

drop policy if exists loans_insert_public on public.loans;
drop policy if exists loans_insert_own on public.loans;
drop policy if exists loans_update_public on public.loans;
drop policy if exists loans_update_owner_or_admin on public.loans;

create policy loans_insert_own
  on public.loans for insert to authenticated
  with check (user_id = (select auth.uid()) and returned_at is null);

create policy loans_update_owner_or_admin
  on public.loans for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));

-- ============================================================
-- 3) 중복 대여 방지 + 수리 중 비품 차단 + updated_at
-- ============================================================
drop trigger if exists loans_prevent_duplicate_active on public.loans;
drop function if exists public.prevent_duplicate_active_loan();
create unique index if not exists loans_one_active_per_asset
  on public.loans(asset_id) where returned_at is null;

create or replace function public.check_loan_asset_available()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.assets a
    where a.id = new.asset_id and a.status = 'available'
  ) then
    raise exception '대여할 수 없는 비품입니다. (수리 중이거나 존재하지 않음)';
  end if;
  return new;
end;
$$;

drop trigger if exists loans_check_asset_available on public.loans;
create trigger loans_check_asset_available
  before insert on public.loans
  for each row execute function public.check_loan_asset_available();

drop trigger if exists loans_set_updated_at on public.loans;
create trigger loans_set_updated_at
  before update on public.loans
  for each row execute function public.set_updated_at();

-- user_roles 는 SECURITY DEFINER 함수(is_admin)로만 조회
revoke all on public.user_roles from anon, authenticated;

-- ============================================================
-- 4) 소모품: 입고는 관리자만 (consumables_migration.sql 적용 후 실행)
-- ============================================================
create or replace function public.record_consumable_movement(
  p_consumable_id uuid,
  p_movement_type text,
  p_quantity numeric,
  p_actor text,
  p_note text default ''
) returns public.consumable_movements
language plpgsql security definer set search_path = ''
as $$
declare
  item public.consumables%rowtype;
  movement public.consumable_movements%rowtype;
  next_quantity numeric(12,2);
begin
  if p_movement_type not in ('use','in') then raise exception '유효하지 않은 재고 변동 유형입니다.'; end if;
  if p_movement_type = 'in' and not public.is_admin() then raise exception '입고 기록은 관리자만 할 수 있습니다.'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception '수량은 0보다 커야 합니다.'; end if;
  if p_actor is null or length(trim(p_actor)) = 0 then raise exception '기록자를 입력하세요.'; end if;

  select * into item from public.consumables where id = p_consumable_id for update;
  if not found then raise exception '소모품을 찾을 수 없습니다.'; end if;

  next_quantity := case when p_movement_type = 'in' then item.quantity + p_quantity else item.quantity - p_quantity end;
  if next_quantity < 0 then raise exception '현재 재고보다 많은 수량을 차감할 수 없습니다. 현재 재고: %', item.quantity; end if;

  update public.consumables set quantity = next_quantity, updated_at = now() where id = p_consumable_id;

  insert into public.consumable_movements(consumable_id,movement_type,quantity,actor,note)
  values(p_consumable_id,p_movement_type,p_quantity,trim(p_actor),coalesce(p_note,'')) returning * into movement;

  return movement;
end;
$$;
revoke all on function public.record_consumable_movement(uuid,text,numeric,text,text) from public;
grant execute on function public.record_consumable_movement(uuid,text,numeric,text,text) to anon, authenticated;

-- ============================================================
-- 5) 구매요청: 상태 위조 방지, 폭주 제한, 메모 길이
-- ============================================================
alter table public.reorder_requests drop constraint if exists reorder_requests_note_len;
alter table public.reorder_requests add constraint reorder_requests_note_len check (length(note) <= 500) not valid;
alter table public.consumable_movements drop constraint if exists consumable_movements_note_len;
alter table public.consumable_movements add constraint consumable_movements_note_len check (length(note) <= 500) not valid;

revoke all on public.reorder_requests from anon, authenticated;
grant select on public.reorder_requests to anon, authenticated;
grant insert (consumable_id, requested_quantity, requester, note, status)
  on public.reorder_requests to anon, authenticated;
grant update, delete on public.reorder_requests to authenticated;

drop policy if exists reorder_requests_public_create on public.reorder_requests;
create policy reorder_requests_public_create
  on public.reorder_requests for insert to anon, authenticated
  with check (status = 'pending');

create or replace function public.limit_reorder_request_rate()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.reorder_requests
      where created_at > now() - interval '1 hour') >= 20 then
    raise exception '구매요청이 짧은 시간에 너무 많이 접수되었습니다. 잠시 후 다시 시도하세요.';
  end if;
  return new;
end;
$$;

drop trigger if exists reorder_requests_rate_limit on public.reorder_requests;
create trigger reorder_requests_rate_limit
  before insert on public.reorder_requests
  for each row execute function public.limit_reorder_request_rate();

drop trigger if exists consumables_set_updated_at on public.consumables;
create trigger consumables_set_updated_at
  before update on public.consumables
  for each row execute function public.set_updated_at();

drop trigger if exists reorder_requests_set_updated_at on public.reorder_requests;
create trigger reorder_requests_set_updated_at
  before update on public.reorder_requests
  for each row execute function public.set_updated_at();
