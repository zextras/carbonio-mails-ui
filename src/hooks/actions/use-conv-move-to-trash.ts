/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { FOLDERS, isTrash } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { useConversationDetailPanelControls } from '../../views/app/detail-panel/detail-panel-controls-hooks';
import { ConversationActionsDescriptors } from 'constants/index';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { useInSearchModule } from 'ui-actions/utils';

type ConvRestoreFunctionsParameter = {
	ids: Array<string>;
	folderId: string;
	onActionComplete?: (conversationsIds: Array<string>) => void;
};

export const useConvMoveToTrashFn = ({
	ids,
	folderId = FOLDERS.INBOX,
	onActionComplete
}: ConvRestoreFunctionsParameter): ActionFn => {
	const canExecute = useCallback((): boolean => !isTrash(folderId), [folderId]);
	const createSnackbar = useSnackbar();
	const inSearchModule = useInSearchModule();
	const [t] = useTranslation();
	const { closeConversationPanel, currentConversation } = useConversationDetailPanelControls();

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
				if (currentConversation && !inSearchModule) {
					if (ids.includes(currentConversation.id)) {
						closeConversationPanel();
					}
				}
				createSnackbar({
					key: `trash-${ids}`,
					replace: true,
					severity: 'info',
					label: t('snackbar.conversation_moved_to_trash', 'Conversation moved to Trash'),
					autoHideTimeout: 3000,
					hideButton: true
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
		currentConversation,
		inSearchModule,
		createSnackbar,
		t,
		closeConversationPanel
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
