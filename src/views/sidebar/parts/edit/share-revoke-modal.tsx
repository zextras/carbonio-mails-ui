/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Checkbox, Container, Input, Row, Text } from '@zextras/carbonio-design-system';
import { t, useUserAccounts } from '@zextras/carbonio-shell-ui';

import { GranteeInfo } from './share-folder-properties';
import ModalFooter from '../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../carbonio-ui-commons/components/modals/modal-header';
import type { ShareRevokeModalType } from '../../../../carbonio-ui-commons/types/sidebar';
import { useAppDispatch } from '../../../../hooks/redux';
import { useUiUtilities } from '../../../../hooks/use-ui-utilities';
import { ShareCalendarRoleOptions } from '../../../../integrations/shared-invite-reply/parts/utils';
import { folderAction } from '../../../../store/actions/folder-action';
import { sendShareNotification } from '../../../../store/actions/send-share-notification';

const ShareRevokeModal: FC<ShareRevokeModalType> = ({ folder, onClose, grant, goBack }) => {
	const [sendNotification, setSendNotification] = useState(false);
	const [standardMessage, setStandardMessage] = useState('');

	const accounts = useUserAccounts();
	const dispatch = useAppDispatch();

	const { createSnackbar } = useUiUtilities();

	const onConfirm = useCallback(() => {
		if (sendNotification) {
			dispatch(
				sendShareNotification({
					sendNotification,
					standardMessage,
					contacts: [{ email: grant?.d }],
					folder,
					accounts
				})
			).then(() => {
				folderAction({ folder, zid: grant.zid, op: '!grant' }).then((res) => {
					if (!('Fault' in res)) {
						createSnackbar({
							key: `remove-share-${folder.id}`,
							replace: true,
							type: 'info',
							label: t('snackbar.share_revoke', 'Share access revoked'),
							autoHideTimeout: 2000,
							hideButton: true
						});
					}
					goBack();
				});
			});
		} else {
			folderAction({ folder, zid: grant.zid, op: '!grant' }).then((res) => {
				if (!('Fault' in res)) {
					createSnackbar({
						key: `remove-share-${folder.id}`,
						replace: true,
						type: 'info',
						label: t('snackbar.share_revoke', 'Share access revoked'),
						autoHideTimeout: 2000,
						hideButton: true
					});
				}
				goBack();
			});
		}
	}, [
		sendNotification,
		dispatch,
		standardMessage,
		grant?.d,
		grant.zid,
		folder,
		accounts,
		goBack,
		createSnackbar
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
export default ShareRevokeModal;
