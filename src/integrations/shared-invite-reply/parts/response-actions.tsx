/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, FC, ReactElement, useCallback, useMemo, useState } from 'react';

import { Button, Checkbox, Divider, Input, Padding, Row } from '@zextras/carbonio-design-system';
import { useUserAccounts } from '@zextras/carbonio-shell-ui';
import { FOLDER_VIEW } from '@zextras/carbonio-ui-commons';
import { TFunction } from 'i18next';

import ColorSelect from 'integrations/shared-invite-reply/parts/color-select';
import { useAccept, useDecline } from 'integrations/shared-invite-reply/parts/share-folder-actions';
import { ResponseActionsProps } from 'types/share';

function getProposedFolderName(sharedFolderName: string, ownerName: string, t: TFunction): string {
	const of = t('label.of', 'of');
	return `${sharedFolderName} ${of} ${ownerName}`;
}

const ResponseActions: FC<ResponseActionsProps> = ({
	t,
	zid,
	view,
	rid,
	msgId,
	sharedFolderName,
	grantee,
	owner,
	role,
	allowedActions,
	participants
}): ReactElement => {
	const [customMessage, setCustomMessage] = useState('');
	const [notifyOrganizer, setNotifyOrganizer] = useState(false);
	const niceFolderName = ['message', 'appointment', 'contact'].includes(view)
		? getProposedFolderName(sharedFolderName, owner, t)
		: sharedFolderName;
	const [folderName, setFolderName] = useState(niceFolderName);
	const [selectedColor, setSelectedColor] = useState<string | null>('0');
	const accounts = useUserAccounts();

	const folderNameLabel = useMemo(() => {
		switch (view) {
			case FOLDER_VIEW.message:
				return t('label.folder_name', 'Folder name');
			case FOLDER_VIEW.appointment:
				return t('label.calendar_name', 'Calendar name');
			case FOLDER_VIEW.contact:
				return t('label.addressbook_name', 'Address book name');
			default:
				return t('label.type_name_here', 'Item name');
		}
	}, [t, view]);

	const hasNameError = useMemo(() => folderName.length === 0, [folderName]);

	const nameError = useMemo(() => {
		if (folderName.length > 0) {
			return undefined;
		}

		switch (view) {
			case FOLDER_VIEW.message:
				return t('messages.enter_folder_name', 'Enter a name to accept the folder');
			case FOLDER_VIEW.appointment:
				return t('messages.enter_calendar_name', 'Enter a name to accept the calendar');
			case FOLDER_VIEW.contact:
				return t('messages.enter_address_name', 'Enter a name to accept the address book');
			default:
				return undefined;
		}
	}, [folderName.length, t, view]);

	const isConfirmDisabled = useMemo(() => hasNameError, [hasNameError]);

	const accept = useAccept();
	const acceptShare = useCallback(
		() =>
			accept({
				zid,
				view,
				rid,
				folderName,
				color: parseInt(selectedColor ?? '0', 10),
				accounts,
				t,
				msgId,
				sharedFolderName,
				owner,
				participants,
				grantee,
				customMessage,
				role,
				allowedActions,
				notifyOrganizer
			}),
		[
			accept,
			zid,
			view,
			rid,
			folderName,
			selectedColor,
			accounts,
			t,
			msgId,
			sharedFolderName,
			owner,
			participants,
			grantee,
			customMessage,
			role,
			allowedActions,
			notifyOrganizer
		]
	);

	const decline = useDecline();
	const declined = useCallback(() => {
		decline({
			t,
			msgId,
			sharedFolderName,
			owner,
			participants,
			grantee,
			customMessage,
			role,
			allowedActions,
			notifyOrganizer
		});
	}, [
		decline,
		t,
		msgId,
		sharedFolderName,
		owner,
		participants,
		grantee,
		customMessage,
		role,
		allowedActions,
		notifyOrganizer
	]);
	return (
		<>
			<Row width="100%" crossAlignment="baseline" padding={{ vertical: 'small' }}>
				<Row width="auto">
					<Padding right="small">
						<Checkbox
							value={notifyOrganizer}
							onClick={(): void => setNotifyOrganizer(!notifyOrganizer)}
							label={t('label.notify_organizer', 'Notify Organizer')}
						/>
					</Padding>
				</Row>
				<Row width="80%" padding={{ left: 'small', vertical: 'small' }}>
					<Input
						label={t('label.add_custom_message', 'Add a custom message')}
						value={customMessage}
						onChange={(ev: any): void => {
							setCustomMessage(ev.target.value);
						}}
						backgroundColor="gray6"
						disabled={!notifyOrganizer}
					/>
				</Row>
			</Row>
			<Row width="fill" mainAlignment="space-around">
				<Row width="50%" mainAlignment="flex-start">
					<Input
						label={folderNameLabel}
						backgroundColor="gray5"
						value={folderName}
						hasError={hasNameError}
						description={nameError}
						onChange={(e: ChangeEvent<HTMLInputElement>): void => setFolderName(e.target.value)}
					/>
				</Row>
				<Row
					width="50%"
					mainAlignment="flex-start"
					padding={{ horizontal: 'small', vertical: 'small' }}
				>
					<ColorSelect
						onChange={(a: string | null): void => setSelectedColor(a)}
						defaultColor={0}
						label={t('label.calendar_color', `Item color`)}
					/>
				</Row>
			</Row>
			<Divider />
			<Row
				orientation="horizontal"
				crossAlignment="flex-start"
				mainAlignment="center"
				height="fit"
				padding={{ all: 'large' }}
			>
				<Button
					type="outlined"
					label={t('label.accept', 'Accept')}
					icon="Checkmark"
					onClick={acceptShare}
					disabled={isConfirmDisabled}
				/>
				<Padding horizontal="small" />
				<Button
					color="error"
					type="outlined"
					label={t('label.decline', 'Decline')}
					icon="CloseOutline"
					onClick={declined}
				/>
				<Padding horizontal="small" />
			</Row>
		</>
	);
};

export default ResponseActions;
