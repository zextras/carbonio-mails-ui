#!/bin/bash

MAILS_COMMIT_HASH=$(cat /tmp/dist/component.json | jq -r ".commit")
rm -r /tmp/iris
cp -r /opt/zextras/web/* /tmp
chmod 777 /tmp/iris

mkdir /tmp/iris/carbonio-mails-ui/"${MAILS_COMMIT_HASH}"
cp -r /tmp/dist/* /tmp/iris/carbonio-mails-ui/"${MAILS_COMMIT_HASH}"

jq -s '{components: .}' $(find /tmp/iris -name component.json) > /tmp/iris/components.json

tail -f /dev/null