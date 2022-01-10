/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Dispatch } from 'redux';
import { map } from 'lodash';
import { mountSharedCalendar } from '../../../store/actions/mount-share-calendar';
import { msgAction } from '../../../store/actions';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { acceptSharedCalendarReply } from '../../../store/actions/acceptSharedCalendarReply';

type accept = {
	zid: string;
	view: string;
	rid: string;
	calendarName: string;
	color: number;
	accounts: any;
	t: (...args: any[]) => string;
	dispatch: Dispatch;
	msgId: Array<string> | any;
	sharedCalendarName: string;
	owner: string;
	participants: any;
	grantee: string;
	customMessage: string;
	createSnackbar: any;
	role: string;
	allowedActions: string;
	notifyOrganizer: boolean;
};

type moveInviteToTrashType = {
	t: (...args: any[]) => string;
	dispatch: Dispatch;
	msgId: string;
};

type mountSharedCalendarType = {
	zid: string;
	view: string;
	rid: string;
	calendarName: string;
	color: number;
	accounts: any;
	dispatch: Dispatch;
};
type acceptSharedCalendarType = {
	dispatch: Dispatch;
	sharedCalendarName: string;
	owner: string;
	participants: any;
	grantee: string;
	customMessage: string;
	role: string;
	allowedActions: string;
	isAccepted: boolean;
};

type declineType = {
	dispatch: Dispatch;
	t: (...args: any[]) => string;
	createSnackbar: any;
	msgId: string;
	sharedCalendarName: string;
	owner: string;
	participants: any;
	grantee: string;
	customMessage: string;
	role: string;
	allowedActions: string;
	notifyOrganizer: boolean;
};
const mountSharedCalendarFunc = ({
	zid,
	view,
	rid,
	calendarName,
	color,
	accounts,
	dispatch
}: mountSharedCalendarType): any =>
	dispatch(
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		mountSharedCalendar({
			zid,
			view,
			rid,
			calendarName,
			color,
			accounts
		})
	);

const sharedCalendarReplyFunc = ({
	dispatch,
	sharedCalendarName,
	owner,
	participants,
	grantee,
	customMessage,
	role,
	allowedActions,
	isAccepted
}: acceptSharedCalendarType): any =>
	dispatch(
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		acceptSharedCalendarReply({
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			data: {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				attach: [{ mp: [] }],
				subject: isAccepted
					? `Share Accepted: ${sharedCalendarName} shared by ${owner}`
					: `Share Declined: ${sharedCalendarName} shared by ${owner}`,
				participants: map(participants, (p) => {
					if (p.type === 'f') {
						return { ...p, type: 't' };
					}
					return { ...p, type: 'f' };
				}),
				text: [
					isAccepted
						? `Accepted: ${grantee} has accepted the sharing of "${sharedCalendarName}"\n\n----------------------------------------------\n\nShared item: ${sharedCalendarName}\nOwner: ${owner}\nGrantee: ${grantee}\nRole: ${role}\nAllowed actions: ${allowedActions}\n*~*~*~*~*~*~*~*~*~*\n${
								customMessage?.length > 0 ? customMessage : ''
						  }`
						: `Declined: ${grantee} has declined the sharing of "${sharedCalendarName}"\n\n----------------------------------------------\n\nShared item: ${sharedCalendarName}\nOwner: ${owner}\nGrantee: ${grantee}\nRole: ${role}\nAllowed actions: ${allowedActions}\n*~*~*~*~*~*~*~*~*~*\n${
								customMessage?.length > 0 ? customMessage : ''
						  }`
				]
			}
		})
	);

const moveInviteToTrashFunc = ({ msgId, dispatch, t }: moveInviteToTrashType): any =>
	dispatch(
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		msgAction({
			operation: `trash`,
			ids: [msgId]
		})
	).then((res2: any): void => {
		if (!res2.type.includes('fulfilled')) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			createSnackbar({
				key: `share`,
				replace: true,
				hideButton: true,
				type: 'error',
				label: t('label.error_try_again', 'Something went wrong, please try again'),
				autoHideTimeout: 3000
			});
		}
	});

export const accept = ({
	zid,
	view,
	rid,
	calendarName,
	color,
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
}: accept): void =>
	mountSharedCalendarFunc({
		zid,
		view,
		rid,
		calendarName,
		color,
		accounts,
		dispatch
	}).then((res: any): void => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (res.type.includes('fulfilled')) {
			notifyOrganizer &&
				sharedCalendarReplyFunc({
					dispatch,
					sharedCalendarName,
					owner,
					participants,
					grantee,
					customMessage,
					role,
					allowedActions,
					isAccepted: true
				});
			moveInviteToTrashFunc({ msgId, dispatch, t });
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			createSnackbar({
				key: `share_accepted`,
				replace: true,
				type: 'info',
				label: t('message.snackbar.share.accepted', 'You have accepted the share request'),
				autoHideTimeout: 3000,
				hideButton: true
			});
		} else {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			createSnackbar({
				key: `share`,
				replace: true,
				type: 'error',
				label: t('label.error_try_again', 'Something went wrong, please try again'),
				autoHideTimeout: 3000,
				hideButton: true
			});
		}
	});

export const decline = ({
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
}: declineType): any =>
	dispatch(
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		msgAction({
			operation: `trash`,
			ids: [msgId]
		})
	).then((res: any): void => {
		if (res.type.includes('fulfilled')) {
			notifyOrganizer &&
				sharedCalendarReplyFunc({
					dispatch,
					sharedCalendarName,
					owner,
					participants,
					grantee,
					customMessage,
					role,
					allowedActions,
					isAccepted: false
				});

			createSnackbar({
				key: `share_declined`,
				replace: true,
				type: 'info',
				label: t('message.snackbar.share.declined', 'You have declined the share request'),
				autoHideTimeout: 3000,
				hideButton: true
			});
		} else {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			createSnackbar({
				key: `share`,
				replace: true,
				type: 'error',
				label: t('label.error_try_again', 'Something went wrong, please try again'),
				autoHideTimeout: 3000,
				hideButton: true
			});
		}
	});
