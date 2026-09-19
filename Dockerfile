FROM node:24 AS build
WORKDIR /software

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* ./
RUN npm install -g pnpm@10
RUN pnpm install
RUN npm install -g prisma
run pnpm add express

COPY prisma ./prisma
COPY prisma.config.ts ./

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:24-alpine
WORKDIR /software

COPY --from=build /software/package.json .
COPY --from=build /software/node_modules ./node_modules
COPY --from=build /software/dist ./dist
COPY --from=build /software/prisma ./prisma
COPY --from=build /software/prisma.config.ts ./

ENV NODE_ENV=production
EXPOSE 3200

CMD ["npm", "run", "server:run:under:dockerimage"]