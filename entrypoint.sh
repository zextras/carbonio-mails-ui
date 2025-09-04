#!/bin/sh

MAILS_COMMIT_HASH=$(cat /tmp/build/component.json | jq -r ".commit")
MAILS_DIR=/opt/zextras/web/iris/carbonio-mails-ui/"${MAILS_COMMIT_HASH}"
mkdir -p "${MAILS_DIR}"
cp -r /tmp/build/* "${MAILS_DIR}"

jq -s '{components: .}' $(find /opt/zextras/web/iris -name component.json) > /opt/zextras/web/iris/components.json