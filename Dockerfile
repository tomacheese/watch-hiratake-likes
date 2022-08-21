FROM python:3.10.6-alpine3.16

RUN apk update && \
  apk add dumb-init && \
  rm -rf /var/cache/apk/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src src

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/entrypoint.sh"]
