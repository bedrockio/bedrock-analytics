FROM node:12-alpine

# Update & install required packages
RUN apk add --update bash git make python g++

# Install app dependencies
COPY package.json /service/package.json
COPY yarn.lock /service/yarn.lock


RUN cd /service; yarn install --production=true

# Fix bcrypt
# RUN cd /service; yarn --force add bcrypt --build-from-source

# Copy app source
COPY . /service/

# Set work directory to /api
WORKDIR /service/

RUN apk del python make g++

CMD ["./scripts/entrypoint.sh"]
