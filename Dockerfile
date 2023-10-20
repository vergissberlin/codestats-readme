FROM node:21

WORKDIR /app

# Install dependencies.
ADD . /app/
RUN yarn

CMD ["node", "/app/index.js"]
