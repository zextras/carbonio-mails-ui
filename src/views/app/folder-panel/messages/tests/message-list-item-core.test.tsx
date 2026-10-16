/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { FOLDERS, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import { populateTagsStore } from '@test-utils/store/tags';
import { populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { MessageListItemCore } from 'views/app/folder-panel/messages/message-list-item-core';

const renderWithTag = (tag: { id: string; name: string; color?: number; rgb?: string }): void => {
	populateFoldersStore();
	populateTagsStore({ [tag.id]: tag });
	const [message] = populateMessagesInEmailStore({
		messageGeneratorParams: [{ id: '123', tags: [tag.id] }]
	});
	setupTest(
		<MessageListItemCore
			message={message}
			selected={false}
			selecting={false}
			isConvChildren={false}
			firstChildFolderId={FOLDERS.INBOX}
			index={0}
			onSelect={vi.fn()}
		/>
	);
};

describe('MessageListItemCore tag icon', () => {
	it('is colored with the custom color of the tag', () => {
		renderWithTag({ id: 't1', name: 'custom', rgb: '#abcdef' });

		expect(screen.getByTestId('TagIcon')).toHaveStyleRule('color', '#abcdef');
	});

	it('is colored with the standard color of the tag', () => {
		renderWithTag({ id: 't1', name: 'standard', color: 4 });

		expect(screen.getByTestId('TagIcon')).toHaveStyleRule('color', ZIMBRA_STANDARD_COLORS[4].hex);
	});
});
