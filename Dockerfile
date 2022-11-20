FROM node:19

WORKDIR /app

# Install dependencies.
ADD . /app/
RUN yarn

CMD ["node", "/app/index.js"]
