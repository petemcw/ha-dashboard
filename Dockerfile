# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
# The nginx image runs /docker-entrypoint.d/*.sh before starting nginx.
COPY --chmod=755 deploy/40-ha-dashboard-config.sh /docker-entrypoint.d/
COPY --from=build /app/dist /usr/share/nginx/html
