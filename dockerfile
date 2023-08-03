# Build stage
FROM node:slim as build
WORKDIR /usr/src/app

COPY . ./

RUN npm ci
RUN npm install typescript -g
RUN npm run build

# Final stage
FROM  node:slim
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package*.json ./
RUN npm ci

COPY --from=build /usr/src/app/bin /usr/src/app

EXPOSE 3000

CMD ["node","server.js"]
