/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { map } from 'lodash';

import { msgActionSoapApi } from '../../../api/msg-action';
import { ParticipantRole } from '../../../carbonio-ui-commons/constants/participants';
import { useUiUtilities } from '../../../hooks/use-ui-utilities';
import { msgAction } from '../../../store/actions';
import { acceptSharedCalendarReply } from '../../../store/actions/acceptSharedCalendarReply';
import {
	CreateMountpointDataType,
	mountSharedFolder
} from '../../../store/actions/mount-shared-folder';
import { AppDispatch } from '../../../store/redux';
import type { MailsEditor, Participant } from '../../../types';

type Accept = {
	zid: string;
	view: string;
	rid: string;
	folderName: string;
	color: number;
	accounts: any;
	t: (...args: any[]) => string;
	dispatch: AppDispatch;
	msgId: Array<string> | any;
	sharedFolderName: string;
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
	msgId: string;
};

type AcceptSharedCalendarType = {
	dispatch: AppDispatch;
	sharedFolderName: string;
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
	sharedFolderName: string;
	owner: string;
	participants: Participant[];
	grantee: string;
	customMessage: string;
	role: string;
	allowedActions: string;
	notifyOrganizer: boolean;
};

type MountSharedFolderFuncType = CreateMountpointDataType & { dispatch: AppDispatch };

const mountSharedFolderFunc = ({
	zid,
	view,
	rid,
	folderName,
	color,
	accounts,
	dispatch
}: MountSharedFolderFuncType): Promise<any> =>
	dispatch(
		mountSharedFolder({
			zid,
			view,
			rid,
			folderName,
			color,
			accounts
		})
	);

const sharedCalendarReplyFunc = ({
	dispatch,
	sharedFolderName,
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
					? `Share Accepted: ${sharedFolderName} shared by ${owner}`
					: `Share Declined: ${sharedFolderName} shared by ${owner}`,
				participants: map(participants, (p) => {
					if (p.type === ParticipantRole.FROM) {
						return { ...p, type: ParticipantRole.TO };
					}
					return { ...p, type: ParticipantRole.FROM };
				}),
				text: [
					isAccepted
						? `Accepted: ${grantee} has accepted the sharing of "${sharedFolderName}"\n\n----------------------------------------------\n\nShared item: ${sharedFolderName}\nOwner: ${owner}\nGrantee: ${grantee}\nRole: ${role}\nAllowed actions: ${allowedActions}\n*~*~*~*~*~*~*~*~*~*\n${displayMessage}`
						: `Declined: ${grantee} has declined the sharing of "${sharedFolderName}"\n\n----------------------------------------------\n\nShared item: ${sharedFolderName}\nOwner: ${owner}\nGrantee: ${grantee}\nRole: ${role}\nAllowed actions: ${allowedActions}\n*~*~*~*~*~*~*~*~*~*\n${displayMessage}`
				]
			} as MailsEditor
		})
	);
};

const useMoveInviteToTrashFunc = (): ((arg: MoveInviteToTrashType) => any) => {
	const { createSnackbar } = useUiUtilities();
	return useCallback(
		({ msgId, t }) =>
			msgActionSoapApi({
				operation: `trash`,
				ids: [msgId]
			}).then((res2: any): void => {
				if ('Fault' in res2) {
					createSnackbar({
						key: `share`,
						replace: true,
						hideButton: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000
					});
				}
			}),
		[createSnackbar]
	);
};

function isDuplicatedName(error: { message?: string }): boolean {
	return error?.message?.includes('mail.ALREADY_EXISTS') ?? false;
}

export const useAccept = (): ((arg: Accept) => void) => {
	const { createSnackbar } = useUiUtilities();
	const moveInviteToTrashFunc = useMoveInviteToTrashFunc();
	return useCallback(
		({
			zid,
			view,
			rid,
			folderName,
			color,
			accounts,
			t,
			dispatch,
			msgId,
			sharedFolderName,
			owner,
			participants,
			grantee,
			customMessage,
			role,
			allowedActions,
			notifyOrganizer
		}) => {
			mountSharedFolderFunc({
				zid,
				view,
				rid,
				folderName,
				color,
				accounts,
				dispatch
			}).then((res): void => {
				if (res.type.includes('fulfilled')) {
					notifyOrganizer &&
						sharedCalendarReplyFunc({
							dispatch,
							sharedFolderName,
							owner,
							participants,
							grantee,
							customMessage,
							role,
							allowedActions,
							isAccepted: true
						});
					moveInviteToTrashFunc({ msgId, t });
					createSnackbar({
						key: `share_accepted`,
						replace: true,
						severity: 'info',
						label: t('message.snackbar.share.accepted', 'You have accepted the share request'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				} else {
					createSnackbar({
						key: `share`,
						replace: true,
						severity: 'error',
						label: isDuplicatedName(res.error)
							? t(
									'label.error_folder_exists',
									'A folder with the same name already exists, please choose a different one'
								)
							: t('label.error_try_again', 'Something went wrong, please try again'),
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
			sharedFolderName,
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
							sharedFolderName,
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
						severity: 'info',
						label: t('message.snackbar.share.declined', 'You have declined the share request'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				} else {
					createSnackbar({
						key: `share`,
						replace: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			}),
		[createSnackbar]
	);
};
