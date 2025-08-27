#!/bin/bash

MAILS_COMMIT_HASH=$(cat /tmp/dist/component.json | jq -r ".commit")
# copy Iris
rm -r /tmp/iris/*
cp -r /opt/zextras/web/* /tmp
chmod 777 /tmp/iris

mkdir /tmp/carbonio
mkdir /tmp/iris/carbonio-mails-ui/"${MAILS_COMMIT_HASH}"
# copy built code into mails project
cp -r /tmp/dist/* /tmp/iris/carbonio-mails-ui/"${MAILS_COMMIT_HASH}"
# copy shell index in /carbonio path, served by http-server
cp /tmp/iris/carbonio-shell-ui/current/index.html /tmp/carbonio/index.html

jq -s '{components: .}' $(find /tmp/iris -name component.json) > /tmp/iris/components.json

echo "Copied local files, you can use them locally by mounting /tmp/iris. Bye!"
exit 0