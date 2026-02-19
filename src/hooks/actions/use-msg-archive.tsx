/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { isTrash } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from 'constants/index';
import { isSystemArchiveAvailable } from 'helpers/folders';
import { msgActionEmailStoreAction } from 'store/emails/actions/msg-action-action';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { useInSearchModule } from 'ui-actions/utils';
import { useConversationDetailPanelControls } from 'views/app/detail-panel/detail-panel-controls-hooks';

type MsgArchiveFunctionsParameter = {
	folderId: string;
	messagesIds: string[];
	onActionComplete?: (messagesIds: string[]) => void;
};

export const useMsgArchiveFn = ({
	folderId,
	messagesIds,
	onActionComplete
}: MsgArchiveFunctionsParameter): ActionFn => {
	const canExecute = useCallback(
		(): boolean => isSystemArchiveAvailable() && !isTrash(folderId),
		[folderId]
	);
	const createSnackbar = useSnackbar();
	const inSearchModule = useInSearchModule();
	const [t] = useTranslation();
	const { closeConversationPanel, currentConversation } = useConversationDetailPanelControls();

	const execute = useCallback((): void => {
		if (!canExecute()) {
			return;
		}
		msgActionEmailStoreAction({
			operation: `archive`,
			ids: messagesIds
		}).then((res) => {
			if ('Fault' in res) {
				createSnackbar({
					key: `archive-${messagesIds.join(',')}`,
					replace: true,
					severity: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			} else {
				onActionComplete?.(messagesIds);
				if (
					currentConversation &&
					!inSearchModule &&
					messagesIds.includes(currentConversation.id)
				) {
					closeConversationPanel();
				}
				createSnackbar({
					key: `archive-${messagesIds.join(',')}`,
					replace: true,
					severity: 'info',
					label: t('snackbar.message_moved_to_archive', 'E-mail moved to Archive'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		});
	}, [
		canExecute,
		messagesIds,
		onActionComplete,
		currentConversation,
		inSearchModule,
		createSnackbar,
		t,
		closeConversationPanel
	]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgArchiveDescriptor = ({
	messagesIds,
	folderId,
	onActionComplete
}: MsgArchiveFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useMsgArchiveFn({
		messagesIds,
		folderId,
		onActionComplete
	});
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.ARCHIVE.id,
		icon: 'ArchiveOutline',
		label: t('label.archive', 'Archive'),
		execute,
		canExecute
	};
};
