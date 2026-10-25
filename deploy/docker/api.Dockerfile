# Nordsvar API image. Build from the repo root:
#   docker build -f deploy/docker/api.Dockerfile -t nordsvar-api .
FROM rust:1-bookworm AS build
WORKDIR /src

# Dependency-cache stage: build the manifests with stub sources first so
# the expensive dependency layer is reused unless Cargo.toml/Cargo.lock
# change. Real sources are copied afterwards.
COPY Cargo.toml Cargo.lock ./
COPY crates/ai-core/Cargo.toml crates/ai-core/Cargo.toml
COPY crates/kb-ingest/Cargo.toml crates/kb-ingest/Cargo.toml
COPY crates/media-livekit/Cargo.toml crates/media-livekit/Cargo.toml
COPY crates/tenancy/Cargo.toml crates/tenancy/Cargo.toml
COPY services/api/Cargo.toml services/api/Cargo.toml
COPY services/ai-worker/Cargo.toml services/ai-worker/Cargo.toml
RUN for d in crates/ai-core crates/kb-ingest crates/media-livekit crates/tenancy services/api services/ai-worker; do \
      mkdir -p "$d/src"; \
    done \
 && for d in crates/ai-core crates/kb-ingest crates/media-livekit crates/tenancy; do \
      echo '' > "$d/src/lib.rs"; \
    done \
 && echo 'fn main() {}' > services/api/src/main.rs \
 && echo '' > services/api/src/lib.rs \
 && echo 'fn main() {}' > services/ai-worker/src/main.rs \
 && cargo build --release -p nordsvar-api || true

COPY . .
# Touch the real sources so cargo rebuilds the workspace members, not deps.
RUN touch crates/*/src/*.rs services/*/src/*.rs \
 && cargo build --release -p nordsvar-api

FROM debian:bookworm-slim
RUN useradd -r -u 10001 nordsvar
COPY --from=build /src/target/release/nordsvar-api /usr/local/bin/nordsvar-api
USER nordsvar
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/nordsvar-api"]
