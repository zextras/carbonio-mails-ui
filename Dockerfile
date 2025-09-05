FROM registry.dev.zextras.com/dev/carbonio-webui-builder:dfrison

COPY dist /tmp/build
ENV PROJECT_NAME="carbonio-mails-ui"