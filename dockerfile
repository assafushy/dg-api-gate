FROM node:slim as build
WORKDIR /usr/src/app

COPY . ./

RUN npm install
RUN npm install typescript -g
RUN npm run build


FROM  node:slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install


COPY --from=build /usr/src/app/bin /usr/src/app

EXPOSE 3000

CMD ["node","server.js"]
