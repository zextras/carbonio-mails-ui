/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { isInaccessible, screen } from '@testing-library/react';

import { ConversationBadge } from '../conversation-badge';
import { setupTest } from '@test-setup';

describe('ConversationBadge', () => {
	it('shows the number of messages', () => {
		setupTest(<ConversationBadge messages={3} read={false} unread={1} />);

		expect(screen.getByTestId('FolderBadge')).toHaveTextContent('3');
	});

	it('tells screen readers how many messages there are and how many are unread', () => {
		setupTest(<ConversationBadge messages={3} read={false} unread={1} />);

		expect(screen.getByText('3 messages, 1 unread')).toBeInTheDocument();
		expect(isInaccessible(screen.getByTestId('FolderBadge'))).toBe(true);
	});

	it('uses the plural of the unread messages', () => {
		setupTest(<ConversationBadge messages={3} read={false} unread={2} />);

		expect(screen.getByText('3 messages, 2 unread')).toBeInTheDocument();
	});

	it('uses the singular for a conversation of one message', () => {
		setupTest(<ConversationBadge messages={1} read={false} unread={1} />);

		expect(screen.getByText('1 message, 1 unread')).toBeInTheDocument();
	});

	it('never says more unread messages than the messages it shows', () => {
		setupTest(<ConversationBadge messages={2} read={false} unread={3} />);

		expect(screen.getByText('2 messages, 2 unread')).toBeInTheDocument();
	});

	it('says only the number of messages when the conversation is read', () => {
		// read wins over a count not updated yet, as the colour of the badge does
		setupTest(<ConversationBadge messages={3} read unread={1} />);

		expect(screen.getByText('3 messages')).toBeInTheDocument();
	});

	it('says it is unread when the number of unread messages is not known yet', () => {
		setupTest(<ConversationBadge messages={3} read={false} unread={undefined} />);

		expect(screen.getByText('3 messages, unread')).toBeInTheDocument();
	});
});
