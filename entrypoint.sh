#!/bin/bash

MAILS_COMMIT_HASH=$(cat /tmp/dist/component.json | jq -r ".commit")

MAILS_DIR=/opt/zextras/web/iris/carbonio-mails-ui/"${MAILS_COMMIT_HASH}"
mkdir "${MAILS_DIR}"
cp -r /tmp/dist/* "${MAILS_DIR}"

jq -s '{components: .}' $(find /opt/zextras/web/iris -name component.json) > /opt/zextras/web/iris/components.json

nginx -g "daemon off;"

echo "Copied local files, you can use them locally by mounting /tmp/iris. Bye!"
exit 0