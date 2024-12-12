/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { replaceHistory } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { msgActionSoapApi } from '../../api/msg-action';
import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { isTrash } from '../../carbonio-ui-commons/helpers/folders';
import { MessageActionsDescriptors } from '../../constants';
import type { ActionFn, UIActionDescriptor } from '../../types';
import { useInSearchModule } from '../../ui-actions/utils';
import { useUiUtilities } from '../use-ui-utilities';

const useRestoreMessage = (): ((
	ids: Array<string>,
	folderId: string,
	closeEditor: boolean | undefined
) => void) => {
	const { createSnackbar } = useUiUtilities();
	const [t] = useTranslation();
	return useCallback(
		(ids, folderId, closeEditor): void => {
			msgActionSoapApi({ ids, parent: folderId, operation: 'move' }).then((res) => {
				if (!('Fault' in res)) {
					closeEditor && replaceHistory(`/folder/${folderId}/message/${ids[0]}`);
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
		[createSnackbar, t]
	);
};

type MoveToTrashExecute = {
	ids: Array<string>;
	folderId?: string;
	deselectAll?: () => void;
	shouldReplaceHistory?: boolean;
};

export const useMsgMoveToTrashFn = ({
	ids,
	deselectAll,
	folderId = FOLDERS.INBOX,
	shouldReplaceHistory
}: MoveToTrashExecute): ActionFn => {
	const canExecute = useCallback((): boolean => !isTrash(folderId), [folderId]);
	const createSnackbar = useSnackbar();
	const restoreMessage = useRestoreMessage();
	const inSearchModule = useInSearchModule();
	const [t] = useTranslation();

	const execute = useCallback((): void => {
		if (canExecute()) {
			msgActionSoapApi({
				operation: 'trash',
				ids
			}).then((res) => {
				if (!('Fault' in res)) {
					deselectAll?.();
					if (!inSearchModule) {
						shouldReplaceHistory && replaceHistory(`/folder/${folderId}`);
					}
					createSnackbar({
						key: `trash-${ids}`,
						replace: true,
						severity: 'info',
						label: t('messages.snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
						autoHideTimeout: 5000,
						hideButton: false,
						actionLabel: t('label.undo', 'Undo'),
						onActionClick: () => restoreMessage(ids, folderId, shouldReplaceHistory)
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
		deselectAll,
		inSearchModule,
		createSnackbar,
		t,
		shouldReplaceHistory,
		folderId,
		restoreMessage
	]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgMoveToTrashDescriptor = ({
	ids,
	deselectAll,
	folderId,
	shouldReplaceHistory
}: MoveToTrashExecute): UIActionDescriptor => {
	const { canExecute, execute } = useMsgMoveToTrashFn({
		ids,
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
