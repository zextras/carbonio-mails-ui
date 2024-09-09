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

import { ActionFn, UIActionDescriptor } from './use-redirect-msg';
import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { MessageActionsDescriptors } from '../../constants';
import { msgAction } from '../../store/actions';
import { AppDispatch } from '../../store/redux';
import type { MsgActionParameters, MsgActionResult } from '../../types';
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
	closeEditor: boolean | undefined,
	conversationId: string | undefined
) => void) => {
	const { createSnackbar } = useUiUtilities();
	return useCallback(
		(dispatch, ids, folderId, closeEditor, conversationId): void => {
			dispatchMsgMove(dispatch, ids, folderId)
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				.then((res) => {
					if (res.type.includes('fulfilled')) {
						closeEditor &&
							replaceHistory(
								conversationId
									? `/folder/${folderId}/conversation/${conversationId}`
									: `/folder/${folderId}/conversation/-${ids[0]}`
							);
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
	ids: Array<string>;
	folderId?: string;
	deselectAll?: () => void;
	conversationId?: string;
	closeEditor?: boolean;
};

export const useMoveToTrashFn = (): ActionFn<MoveToTrashExecute, undefined> => {
	const canExecute = useCallback((): boolean => true, []);
	const dispatch = useAppDispatch();
	const createSnackbar = useSnackbar();
	const restoreMessage = useRestoreMessage();
	const inSearchModule = useInSearchModule();

	const execute = useCallback(
		({
			ids,
			deselectAll,
			folderId = FOLDERS.INBOX,
			conversationId,
			closeEditor
		}: MoveToTrashExecute): void => {
			dispatch(
				msgAction({
					operation: 'trash',
					ids
				})
			).then((res) => {
				if (res.type.includes('fulfilled')) {
					deselectAll && deselectAll();
					if (!inSearchModule) {
						closeEditor && replaceHistory(`/folder/${folderId}`);
					}
					createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						type: 'info',
						label: t('messages.snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
						autoHideTimeout: 5000,
						hideButton: false,
						actionLabel: t('label.undo', 'Undo'),
						onActionClick: () =>
							restoreMessage(dispatch, ids, folderId, closeEditor, conversationId)
					});
				} else {
					createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		},
		[createSnackbar, dispatch, inSearchModule, restoreMessage]
	);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMoveToTrashDescriptor = (): UIActionDescriptor<MoveToTrashExecute, undefined> => {
	const { canExecute, execute } = useMoveToTrashFn();
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.MOVE_TO_TRASH.id,
		icon: 'Trash2Outline',
		label: t('label.delete', 'Delete'),
		execute,
		canExecute
	};
};
