# ---- Base Stage ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- Dependencies Stage ----
FROM base AS dependencies
# Instalamos solo las dependencias de producción para mantener el contenedor limpio
RUN npm ci --only=production
# Hacemos una copia de las dependencias completas (incluyendo dev) para compilar
RUN cp -R node_modules prod_node_modules
RUN npm ci

# ---- Builder Stage ----
FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json tsconfig*.json nest-cli.json ./
COPY src/ ./src/
# Compilamos NestJS
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production
WORKDIR /app

# Copiamos package.json por si se necesita para scripts de inicio
COPY --from=base /app/package.json ./

# Copiamos solo los módulos de producción
COPY --from=dependencies /app/prod_node_modules ./node_modules

# Copiamos la aplicación compilada
COPY --from=builder /app/dist ./dist

# Establecemos el entorno en producción
ENV NODE_ENV=production

# Cambiamos al usuario sin privilegios por seguridad (SonarQube)
USER node

# Exponemos el puerto de NestJS
EXPOSE 3000

# Comando para iniciar la aplicación compilada
CMD ["node", "dist/main"]
