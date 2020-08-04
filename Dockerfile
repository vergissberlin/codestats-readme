FROM node:12

WORKDIR /app

# Install dependencies.
ADD /app /app/
RUN npm i

CMD ["node", "/app/index.js"]
