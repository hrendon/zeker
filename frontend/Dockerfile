# Build stage — compiles the Next.js app into a standalone server.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# `npm ci` installs exactly what the lockfile pins and fails if the two
# disagree. `npm install` would quietly resolve newer versions instead.
RUN npm ci
COPY . .

# Next compiles NEXT_PUBLIC_* values into the browser bundle during this build,
# not at run time — setting them on Cloud Run afterwards would do nothing. They
# come from the tracked `.env.production`, which `next build` reads on its own.
# They are deliberately NOT build arguments: `gcloud run deploy --source` passes
# none, so every one of them would arrive empty and silently overwrite the real
# values, producing an app that builds cleanly and cannot sign anyone in.
RUN npm run build

# Runtime stage — the standalone server only: no sources, no dev dependencies.
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# Never run the site as root on Cloud Run.
USER node

# Cloud Run supplies PORT. The server must listen on every interface, not only
# localhost, or the platform's health check never reaches it.
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node", "server.js"]
