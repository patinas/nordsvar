# STT service: whisper.cpp's HTTP server, which exposes the /inference
# endpoint the AI worker's WhisperHttpStt adapter posts to (multipart
# "audio_file" WAV in, {"text": ...} JSON out).
#
# Model weights are NOT baked in: mount mirrored ggml weights at /models
# and pick one with STT_MODEL_PATH (see docs/DATA-SOVEREIGNTY.md). The
# Danish fine-tune choice is decision D-002; ggml-small.bin is the
# documented starting point.
FROM debian:bookworm AS build
# Pin from https://github.com/ggml-org/whisper.cpp/releases (b4938,
# 2026-08-20). Bump deliberately; mirror the source for air-gapped builds.
ARG WHISPER_CPP_REF=b4938
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      build-essential cmake git ca-certificates libgomp1 \
 && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 --branch "$WHISPER_CPP_REF" \
      https://github.com/ggml-org/whisper.cpp /src
WORKDIR /src
RUN cmake -B build -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF \
 && cmake --build build --target whisper-server -j"$(nproc)"

FROM debian:bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 \
 && rm -rf /var/lib/apt/lists/* \
 && useradd -r -u 10001 nordsvar
COPY --from=build /src/build/bin/whisper-server /usr/local/bin/whisper-server
USER nordsvar
EXPOSE 8000
ENV STT_MODEL_PATH=/models/ggml-small.bin
# sh -c only to expand STT_MODEL_PATH; no shell features beyond that.
ENTRYPOINT ["/bin/sh", "-c", "exec whisper-server -m \"$STT_MODEL_PATH\" --host 0.0.0.0 --port 8000 --convert"]
