/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserAccount, getUserSettings } from '@zextras/carbonio-shell-ui';
import { isArray } from 'lodash';

import { AvailableAddress } from '../carbonio-ui-commons/types/identities';
import { NO_ACCOUNT_NAME } from '../constants';

/**
 * Returns the list of all the available addresses for the account and their type
 */
export const getAvailableAddresses = (): Array<AvailableAddress> => {
	const account = getUserAccount();
	const settings = getUserSettings();
	const result: Array<AvailableAddress> = [];

	// Adds the email address of the primary account
	result.push({
		address: account?.name ?? NO_ACCOUNT_NAME,
		type: 'primary',
		ownerAccount: account?.name ?? NO_ACCOUNT_NAME
	});

	// Adds all the aliases
	if (settings.attrs.zimbraMailAlias) {
		if (isArray(settings.attrs.zimbraMailAlias)) {
			result.push(
				...settings.attrs.zimbraMailAlias.map<AvailableAddress>((alias: string) => ({
					address: alias,
					type: 'alias',
					ownerAccount: account?.name ?? NO_ACCOUNT_NAME
				}))
			);
		} else {
			result.push({
				address: settings.attrs.zimbraMailAlias,
				type: 'alias',
				ownerAccount: account?.name ?? NO_ACCOUNT_NAME
			});
		}
	}

	// Adds the email addresses of all the delegation accounts
	if (account?.rights?.targets) {
		account.rights.targets.forEach((target) => {
			if (target.target && (target.right === 'sendAs' || target.right === 'sendOnBehalfOf')) {
				target.target.forEach((user) => {
					if (user.type === 'account' && user.email) {
						user.email.forEach((email) => {
							result.push({
								address: email.addr,
								type: 'delegation',
								right: target.right,
								ownerAccount: email.addr
							});
						});
					}
				});
			}
		});
	}

	return result;
};
