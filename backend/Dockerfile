# Build stage — compiles TypeScript to plain JavaScript.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Runtime stage — production dependencies only, no compiler, no sources.
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# Never run the API as root on Cloud Run.
USER node

# Cloud Run supplies PORT; 3001 is only the local default.
EXPOSE 3001
CMD ["node", "dist/index.js"]
