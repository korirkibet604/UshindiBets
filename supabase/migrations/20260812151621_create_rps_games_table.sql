/*
# Create RPS (Rock Paper Scissors) games table

1. New Tables
- `rps_games`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `bet_amount` (numeric, not null) — amount wagered
  - `player_choice` (text, not null) — rock, paper, or scissors
  - `computer_choice` (text, not null) — rock, paper, or scissors
  - `result` (text, not null) — win, loss, or draw
  - `win_amount` (numeric, not null, default 0) — amount won (0 for loss/draw)
  - `currency` (text, default 'KES')
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `rps_games`.
- Owner-scoped CRUD: each authenticated user can only access their own rows.
- user_id defaults to auth.uid() so inserts omitting user_id still succeed.
*/

CREATE TABLE IF NOT EXISTS rps_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  bet_amount numeric NOT NULL,
  player_choice text NOT NULL CHECK (player_choice IN ('rock', 'paper', 'scissors')),
  computer_choice text NOT NULL CHECK (computer_choice IN ('rock', 'paper', 'scissors')),
  result text NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  win_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rps_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_rps" ON rps_games;
CREATE POLICY "select_own_rps" ON rps_games FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_rps" ON rps_games;
CREATE POLICY "insert_own_rps" ON rps_games FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_rps" ON rps_games;
CREATE POLICY "update_own_rps" ON rps_games FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_rps" ON rps_games;
CREATE POLICY "delete_own_rps" ON rps_games FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
