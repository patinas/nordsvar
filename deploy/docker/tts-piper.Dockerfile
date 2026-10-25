# TTS service: Piper (Danish-capable voices) behind a tiny HTTP wrapper
# matching the AI worker's PiperHttpTts adapter (POST raw text -> WAV).
#
# Voice models are NOT baked in: mount mirrored voices at /models and pick
# one with TTS_VOICE (default: the Danish "default" voice). Voice choice
# is part of decision D-002.
FROM python:3.12-slim
# Pin from https://github.com/OHF-Voice/piper1-gpl/releases (v1.7.0,
# 2026-08-15). manylinux x86_64/aarch64 wheels exist, so no compiler is
# needed in this image.
RUN pip install --no-cache-dir piper-tts==1.7.0 \
 && useradd -r -u 10001 nordsvar
COPY deploy/docker/tts_server.py /usr/local/bin/tts_server.py
USER nordsvar
EXPOSE 5000
ENV TTS_VOICE=/models/da_DK-default.onnx
ENTRYPOINT ["python", "/usr/local/bin/tts_server.py"]
