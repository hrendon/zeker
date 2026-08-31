# Build stage — compiles the Next.js app into a standalone server.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# `npm ci` installs exactly what the lockfile pins and fails if the two
# disagree. `npm install` would quietly resolve newer versions instead.
RUN npm ci
COPY . .

# Next bakes NEXT_PUBLIC_* values into the browser bundle at build time, not at
# run time. Passing them as Cloud Run environment variables would do nothing —
# by then the strings are already compiled in. So they arrive as build args.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
    NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
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
