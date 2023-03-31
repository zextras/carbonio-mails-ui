/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Checkbox,
	ChipInput,
	ChipItem,
	Container,
	Input,
	Padding,
	Row,
	Select,
	SelectItem,
	Text
} from '@zextras/carbonio-design-system';
import {
	getBridgedFunctions,
	t,
	useIntegratedComponent,
	useUserAccounts
} from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import React, { ChangeEvent, FC, useCallback, useMemo, useState } from 'react';
import ModalFooter from '../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../carbonio-ui-commons/components/modals/modal-header';
import { EditPermissionsModalProps } from '../../carbonio-ui-commons/types/sidebar';
import { useAppDispatch } from '../../hooks/redux';
import {
	ShareCalendarRoleOptions,
	ShareCalendarWithOptions,
	findLabel
} from '../../integrations/shared-invite-reply/parts/utils';
import { sendShareNotification } from '../../store/actions/send-share-notification';
import { shareFolder } from '../../store/actions/share-folder';
import { GranteeInfo } from './parts/edit/share-folder-properties';

const EditPermissionsModal: FC<EditPermissionsModalProps> = ({
	onClose,
	folder,
	editMode = false,
	grant,
	goBack
}) => {
	const dispatch = useAppDispatch();
	const [ContactInput, integrationAvailable] = useIntegratedComponent('contact-input');
	const shareCalendarWithOptions = useMemo(() => ShareCalendarWithOptions(t), []);
	const shareCalendarRoleOptions = useMemo(() => ShareCalendarRoleOptions(t), []);
	const [sendNotification, setSendNotification] = useState(false);
	const [standardMessage, setStandardMessage] = useState('');
	const [contacts, setContacts] = useState<any>([]);
	const [shareWithUserType, setshareWithUserType] = useState('usr');
	const [shareWithUserRole, setshareWithUserRole] = useState(editMode ? grant.perm : 'r');

	const accounts = useUserAccounts();

	const title = useMemo(
		() =>
			editMode
				? `${t('label.edit_access', 'Edit access')} `
				: `${t('label.share', 'Share')} ${folder.name}`,
		[editMode, folder.name]
	);

	const onShareWithChange = useCallback((shareWith) => {
		setshareWithUserType(shareWith);
	}, []);

	const onShareRoleChange = useCallback((shareRole) => {
		setshareWithUserRole(shareRole);
	}, []);

	const onConfirm = useCallback(() => {
		dispatch(
			shareFolder({
				sendNotification,
				standardMessage,
				contacts: editMode ? [{ email: grant.d || grant.zid }] : contacts,
				shareWithUserType,
				shareWithUserRole,
				folder,
				accounts
			})
		).then((res: { type: string }) => {
			if (res.type.includes('fulfilled')) {
				getBridgedFunctions()?.createSnackbar({
					key: `share-${folder.id}`,
					replace: true,
					hideButton: true,
					type: 'info',
					label: editMode
						? t('snackbar.share_updated', '"Access rights updated"')
						: t('snackbar.folder_shared', 'Folder shared'),
					autoHideTimeout: 3000
				});
				sendNotification &&
					dispatch(
						sendShareNotification({
							sendNotification,
							standardMessage,
							contacts: editMode ? [{ email: grant.d || grant.zid }] : contacts,
							shareWithUserType,
							shareWithUserRole,
							folder,
							accounts
						})
					).then((res2: { type: string }) => {
						if (!res2.type.includes('fulfilled')) {
							getBridgedFunctions()?.createSnackbar({
								key: `share-${folder.id}`,
								replace: true,
								type: 'error',
								hideButton: true,
								label: t('label.error_try_again', 'Something went wrong, please try again'),
								autoHideTimeout: 3000
							});
						}
					});
			}
			onClose();
		});
	}, [
		dispatch,
		sendNotification,
		standardMessage,
		editMode,
		grant,
		contacts,
		shareWithUserType,
		shareWithUserRole,
		folder,
		accounts,
		onClose
	]);

	const disableEdit = useMemo(
		() => grant?.perm === shareWithUserRole,
		[grant?.perm, shareWithUserRole]
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
				{!editMode && (
					<Container height="fit">
						<Select
							items={shareCalendarWithOptions}
							background="gray5"
							label={t('label.share_with', 'Share with')}
							onChange={onShareWithChange}
							defaultSelection={{
								value: 'usr',
								label: findLabel(shareCalendarWithOptions, 'usr')
							}}
						/>
					</Container>
				)}
				{editMode ? (
					<Container
						orientation="horizontal"
						mainAlignment="flex-end"
						padding={{ bottom: 'large', top: 'large' }}
					>
						<GranteeInfo grant={grant} shareCalendarRoleOptions={shareCalendarRoleOptions} />
					</Container>
				) : (
					<Container height="fit" padding={{ vertical: 'small' }}>
						{integrationAvailable ? (
							<ContactInput
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								background="gray4"
								placeholder={t('share.recipients_address', 'Recipients’ e-mail addresses')}
								onChange={(ev: ChangeEvent<HTMLInputElement>): void => {
									setContacts(ev);
								}}
								defaultValue={contacts}
							/>
						) : (
							<ChipInput
								placeholder={t('share.recipients_address', 'Recipients’ e-mail addresses')}
								onChange={(items: ChipItem[]): void => {
									setContacts(map(items, (contact) => ({ email: contact })));
								}}
							/>
						)}
					</Container>
				)}

				<Container height="fit">
					<Select
						items={shareCalendarRoleOptions}
						background="gray5"
						label={t('label.role', 'Role')}
						onChange={onShareRoleChange}
						defaultSelection={
							{
								value: editMode ? grant?.perm : 'r',
								label: findLabel(shareCalendarRoleOptions, editMode ? grant?.perm : 'r')
							} as SelectItem
						}
					/>
				</Container>
				<Container
					height="fit"
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					padding={{ vertical: 'medium' }}
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
				label={
					editMode ? t('action.edit_share', 'Edit Share') : t('action.share_folder', 'Share folder')
				}
				onConfirm={onConfirm}
				disabled={editMode ? disableEdit : contacts.length < 1}
				secondaryAction={goBack}
				secondaryLabel={t('label.go_back', 'Go Back')}
			/>
		</>
	);
};

export default EditPermissionsModal;
