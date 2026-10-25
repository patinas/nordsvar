# Nordsvar AI worker image. Model endpoints are configured by env at runtime;
# no weights are baked into this image (see docs/DATA-SOVEREIGNTY.md).
FROM rust:1-bookworm AS build
# webrtc-sys / webrtc-sys-build (via nordsvar-media-livekit) need a C/C++
# toolchain plus curl+TLS certs to fetch the prebuilt WebRTC artifacts during
# the build. The bare rust image ships none of these and the build script
# panics (exit 101) without them.
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential cmake ninja-build pkg-config libssl-dev \
      curl ca-certificates xz-utils zlib1g \
    && rm -rf /var/lib/apt/lists/*
# webrtc-sys 0.3.45 additionally enforces clang >= 21 at build time: the
# hermetic libc++ shipped with the prebuilt libwebrtc states that floor in
# __configuration/compiler.h, and the build script panics on bookworm's
# clang 14. Install the official LLVM 21.1.0 toolchain (same version the
# project is developed against) and point CC/CXX at it.
RUN curl -fL https://github.com/llvm/llvm-project/releases/download/llvmorg-21.1.0/LLVM-21.1.0-Linux-X64.tar.xz \
      -o /tmp/llvm.tar.xz \
    && mkdir -p /opt/llvm \
    && tar -xJf /tmp/llvm.tar.xz -C /opt/llvm --strip-components=1 \
    && rm /tmp/llvm.tar.xz
ENV PATH=/opt/llvm/bin:$PATH \
    CC=clang \
    CXX=clang++ \
    CARGO_BUILD_JOBS=2
WORKDIR /src
COPY . .
RUN cargo build --release -p nordsvar-ai-worker

FROM debian:bookworm-slim
# Runtime deps: libstdc++ for the prebuilt WebRTC library, CA certs for TLS.
RUN apt-get update && apt-get install -y --no-install-recommends \
      libstdc++6 ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -r -u 10001 nordsvar
COPY --from=build /src/target/release/nordsvar-ai-worker /usr/local/bin/nordsvar-ai-worker
USER nordsvar
ENTRYPOINT ["/usr/local/bin/nordsvar-ai-worker"]
