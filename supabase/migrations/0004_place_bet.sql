-- Places a bet atomically: debit the wager, insert the bet, insert every
-- leg, all in one transaction. If anything fails (insufficient balance, a
-- bad leg), the whole thing rolls back — including the balance debit —
-- rather than leaving a partially-placed bet or a charged wager with no
-- bet to show for it.
--
-- Per-leg validation (game is open, not yet kicked off, selection matches
-- the market, line/odds pulled fresh from the live game row) happens in
-- the Next.js route before calling this, since that logic reads more
-- naturally in TypeScript. This function trusts p_legs's line/odds values
-- as already-validated and focuses purely on making the write atomic.
create or replace function public.place_bet(
  p_user_id uuid,
  p_type text,
  p_wager numeric,
  p_legs jsonb -- array of {game_id, market, selection, line_at_placement, odds_at_placement}
)
returns uuid
language plpgsql
as $$
declare
  v_bet_id uuid;
  v_leg jsonb;
begin
  if p_wager <= 0 then
    raise exception 'Wager must be positive';
  end if;

  if jsonb_array_length(p_legs) < 1 then
    raise exception 'A bet needs at least one leg';
  end if;

  if p_type = 'straight' and jsonb_array_length(p_legs) <> 1 then
    raise exception 'A straight bet must have exactly one leg';
  end if;

  if p_type = 'parlay' and jsonb_array_length(p_legs) < 2 then
    raise exception 'A parlay needs at least two legs';
  end if;

  if p_type = 'parlay' and (
    select count(distinct v ->> 'game_id') from jsonb_array_elements(p_legs) v
  ) <> jsonb_array_length(p_legs) then
    raise exception 'A parlay cannot have two legs on the same game';
  end if;

  -- Raises (and rolls back this whole transaction) on insufficient balance.
  perform public.increment_balance(p_user_id, -p_wager);

  insert into public.bets (user_id, type, wager, status)
  values (p_user_id, p_type, p_wager, 'pending')
  returning id into v_bet_id;

  for v_leg in select * from jsonb_array_elements(p_legs)
  loop
    insert into public.bet_legs (bet_id, game_id, market, selection, line_at_placement, odds_at_placement, result)
    values (
      v_bet_id,
      (v_leg ->> 'game_id')::uuid,
      v_leg ->> 'market',
      v_leg ->> 'selection',
      nullif(v_leg ->> 'line_at_placement', 'null')::numeric,
      (v_leg ->> 'odds_at_placement')::integer,
      'pending'
    );
  end loop;

  return v_bet_id;
end;
$$;
