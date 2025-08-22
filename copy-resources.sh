#!/bin/bash


mkdir -p ./it/static/iris
mkdir -p ./it/carbonio
mkdir -p ./it/static/iris/carbonio-mails-ui
cp -r ./dist/* ./it/static/iris/carbonio-mails-ui
mkdir -p ./it/static/iris/carbonio-shell-ui

# TODO: copy shell
# cp ./it/static/iris/carbonio-shell-ui/index.html ./it/carbonio

jq -s '{components: .}' $(find ./it/static/iris/carbonio-mails-ui -name component.json) > ./it/static/components.json
jq -s '{components: .}' $(find ./it/static/iris/carbonio-shell-ui -name component.json) > ./it/static/components.json