//! Fixed-window rate limiting for the public embed surface. In-memory,
//! per-process: good enough for the single-node deployment Nordsvar
//! targets, and it never touches the database on the hot path.

use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

fn now_unix() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

struct Window {
    start_unix: u64,
    count: u32,
}

/// A fixed-window counter keyed by an arbitrary string (IP, embed key,
/// session id). `check` returns true while the caller is within the limit
/// for the current window and increments the count.
pub struct RateLimiter {
    limit: u32,
    window_secs: u64,
    inner: Mutex<HashMap<String, Window>>,
}

impl RateLimiter {
    pub fn new(limit: u32, window_secs: u64) -> Self {
        Self {
            limit,
            window_secs,
            inner: Mutex::new(HashMap::new()),
        }
    }

    /// One call per minute at this shape: per-IP and per-key buckets on
    /// the public embed routes.
    pub fn per_minute(limit: u32) -> Self {
        Self::new(limit, 60)
    }

    /// Returns true and consumes one slot when under the limit.
    pub fn check(&self, key: &str) -> bool {
        self.check_at(key, now_unix())
    }

    /// Time-injectable core, for tests.
    pub fn check_at(&self, key: &str, now: u64) -> bool {
        let mut guard = match self.inner.lock() {
            Ok(g) => g,
            // A poisoned limiter must not take the public surface down;
            // fail open on the lock, not on the counter.
            Err(_) => return true,
        };
        // Opportunistic sweep of expired windows so the map cannot grow
        // unbounded under junk traffic.
        if guard.len() > 10_000 {
            guard.retain(|_, w| now.saturating_sub(w.start_unix) < self.window_secs);
        }
        let window = guard.entry(key.to_string()).or_insert(Window {
            start_unix: now,
            count: 0,
        });
        if now.saturating_sub(window.start_unix) >= self.window_secs {
            window.start_unix = now;
            window.count = 0;
        }
        if window.count >= self.limit {
            return false;
        }
        window.count += 1;
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allows_up_to_the_limit_then_blocks() {
        let limiter = RateLimiter::per_minute(3);
        assert!(limiter.check_at("ip", 1000));
        assert!(limiter.check_at("ip", 1000));
        assert!(limiter.check_at("ip", 1000));
        assert!(!limiter.check_at("ip", 1000));
    }

    #[test]
    fn separate_keys_have_separate_windows() {
        let limiter = RateLimiter::per_minute(1);
        assert!(limiter.check_at("a", 1000));
        assert!(limiter.check_at("b", 1000));
        assert!(!limiter.check_at("a", 1000));
    }

    #[test]
    fn a_new_window_resets_the_count() {
        let limiter = RateLimiter::per_minute(1);
        assert!(limiter.check_at("ip", 1000));
        assert!(!limiter.check_at("ip", 1059));
        assert!(limiter.check_at("ip", 1061));
    }
}
