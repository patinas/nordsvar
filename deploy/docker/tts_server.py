#!/usr/bin/env python3
"""Minimal HTTP front for Piper matching Nordsvar's PiperHttpTts adapter.

POST / with a raw UTF-8 text body returns a WAV file. The voice model is
loaded once at startup from TTS_VOICE (an .onnx file under /models,
mirrored ahead of time - nothing downloads at runtime).

Deliberately stdlib-only around the piper API (plus piper-tts itself), so
the file stays easy to audit.
"""

import io
import os
import sys
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from piper import PiperVoice

VOICE_PATH = os.environ.get("TTS_VOICE", "/models/da_DK-default.onnx")
PORT = int(os.environ.get("TTS_PORT", "5000"))

voice = None  # loaded in main()


def synthesize_wav(text: str) -> bytes:
    """Render text to WAV bytes with the loaded voice."""
    buf = io.BytesIO()
    chunks = list(voice.synthesize(text))
    if not chunks:
        raise ValueError("piper returned no audio")
    rate = chunks[0].sample_rate
    with wave.open(buf, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        for chunk in chunks:
            wav.writeframes(chunk.audio_int16_bytes)
    return buf.getvalue()


class Handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:  # noqa: N802 (stdlib naming)
        length = int(self.headers.get("content-length") or 0)
        text = self.rfile.read(length).decode("utf-8", errors="replace")
        try:
            data = synthesize_wav(text)
        except Exception as exc:  # surface a clean 500, never a traceback body
            self.send_error(500, f"synthesis failed: {exc.__class__.__name__}")
            return
        self.send_response(200)
        self.send_header("content-type", "audio/wav")
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/healthz":
            body = b'{"status":"ok"}'
            self.send_response(200)
            self.send_header("content-type", "application/json")
            self.send_header("content-length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_error(404)

    def log_message(self, fmt: str, *args: object) -> None:
        # Keep request noise out of stdout; the platform logs real errors.
        pass


def main() -> int:
    global voice
    if not os.path.exists(VOICE_PATH):
        print(
            f"TTS voice model not found: {VOICE_PATH}\n"
            "Mount mirrored Piper voices at /models (see docs/INSTALL.md).",
            file=sys.stderr,
        )
        return 1
    voice = PiperVoice.load(VOICE_PATH)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"piper tts listening on :{PORT} with voice {VOICE_PATH}")
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
