/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container, Padding, Select, SelectItem } from '@zextras/carbonio-design-system';
import { t, useUserAccounts } from '@zextras/carbonio-shell-ui';
import type { Grant } from '@zextras/carbonio-ui-commons';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';

import { sendShareNotificationSoapApi } from 'api/send-share-notification-soap-api';
import { shareFolderSoapApi } from 'api/share-folder-soap-api';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { ShareCalendarRoleOptions, findLabel } from 'integrations/shared-invite-reply/parts/utils';
import { ModalProps } from 'types/utils';
import { GranteeInfo } from 'views/sidebar/parts/edit/share-folder-properties';
import { ShareNotificationFields } from 'views/sidebar/share-notification-fields';

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

	const title = useMemo(() => t('label.edit_access', 'Edit access'), []);

	const onShareRoleChange = useCallback((shareRole: string | null) => {
		if (shareRole !== null) setShareWithUserRole(shareRole);
	}, []);

	const onConfirm = useCallback(async (): Promise<void> => {
		const shareFolderResponse = await shareFolderSoapApi({
			sendNotification,
			standardMessage,
			contacts: [{ email: grant.d ?? '' }],
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
			label: t('snackbar.share_updated', 'Access rights updated'),
			autoHideTimeout: 3000
		});
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
				<ShareNotificationFields
					sendNotification={sendNotification}
					standardMessage={standardMessage}
					onToggleNotification={(): void => setSendNotification(!sendNotification)}
					onMessageChange={setStandardMessage}
				/>
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
