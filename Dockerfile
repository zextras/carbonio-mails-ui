FROM alpine

RUN apk add --no-cache jq

COPY dist /tmp/build

RUN COMMIT_ID=$(jq -r .commit /tmp/build/component.json) \
&& WEB_PATH="/opt/zextras/web/iris/carbonio-mails-ui/${COMMIT_ID}" \
&& mkdir -p "${WEB_PATH}" \
&& cp -r /tmp/build/* "${WEB_PATH}" \
&& rm -r /tmp/build

ENTRYPOINT ["/bin/sh", "-c", "tail -f > /dev/null"]