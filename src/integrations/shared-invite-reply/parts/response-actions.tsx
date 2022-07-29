/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable import/extensions */
import React, { FC, ReactElement, useCallback, useState } from 'react';
import { Padding, Button, Divider, Row, Checkbox, Input } from '@zextras/carbonio-design-system';
import { useUserAccounts } from '@zextras/carbonio-shell-ui';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ColorSelect from './color-select';
import { ResponseActionsProps } from '../../../types';
import { accept, decline } from './share-calendar-actions';

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
