/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { FOLDERS, getFolderIdParts } from '@zextras/carbonio-ui-commons';
import { filter } from 'lodash';
import { useParams } from 'react-router-dom';

import { useConversationMessages } from '../store/emails/store';
import { MailMessage } from '../types';
import type { DetailPanelRoutesParams } from '../types/routes';

export const useShouldReplaceHistory = (message: MailMessage): boolean => {
	const { folderId, conversationId, messageId } =
		useParams<DetailPanelRoutesParams>() as DetailPanelRoutesParams;

	const messages = useConversationMessages(conversationId ?? message.conversation);

	return useMemo(() => {
		if (conversationId) {
			return getFolderIdParts(folderId).id === FOLDERS.TRASH
				? messages?.length <= 0
				: filter(messages, (m) => getFolderIdParts(m.parent).id !== FOLDERS.TRASH).length <= 0;
		}
		return messageId === message.id;
	}, [conversationId, folderId, message.id, messageId, messages]);
};
