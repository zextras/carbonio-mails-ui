/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { CreateSnackbarFn } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { mailToSharedFunction } from '../integrations/shared-functions';
import { Participant } from '../types';

export const copyEmailToClipboard = (email: string, createSnackbar: CreateSnackbarFn): void => {
	navigator.clipboard.writeText(email).then(() => {
		createSnackbar({
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
