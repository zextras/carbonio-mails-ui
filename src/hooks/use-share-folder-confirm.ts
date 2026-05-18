/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { t, useUserAccounts } from '@zextras/carbonio-shell-ui';
import type { Folder } from '@zextras/carbonio-ui-commons';

import { sendShareNotificationSoapApi } from 'api/send-share-notification-soap-api';
import { shareFolderSoapApi } from 'api/share-folder-soap-api';
import { useUiUtilities } from 'hooks/use-ui-utilities';

type UseShareFolderConfirmParams = {
	folder: Folder;
	shareWithUserRole: string;
	sendNotification: boolean;
	standardMessage: string;
	successLabel: string;
	goBack: () => void;
	onSuccess?: () => void;
};

export const useShareFolderConfirm = ({
	folder,
	shareWithUserRole,
	sendNotification,
	standardMessage,
	successLabel,
	goBack,
	onSuccess
}: UseShareFolderConfirmParams): ((contacts: Array<{ email: string }>) => Promise<void>) => {
	const { createSnackbar } = useUiUtilities();
	const accounts = useUserAccounts();

	return useCallback(
		async (contacts: Array<{ email: string }>): Promise<void> => {
			const res = await shareFolderSoapApi({
				sendNotification,
				standardMessage,
				contacts,
				shareWithUserRole,
				folder,
				accounts
			});
			if ('Fault' in res) {
				createSnackbar({
					key: `share-${folder.id}`,
					replace: true,
					hideButton: true,
					severity: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 3000
				});
				goBack();
				return;
			}
			createSnackbar({
				key: `share-${folder.id}`,
				replace: true,
				hideButton: true,
				severity: 'info',
				label: successLabel,
				autoHideTimeout: 3000
			});
			if (sendNotification) {
				try {
					await sendShareNotificationSoapApi({
						standardMessage,
						contacts,
						folder,
						accounts
					});
				} catch (e) {
					console.error('Failed to send share notification', e);
					createSnackbar({
						key: `notify-${folder.id}`,
						replace: true,
						severity: 'warning',
						label: t('label.notification_failed', 'Failed to send notification'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			}
			onSuccess?.();
			goBack();
		},
		[
			folder,
			shareWithUserRole,
			sendNotification,
			standardMessage,
			successLabel,
			accounts,
			createSnackbar,
			goBack,
			onSuccess
		]
	);
};
