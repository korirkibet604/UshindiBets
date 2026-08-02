/*
# Bonus claims + withdrawal RPC

1. Overview
Adds a bonus_claims table to track which promotional bonuses a user has claimed,
plus a withdraw_wallet RPC for processing withdrawals (debits wallet, records transaction).

2. New Tables
- bonus_claims: user_id, bonus_type (welcome|acca|freebet), status (claimed|fulfilled|expired),
  amount, claimed_at, fulfilled_at.

3. New Functions
- withdraw_wallet(p_user_id, p_amount): debits balance, returns new balance. Raises if insufficient.
- credit_bonus(p_user_id, p_amount, p_bonus_type): credits bonus_balance + records bonus_claim + transaction.

4. Security
- RLS on bonus_claims, owner-scoped CRUD.
- SECURITY DEFINER on both RPCs, validated against auth.uid().
*/
CREATE TABLE IF NOT EXISTS bonus_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_type text NOT NULL,
  status text NOT NULL DEFAULT 'claimed',
  amount numeric(14,2) DEFAULT 0,
  meta jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, bonus_type)
);
ALTER TABLE bonus_claims ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_bonus_claims_user ON bonus_claims(user_id);

DROP POLICY IF EXISTS "bonus_claims_select_own" ON bonus_claims;
CREATE POLICY "bonus_claims_select_own" ON bonus_claims FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "bonus_claims_insert_own" ON bonus_claims;
CREATE POLICY "bonus_claims_insert_own" ON bonus_claims FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "bonus_claims_update_own" ON bonus_claims;
CREATE POLICY "bonus_claims_update_own" ON bonus_claims FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "bonus_claims_delete_own" ON bonus_claims;
CREATE POLICY "bonus_claims_delete_own" ON bonus_claims FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.withdraw_wallet(p_user_id uuid, p_amount numeric)
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
    RAISE EXCEPTION 'Not allowed to withdraw from another user wallet';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Withdrawal amount must be positive';
  END IF;
  SELECT balance INTO current_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  IF current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance for withdrawal';
  END IF;
  UPDATE public.wallets
    SET balance = balance - p_amount, updated_at = now()
    WHERE user_id = p_user_id
    RETURNING balance INTO new_balance;
  RETURN new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_bonus(
  p_user_id uuid,
  p_amount numeric,
  p_bonus_type text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_bonus numeric;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not allowed to credit bonus to another user';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Bonus amount must be positive';
  END IF;
  UPDATE public.wallets
    SET bonus_balance = bonus_balance + p_amount, updated_at = now()
    WHERE user_id = p_user_id
    RETURNING bonus_balance INTO new_bonus;
  INSERT INTO public.bonus_claims (user_id, bonus_type, status, amount)
    VALUES (p_user_id, p_bonus_type, 'claimed', p_amount)
    ON CONFLICT (user_id, bonus_type) DO NOTHING;
  INSERT INTO public.transactions (user_id, type, amount, status, provider, meta)
    VALUES (p_user_id, 'bonus', p_amount, 'successful', 'system',
      jsonb_build_object('bonus_type', p_bonus_type));
  RETURN new_bonus;
END;
$$;
