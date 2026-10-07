FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
EXPOSE 4000
CMD ["sh", "-c", "node src/seed.js && node src/index.js"]
