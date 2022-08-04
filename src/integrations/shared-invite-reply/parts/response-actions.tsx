/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable import/extensions */
import React, { FC, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import {
	Padding,
	Button,
	Divider,
	Row,
	Checkbox,
	Input,
	Text
} from '@zextras/carbonio-design-system';
import { useFoldersAccordionByView, useUserAccounts } from '@zextras/carbonio-shell-ui';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { find } from 'lodash';
import ColorSelect from './color-select';
import { ResponseActionsProps } from '../../../types';
import { accept, decline } from './share-calendar-actions';
import { FOLDER_VIEW } from '../../../constants';

const ResponseActions: FC<ResponseActionsProps> = ({
	dispatch,
	t,
	createSnackbar,
	zid,
	view,
	rid,
	msgId,
	sharedCalendarName,
	grantee,
	owner,
	role,
	allowedActions,
	participants
}): ReactElement => {
	const [customMessage, setCustomMessage] = useState('');
	const [notifyOrganizer, setNotifyOrganizer] = useState(false);
	const [calendarName, setCalendarName] = useState(sharedCalendarName);
	const [selectedColor, setSelectedColor] = useState(0);
	const accounts = useUserAccounts();
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const calFolders = useFoldersAccordionByView(FOLDER_VIEW.appointment, null);
	const showError = useMemo(
		() => find(calFolders[0].items, (item) => item.label === calendarName.toLowerCase()),
		[calFolders, calendarName]
	);
	const disabled = useMemo(
		() => !calendarName || !calendarName.length || showError,
		[calendarName, showError]
	);
	const acceptShare = useCallback(
		() =>
			accept({
				zid,
				view,
				rid,
				calendarName,
				color: selectedColor,
				accounts,
				t,
				dispatch,
				msgId,
				sharedCalendarName,
				owner,
				participants,
				grantee,
				customMessage,
				role,
				allowedActions,
				notifyOrganizer,
				createSnackbar
			}),
		[
			zid,
			view,
			rid,
			calendarName,
			selectedColor,
			accounts,
			t,
			dispatch,
			msgId,
			sharedCalendarName,
			owner,
			participants,
			grantee,
			customMessage,
			role,
			allowedActions,
			notifyOrganizer,
			createSnackbar
		]
	);

	const declined = useCallback(() => {
		decline({
			dispatch,
			t,
			createSnackbar,
			msgId,
			sharedCalendarName,
			owner,
			participants,
			grantee,
			customMessage,
			role,
			allowedActions,
			notifyOrganizer
		});
	}, [
		dispatch,
		t,
		createSnackbar,
		msgId,
		sharedCalendarName,
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
						label={t('label.type_name_here', 'Item name')}
						backgroundColor="gray5"
						value={calendarName}
						hasError={disabled}
						onChange={(e: any): void => setCalendarName(e.target.value)}
					/>
				</Row>
				<Row
					width="50%"
					mainAlignment="flex-start"
					padding={{ horizontal: 'small', vertical: 'small' }}
				>
					<ColorSelect
						onChange={(a: any): any => setSelectedColor(a)}
						t={t}
						label={t('label.calendar_color', `Item color`)}
					/>
				</Row>
				<Row width="100%" height="16px" mainAlignment="flex-start" style={{ marginBottom: '8px' }}>
					{showError && (
						<Text size="small" color="error">
							{t(
								'messages.cal_name_exist_warning',
								'A calendar with the same name already exists in this path'
							)}
						</Text>
					)}
				</Row>
			</Row>
			<Divider />
			<Row
				orientation="horizontal"
				crossAlignment="flex-start"
				mainAlignment="center"
				weight="fill"
				height="fit"
				padding={{ all: 'large' }}
			>
				<Button
					type="outlined"
					label={t('label.accept', 'Accept')}
					icon="Checkmark"
					onClick={acceptShare}
					disabled={disabled}
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
