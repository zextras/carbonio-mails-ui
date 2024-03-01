/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { addBoard } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { ConversationActionsDescriptors, EditViewActions, MAILS_ROUTE } from '../constants';
import { isSpam, isTrash, isDraft, isSent } from '../helpers/folders';
import { getConversationMostRecentMessage } from '../helpers/messages';
import { type BoardContext, Conversation, UIAction, UIActionExecutionParams } from '../types';

export type ConvForwardUIAction = UIAction<
	UIActionExecutionParams & { conversation: Conversation },
	Conversation
>;

export const useUIActionConvForward = (): ConvForwardUIAction => {
	const [t] = useTranslation();

	const canExecute = useCallback<NonNullable<ConvForwardUIAction['canExecute']>>((conversation) => {
		if (conversation.messages.length === 0) {
			return false;
		}

		if (
			isTrash(conversation.parent) ||
			isSpam(conversation.parent) ||
			isDraft(conversation.parent) ||
			isSent(conversation.parent)
		) {
			return false;
		}

		return getConversationMostRecentMessage(conversation, { type: 'received' }) !== null;
	}, []);

	const execute = useCallback<NonNullable<ConvForwardUIAction['execute']>>(
		({ conversation }) => {
			if (conversation === undefined) {
				return;
			}

			if (!canExecute(conversation)) {
				return;
			}

			const message = getConversationMostRecentMessage(conversation, { type: 'received' });

			addBoard<BoardContext>({
				url: `${MAILS_ROUTE}/edit?action=${EditViewActions.FORWARD}&id=${message?.id}`,
				title: ''
			});
		},
		[canExecute]
	);

	return useMemo(
		() => ({
			id: ConversationActionsDescriptors.FORWARD.id,
			label: t('action.forward', 'Forward'),
			icon: 'Forward',
			execute,
			canExecute
		}),
		[canExecute, execute, t]
	);
};
