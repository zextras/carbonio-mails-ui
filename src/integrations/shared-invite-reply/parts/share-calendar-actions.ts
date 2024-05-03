/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { map } from 'lodash';

import { ParticipantRole } from '../../../carbonio-ui-commons/constants/participants';
import { useUiUtilities } from '../../../hooks/use-ui-utilities';
import { msgAction } from '../../../store/actions';
import { acceptSharedCalendarReply } from '../../../store/actions/acceptSharedCalendarReply';
import { mountSharedCalendar } from '../../../store/actions/mount-share-calendar';
import { AppDispatch } from '../../../store/redux';
import type { MailsEditor, Participant } from '../../../types';

type Accept = {
	zid: string;
	view: string;
	rid: string;
	calendarName: string;
	color: number;
	accounts: any;
	t: (...args: any[]) => string;
	dispatch: AppDispatch;
	msgId: Array<string> | any;
	sharedCalendarName: string;
	owner: string;
	participants: Participant[];
	grantee: string;
	customMessage: string;
	role: string;
	allowedActions: string;
	notifyOrganizer: boolean;
};

type MoveInviteToTrashType = {
	t: (...args: any[]) => string;
	dispatch: AppDispatch;
	msgId: string;
};

type MountSharedCalendarType = {
	zid: string;
	view: string;
	rid: string;
	calendarName: string;
	color: number;
	accounts: any;
	dispatch: AppDispatch;
};
type AcceptSharedCalendarType = {
	dispatch: AppDispatch;
	sharedCalendarName: string;
	owner: string;
	participants: Participant[];
	grantee: string;
	customMessage: string;
	role: string;
	allowedActions: string;
	isAccepted: boolean;
};

type DeclineType = {
	dispatch: AppDispatch;
	t: (...args: any[]) => string;
	msgId: string;
	sharedCalendarName: string;
	owner: string;
	participants: Participant[];
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
}: MountSharedCalendarType): any =>
	dispatch(
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
}: AcceptSharedCalendarType): any => {
	const displayMessage = customMessage?.length > 0 ? customMessage : '';
	return dispatch(
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
					if (p.type === ParticipantRole.FROM) {
						return { ...p, type: ParticipantRole.TO };
					}
					return { ...p, type: ParticipantRole.FROM };
				}),
				text: [
					isAccepted
						? `Accepted: ${grantee} has accepted the sharing of "${sharedCalendarName}"\n\n----------------------------------------------\n\nShared item: ${sharedCalendarName}\nOwner: ${owner}\nGrantee: ${grantee}\nRole: ${role}\nAllowed actions: ${allowedActions}\n*~*~*~*~*~*~*~*~*~*\n${displayMessage}`
						: `Declined: ${grantee} has declined the sharing of "${sharedCalendarName}"\n\n----------------------------------------------\n\nShared item: ${sharedCalendarName}\nOwner: ${owner}\nGrantee: ${grantee}\nRole: ${role}\nAllowed actions: ${allowedActions}\n*~*~*~*~*~*~*~*~*~*\n${displayMessage}`
				]
			} as MailsEditor
		})
	);
};

const useMoveInviteToTrashFunc = (): ((arg: MoveInviteToTrashType) => any) => {
	const { createSnackbar } = useUiUtilities();
	return useCallback(
		({ msgId, dispatch, t }) =>
			dispatch(
				msgAction({
					operation: `trash`,
					ids: [msgId]
				})
			).then((res2: any): void => {
				if (!res2.type.includes('fulfilled')) {
					createSnackbar({
						key: `share`,
						replace: true,
						hideButton: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000
					});
				}
			}),
		[createSnackbar]
	);
};

export const useAccept = (): ((arg: Accept) => void) => {
	const { createSnackbar } = useUiUtilities();
	const moveInviteToTrashFunc = useMoveInviteToTrashFunc();
	return useCallback(
		({
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
			notifyOrganizer
		}) => {
			mountSharedCalendarFunc({
				zid,
				view,
				rid,
				calendarName,
				color,
				accounts,
				dispatch
			}).then((res: any): void => {
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
					createSnackbar({
						key: `share_accepted`,
						replace: true,
						type: 'info',
						label: t('message.snackbar.share.accepted', 'You have accepted the share request'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				} else {
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
		},
		[createSnackbar, moveInviteToTrashFunc]
	);
};

export const useDecline = (): ((arg: DeclineType) => Promise<void>) => {
	const { createSnackbar } = useUiUtilities();
	return useCallback(
		({
			dispatch,
			t,
			msgId,
			sharedCalendarName,
			owner,
			participants,
			grantee,
			customMessage,
			role,
			allowedActions,
			notifyOrganizer
		}) =>
			dispatch(
				msgAction({
					operation: `trash`,
					ids: [msgId]
				})
			).then((res): void => {
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
					createSnackbar({
						key: `share`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			}),
		[createSnackbar]
	);
};
