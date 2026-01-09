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

import { ConversationActionsDescriptors, MAILS_ROUTE } from 'constants/index';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
import type { ActionFn, UIActionDescriptor } from 'types/index.d';
import { useInSearchModule } from 'ui-actions/utils';

type ConvRestoreFunctionsParameter = {
	ids: Array<string>;
	folderId: string;
	onActionComplete?: (conversationsIds: Array<string>) => void;
};

const useRestoreConversation = (ids: Array<string>, folderId: string): (() => void) => {
	const createSnackbar = useSnackbar();
	const inSearchModule = useInSearchModule();
	const [t] = useTranslation();
	const navigate = useNavigate();

	return useCallback(() => {
		convActionEmailStoreAction({
			operation: `move`,
			ids,
			parent: folderId
		}).then((res) => {
			if (!('Fault' in res)) {
				if (!inSearchModule) {
					navigate(`/${MAILS_ROUTE}/folder/${folderId}/conversation/${ids[0]}`, { replace: true });
				}
				createSnackbar({
					key: `edit`,
					replace: true,
					severity: 'success',
					hideButton: true,
					label: t('messages.snackbar.email_restored', 'E-mail restored in destination folder'),
					autoHideTimeout: 3000
				});
			} else {
				createSnackbar({
					key: `edit`,
					replace: true,
					hideButton: true,
					severity: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again.'),
					autoHideTimeout: 3000
				});
			}
		});
	}, [createSnackbar, folderId, ids, inSearchModule, navigate, t]);
};

export const useConvMoveToTrashFn = ({
	ids,
	folderId = FOLDERS.INBOX,
	onActionComplete
}: ConvRestoreFunctionsParameter): ActionFn => {
	const canExecute = useCallback((): boolean => !isTrash(folderId), [folderId]);
	const createSnackbar = useSnackbar();
	const restoreConversation = useRestoreConversation(ids, folderId);
	const inSearchModule = useInSearchModule();
	const [t] = useTranslation();
	const navigate = useNavigate();

	const execute = useCallback((): void => {
		if (!canExecute()) {
			return;
		}
		convActionEmailStoreAction({
			operation: `trash`,
			ids
		}).then((res) => {
			if (!('Fault' in res)) {
				onActionComplete && onActionComplete(ids);
				if (!inSearchModule) {
					navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
				}
				createSnackbar({
					key: `trash-${ids}`,
					replace: true,
					severity: 'info',
					actionLabel: t('label.undo', 'Undo'),
					label: t('snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
					autoHideTimeout: 5000,
					onActionClick: restoreConversation
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
	}, [
		canExecute,
		ids,
		onActionComplete,
		inSearchModule,
		createSnackbar,
		t,
		restoreConversation,
		navigate,
		folderId
	]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvMoveToTrashDescriptor = ({
	ids,
	folderId,
	onActionComplete
}: ConvRestoreFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useConvMoveToTrashFn({
		ids,
		folderId,
		onActionComplete
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
