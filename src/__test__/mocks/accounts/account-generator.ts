/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account } from '@zextras/carbonio-shell-ui';

import { defaultAccount } from './default-account';

/**
 * Generate an account with the customAccount if pass otherwise retunr default Account
 */
const generateAccount = (customAccount?: Account): Account => {
	const defaultAcc = defaultAccount();
	return customAccount ?? defaultAcc;
};
export { generateAccount };
