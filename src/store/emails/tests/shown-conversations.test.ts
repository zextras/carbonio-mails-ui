/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { isConversationShown, showConversation } from 'store/emails/shown-conversations';

describe('shown conversations', () => {
	it('should consider a conversation shown until its view hides it', () => {
		const hideConversation = showConversation('1');
		expect(isConversationShown('1')).toBe(true);

		hideConversation();

		expect(isConversationShown('1')).toBe(false);
	});

	it('should consider a conversation shown while any of its views shows it', () => {
		const hideFromPanel = showConversation('1');
		const hideFromList = showConversation('1');

		hideFromPanel();
		expect(isConversationShown('1')).toBe(true);

		hideFromList();
		expect(isConversationShown('1')).toBe(false);
	});
});
