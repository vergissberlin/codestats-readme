FROM node:12

WORKDIR /app

# Install dependencies.
ADD . /app/
RUN yarn

CMD ["ls", "/github/home"]
ENTRYPOINT  ["node", "/app/index.js"]
