# Frontend: Vite Dev-Server. Source via Volume, HMR aktiviert.
FROM node:20-alpine

WORKDIR /app

# Dependencies separat — bessere Cache-Nutzung
COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host 0.0.0.0 macht Vite vom Host erreichbar
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
