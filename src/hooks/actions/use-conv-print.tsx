/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { isDraft } from 'immer';
import { forEach } from 'lodash';
import { useTranslation } from 'react-i18next';

import { getContentForPrint } from '../../commons/print-conversation/print-conversation';
import { ConversationActionsDescriptors } from '../../constants';
import { isTrash } from '../../helpers/folders';
import { getMsgsForPrint } from '../../store/actions';
import { ActionFn, Conversation, UIActionDescriptor } from '../../types';
import { errorPage } from '../../ui-actions/error-page';

export const useConvPrintFn = (conversation: Array<Conversation>, folderId: string): ActionFn => {
	const canExecute = useCallback(
		(): boolean => !isDraft(folderId) && !isTrash(folderId),
		[folderId]
	);

	const execute = useCallback((): void => {
		const messageIds: Array<string> = [];

		forEach(conversation, (conv) => {
			forEach(conv.messages, (m) => {
				messageIds.push(m.id);
			});
		});

		const printWindow = window.open('', '_blank');
		getMsgsForPrint({ ids: messageIds })
			.then((res) => {
				const content = getContentForPrint({
					messages: res,
					conversations: conversation,
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
	}, [conversation]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useConvPrintDescriptor = (
	conversation: Array<Conversation>,
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
