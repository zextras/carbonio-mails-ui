/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

const customizeConfig = (config) => {
	const newConfig = { ...config };

	newConfig.resolve = {
		...config.resolve,
		alias: {
			...(config.resolve?.alias || {}),
			'app-entrypoint': path.resolve(__dirname, 'src/app.tsx')
		},
		modules: [path.resolve(__dirname, 'src'), 'node_modules']
	};

	return newConfig;
};

// Still required to keep the compatibility with the sdk
module.exports = customizeConfig;
