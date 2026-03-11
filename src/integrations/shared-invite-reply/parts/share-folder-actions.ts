/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { getErrorMessage, ParticipantRole } from '@zextras/carbonio-ui-commons';
import { TFunction } from 'i18next';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { acceptSharedFolderReply } from 'api/accept-shared-folder-reply';
import { mountSharedFolderSoapApi } from 'api/mount-shared-folder-soap-api';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { msgActionEmailStoreAction } from 'store/emails/actions/msg-action-action';
import { Participant } from 'types/participant';
import { SaveDraftResponse } from 'types/soap/save-draft';

type Accept = {
	zid: string;
	view: string;
	rid: string;
	folderName: string;
	color: number;
	accounts: any;
	t: TFunction;
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
	t: TFunction;
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

const sharedFolderReplyFunc = ({
	sharedFolderName,
	owner,
	participants,
	grantee,
	customMessage,
	role,
	allowedActions,
	isAccepted
}: AcceptSharedCalendarType): Promise<SaveDraftResponse> => {
	const displayMessage = customMessage?.length > 0 ? customMessage : '';
	return acceptSharedFolderReply({
		// TODO FIX ATTACH TYPE ERROR
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
				: `Declined: ${grantee} has declined the sharing of "${sharedFolderName}"\n\n----------------------------------------------\n\nShared item: ${sharedFolderName}\nOwner: ${owner}\nGrantee: ${grantee}\nRole: ${role}\nAllowed actions: ${allowedActions}\n*~*~*~*~*~*~*~*~*~*\n${displayMessage}`,
			''
		]
	});
};

const useMoveInviteToTrashFunc = (): ((arg: MoveInviteToTrashType) => Promise<void>) => {
	const { createSnackbar } = useUiUtilities();
	return useCallback(
		({ msgId, t }) =>
			msgActionEmailStoreAction({
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

export const useAccept = (): ((arg: Accept) => void) => {
	const { createSnackbar } = useUiUtilities();
	const [t] = useTranslation();
	const moveInviteToTrashFunc = useMoveInviteToTrashFunc();
	return useCallback(
		({
			zid,
			view,
			rid,
			folderName,
			color,
			accounts,
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
			mountSharedFolderSoapApi({
				zid,
				view,
				rid,
				folderName,
				color,
				accounts
			})
				.then((): Promise<SaveDraftResponse | void> => {
					if (!notifyOrganizer) {
						return Promise.resolve();
					}
					return sharedFolderReplyFunc({
						sharedFolderName,
						owner,
						participants,
						grantee,
						customMessage,
						role,
						allowedActions,
						isAccepted: true
					});
				})
				.then(() => moveInviteToTrashFunc({ msgId, t }))
				.then(() => {
					createSnackbar({
						key: `share_accepted`,
						replace: true,
						severity: 'info',
						label: t('message.snackbar.share.accepted', 'You have accepted the share request'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				})
				.catch((err) => {
					createSnackbar({
						key: `share`,
						replace: true,
						severity: 'error',
						label: getErrorMessage(err, t),
						autoHideTimeout: 3000,
						hideButton: true
					});
				});
		},
		[createSnackbar, moveInviteToTrashFunc, t]
	);
};

export const useDecline = (): ((arg: DeclineType) => Promise<void>) => {
	const { createSnackbar } = useUiUtilities();
	const [t] = useTranslation();

	return useCallback(
		({
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
			msgActionEmailStoreAction({
				operation: `trash`,
				ids: [msgId]
			}).then((res): void => {
				if (!('Fault' in res)) {
					notifyOrganizer &&
						sharedFolderReplyFunc({
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
		[createSnackbar, t]
	);
};
