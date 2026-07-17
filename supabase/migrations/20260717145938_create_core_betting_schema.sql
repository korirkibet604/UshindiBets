/*
# Core Betting Platform Schema

1. Overview
This migration creates the complete data model for a multi-user sports betting
web app (UshindiBets). It supports user accounts (Supabase auth), multi-currency
wallets, deposits/withdrawals via Flutterwave, bet slips with multiple selections,
jackpot entries, odds/match/transaction notifications, and responsible-gaming
self-limits. All user-owned tables are owner-scoped via user_id with DEFAULT auth.uid()
and protected with per-verb RLS policies scoped to authenticated users.

2. New Tables
- profiles: extends auth.users with display name, phone, country, currency, avatar.
- wallets: one per user, stores balance + bonus balance in user's currency.
- transactions: deposits, withdrawals, bet stakes, payouts, bonuses (ledger).
- bet_slips: a placed bet (single or accumulator) with total odds, stake, status.
- bet_selections: individual legs within a bet slip (match, market, pick, odds).
- jackpot_entries: user picks for a jackpot competition.
- odds_alerts: user-defined threshold alerts on match odds.
- notifications: in-app notification feed (and mirror for push).
- responsible_limits: self-imposed deposit/loss/stake caps per period.
- app_settings: key/value user preferences (theme, push subscription, etc).

3. Security
- RLS enabled on every table.
- Owner-scoped CRUD (4 policies per table) for authenticated users.
- profiles: user can read/update own row only (no insert needed - trigger creates).
- wallets: user reads own wallet; inserts/updates/deletes blocked at RLS (backend/edge fn manages balance via service role). Select allowed for owner.
- transactions: owner can read + insert (deposits initiate a row); updates restricted to backend (status changes). For simplicity, owner can insert + read; update/delete blocked.
- bet_slips + bet_selections: full owner CRUD.
- jackpot_entries: full owner CRUD.
- odds_alerts: full owner CRUD.
- notifications: owner read + update (mark read) + insert (system) ; delete own.
- responsible_limits: owner read + insert/update (upsert) ; no delete.
- app_settings: full owner CRUD.

4. Important Notes
- A trigger auto-creates a profile + wallet row when a new auth.user signs up.
- Wallet balance is stored as numeric(14,2). Currency code (ISO 4217) on profiles.
- All timestamps are timestamptz defaulting to now().
- FKs cascade on user delete for user-owned tables.
*/

-- ========== profiles ==========
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  phone text,
  country_code text DEFAULT 'KE',
  country_name text DEFAULT 'Kenya',
  currency text DEFAULT 'KES',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ========== wallets ==========
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  bonus_balance numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_select_own" ON wallets;
CREATE POLICY "wallets_select_own" ON wallets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- ========== transactions ==========
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- deposit | withdrawal | bet_stake | bet_payout | bonus | adjustment
  amount numeric(14,2) NOT NULL, -- positive for credit, negative for debit
  currency text NOT NULL DEFAULT 'KES',
  status text NOT NULL DEFAULT 'pending', -- pending | successful | failed | reversed
  reference text, -- flutterwave tx_ref / internal
  provider text, -- flutterwave | system | manual
  meta jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ========== bet_slips ==========
CREATE TABLE IF NOT EXISTS bet_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'single', -- single | accumulator | jackpot
  stake numeric(14,2) NOT NULL,
  total_odds numeric(10,4) NOT NULL DEFAULT 1,
  potential_win numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open', -- open | won | lost | void | cashed_out
  payout numeric(14,2) DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  source_match_id text,
  jackpot_id text,
  created_at timestamptz DEFAULT now(),
  settled_at timestamptz
);
ALTER TABLE bet_slips ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_bet_slips_user ON bet_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_slips_status ON bet_slips(status);

DROP POLICY IF EXISTS "bet_slips_select_own" ON bet_slips;
CREATE POLICY "bet_slips_select_own" ON bet_slips FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "bet_slips_insert_own" ON bet_slips;
CREATE POLICY "bet_slips_insert_own" ON bet_slips FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "bet_slips_update_own" ON bet_slips;
CREATE POLICY "bet_slips_update_own" ON bet_slips FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "bet_slips_delete_own" ON bet_slips;
CREATE POLICY "bet_slips_delete_own" ON bet_slips FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ========== bet_selections ==========
CREATE TABLE IF NOT EXISTS bet_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_slip_id uuid NOT NULL REFERENCES bet_slips(id) ON DELETE CASCADE,
  match_id text NOT NULL,
  match_name text,
  market text NOT NULL, -- e.g. 1X2 | Double Chance | Over/Under
  pick text NOT NULL, -- e.g. "Home" | "1" | "Over 2.5"
  odds numeric(10,4) NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | won | lost | void
  created_at timestamptz DEFAULT now()
);
ALTER TABLE bet_selections ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_bet_selections_slip ON bet_selections(bet_slip_id);

