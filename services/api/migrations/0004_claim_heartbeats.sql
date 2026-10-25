-- Worker-heartbeat recovery for session claims.
-- A claim is a worker's lease on the AI seat in a session; claimed_at_unix
-- records the last claim or heartbeat. A claim older than the staleness
-- window without a heartbeat means the worker died mid-call, and the
-- session becomes claimable again (see store::CLAIM_STALE_AFTER_SECS).
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS claimed_at_unix BIGINT;
