/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors } from 'constants/index';
import { getArchiveFolderId, isArchive, isSystemArchiveAvailable } from 'helpers/folders';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { useInSearchModule } from 'ui-actions/utils';
import { useConversationDetailPanelControls } from 'views/app/detail-panel/detail-panel-controls-hooks';

type ConvArchiveFunctionsParameter = {
	conversationIds: string[];
	folderId: string;
	onActionComplete?: (conversationsIds: string[]) => void;
};

export const useConvArchiveFn = ({
	conversationIds,
	folderId,
	onActionComplete
}: ConvArchiveFunctionsParameter): ActionFn => {
	const canExecute = useCallback(
		(): boolean => isSystemArchiveAvailable() && !isArchive(folderId),
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
		convActionEmailStoreAction({
			operation: `move`,
			ids: conversationIds,
			parent: getArchiveFolderId(folderId)
		}).then((res) => {
			if ('Fault' in res) {
				createSnackbar({
					key: `archive-${conversationIds.join('-')}`,
					replace: true,
					severity: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			} else {
				onActionComplete?.(conversationIds);
				if (
					currentConversation &&
					!inSearchModule &&
					conversationIds.includes(currentConversation.id)
				) {
					closeConversationPanel();
				}
				const snackbarLabel =
					conversationIds.length === 1
						? t('snackbar.conversation_moved_to_archive', 'Conversation moved to Archive')
						: t('snackbar.conversations_moved_to_archive', 'Conversations moved to Archive');
				createSnackbar({
					key: `archive-${conversationIds.join('-')}`,
					replace: true,
					severity: 'info',
					label: snackbarLabel,
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		});
	}, [
		canExecute,
		closeConversationPanel,
		conversationIds,
		createSnackbar,
		currentConversation,
		folderId,
		inSearchModule,
		onActionComplete,
		t
	]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvArchiveDescriptor = ({
	conversationIds,
	folderId,
	onActionComplete
}: ConvArchiveFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useConvArchiveFn({
		conversationIds,
		folderId,
		onActionComplete
	});
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.ARCHIVE.id,
		icon: 'ArchiveOutline',
		label: t('label.archive', 'Archive'),
		execute,
		canExecute
	};
};
