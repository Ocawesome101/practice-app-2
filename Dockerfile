FROM openresty/openresty:jammy

RUN apt-get update && apt-get install -y libssl-dev

RUN luarocks install lapis
RUN luarocks install luaposix

WORKDIR /app
ADD . /app

# Create db dirs and make it so the 'nobody' user can write to them.
RUN bash -c 'mkdir -p /app/db/{assignments,lists,practiced} && chmod -R 777 /app/db'
VOLUME /app/db

ENTRYPOINT [ "lapis" ]
CMD [ "serve" ]
