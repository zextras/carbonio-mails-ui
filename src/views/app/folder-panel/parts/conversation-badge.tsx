/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ItemBadge } from './item-badge';
import { VisuallyHidden } from 'commons/visually-hidden';

type ConversationBadgeProps = {
	/** Messages of the conversation: the number shown. */
	messages: number;
	read: boolean | undefined;
	/** Unread messages, as the server counts them; unknown until it sends them. */
	unread: number | undefined;
};

/**
 * The badge of a conversation row: the number of its messages, coloured when the conversation is
 * unread. Screen readers get what the number and the colour mean ("3 messages, 1 unread").
 */
export const ConversationBadge = ({
	messages,
	read,
	unread
}: Readonly<ConversationBadgeProps>): React.JSX.Element => {
	const [t] = useTranslation();
	const label = useMemo(() => {
		const messagesText = t('label.conversation_messages', {
			count: messages,
			defaultValue_one: '{{count}} message',
			defaultValue_other: '{{count}} messages'
		});
		// The colour follows `read`: a count not updated yet must not say otherwise
		if (read !== false) return messagesText;
		return unread
			? t('label.conversation_messages_unread', {
					// The server counts the unread over the whole conversation, deleted messages too
					count: Math.min(unread, messages),
					messages: messagesText,
					defaultValue_one: '{{messages}}, {{count}} unread',
					defaultValue_other: '{{messages}}, {{count}} unread'
				})
			: t('label.conversation_messages_unread_unknown', {
					messages: messagesText,
					defaultValue: '{{messages}}, unread'
				});
	}, [messages, read, t, unread]);
	return (
		<>
			<span aria-hidden="true">
				<ItemBadge itemReadValue={read} value={messages} />
			</span>
			<VisuallyHidden>{label}</VisuallyHidden>
		</>
	);
};
