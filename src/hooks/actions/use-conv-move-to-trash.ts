/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { replaceHistory } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { isTrash } from '../../carbonio-ui-commons/helpers/folders';
import { ConversationActionsDescriptors } from '../../constants';
import { convAction } from '../../store/actions';
import type { ActionFn, UIActionDescriptor } from '../../types';
import { useInSearchModule } from '../../ui-actions/utils';
import { useAppDispatch } from '../redux';

type MoveToTrashArguments = {
	ids: Array<string>;
	folderId: string;
	deselectAll?: () => void;
};

const useRestoreConversation = (
	ids: Array<string>,
	folderId: string,
	deselectAll?: () => void
): (() => void) => {
	const dispatch = useAppDispatch();
	const createSnackbar = useSnackbar();
	const inSearchModule = useInSearchModule();
	const [t] = useTranslation();

	return useCallback(() => {
		dispatch(
			convAction({
				operation: `move`,
				ids,
				parent: folderId
			})
		).then((res) => {
			if (res.type.includes('fulfilled')) {
				deselectAll?.();
				if (!inSearchModule) {
					replaceHistory(`/folder/${folderId}/conversation/${ids[0]}`);
				}
				createSnackbar({
					key: `edit`,
					replace: true,
					type: 'success',
					hideButton: true,
					label: t('messages.snackbar.email_restored', 'E-mail restored in destination folder'),
					autoHideTimeout: 3000
				});
			} else {
				createSnackbar({
					key: `edit`,
					replace: true,
					hideButton: true,
					type: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again.'),
					autoHideTimeout: 3000
				});
			}
		});
	}, [createSnackbar, deselectAll, dispatch, folderId, ids, inSearchModule, t]);
};
export const useConvMoveToTrashFn = ({
	ids,
	deselectAll,
	folderId = FOLDERS.INBOX
}: MoveToTrashArguments): ActionFn => {
	const canExecute = useCallback((): boolean => !isTrash(folderId), [folderId]);
	const dispatch = useAppDispatch();
	const createSnackbar = useSnackbar();
	const restoreConversation = useRestoreConversation(ids, folderId, deselectAll);
	const inSearchModule = useInSearchModule();
	const [t] = useTranslation();

	const execute = useCallback((): void => {
		dispatch(
			convAction({
				operation: `trash`,
				ids
			})
		).then((res) => {
			if (res.type.includes('fulfilled')) {
				deselectAll?.();
				if (!inSearchModule) {
					replaceHistory(`/folder/${folderId}/`);
				}
				createSnackbar({
					key: `trash-${ids}`,
					replace: true,
					type: 'info',
					actionLabel: t('label.undo', 'Undo'),
					label: t('snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
					autoHideTimeout: 5000,
					onActionClick: restoreConversation
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
	}, [
		dispatch,
		ids,
		deselectAll,
		inSearchModule,
		createSnackbar,
		t,
		restoreConversation,
		folderId
	]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvMoveToTrashDescriptor = ({
	ids,
	deselectAll,
	folderId
}: MoveToTrashArguments): UIActionDescriptor => {
	const { canExecute, execute } = useConvMoveToTrashFn({
		ids,
		deselectAll,
		folderId
	});
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.MOVE_TO_TRASH.id,
		icon: 'Trash2Outline',
		label: t('label.delete', 'Delete'),
		execute,
		canExecute
	};
};
