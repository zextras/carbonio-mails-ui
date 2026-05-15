/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container, Padding, Select, SelectItem } from '@zextras/carbonio-design-system';
import { t, useUserAccounts } from '@zextras/carbonio-shell-ui';
import {
	ContactInputItem,
	ModalFooter,
	ModalHeader,
	useContactInput
} from '@zextras/carbonio-ui-commons';

import { sendShareNotificationSoapApi } from 'api/send-share-notification-soap-api';
import { shareFolderSoapApi } from 'api/share-folder-soap-api';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { ShareCalendarRoleOptions, findLabel } from 'integrations/shared-invite-reply/parts/utils';
import { ModalProps } from 'types/utils';
import { ShareNotificationFields } from 'views/sidebar/share-notification-fields';

type AddShareModalProps = ModalProps & {
	goBack: () => void;
	onSuccess?: () => void;
};

export const AddShareModal: FC<AddShareModalProps> = ({ onClose, folder, goBack, onSuccess }) => {
	const ContactInput = useContactInput();
	const shareCalendarRoleOptions = useMemo(() => ShareCalendarRoleOptions(t), []);
	const [sendNotification, setSendNotification] = useState(true);
	const [standardMessage, setStandardMessage] = useState('');
	const [contacts, setContacts] = useState<ContactInputItem[]>([]);
	const [shareWithUserRole, setShareWithUserRole] = useState<string>('r');

	const { createSnackbar } = useUiUtilities();
	const accounts = useUserAccounts();

	const title = useMemo(() => `${t('label.share', 'Share')} ${folder.name}`, [folder.name]);

	const onShareRoleChange = useCallback((shareRole: string | null) => {
		if (shareRole !== null) setShareWithUserRole(shareRole);
	}, []);

	const onConfirm = useCallback(async (): Promise<void> => {
		const shareFolderResponse = await shareFolderSoapApi({
			sendNotification,
			standardMessage,
			contacts: contacts.map((contact) => ({ email: contact.value.email })),
			shareWithUserRole,
			folder,
			accounts
		});
		if ('Fault' in shareFolderResponse) {
			createSnackbar({
				key: `share-${folder.id}`,
				replace: true,
				hideButton: true,
				severity: 'error',
				label: t('label.error_try_again', 'Something went wrong, please try again'),
				autoHideTimeout: 3000
			});
			return;
		}
		createSnackbar({
			key: `share-${folder.id}`,
			replace: true,
			hideButton: true,
			severity: 'info',
			label: t('snackbar.folder_shared', 'Folder shared'),
			autoHideTimeout: 3000
		});
		if (sendNotification) {
			try {
				await sendShareNotificationSoapApi({
					standardMessage,
					contacts: contacts.map((contact) => ({ email: contact.value.email })),
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
		onClose();
	}, [
		sendNotification,
		standardMessage,
		contacts,
		shareWithUserRole,
		folder,
		accounts,
		onClose,
		createSnackbar,
		onSuccess
	]);

	return (
		<>
			<Container
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
				padding={{ vertical: 'small' }}
			>
				<ModalHeader title={title} onClose={onClose} />
				<Padding top="small" />
				<Container height="fit" padding={{ vertical: 'small' }}>
					<ContactInput
						background="gray4"
						placeholder={t('share.recipients_address', "Recipients' e-mail addresses")}
						onChange={(contactChips: ContactInputItem[]): void => {
							setContacts(contactChips);
						}}
						defaultValue={contacts}
					/>
				</Container>
				<Container height="fit">
					<Select
						data-testid={'share-role'}
						items={shareCalendarRoleOptions}
						background="gray5"
						label={t('label.role', 'Role')}
						onChange={onShareRoleChange}
						defaultSelection={
							{
								value: 'r',
								label: findLabel(shareCalendarRoleOptions, 'r')
							} as SelectItem
						}
					/>
				</Container>
				<ShareNotificationFields
					sendNotification={sendNotification}
					standardMessage={standardMessage}
					onToggleNotification={(): void => setSendNotification(!sendNotification)}
					onMessageChange={setStandardMessage}
				/>
			</Container>
			<ModalFooter
				label={t('action.share_folder', 'Share folder')}
				onConfirm={onConfirm}
				disabled={contacts.length < 1}
				secondaryAction={goBack}
				secondaryLabel={t('label.go_back', 'Go Back')}
			/>
		</>
	);
};
