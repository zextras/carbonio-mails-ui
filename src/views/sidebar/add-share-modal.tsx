/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, FC, useCallback, useMemo, useState } from 'react';

import {
	Checkbox,
	Container,
	Input,
	Padding,
	Row,
	Select,
	SelectItem,
	Text
} from '@zextras/carbonio-design-system';
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
			await sendShareNotificationSoapApi({
				standardMessage,
				contacts: contacts.map((contact) => ({ email: contact.value.email })),
				folder,
				accounts
			});
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
				<Container
					height="fit"
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					padding={{ vertical: 'medium' }}
					data-testid={'sendNotificationCheckboxContainer'}
				>
					<Checkbox
						value={sendNotification}
						defaultChecked={sendNotification}
						onClick={(): void => setSendNotification(!sendNotification)}
						label={t('share.send_notification', 'Send a notification about this share')}
					/>
				</Container>

				<Container height="fit">
					<Input
						label={t('share.standard_message', 'Add a note to the standard message')}
						value={standardMessage}
						onChange={(ev: ChangeEvent<HTMLInputElement>): void => {
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
								'The standard message displays your name, the name of the shared item, permissions granted to the recipients, and sign in information, if necessary.'
							)}
						</Text>
					</Row>
				</Container>
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
