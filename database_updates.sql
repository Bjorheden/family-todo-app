-- Add requires_approval column to rewards table
ALTER TABLE rewards 
ADD COLUMN requires_approval BOOLEAN NOT NULL DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN rewards.requires_approval IS 'Whether the reward requires admin approval before the user can receive it after claiming';

-- Ensure there are no unique constraints preventing multiple claims of the same reward
-- (The reward_claims table should allow multiple claims per user per reward)
-- If there was a unique constraint, remove it:
-- ALTER TABLE reward_claims DROP CONSTRAINT IF EXISTS reward_claims_user_id_reward_id_key;

-- Optionally, if you want to set some existing rewards to require approval, you can run:
-- UPDATE rewards SET requires_approval = true WHERE points_required >= 100; -- Example: high-value rewards require approval