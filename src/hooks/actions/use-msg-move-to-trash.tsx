/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { FOLDERS, isTrash } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { MAILS_ROUTE, MessageActionsDescriptors } from 'constants/index';
import { isFocusModeMailView } from 'helpers/external-tabs';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { msgActionEmailStoreAction } from 'store/emails/actions/msg-action-action';
import type { ActionFn, UIActionDescriptor } from 'types/index.d';
import { useInSearchModule } from 'ui-actions/utils';

const useRestoreMessage = (): ((
	ids: Array<string>,
	messageFolderId: string,
	closeEditor: boolean | undefined
) => void) => {
	const { createSnackbar } = useUiUtilities();
	const navigate = useNavigate();
	const [t] = useTranslation();
	return useCallback(
		(ids, messageFolderId, closeEditor): void => {
			msgActionEmailStoreAction({ ids, parent: messageFolderId, operation: 'move' }).then((res) => {
				if (!('Fault' in res)) {
					closeEditor &&
						navigate(`/${MAILS_ROUTE}/folder/${messageFolderId}/message/${ids[0]}`, {
							replace: true
						});
					createSnackbar({
						key: `move-${ids}`,
						replace: true,
						severity: 'success',
						label: t('messages.snackbar.email_restored', 'E-mail restored in destination folder'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				} else {
					createSnackbar({
						key: `move-${ids}`,
						replace: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		},
		[createSnackbar, navigate, t]
	);
};

type MoveToTrashExecute = {
	ids: Array<string>;
	messageFolderId?: string;
	routeFolderId?: string;
	shouldReplaceHistory?: boolean;
};

export const useMsgMoveToTrashFn = ({
	ids,
	messageFolderId = FOLDERS.INBOX,
	routeFolderId,
	shouldReplaceHistory
}: MoveToTrashExecute): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isTrash(messageFolderId) && !isFocusModeMailView(),
		[messageFolderId]
	);
	const createSnackbar = useSnackbar();
	const restoreMessage = useRestoreMessage();
	const inSearchModule = useInSearchModule();
	const [t] = useTranslation();
	const navigate = useNavigate();

	const execute = useCallback((): void => {
		if (canExecute()) {
			msgActionEmailStoreAction({
				operation: 'trash',
				ids
			}).then((res) => {
				if (!('Fault' in res)) {
					if (!inSearchModule) {
						shouldReplaceHistory &&
							navigate(`/${MAILS_ROUTE}/folder/${routeFolderId}`, { replace: true });
					}
					createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						severity: 'info',
						label: t('messages.snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
						autoHideTimeout: 5000,
						hideButton: false,
						actionLabel: t('label.undo', 'Undo'),
						onActionClick: () => restoreMessage(ids, messageFolderId, shouldReplaceHistory)
					});
				} else {
					createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		}
	}, [
		canExecute,
		ids,
		inSearchModule,
		createSnackbar,
		t,
		shouldReplaceHistory,
		navigate,
		routeFolderId,
		restoreMessage,
		messageFolderId
	]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgMoveToTrashDescriptor = ({
	ids,
	messageFolderId,
	routeFolderId,
	shouldReplaceHistory
}: MoveToTrashExecute): UIActionDescriptor => {
	const { canExecute, execute } = useMsgMoveToTrashFn({
		ids,
		messageFolderId,
		routeFolderId,
		shouldReplaceHistory
	});
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.MOVE_TO_TRASH.id,
		icon: 'Trash2Outline',
		label: t('label.delete', 'Delete'),
		execute,
		canExecute
	};
};
