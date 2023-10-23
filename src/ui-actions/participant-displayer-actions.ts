/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t, getBridgedFunctions } from '@zextras/carbonio-shell-ui';

import { mailToSharedFunction } from '../integrations/shared-functions';
import { Participant } from '../types';

export const copyEmailToClipboard = (email: string): void => {
	navigator.clipboard.writeText(email).then(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		getBridgedFunctions().createSnackbar({
			key: `clipboard-copy-success`,
			replace: true,
			type: 'success',
			hideButton: true,
			label: t('snackbar.email_copied_to_clipboard', 'Email copied to clipboard.'),
			autoHideTimeout: 3000
		});
	});
};

export const sendMsg = (contact: Participant): void => {
	mailToSharedFunction([contact]);
};
