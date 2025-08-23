<!--
SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>

SPDX-License-Identifier: AGPL-3.0-only
-->
<div align="center">
  <h1>Carbonio Mails UI</h1>
</div>

Mails module for Zextras Carbonio

<p align="center">
  <a href="https://github.com/zextras/carbonio-mails-ui/graphs/contributors" alt="Contributors">
  <img src="https://img.shields.io/github/contributors/zextras/carbonio-mails-ui" /></a>
  <a href="https://github.com/zextras/carbonio-mails-ui/pulse" alt="Activity">
  <img src="https://img.shields.io/github/commit-activity/m/zextras/carbonio-mails-ui" /></a>
  <img src="https://img.shields.io/badge/license-AGPL%203-green" alt="License AGPL 3">
  <img src="https://img.shields.io/badge/project-carbonio-informational" alt="Project Carbonio">
  <a href="https://twitter.com/intent/follow?screen_name=zextras">
  <img src="https://img.shields.io/twitter/follow/zextras?style=social&logo=twitter" alt="Follow on Twitter"></a>
</p>
<h3>How to build</h3>

<h4>Setup</h4>

- clone the repo

- install the dependencies:

```
nvm use
npm install
```

- install carbonio-commons-ui submodule

```
git submodule update --recursive --init
```

<h4>Playwright Tests</h4>

You may need to setup your environment before doing these steps (WIP: build, 
copy shell, etc.)

To run integration tests you can run `npm run it`. \
This will start an http-server serving mails-ui and a mockserver that mocks 
backend api calls, and run playwright tests against it. 
Configuration parameters for the endpoint are defined in [playwright.config.ts](playwright.config.ts)

<h4>Lightweight dev mode</h4>
You can also see how your UI looks by running `PORT=1234 npm run start:mock`. \
This will spin up the same environment as the mock test and serve the UI at 
port 1234. \
Visit http://localhost:1234/carbonio to see the web application. \
The result of what you see depends on the mocked apis. Feel free to adjust 
the mocks based on your needs.

<h4>Watch Mode</h4>

```
npm run start -- -h <host>
```

The host parameter is required to proxy requests and content from an existing Carbonio installation.

<h4>Deploy</h4>

```
npm run deploy -- -h <host>
```

The host parameter is required to proxy requests and content from an existing Carbonio installation.

<h4>Build</h4>

```
npm run build
```

<h2>License</h2>

Released under the AGPL-3.0-only license as specified here: LICENSES/AGPL-3.0-only.txt.
