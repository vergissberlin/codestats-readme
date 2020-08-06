FROM node:12

WORKDIR /app

# Install dependencies.
ADD ./app /app/
RUN yarn

CMD ["node", "/app/index.js"]
