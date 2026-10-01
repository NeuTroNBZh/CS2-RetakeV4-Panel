FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The build boots the app to generate the client registry: it needs a valid
# environment (placeholders only, not kept in the final image) and no database.
RUN NODE_ENV=production PORT=3333 HOST=0.0.0.0 LOG_LEVEL=info \
    APP_KEY=build-only-placeholder-key-0123456789ab APP_URL=https://localhost \
    SESSION_DRIVER=cookie LIMITER_STORE=memory \
    PANEL_DB_HOST=localhost PANEL_DB_PORT=3306 PANEL_DB_USER=build PANEL_DB_DATABASE=build \
    sh -c "node ace codegen && node ace build" \
    && cd build && npm ci --omit=dev

FROM node:24-alpine
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3333 SESSION_DRIVER=cookie LIMITER_STORE=database
WORKDIR /app
COPY --from=build --chown=node:node /app/build ./
USER node
EXPOSE 3333
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:3333/health || exit 1
CMD ["sh", "-c", "node ace migration:run --force && exec node bin/server.js"]
