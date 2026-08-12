/*
# Create plinko_games table

1. Overview
Adds a table to track individual Plinko game rounds — each drop of the ball is recorded
with the bet amount, the landing zone, the multiplier, and the win/loss result. This
provides a history of plays for each user and enables analytics on the game.

2. New Tables
- `plinko_games`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `bet_amount` (numeric, not null) — the stake in wallet currency
  - `zone_index` (integer, not null) — which of the 7 zones the ball landed in (0-6)
  - `zone_name` (text, not null) — human-readable zone label
  - `multiplier` (numeric, not null) — the odds multiplier for that zone
  - `win_amount` (numeric, not null, default 0) — payout (bet * multiplier, or 0)
  - `currency` (text, default 'KES')
  - `created_at` (timestamptz, default now())

3. Security
- Enable RLS on `plinko_games`.
- Owner-scoped CRUD: each authenticated user can only access their own game records.
- SELECT, INSERT, UPDATE, DELETE policies using auth.uid() = user_id.
*/

CREATE TABLE IF NOT EXISTS plinko_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  bet_amount numeric NOT NULL,
  zone_index integer NOT NULL,
  zone_name text NOT NULL,
  multiplier numeric NOT NULL,
  win_amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'KES',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plinko_games_user_id ON plinko_games(user_id);
CREATE INDEX IF NOT EXISTS idx_plinko_games_created_at ON plinko_games(created_at DESC);

ALTER TABLE plinko_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_plinko_games" ON plinko_games;
CREATE POLICY "select_own_plinko_games" ON plinko_games FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_plinko_games" ON plinko_games;
CREATE POLICY "insert_own_plinko_games" ON plinko_games
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_plinko_games" ON plinko_games;
CREATE POLICY "update_own_plinko_games" ON plinko_games
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_plinko_games" ON plinko_games;
CREATE POLICY "delete_own_plinko_games" ON plinko_games
  TO authenticated USING (auth.uid() = user_id);