-- Owner can read selections via their slip; allow insert/update/delete through slip ownership
DROP POLICY IF EXISTS "bet_selections_select_own" ON bet_selections;
CREATE POLICY "bet_selections_select_own" ON bet_selections FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM bet_slips WHERE bet_slips.id = bet_selections.bet_slip_id AND bet_slips.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "bet_selections_insert_own" ON bet_selections;
CREATE POLICY "bet_selections_insert_own" ON bet_selections FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM bet_slips WHERE bet_slips.id = bet_selections.bet_slip_id AND bet_slips.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "bet_selections_update_own" ON bet_selections;
CREATE POLICY "bet_selections_update_own" ON bet_selections FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM bet_slips WHERE bet_slips.id = bet_selections.bet_slip_id AND bet_slips.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM bet_slips WHERE bet_slips.id = bet_selections.bet_slip_id AND bet_slips.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "bet_selections_delete_own" ON bet_selections;
CREATE POLICY "bet_selections_delete_own" ON bet_selections FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM bet_slips WHERE bet_slips.id = bet_selections.bet_slip_id AND bet_slips.user_id = auth.uid())
  );

-- ========== jackpot_entries ==========
CREATE TABLE IF NOT EXISTS jackpot_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  jackpot_type text NOT NULL, -- must-be-won | midweek
  jackpot_id text,
  picks jsonb NOT NULL, -- array of {matchId, pick}
  stake numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'entered',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE jackpot_entries ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_jackpot_entries_user ON jackpot_entries(user_id);

DROP POLICY IF EXISTS "jackpot_entries_select_own" ON jackpot_entries;
CREATE POLICY "jackpot_entries_select_own" ON jackpot_entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "jackpot_entries_insert_own" ON jackpot_entries;
CREATE POLICY "jackpot_entries_insert_own" ON jackpot_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "jackpot_entries_update_own" ON jackpot_entries;
CREATE POLICY "jackpot_entries_update_own" ON jackpot_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "jackpot_entries_delete_own" ON jackpot_entries;
CREATE POLICY "jackpot_entries_delete_own" ON jackpot_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ========== odds_alerts ==========
CREATE TABLE IF NOT EXISTS odds_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id text NOT NULL,
  match_name text,
  market text NOT NULL DEFAULT '1X2',
  pick text NOT NULL,
  target_odds numeric(10,4),
  current_odds numeric(10,4),
  triggered boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE odds_alerts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_odds_alerts_user ON odds_alerts(user_id);

DROP POLICY IF EXISTS "odds_alerts_select_own" ON odds_alerts;
CREATE POLICY "odds_alerts_select_own" ON odds_alerts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "odds_alerts_insert_own" ON odds_alerts;
CREATE POLICY "odds_alerts_insert_own" ON odds_alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "odds_alerts_update_own" ON odds_alerts;
CREATE POLICY "odds_alerts_update_own" ON odds_alerts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "odds_alerts_delete_own" ON odds_alerts;
CREATE POLICY "odds_alerts_delete_own" ON odds_alerts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ========== notifications ==========
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL, -- odds | match | transaction | marketing | system
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read);

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ========== responsible_limits ==========
CREATE TABLE IF NOT EXISTS responsible_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  period text NOT NULL, -- daily | weekly | monthly
  max_deposit numeric(14,2),
  max_loss numeric(14,2),
  max_stake numeric(14,2),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, period)
);
ALTER TABLE responsible_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "responsible_limits_select_own" ON responsible_limits;
CREATE POLICY "responsible_limits_select_own" ON responsible_limits FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "responsible_limits_insert_own" ON responsible_limits;
CREATE POLICY "responsible_limits_insert_own" ON responsible_limits FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "responsible_limits_update_own" ON responsible_limits;
CREATE POLICY "responsible_limits_update_own" ON responsible_limits FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========== app_settings ==========
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, key)
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_select_own" ON app_settings;
CREATE POLICY "app_settings_select_own" ON app_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "app_settings_insert_own" ON app_settings;
CREATE POLICY "app_settings_insert_own" ON app_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "app_settings_update_own" ON app_settings;
CREATE POLICY "app_settings_update_own" ON app_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "app_settings_delete_own" ON app_settings;
CREATE POLICY "app_settings_delete_own" ON app_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ========== Auto-create profile + wallet on signup ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id, currency)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'currency', 'KES'))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== updated_at triggers ==========
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_touch ON profiles;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS wallets_touch ON wallets;
CREATE TRIGGER wallets_touch BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS app_settings_touch ON app_settings;
CREATE TRIGGER app_settings_touch BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
