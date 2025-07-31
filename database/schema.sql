CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE currency_code AS ENUM ('USD','TRY');
CREATE TYPE debt_status AS ENUM ('pending','paid');
CREATE TYPE debt_type AS ENUM ('short','long');
CREATE TYPE expense_status AS ENUM ('paid','pending');
CREATE TYPE expense_type AS ENUM ('fixed','variable');
CREATE TYPE income_status AS ENUM ('expected','received');

-- User profile table extending auth.users
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Assets owned by user
CREATE TABLE assets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    quantity numeric NOT NULL,
    unit text NOT NULL,
    price_per_unit numeric NOT NULL,
    currency currency_code NOT NULL,
    conversion_rate numeric,
    total_value numeric GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
    auto_update boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assets_user_idx ON assets(user_id);

-- Debts table
CREATE TABLE debts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    creditor text NOT NULL,
    amount numeric NOT NULL,
    currency currency_code NOT NULL,
    due_date date,
    status debt_status NOT NULL DEFAULT 'pending',
    type debt_type NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX debts_user_idx ON debts(user_id);

-- Expenses table
CREATE TABLE expenses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    category text NOT NULL,
    amount numeric NOT NULL,
    currency currency_code NOT NULL,
    date date NOT NULL,
    status expense_status NOT NULL DEFAULT 'paid',
    type expense_type NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX expenses_user_idx ON expenses(user_id);

-- Incomes table
CREATE TABLE incomes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    amount numeric NOT NULL,
    currency currency_code NOT NULL,
    category text NOT NULL,
    status income_status NOT NULL DEFAULT 'expected',
    date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX incomes_user_idx ON incomes(user_id);

-- User preferences
CREATE TABLE user_settings (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    default_currency currency_code NOT NULL DEFAULT 'USD',
    auto_convert boolean NOT NULL DEFAULT true,
    theme text NOT NULL DEFAULT 'system',
    include_long_term boolean NOT NULL DEFAULT true,
    auto_price_update boolean NOT NULL DEFAULT true,
    language text NOT NULL DEFAULT 'en'
);

-- enable pgcrypto once
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) new table to store snapshots
CREATE TABLE debt_amount_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id   uuid NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount    numeric NOT NULL,          -- full amount at this moment
    note      text NOT NULL DEFAULT '',
    logged_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX debt_amount_history_debt_idx ON debt_amount_history(debt_id);

-- 2) row-level security
ALTER TABLE debt_amount_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user reads own debt history"
ON debt_amount_history FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "user can manage own debt history"
ON debt_amount_history FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- Recent user activities
CREATE TABLE recent_activity (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL, -- e.g., 'income', 'expense', 'debt', 'asset'
    action text NOT NULL, -- e.g., 'create', 'edit', 'delete', 'payment'
    description text NOT NULL,
    timestamp timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX recent_activity_user_idx ON recent_activity(user_id, timestamp DESC);

-- RLS Policies for recent_activity
ALTER TABLE recent_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user can manage own activity"
ON recent_activity FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- new table to store income snapshots
CREATE TABLE income_amount_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    income_id uuid NOT NULL REFERENCES incomes(id) ON DELETE CASCADE,
    user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount    numeric NOT NULL,
    note      text NOT NULL DEFAULT '',
    logged_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX income_amount_history_income_idx ON income_amount_history(income_id);

-- row-level security for income_amount_history
ALTER TABLE income_amount_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user reads own income history"
ON income_amount_history FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "user can manage own income history"
ON income_amount_history FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- RLS Policies for all tables

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user can manage own profile"
ON profiles FOR ALL
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user can manage own assets"
ON assets FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Debts
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user can manage own debts"
ON debts FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user can manage own expenses"
ON expenses FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Incomes
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user can manage own income"
ON incomes FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- User Settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user can manage own settings"
ON user_settings FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
