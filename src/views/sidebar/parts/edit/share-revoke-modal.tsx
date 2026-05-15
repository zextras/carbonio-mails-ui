/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Checkbox, Container, Input, Row, Text } from '@zextras/carbonio-design-system';
import { t, useUserAccounts } from '@zextras/carbonio-shell-ui';
import type { Folder, Grant } from '@zextras/carbonio-ui-commons';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';

import { folderActionSoapApi } from 'api/folder-action-soap-api';
import { sendShareNotificationSoapApi } from 'api/send-share-notification-soap-api';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { ShareCalendarRoleOptions } from 'integrations/shared-invite-reply/parts/utils';
import { GranteeInfo } from 'views/sidebar/parts/edit/share-folder-properties';

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
			} catch {
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
			<Checkbox
				iconSize="medium"
				value={sendNotification}
				defaultChecked={sendNotification}
				onClick={(): void => setSendNotification(!sendNotification)}
				label={t('label.send_notification', 'Send a notification message to')}
			/>
			<Container
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
				padding={{ bottom: 'large', top: 'large' }}
			>
				<Input
					label={t('share.standard_message', 'Add a note to the standard message')}
					value={standardMessage}
					onChange={(ev: React.ChangeEvent<HTMLInputElement>): void => {
						setStandardMessage(ev.target.value);
					}}
					disabled={!sendNotification}
					backgroundColor="gray5"
				/>
			</Container>
			<Container
				orientation="horizontal"
				crossAlignment="baseline"
				mainAlignment="baseline"
				padding={{ all: 'small' }}
			>
				<Row padding={{ right: 'small' }}>
					<Text weight="bold" size="small" color="gray0">
						Note:
					</Text>
				</Row>
				<Row padding={{ bottom: 'small' }}>
					<Text overflow="break-word" size="small" color="gray1">
						{t(
							'share.share_note',
							'The standard message displays your name, the name of the shared item, pemissions granted to the recipients, and sign in information, if necessary.'
						)}
					</Text>
				</Row>
			</Container>
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
