/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { forEach } from 'lodash';
import { useTranslation } from 'react-i18next';

import { getMsgsForPrintSoapApi } from 'api/index';
import { getContentForPrint } from 'commons/print-conversation/print-conversation';
import { ConversationActionsDescriptors } from 'constants/index';
import { isDraft, isTrash } from 'helpers/folders';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { NormalizedConversation } from 'types/conversations';
import { errorPage } from 'ui-actions/error-page';

export const useConvPrintFn = (
	conversations: Array<NormalizedConversation>,
	folderId: string
): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isTrash(folderId),
		[folderId]
	);

	const execute = useCallback((): void => {
		if (canExecute()) {
			const messageIds: Array<string> = [];

			forEach(conversations, (conv) => {
				forEach(conv.messageIds, (m) => {
					messageIds.push(m);
				});
			});

			const printWindow = window.open('', '_blank');
			getMsgsForPrintSoapApi({ ids: messageIds })
				.then((res) => {
					const content = getContentForPrint({
						messages: res,
						conversations,
						isMsg: false
					});
					if (printWindow?.top) {
						printWindow.top.document.title = 'Carbonio';
						printWindow.document.write(content);
					}
				})
				.catch(() => {
					if (printWindow) {
						printWindow.document.write(errorPage);
					}
				});
		}
	}, [canExecute, conversations]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvPrintDescriptor = (
	conversation: Array<NormalizedConversation>,
	folderId: string
): UIActionDescriptor => {
	const { canExecute, execute } = useConvPrintFn(conversation, folderId);
	const [t] = useTranslation();
	return {
		id: ConversationActionsDescriptors.PRINT.id,
		icon: 'PrinterOutline',
		label: t('action.print', 'Print'),
		execute,
		canExecute
	};
};
