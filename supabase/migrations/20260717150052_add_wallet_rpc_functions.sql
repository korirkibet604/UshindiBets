/*
# Wallet debit/credit RPC functions

1. Overview
Adds two SECURITY DEFINER Postgres functions callable via supabase.rpc() from the
authenticated client, so wallet balance changes happen atomically server-side even
though RLS blocks direct UPDATE on wallets.

2. New Functions
- debit_wallet(p_user_id, p_amount): subtracts p_amount from balance if sufficient; returns new balance.
- credit_wallet(p_user_id, p_amount, p_bonus boolean): adds to balance or bonus_balance; returns new balance.

3. Security
- SECURITY DEFINER so they bypass RLS on wallets (which is read-only for users).
- Validates the caller's auth.uid() matches p_user_id to prevent cross-user tampering.
- Raises an exception if insufficient funds for debit.

4. Notes
- Idempotent enough for single-call flows; callers should still guard against double-submit.
- Returns numeric new balance.
*/

CREATE OR REPLACE FUNCTION public.debit_wallet(p_user_id uuid, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance numeric;
  current_balance numeric;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not allowed to debit another user wallet';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Debit amount must be positive';
  END IF;

  SELECT balance INTO current_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  IF current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE public.wallets
    SET balance = balance - p_amount, updated_at = now()
    WHERE user_id = p_user_id
    RETURNING balance INTO new_balance;

  RETURN new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_bonus boolean DEFAULT false
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance numeric;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not allowed to credit another user wallet';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;

  IF p_bonus THEN
    UPDATE public.wallets
      SET bonus_balance = bonus_balance + p_amount, updated_at = now()
      WHERE user_id = p_user_id
      RETURNING bonus_balance INTO new_balance;
  ELSE
    UPDATE public.wallets
      SET balance = balance + p_amount, updated_at = now()
      WHERE user_id = p_user_id
      RETURNING balance INTO new_balance;
  END IF;

  RETURN new_balance;
END;
$$;
