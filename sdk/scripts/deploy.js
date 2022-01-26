/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-console */
const arg = require('arg');
const { execSync, spawn } = require('child_process');
const chalk = require('chalk');
const { runBuild } = require('./build');
const { pkg } = require('./utils/pkg');
const { buildSetup } = require('./utils/setup');

const pathPrefix = '/opt/zextras/web/iris/';
const ENTRY_REGEX = /^app\..*\.js$/;
function parseArguments() {
	const args = arg(
		{
			'--host': String,
			'-h': '--host',
			'--user': String,
			'-u': '--user'
		},
		{
			argv: process.argv.slice(2),
			permissive: true
		}
	);
	return {
		host: args['--host'],
		user: args['--user'] || 'root'
	};
}

const updateJson = (appJson, carbonioJson, stats) => {
	const components = carbonioJson.components.filter(
		(component) => component.name !== pkg.carbonio.name
	);
	components.push(appJson);
	return { components };
};
exports.runDeploy = async () => {
	const options = parseArguments();
	const stats = await runBuild();
	if (options.host) {
		const target = `${options.user}@${options.host}`;
		console.log(`- Deploying to ${chalk.bold(target)}...`);
		execSync(
			`ssh ${target} "cd ${pathPrefix} && rm -rf ${pkg.carbonio.name}/* && mkdir -p ${pkg.carbonio.name}/${buildSetup.commitHash}"`
		);
		execSync(`scp -r dist/* ${target}:${pathPrefix}${pkg.carbonio.name}/${buildSetup.commitHash}`);
		console.log(`- Updating ${chalk.bold('components.json')}...`);
		const components = JSON.stringify(
			updateJson(
				JSON.parse(
					execSync(
						`ssh ${target} cat ${pathPrefix}${pkg.carbonio.name}/${buildSetup.commitHash}/component.json`
					).toString()
				),
				JSON.parse(execSync(`ssh ${target} cat ${pathPrefix}components.json`).toString()),
				stats
			)
		).replace(/"/g, '\\"');
		execSync(`ssh ${target} "echo '${components}' > ${pathPrefix}components.json"`);
		console.log(chalk.bgBlue.white.bold('Deploy Completed'));
	} else {
		console.log(chalk.bgYellow.white('Target host not specified, skipping deploy step'));
	}
};
