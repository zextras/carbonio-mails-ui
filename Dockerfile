FROM ubuntu/nginx:1.18-20.04_beta

USER root
RUN apt update && apt install -y gnupg2 ca-certificates && apt clean \
&& apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 52FD40243E584A21 \
&& echo deb https://repo.zextras.io/release/ubuntu jammy main > /etc/apt/sources.list.d/zextras.list \
&& apt update && apt install -y carbonio-shell-ui && apt clean

# TODO: define an image on shell and publish it to avoid rebuilding locally

COPY entrypoint.sh .
ENTRYPOINT ["./entrypoint.sh"]
