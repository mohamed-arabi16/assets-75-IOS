-- 1) new table to store snapshots
CREATE OR REPLACE FUNCTION update_income_amount(
    in_income_id uuid,
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
      SELECT 1 FROM incomes WHERE id = in_income_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Income not found or not owned by user';
    END IF;

    -- update master record
    UPDATE incomes
    SET amount = in_new_amount
    WHERE id = in_income_id;

    -- insert snapshot
    INSERT INTO income_amount_history (income_id, user_id, amount, note)
    VALUES (in_income_id, auth.uid(), in_new_amount, COALESCE(in_note,''));
END;
$$;
