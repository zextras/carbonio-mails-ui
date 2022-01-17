/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Checkbox, Container, Input, Row, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useUserAccounts } from '@zextras/carbonio-shell-ui';
import { ModalHeader } from '../../commons/modal-header';
import ModalFooter from '../../commons/modal-footer';

import { ShareCalendarRoleOptions } from '../../../../integrations/shared-invite-reply/parts/utils';
import { GranteeInfo } from './share-folder-properties';
import { sendShareNotification } from '../../../../store/actions/send-share-notification';
import { folderAction } from '../../../../store/actions/folder-action';

const ShareRevokeModal = ({ folder, onClose, grant, createSnackbar, goBack }) => {
	const [t] = useTranslation();
	const [sendNotification, setSendNotification] = useState(false);
	const [standardMessage, setStandardMessage] = useState('');

	const accounts = useUserAccounts();
	const dispatch = useDispatch();

	const onConfirm = useCallback(() => {
		if (sendNotification) {
			dispatch(
				sendShareNotification({
					sendNotification,
					standardMessage,
					contacts: [{ email: grant.d }],
					folder,
					accounts
				})
			).then(() => {
				dispatch(folderAction({ folder, zid: grant.zid, op: '!grant' })).then((res) => {
					if (res.type.includes('fulfilled')) {
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
			dispatch(folderAction({ folder, zid: grant.zid, op: '!grant' })).then((res) => {
				if (res.type.includes('fulfilled')) {
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
		accounts,
		dispatch,
		grant.d,
		grant.zid,
		sendNotification,
		standardMessage,
		folder,
		createSnackbar,
		t,
		goBack
	]);
	const shareCalendarRoleOptions = useMemo(
		() => ShareCalendarRoleOptions(t, grant.perm?.includes('p')),
		[t, grant.perm]
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
	}, [t, sendNotification, standardMessage]);
	return (
		<Container
			padding={{ all: 'small' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
			<ModalHeader
				title={t('label.revoke_share', {
					title: folder.name,
					defaultValue: "Revoke {{title}}'s share"
				})}
				onClose={onClose}
			/>
			<Container
				orientation="horizontal"
				mainAlignment="flex-end"
				padding={{ bottom: 'large', top: 'large' }}
			>
				<GranteeInfo grant={grant} shareCalendarRoleOptions={shareCalendarRoleOptions} />
			</Container>
			<Checkbox
				iconSize="medium"
				value={sendNotification}
				defaultChecked={sendNotification}
				onClick={() => setSendNotification(!sendNotification)}
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
					onChange={(ev) => {
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
					t={t}
					tooltip={toolTip}
				/>
			</Container>
		</Container>
	);
};
export default ShareRevokeModal;
