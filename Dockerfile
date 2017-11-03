FROM node:7

RUN mkdir -p /var/app
WORKDIR /var/app

RUN curl -o- -L https://yarnpkg.com/install.sh | bash

COPY package.json yarn.lock /var/app/
RUN /root/.yarn/bin/yarn install --production

COPY . /var/app

ENV PORT 80
EXPOSE 80

CMD [ "npm", "start" ]
