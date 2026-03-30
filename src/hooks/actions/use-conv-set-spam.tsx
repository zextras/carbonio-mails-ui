/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { useConversationDetailPanelControls } from '../../views/app/detail-panel/detail-panel-controls-hooks';
import { ConversationActionsDescriptors } from 'constants/index';
import { isDraft, isSpam } from 'helpers/folders';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
import { ActionFn, UIActionDescriptor } from 'types/actions';

type ConvSetSpamFunctionsParameter = {
	ids: Array<string>;
	folderId: string;
	onActionComplete?: (conversationsIds: Array<string>) => void;
};

export const useConvSetSpamFn = ({
	ids,
	folderId,
	onActionComplete
}: ConvSetSpamFunctionsParameter): ActionFn => {
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isSpam(folderId),
		[folderId]
	);

	const { closeConversationPanel, currentConversation } = useConversationDetailPanelControls();
	const execute = useCallback((): void => {
		if (!canExecute()) {
			return;
		}
		convActionEmailStoreAction({
			operation: 'spam',
			ids
		}).then((res) => {
			if ('Fault' in res) {
				createSnackbar({
					key: `spam-${ids}`,
					replace: true,
					severity: 'error',
					label: t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 3000,
					hideButton: true
				});
				return;
			}

			onActionComplete && onActionComplete(ids);
			if (currentConversation && ids.includes(currentConversation.id)) {
				closeConversationPanel();
			}
			createSnackbar({
				key: `spam-${ids}`,
				replace: true,
				severity: 'info',
				label: t('messages.snackbar.conversation_marked_as_spam', 'Conversation marked as Spam'),
				autoHideTimeout: 3000,
				hideButton: true
			});
		});
	}, [
		canExecute,
		closeConversationPanel,
		createSnackbar,
		currentConversation,
		ids,
		onActionComplete,
		t
	]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvSetSpamDescriptor = ({
	ids,
	folderId,
	onActionComplete
}: ConvSetSpamFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useConvSetSpamFn({
		ids,
		folderId,
		onActionComplete
	});
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.MARK_AS_SPAM.id,
		icon: 'AlertCircle',
		label: t('action.mark_as_spam', 'Mark as spam'),
		execute,
		canExecute
	};
};
