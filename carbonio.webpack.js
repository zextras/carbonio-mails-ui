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

const { SUPPORTED_LOCALES } = require('./src/constants/locale-consts');

const customizeConfig = (config) => {
	const newConfig = { ...config };

	// Generate commit hash for static path (similar to shell project)
	const commitHash = execSync('git rev-parse HEAD').toString().trim();
	const baseStaticPath = `/static/iris/carbonio-mails-ui/${commitHash}/`;

	const supportedLocalesList = Object.values(SUPPORTED_LOCALES);

	const tinymceLocales = supportedLocalesList.map(
		(locale) => ('tinymceLocale' in locale && locale.tinymceLocale) || locale.value
	);

	newConfig.resolve = {
		...config.resolve,
		alias: {
			...(config.resolve?.alias || {}),
			'app-entrypoint': path.resolve(__dirname, 'src/app.tsx')
		},
		modules: [path.resolve(__dirname, 'src'), 'node_modules']
	};

	// Add DefinePlugin to define BASE_PATH_2 as a global variable with commit hash
	newConfig.plugins = newConfig.plugins || [];
	newConfig.plugins.push(
		new webpack.DefinePlugin({
			BASE_PATH_2: JSON.stringify(baseStaticPath)
		})
	);

	newConfig.plugins.push(
		new CopyPlugin({
			patterns: [
				{
					from: 'assets/',
					to: ''
				},
				{
					from: `plugins/help/js/i18n/**/(${tinymceLocales.join('|')}).js`,
					to: '',
					context: 'node_modules/tinymce/'
				},
				{
					from: 'plugins/emoticons',
					to: 'plugins/emoticons',
					context: 'node_modules/tinymce/'
				}
			]
		})
	);

	return newConfig;
};

// Still required to keep the compatibility with the sdk
module.exports = customizeConfig;
