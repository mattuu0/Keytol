FROM node:24.11.1-slim AS development-dependencies-env
WORKDIR /app
COPY package*.json /app
COPY ./run.sh /app
RUN chmod +x ./run.sh
CMD ["sh","./run.sh"]

FROM node:24.11.1-slim AS build-env
COPY . /app
WORKDIR /app
RUN npm i 
RUN npm run build

FROM ghcr.io/static-web-server/static-web-server:2 as release

COPY --from=build-env /app/dist /public/ui

ENV SERVER_PORT=3000
ENV SERVER_LOG_LEVEL=info
ENV SERVER_LOG_REMOTE_ADDRESS=true
ENV SERVER_LOG_X_REAL_IP=true
ENV SERVER_LOG_FORWARDED_FOR=true
ENV SERVER_FALLBACK_PAGE=/public/ui/index.html