-- Atomic balance adjustment used for both bet settlement (credit) and bet
-- placement (debit, via a negative amount). Runs the read-modify-write as
-- a single UPDATE so concurrent bets on the same user serialize on the row
-- lock instead of racing, and refuses to push a balance negative.
create or replace function public.increment_balance(p_user_id uuid, p_amount numeric)
returns numeric
language plpgsql
as $$
declare
  new_balance numeric;
begin
  update public.users
  set balance = balance + p_amount
  where id = p_user_id
  returning balance into new_balance;

  if new_balance is null then
    raise exception 'User % not found', p_user_id;
  end if;

  if new_balance < 0 then
    raise exception 'Insufficient balance for user %', p_user_id;
  end if;

  return new_balance;
end;
$$;

-- Guards against re-awarding a week's Toss-Up Five bonus if the settlement
-- job runs again after the week has already been paid out (e.g. the
-- Sunday-noon safety sweep re-checking a week that finished Saturday night).
alter table public.toss_up_weeks add column bonus_awarded_at timestamptz;
