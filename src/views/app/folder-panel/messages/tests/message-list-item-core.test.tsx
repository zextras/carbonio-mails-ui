/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, within } from '@testing-library/react';
import { FOLDERS, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import {
	populateFoldersStore,
	SHARED_FOLDER_ID,
	SHARED_FOLDER_LINK,
	SHARED_FOLDER_OWNER
} from '@test-utils/store/folders';
import { populateTagsStore } from '@test-utils/store/tags';
import { populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { MessageListItemCore } from 'views/app/folder-panel/messages/message-list-item-core';

const renderWithTag = (
	tag: { id: string; name: string; color?: number; rgb?: string },
	isConvChildren = false
): ReturnType<typeof populateMessagesInEmailStore>[number] => {
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
			isConvChildren={isConvChildren}
			firstChildFolderId={FOLDERS.INBOX}
			index={0}
			onSelect={vi.fn()}
		/>
	);
	return message;
};

describe('MessageListItemCore tags', () => {
	it('tints the pill with the custom colour of the tag', () => {
		renderWithTag({ id: 't1', name: 'custom', rgb: '#abcdef' });

		expect(screen.getByTestId('icon: Tag')).toHaveStyle({ color: '#abcdef' });
	});

	it('shows a pill with the standard colour of the tag', () => {
		renderWithTag({ id: 't1', name: 'standard', color: 4 });

		expect(screen.getByTestId('tag-pill')).toHaveTextContent('standard');
		expect(screen.getByTestId('icon: Tag')).toHaveStyle({ color: ZIMBRA_STANDARD_COLORS[4].hex });
	});

	it('in a conversation child row shows the tags of the message once', () => {
		renderWithTag({ id: 't1', name: 'child tag', color: 4 }, true);

		expect(screen.getAllByTestId('tag-pill')).toHaveLength(1);
		expect(screen.getByTestId('tag-pill')).toHaveTextContent('child tag');
	});

	// On the sender's line the hover actions would cover "+N"
	it('in a conversation child row puts the tags on the line of the fragment, not of the sender', () => {
		const { fragment } = renderWithTag({ id: 't1', name: 'child tag', color: 4 }, true);

		const line = screen.getByTestId('line-with-tags');
		expect(within(line).getByTestId('list-tag-pills')).toBeVisible();
		expect(line).toHaveTextContent(fragment as string);
		expect(within(line).queryByTestId('DateLabel')).not.toBeInTheDocument();
	});
	it('a tag from a shared folder says whose folder it comes from', async () => {
		populateFoldersStore({ additionalFolders: SHARED_FOLDER_LINK });
		populateTagsStore({});
		const [message] = populateMessagesInEmailStore({
			messageGeneratorParams: [{ id: '123', tags: ['nil:Finance'], folderId: SHARED_FOLDER_ID }]
		});
		const { user } = setupTest(
			<MessageListItemCore
				message={message}
				selected={false}
				selecting={false}
				isConvChildren={false}
				firstChildFolderId={SHARED_FOLDER_ID}
				index={0}
				onSelect={vi.fn()}
			/>
		);

		await user.hover(screen.getByText('Finance'));

		expect(await screen.findByText(`Finance (from ${SHARED_FOLDER_OWNER}'s folder)`)).toBeVisible();
	});
});
