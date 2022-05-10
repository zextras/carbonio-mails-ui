/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, FC, useCallback, useContext, useMemo, useState } from 'react';
import {
	Container,
	Input,
	Select,
	Text,
	Checkbox,
	Row,
	ChipInput,
	Padding,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import { useIntegratedComponent, useUserAccounts } from '@zextras/carbonio-shell-ui';
import { map, replace, split } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import {
	ShareCalendarWithOptions,
	findLabel,
	ShareCalendarRoleOptions
} from '../../integrations/shared-invite-reply/parts/utils';
import { shareFolder } from '../../store/actions/share-folder';
import { sendShareNotification } from '../../store/actions/send-share-notification';
import ModalFooter from './commons/modal-footer';
import { ModalHeader } from './commons/modal-header';
import { capitalise } from './utils';
import { GranteeInfo } from './parts/edit/share-folder-properties';
import { ModalProps } from '../../types/commons';

type ShareFolderModalProps = ModalProps & {
	goBack: () => void;
	editMode?: boolean;
	activeGrant: Partial<{ perm: string; d: string }>;
};

const ShareFolderModal: FC<ShareFolderModalProps> = ({
	onClose,
	folder,
	goBack,
	editMode = false,
	activeGrant
}) => {
	const [t] = useTranslation();
	// eslint-disable-next-line @typescript-eslint/ban-types
	const dispatch = useDispatch() as Function;
	// eslint-disable-next-line @typescript-eslint/ban-types
	const createSnackbar = useContext(SnackbarManagerContext) as Function;
	const [ContactInput, integrationAvailable] = useIntegratedComponent('contact-input');
	const shareCalendarWithOptions = useMemo(() => ShareCalendarWithOptions(t), [t]);
	const shareCalendarRoleOptions = useMemo(() => ShareCalendarRoleOptions(t), [t]);
	const [sendNotification, setSendNotification] = useState(false);
	const [standardMessage, setStandardMessage] = useState('');
	const [contacts, setContacts] = useState<any>([]);
	const [shareWithUserType, setshareWithUserType] = useState('usr');
	const [shareWithUserRole, setshareWithUserRole] = useState(editMode ? activeGrant.perm : 'r');
	const userName = useMemo(() => replace(split(activeGrant?.d, '@')?.[0], '.', ' '), [activeGrant]);
	const userNameCapitalise = useMemo(() => capitalise(userName), [userName]);

	const accounts = useUserAccounts();

	const title = useMemo(
		() =>
			editMode
				? `${t('label.edit_access', {
						name: userNameCapitalise,
						defaultValue: "Edit {{name}}'s access"
				  })} `
				: `${t('label.share', 'Share')} ${folder?.folder.name}`,
		[t, folder, editMode, userNameCapitalise]
	);

	const onShareWithChange = useCallback((shareWith) => {
		setshareWithUserType(shareWith);
	}, []);

	const onShareRoleChange = useCallback((shareRole) => {
		setshareWithUserRole(shareRole);
	}, []);

	const onConfirm = useCallback(() => {
		dispatch(
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			shareFolder({
				sendNotification,
				standardMessage,
				contacts: editMode ? [{ email: activeGrant.d }] : contacts,
				shareWithUserType,
				shareWithUserRole,
				folder,
				accounts
			})
		).then((res: { type: string }) => {
			if (res.type.includes('fulfilled')) {
				createSnackbar({
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
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						sendShareNotification({
							sendNotification,
							standardMessage,
							contacts: editMode ? [{ email: activeGrant.d }] : contacts,
							shareWithUserType,
							shareWithUserRole,
							folder,
							accounts
						})
					).then((res2: { type: string }) => {
						if (!res2.type.includes('fulfilled')) {
							createSnackbar({
								key: `share-${folder.id}`,
								replace: true,
								type: 'error',
								hideButton: true,
								label: t('label.error_try_again', 'Something went wrong, please try again'),
								autoHideTimeout: 3000
							});
						}
					});
				goBack && goBack();
			}
			onClose();
		});
	}, [
		dispatch,
		sendNotification,
		standardMessage,
		editMode,
		activeGrant.d,
		contacts,
		shareWithUserType,
		shareWithUserRole,
		folder,
		accounts,
		onClose,
		createSnackbar,
		t,
		goBack
	]);

	const disableEdit = useMemo(
		() => activeGrant?.perm === shareWithUserRole,
		[activeGrant?.perm, shareWithUserRole]
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
						<GranteeInfo grant={activeGrant} shareCalendarRoleOptions={shareCalendarRoleOptions} />
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
								backgroundColor="gray5"
								placeholder={t('share.recipients_address', 'Recipients’ e-mail addresses')}
								onChange={(ev: ChangeEvent<HTMLInputElement>): void => {
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									setContacts(map(ev, (contact) => ({ email: contact.address })));
								}}
								valueKey="address"
								getChipLabel={(
									participant: Partial<{ fullName: string; name: string; address: string }>
								): string | undefined =>
									participant.fullName ?? participant.name ?? participant.address
								}
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
						defaultSelection={{
							value: editMode ? activeGrant?.perm : 'r',
							label: findLabel(shareCalendarRoleOptions, editMode ? activeGrant?.perm : 'r')
						}}
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

export default ShareFolderModal;
