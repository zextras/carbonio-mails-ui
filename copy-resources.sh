#!/bin/bash


MAILS_COMMIT_HASH=$(cat ./dist/component.json | jq ".commit")

mkdir -p ./it/static/iris
mkdir -p ./it/carbonio
mkdir -p ./it/static/iris/carbonio-mails-ui/"${MAILS_COMMIT_HASH}"
cp -r ./dist/* ./it/static/iris/carbonio-mails-ui/"${MAILS_COMMIT_HASH}"


# TODO: copy shell dist under this directory with shell hash
mkdir -p ./it/static/iris/carbonio-shell-ui
# you can manually copy the shell built code
# cp ./it/static/iris/carbonio-shell-ui/index.html ./it/carbonio

jq -s '{components: .}' $(find ./it/static/iris/carbonio-shell-ui -name component.json) > ./it/static/components.json
jq -s '{components: .}' $(find ./it/static/iris/carbonio-mails-ui -name component.json) > ./it/static/components.json
