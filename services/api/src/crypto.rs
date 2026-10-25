//! AES-256-GCM for operator-provided secrets at rest (provider API keys).
//! Key comes from the SETTINGS_KEY env (64 hex chars = 32 bytes). Output
//! layout: 12-byte random nonce followed by ciphertext+tag.

use aes_gcm::aead::{Aead, AeadCore, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Key, Nonce};

pub fn parse_key(hex_value: &str) -> Option<[u8; 32]> {
    let bytes = hex::decode(hex_value.trim()).ok()?;
    <[u8; 32]>::try_from(bytes.as_slice()).ok()
}

pub fn encrypt(key: &[u8; 32], plaintext: &str) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let ciphertext = cipher
        .encrypt(&nonce, plaintext.as_bytes())
        .map_err(|_| "encryption failed".to_string())?;
    let mut out = nonce.to_vec();
    out.extend_from_slice(&ciphertext);
    Ok(out)
}

pub fn decrypt(key: &[u8; 32], blob: &[u8]) -> Result<String, String> {
    if blob.len() < 13 {
        return Err("ciphertext too short".into());
    }
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let nonce = Nonce::from_slice(&blob[..12]);
    let plaintext = cipher
        .decrypt(nonce, &blob[12..])
        .map_err(|_| "decryption failed (wrong SETTINGS_KEY?)".to_string())?;
    String::from_utf8(plaintext).map_err(|_| "decrypted value is not utf-8".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_and_wrong_key_fails() {
        let key = [7u8; 32];
        let blob = encrypt(&key, "sk-test-secret").unwrap();
        assert!(!blob.windows(14).any(|w| w == b"sk-test-secret"));
        assert_eq!(decrypt(&key, &blob).unwrap(), "sk-test-secret");
        let wrong = [8u8; 32];
        assert!(decrypt(&wrong, &blob).is_err());
        assert!(parse_key(&hex::encode(key)).is_some());
        assert!(parse_key("not hex").is_none());
        assert!(parse_key("abcd").is_none()); // wrong length
    }
}
