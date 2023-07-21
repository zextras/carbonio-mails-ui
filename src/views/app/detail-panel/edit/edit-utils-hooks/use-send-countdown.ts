/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useSnackbar } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { useEditorSendProcessStatus } from '../../../../../store/zustand/editor';
import { MailsEditorV2 } from '../../../../../types';

export const useSendCountdown = (editorId: MailsEditorV2['id']): void => {
	const sendProcessStatus = useEditorSendProcessStatus(editorId);
	const createSnackbar = useSnackbar();

	if (sendProcessStatus?.status !== 'running' || (sendProcessStatus?.countdown ?? 0) <= 0) {
		return;
	}

	createSnackbar({
		key: 'send',
		replace: true,
		type: 'info',
		label: t('messages.snackbar.sending_mail_in_count', {
			count: sendProcessStatus.countdown,
			defaultValue: 'Sending your message in {{count}} second',
			defaultValue_plural: 'Sending your message in {{count}} seconds'
		}),
		autoHideTimeout: (sendProcessStatus?.countdown ?? 0) * 1000,
		hideButton: false,
		actionLabel: t('label.undo', 'Undo'),
		onActionClick: sendProcessStatus.cancel
	});
};
