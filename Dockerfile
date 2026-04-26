FROM node:20-slim AS builder

WORKDIR /app


COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . .


RUN npm run build


FROM node:20-slim AS runtime


RUN useradd -m -u 1000 aneis 2>/dev/null || true

WORKDIR /app


COPY package.json ./

COPY --from=builder /app/node_modules  ./node_modules

COPY --from=builder /app/dist          ./dist

COPY --from=builder /app/server.ts     ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 7860

USER 1000

CMD ["node_modules/.bin/tsx", "server.ts"]
