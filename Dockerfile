# ---------- Build (Next.js static export → out/) ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Évite husky / .git pendant yarn install dans l’image
ENV HUSKY=0

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

# ---------- Runtime : uniquement les fichiers statiques (pas de node_modules) ----------
FROM nginx:alpine AS runner

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
