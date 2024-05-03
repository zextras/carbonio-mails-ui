/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const customizeConfig = (config, pkg, options, mode) => {
	config.resolve.alias['app-entrypoint'] = `${__dirname}/src/app.tsx`;
	return config;
};

// Still required to keep the compatibility with the sdk
module.exports = customizeConfig;
