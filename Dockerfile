FROM node:22-bookworm-slim AS build
ARG SERVICE=frontend
ENV BACKEND_URL=http://backend:3000
WORKDIR /app
COPY package*.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
RUN npm ci
COPY frontend ./frontend
COPY backend ./backend
RUN npm run build --workspace ${SERVICE}
FROM node:22-bookworm-slim AS runtime
ARG SERVICE=frontend
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/${SERVICE}/.next/standalone ./
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/${SERVICE}/package.json ./${SERVICE}/package.json
COPY --from=build /app/${SERVICE}/.next/static ./${SERVICE}/.next/static
COPY --from=build /app/frontend/public ./frontend/public
ENV SERVICE=${SERVICE}
RUN node -e "const fs=require('node:fs');for(const file of ['/app/package.json','/app/'+process.env.SERVICE+'/package.json'])JSON.parse(fs.readFileSync(file,'utf8'))"
USER node
EXPOSE 3000
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 PORT=3000 node ${SERVICE}/server.js"]
