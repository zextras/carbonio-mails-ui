/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { t, useUserAccounts } from '@zextras/carbonio-shell-ui';
import type { Folder, Grant } from '@zextras/carbonio-ui-commons';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';

import { folderActionSoapApi } from 'api/folder-action-soap-api';
import { sendShareNotificationSoapApi } from 'api/send-share-notification-soap-api';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { ShareCalendarRoleOptions } from 'integrations/shared-invite-reply/parts/utils';
import { GranteeInfo } from 'views/sidebar/parts/edit/share-folder-properties';
import { ShareNotificationFields } from 'views/sidebar/share-notification-fields';

type ShareRevokeModalProps = {
	folder: Folder;
	onClose?: () => void;
	grant: Grant;
	goBack: () => void;
	onSuccess?: () => void;
};

export const ShareRevokeModal: FC<ShareRevokeModalProps> = ({
	folder,
	onClose,
	grant,
	goBack,
	onSuccess
}) => {
	const [sendNotification, setSendNotification] = useState(false);
	const [standardMessage, setStandardMessage] = useState('');

	const accounts = useUserAccounts();

	const { createSnackbar } = useUiUtilities();

	const onConfirm = useCallback(async () => {
		if (!grant.zid) {
			createSnackbar({
				key: `remove-share-${folder.id}`,
				replace: true,
				severity: 'error',
				label: t('label.error_try_again', 'Something went wrong, please try again'),
				autoHideTimeout: 3000,
				hideButton: true
			});
			goBack();
			return;
		}
		if (sendNotification) {
			try {
				await sendShareNotificationSoapApi({
					standardMessage,
					contacts: [{ email: grant.d ?? '' }],
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
		const res = await folderActionSoapApi({ folder, zid: grant.zid, op: '!grant' });
		if (!('Fault' in res)) {
			createSnackbar({
				key: `remove-share-${folder.id}`,
				replace: true,
				severity: 'info',
				label: t('snackbar.share_revoke', 'Share access revoked'),
				autoHideTimeout: 2000,
				hideButton: true
			});
			onSuccess?.();
		} else {
			createSnackbar({
				key: `remove-share-${folder.id}`,
				replace: true,
				severity: 'error',
				label: t('label.error_try_again', 'Something went wrong, please try again'),
				autoHideTimeout: 3000,
				hideButton: true
			});
		}
		goBack();
	}, [
		sendNotification,
		standardMessage,
		grant.d,
		grant.zid,
		folder,
		accounts,
		goBack,
		createSnackbar,
		onSuccess
	]);

	const shareCalendarRoleOptions = useMemo(
		() => ShareCalendarRoleOptions(t, grant.perm?.includes('p')),
		[grant.perm]
	);

	const toolTip = useMemo(() => {
		if (sendNotification && standardMessage.length > 0)
			return t('label.revoke_with_custom_message', 'Revoke access sending a custom notification');
		if (sendNotification)
			return t('label.revoke_access_tooltip', 'Revoke access sending a standard notification');
		return t(
			'label.revoke_access_without_notification',
			'Revoke access without sending a notification'
		);
	}, [sendNotification, standardMessage]);

	return (
		<Container
			padding={{ all: 'small' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
			<ModalHeader title={t('label.revoke_share', 'Revoke share')} onClose={onClose} />
			<Container
				orientation="horizontal"
				mainAlignment="flex-end"
				padding={{ bottom: 'large', top: 'large' }}
			>
				<GranteeInfo
					grant={grant}
					hovered={false}
					shareCalendarRoleOptions={shareCalendarRoleOptions}
				/>
			</Container>
			<ShareNotificationFields
				sendNotification={sendNotification}
				standardMessage={standardMessage}
				onToggleNotification={(): void => setSendNotification(!sendNotification)}
				onMessageChange={setStandardMessage}
			/>
			<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
				<ModalFooter
					background="error"
					onConfirm={onConfirm}
					secondaryAction={goBack}
					secondaryLabel={t('label.go_back', 'Go Back')}
					label={t('label.revoke', 'Revoke')}
					tooltip={toolTip}
				/>
			</Container>
		</Container>
	);
};
