FROM node:24-bullseye-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json ./

RUN npm install --build-from-source=bcrypt
COPY prisma ./prisma

COPY . .

RUN npx prisma generate

EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && npm run prisma:seed && npm run dev"]