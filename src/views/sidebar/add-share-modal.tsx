/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Container, Padding, Select, SelectItem } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import {
	ContactInputItem,
	ModalFooter,
	ModalHeader,
	useContactInput
} from '@zextras/carbonio-ui-commons';

import { useShareFolderConfirm } from 'hooks/use-share-folder-confirm';
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

	const title = useMemo(() => `${t('label.share', 'Share')} ${folder.name}`, [folder.name]);

	const onShareRoleChange = useCallback((shareRole: string | null) => {
		if (shareRole !== null) setShareWithUserRole(shareRole);
	}, []);

	const confirm = useShareFolderConfirm({
		folder,
		shareWithUserRole,
		sendNotification,
		standardMessage,
		successLabel: t('snackbar.folder_shared', 'Folder shared'),
		goBack,
		onSuccess
	});

	const onConfirm = useCallback(
		() => confirm(contacts.map((c) => ({ email: c.value.email }))),
		[confirm, contacts]
	);

	const recipientsEmailsRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		recipientsEmailsRef.current?.focus();
	}, []);

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
						placeholder={`${t('share.recipients_address', 'Recipients’ e-mail addresses')}*`}
						onChange={(contactChips: ContactInputItem[]): void => {
							setContacts(contactChips);
						}}
						defaultValue={contacts}
						inputRef={recipientsEmailsRef}
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
