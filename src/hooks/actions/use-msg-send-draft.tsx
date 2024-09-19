/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { MessageActionsDescriptors } from '../../constants';
import { isDraft } from '../../helpers/folders';
import { sendMsg } from '../../store/actions/send-msg';
import { ActionFn, MailMessage, UIActionDescriptor } from '../../types';
import { useAppDispatch } from '../redux';

export const useMsgSendDraftFn = (message: MailMessage, folderId: string): ActionFn => {
	const canExecute = useCallback((): boolean => isDraft(folderId), [folderId]);
	const dispatch = useAppDispatch();

	const execute = useCallback((): void => {
		if (canExecute()) {
			dispatch(
				sendMsg({
					msg: message
				})
			);
		}
	}, [canExecute, dispatch, message]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgSendDraftDescriptor = (
	message: MailMessage,
	folderId: string
): UIActionDescriptor => {
	const { canExecute, execute } = useMsgSendDraftFn(message, folderId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.SEND.id,
		icon: 'PaperPlaneOutline',
		label: t('label.send', 'Send'),
		execute,
		canExecute
	};
};
