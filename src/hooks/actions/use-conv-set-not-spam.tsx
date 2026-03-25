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
import { isSpam } from 'helpers/folders';
import { convActionEmailStoreAction } from 'store/emails/actions/conv-action-action';
import { ActionFn, UIActionDescriptor } from 'types/actions';

type ConvSetNotSpamFunctionsParameter = {
	ids: Array<string>;
	folderId: string;
	onActionComplete?: (conversationsIds: Array<string>) => void;
};

export const useConvSetNotSpamFn = ({
	ids,
	folderId,
	onActionComplete
}: ConvSetNotSpamFunctionsParameter): ActionFn => {
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();
	const { closeConversationPanel, currentConversation } = useConversationDetailPanelControls();

	const canExecute = useCallback((): boolean => isSpam(folderId), [folderId]);

	const execute = useCallback((): void => {
		if (!canExecute()) {
			return;
		}
		convActionEmailStoreAction({
			operation: '!spam',
			ids
		}).then((res) => {
			if ('Fault' in res) {
				createSnackbar({
					key: `trash-${ids}`,
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
				key: `not-spam-${ids}`,
				replace: true,
				severity: 'info',
				label: t(
					'messages.snackbar.conversation_marked_as_non_spam',
					'Conversation marked as Not Spam'
				),
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

export const useConvSetNotSpamDescriptor = ({
	ids,
	folderId,
	onActionComplete
}: ConvSetNotSpamFunctionsParameter): UIActionDescriptor => {
	const { canExecute, execute } = useConvSetNotSpamFn({
		ids,
		folderId,
		onActionComplete
	});
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.MARK_AS_NOT_SPAM.id,
		icon: 'AlertCircleOutline',
		label: t('action.mark_as_non_spam', 'Not spam'),
		execute,
		canExecute
	};
};
