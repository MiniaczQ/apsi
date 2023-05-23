FROM node:lts-bullseye-slim AS frontend-build
WORKDIR /app/
COPY ./frontend/ /app/
RUN --mount=type=cache,target=/app/node_modules \
    npm ci --production
RUN --mount=type=cache,target=/app/node_modules \
    npm run build

FROM rust:1.68 AS backend-build
WORKDIR /app/
COPY ./backend/ /app/
RUN --mount=type=cache,target=/usr/local/cargo/registry/index \
    --mount=type=cache,target=/usr/local/cargo/registry/cache \
    --mount=type=cache,target=/usr/local/cargo/git/db \
    --mount=type=cache,target=/app/target \
    cargo build --release && \
    mv /app/target/release/webserver /app/

FROM debian:bullseye-slim AS runtime
WORKDIR /app/
COPY --from=backend-build /app/webserver /app/
COPY --from=frontend-build /app/build/ /app/static/
COPY --from=backend-build /app/config/ /app/config/
COPY --from=backend-build /app/devkeys/ /app/devkeys/
COPY --from=backend-build /app/migrations/ /app/migrations/
ENTRYPOINT ["/app/webserver"]
