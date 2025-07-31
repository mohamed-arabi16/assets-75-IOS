-- 3) RPC helper (outline)
CREATE OR REPLACE FUNCTION update_debt_amount(
    in_debt_id uuid,
    in_new_amount numeric,
    in_note text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- verify ownership
    IF NOT EXISTS (
      SELECT 1 FROM debts WHERE id = in_debt_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Debt not found or not owned by user';
    END IF;

    -- update master record
    UPDATE debts
    SET amount = in_new_amount
    WHERE id = in_debt_id;

    -- insert snapshot
    INSERT INTO debt_amount_history (debt_id, user_id, amount, note)
    VALUES (in_debt_id, auth.uid(), in_new_amount, COALESCE(in_note,''));
END;
$$;
