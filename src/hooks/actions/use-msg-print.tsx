/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ActionFn, UIActionDescriptor } from './use-redirect-msg';
import { getContentForPrint } from '../../commons/print-conversation/print-conversation';
import { MessageActionsDescriptors } from '../../constants';
import { getMsgsForPrint } from '../../store/actions';
import type { MailMessage } from '../../types';
import { errorPage } from '../../ui-actions/error-page';

export const useMsgCreateAppointmentFn = (message: MailMessage): ActionFn => {
	const canExecute = useCallback((): boolean => true, []);

	const execute = useCallback((): void => {
		const printWindow = window.open('', '_blank');
		getMsgsForPrint({ ids: [message.id] })
			.then((res) => {
				const content = getContentForPrint({
					messages: res,
					conversations: {
						conversation: message.conversation,
						subject: message.subject
					},
					isMsg: true
				});
				if (printWindow?.top) {
					printWindow.top.document.title = 'Carbonio';
					printWindow.document.write(content);
				}
			})
			.catch(() => {
				if (printWindow) printWindow.document.write(errorPage);
			});
	}, [message.conversation, message.id, message.subject]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgPrintDescriptor = (message: MailMessage): UIActionDescriptor => {
	const { canExecute, execute } = useMsgCreateAppointmentFn(message);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.PRINT.id,
		icon: 'PrinterOutline',
		label: t('action.print', 'Print'),
		execute,
		canExecute
	};
};
