/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { AsyncThunkAction, Dispatch } from '@reduxjs/toolkit';
import { useSnackbar } from '@zextras/carbonio-design-system';
import { replaceHistory, t } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { isTrash } from '../../carbonio-ui-commons/helpers/folders';
import { MessageActionsDescriptors } from '../../constants';
import { msgAction } from '../../store/actions';
import { AppDispatch } from '../../store/redux';
import type {
	ActionFn,
	MsgActionParameters,
	MsgActionResult,
	UIActionDescriptor
} from '../../types';
import { useInSearchModule } from '../../ui-actions/utils';
import { useAppDispatch } from '../redux';
import { useUiUtilities } from '../use-ui-utilities';

const dispatchMsgMove = (
	dispatch: Dispatch<any>,
	ids: Array<string>,
	folderId: string
): AsyncThunkAction<MsgActionResult, MsgActionParameters, Record<string, unknown>> =>
	dispatch(
		msgAction({
			operation: 'move',
			ids,
			parent: folderId
		})
	);

const useRestoreMessage = (): ((
	dispatch: AppDispatch,
	ids: Array<string>,
	folderId: string,
	closeEditor: boolean | undefined
) => void) => {
	const { createSnackbar } = useUiUtilities();
	return useCallback(
		(dispatch, ids, folderId, closeEditor): void => {
			dispatchMsgMove(dispatch, ids, folderId)
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				.then((res) => {
					if (res.type.includes('fulfilled')) {
						closeEditor && replaceHistory(`/folder/${folderId}/message/${ids[0]}`);
						createSnackbar({
							key: `move-${ids}`,
							replace: true,
							type: 'success',
							label: t('messages.snackbar.email_restored', 'E-mail restored in destination folder'),
							autoHideTimeout: 3000,
							hideButton: true
						});
					} else {
						createSnackbar({
							key: `move-${ids}`,
							replace: true,
							type: 'error',
							label: t('label.error_try_again', 'Something went wrong, please try again'),
							autoHideTimeout: 3000,
							hideButton: true
						});
					}
				});
		},
		[createSnackbar]
	);
};

type MoveToTrashExecute = {
	messagesId: Array<string>;
	folderId?: string;
	deselectAll?: () => void;
	shouldReplaceHistory?: boolean;
};

export const useMsgMoveToTrashFn = ({
	messagesId,
	deselectAll,
	folderId = FOLDERS.INBOX,
	shouldReplaceHistory
}: MoveToTrashExecute): ActionFn => {
	const canExecute = useCallback((): boolean => !isTrash(folderId), [folderId]);
	const dispatch = useAppDispatch();
	const createSnackbar = useSnackbar();
	const restoreMessage = useRestoreMessage();
	const inSearchModule = useInSearchModule();

	const execute = useCallback((): void => {
		if (canExecute()) {
			dispatch(
				msgAction({
					operation: 'trash',
					ids: messagesId
				})
			).then((res) => {
				if (res.type.includes('fulfilled')) {
					deselectAll && deselectAll();
					if (!inSearchModule) {
						shouldReplaceHistory && replaceHistory(`/folder/${folderId}`);
					}
					createSnackbar({
						key: `trash-${messagesId}`,
						replace: true,
						type: 'info',
						label: t('messages.snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
						autoHideTimeout: 5000,
						hideButton: false,
						actionLabel: t('label.undo', 'Undo'),
						onActionClick: () =>
							restoreMessage(dispatch, messagesId, folderId, shouldReplaceHistory)
					});
				} else {
					createSnackbar({
						key: `trash-${messagesId}`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		}
	}, [
		canExecute,
		dispatch,
		messagesId,
		deselectAll,
		inSearchModule,
		createSnackbar,
		shouldReplaceHistory,
		folderId,
		restoreMessage
	]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgMoveToTrashDescriptor = ({
	messagesId,
	deselectAll,
	folderId,
	shouldReplaceHistory
}: MoveToTrashExecute): UIActionDescriptor => {
	const { canExecute, execute } = useMsgMoveToTrashFn({
		messagesId,
		deselectAll,
		folderId,
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
