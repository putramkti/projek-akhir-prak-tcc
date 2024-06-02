FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3100
CMD ["npm", "run", "start"]