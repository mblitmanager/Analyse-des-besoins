FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# use npx to invoke the local nest CLI (avoids executable permission issues)
RUN npx --yes nest build

FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production --silent
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/src/main.js"]
