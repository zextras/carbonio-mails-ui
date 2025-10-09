/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires

const { execSync } = require('child_process');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const customizeConfig = (config, pkg) => {
	const newConfig = { ...config };

	const commitHash = execSync('git rev-parse HEAD').toString().trim();
	const packageName = pkg.name || require(path.resolve(__dirname, 'package.json')).name;
	const baseStaticPath = `/static/iris/${packageName}/${commitHash}/`;

	newConfig.resolve = {
		...config.resolve,
		alias: {
			...(config.resolve?.alias || {}),
			'app-entrypoint': path.resolve(__dirname, 'src/app.tsx')
		},
		modules: [path.resolve(__dirname, 'src'), 'node_modules']
	};

	newConfig.plugins = newConfig.plugins || [];
	newConfig.plugins.push(
		new webpack.DefinePlugin({
			BASE_PATH: JSON.stringify(baseStaticPath)
		})
	);

	newConfig.plugins.push(
		new CopyPlugin({
			patterns: [
				{
					from: path.resolve(
						__dirname,
						'node_modules/@zextras/carbonio-ui-text-composer/dist/assets'
					),
					to: path.resolve(__dirname, 'dist/'),
					noErrorOnMissing: true
				}
			]
		})
	);

	return newConfig;
};

// Still required to keep the compatibility with the sdk
module.exports = customizeConfig;
