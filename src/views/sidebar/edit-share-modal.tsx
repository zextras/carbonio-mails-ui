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
import type { Grant } from '@zextras/carbonio-ui-commons';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';

import { sendShareNotificationSoapApi } from 'api/send-share-notification-soap-api';
import { shareFolderSoapApi } from 'api/share-folder-soap-api';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { ShareCalendarRoleOptions, findLabel } from 'integrations/shared-invite-reply/parts/utils';
import { ModalProps } from 'types/utils';
import { GranteeInfo } from 'views/sidebar/parts/edit/share-folder-properties';

type EditShareModalProps = ModalProps & {
	grant: Grant;
	goBack: () => void;
	onSuccess?: () => void;
};

export const EditShareModal: FC<EditShareModalProps> = ({
	onClose,
	folder,
	grant,
	goBack,
	onSuccess
}) => {
	const shareCalendarRoleOptions = useMemo(() => ShareCalendarRoleOptions(t), []);
	const [sendNotification, setSendNotification] = useState(true);
	const [standardMessage, setStandardMessage] = useState('');
	const [shareWithUserRole, setShareWithUserRole] = useState<string>(grant.perm);

	const { createSnackbar } = useUiUtilities();
	const accounts = useUserAccounts();

	const title = useMemo(() => `${t('label.edit_access', 'Edit access')} `, []);

	const onShareRoleChange = useCallback((shareRole: string | null) => {
		if (shareRole !== null) setShareWithUserRole(shareRole);
	}, []);

	const onConfirm = useCallback(async (): Promise<void> => {
		const shareFolderResponse = await shareFolderSoapApi({
			sendNotification,
			standardMessage,
			contacts: [{ email: grant.d || grant.zid || '' }],
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
			label: t('snackbar.share_updated', '"Access rights updated"'),
			autoHideTimeout: 3000
		});
		if (sendNotification) {
			await sendShareNotificationSoapApi({
				standardMessage,
				contacts: [{ email: grant.d || grant.zid || '' }],
				folder,
				accounts
			});
		}
		onSuccess?.();
		onClose();
	}, [
		sendNotification,
		standardMessage,
		grant,
		shareWithUserRole,
		folder,
		accounts,
		onClose,
		createSnackbar,
		onSuccess
	]);

	const disableEdit = useMemo(
		() => grant.perm === shareWithUserRole,
		[grant.perm, shareWithUserRole]
	);

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
				<Container
					orientation="horizontal"
					mainAlignment="flex-end"
					padding={{ bottom: 'large', top: 'large' }}
				>
					<GranteeInfo grant={grant} shareCalendarRoleOptions={shareCalendarRoleOptions} />
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
								value: grant.perm,
								label: findLabel(shareCalendarRoleOptions, grant.perm)
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
								'The standard message displays your name, the name of the shared item, pemissions granted to the recipients, and sign in information, if necessary.'
							)}
						</Text>
					</Row>
				</Container>
			</Container>
			<ModalFooter
				label={t('action.edit_share', 'Edit Share')}
				onConfirm={onConfirm}
				disabled={disableEdit}
				secondaryAction={goBack}
				secondaryLabel={t('label.go_back', 'Go Back')}
			/>
		</>
	);
};
