FROM node:18-alpine

ENV MONGO_DB_USERNAME=admin \
  MONGO_DB_PWD=password

USER root
RUN chown -R 1000:1000 "root/.npm"
USER 1000:1000

EXPOSE 3501

WORKDIR /home/app

ENV COMMAND="npm run dev"

CMD [ -d "node_modules" ] && ${COMMAND} || npm ci && ${COMMAND}



