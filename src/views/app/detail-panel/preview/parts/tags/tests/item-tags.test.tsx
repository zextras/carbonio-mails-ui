/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, within } from '@testing-library/react';
import { FOLDERS, useTagStore } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import {
	populateFoldersStore,
	SHARED_FOLDER_ID,
	SHARED_FOLDER_LINK,
	SHARED_FOLDER_OWNER
} from '@test-utils/store/folders';
import { populateConversationInEmailStore } from '__test__/generators/generateConversation';
import { ConvActionRequest } from 'types/soap/conv-action';
import { MsgActionRequest } from 'types/soap/msg-action';
import { fitTagsInLines } from 'views/app/detail-panel/preview/parts/tags/fit-tags-in-lines';
import { ItemTags } from 'views/app/detail-panel/preview/parts/tags/item-tags';

const mockRunSearch = vi.fn();
vi.mock('@zextras/carbonio-ui-commons', async () => {
	const actual = await vi.importActual('@zextras/carbonio-ui-commons');
	return { ...actual, useRunSearchIntegration: (): typeof mockRunSearch => mockRunSearch };
});

// jsdom has no layout: show the first `visible` tags.
vi.mock('views/app/detail-panel/preview/parts/tags/fit-tags-in-lines', async () => {
	const actual = await vi.importActual<
		typeof import('views/app/detail-panel/preview/parts/tags/fit-tags-in-lines')
	>('views/app/detail-panel/preview/parts/tags/fit-tags-in-lines');
	return { ...actual, fitTagsInLines: vi.fn() };
});
const showFirst = (visible: number): void => {
	vi.mocked(fitTagsInLines).mockImplementation(({ pillWidths }) =>
		Math.min(visible, pillWidths.length)
	);
};

const SHARED_FINANCE = 'nil:Finance';
const READING_PANE_TAGS = 'reading-pane-tags';
const SHOW_MORE = 'Show 1 more tag';
const REMOVE_CLIENT = 'Remove tag Client';

describe('ItemTags', () => {
	beforeEach(() => {
		showFirst(10);
		useTagStore.setState({
			tags: {
				t1: { id: 't1', name: 'Urgent', color: 5 },
				t2: { id: 't2', name: 'Client', color: 1 },
				t3: { id: 't3', name: 'Personal', rgb: '#f6b7d6' }
			}
		});
	});

	test('shows the tags of a message in alphabetical order, the shared ones last', () => {
		setupTest(
			<ItemTags
				kind="message"
				id="10"
				tagIds={['t1', SHARED_FINANCE, 't2']}
				folderId={FOLDERS.INBOX}
			/>
		);
		expect(screen.getByRole('button', { name: 'Client' })).toBeInTheDocument();
		const names = screen
			.getAllByRole('button')
			.map((button) => button.getAttribute('aria-label') ?? button.textContent);
		expect(names).toEqual(['Client', REMOVE_CLIENT, 'Urgent', 'Remove tag Urgent']);
		expect(screen.getAllByText('Finance').length).toBeGreaterThan(0);
	});

	test('shows nothing without tags', () => {
		setupTest(<ItemTags kind="message" id="10" tagIds={[]} folderId={FOLDERS.INBOX} />);
		expect(screen.queryByTestId(READING_PANE_TAGS)).not.toBeInTheDocument();
	});

	test('a click on a pill searches by its tag', async () => {
		const { user } = setupTest(
			<ItemTags kind="message" id="10" tagIds={['t2']} folderId={FOLDERS.INBOX} />
		);
		await user.click(screen.getByRole('button', { name: 'Client' }));
		expect(mockRunSearch).toHaveBeenCalledWith(
			[expect.objectContaining({ label: 'tag:Client', value: 'tag:"Client"' })],
			'mails'
		);
	});

	test('a quote in the name of the tag stays inside the search for it', async () => {
		useTagStore.setState({ tags: { q: { id: 'q', name: 'Q1 "draft"', color: 1 } } });
		const { user } = setupTest(
			<ItemTags kind="message" id="10" tagIds={['q']} folderId={FOLDERS.INBOX} />
		);
		await user.click(screen.getByRole('button', { name: 'Q1 "draft"' }));
		expect(mockRunSearch).toHaveBeenCalledWith(
			[expect.objectContaining({ value: 'tag:"Q1 \\"draft\\""' })],
			'mails'
		);
	});

	test('the "×" of a message card removes the tag from that message only', async () => {
		const interceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		const { user } = setupTest(
			<ItemTags kind="message" id="10" tagIds={['t2']} folderId={FOLDERS.INBOX} />
		);
		await user.click(screen.getByRole('button', { name: REMOVE_CLIENT }));
		expect((await interceptor).action).toEqual(
			expect.objectContaining({ id: '10', op: '!tag', tn: 'Client' })
		);
	});

	test('the "×" of the conversation removes the tag from the whole conversation', async () => {
		const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
		const { user } = setupTest(
			<ItemTags kind="conversation" id="20" tagIds={['t2']} folderId={FOLDERS.INBOX} />
		);
		await user.click(screen.getByRole('button', { name: 'Remove tag Client from conversation' }));
		expect((await interceptor).action).toEqual(
			expect.objectContaining({ id: '20', op: '!tag', tn: 'Client' })
		);
	});

	test('Undo of a conversation removal tags again only the messages that had the tag', async () => {
		populateConversationInEmailStore({
			conversationParams: { id: '20' },
			messageGeneratorParams: [
				{ id: '1', tags: ['t2'] },
				{ id: '2', tags: ['t1'] },
				{ id: '3', tags: ['t1', 't2'] }
			]
		});
		const removal = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
		const { user } = setupTest(
			<ItemTags kind="conversation" id="20" tagIds={['t1', 't2']} folderId={FOLDERS.INBOX} />
		);
		await user.click(screen.getByRole('button', { name: 'Remove tag Client from conversation' }));
		await removal;

		const undo = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		await user.click(await screen.findByRole('button', { name: /undo/i }));
		expect((await undo).action).toEqual(
			expect.objectContaining({ id: '1,3', op: 'tag', tn: 'Client' })
		);
	});

	test('after Undo of the only tag the focus is on it again', async () => {
		createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		const { user, rerender } = setupTest(
			<ItemTags kind="message" id="10" tagIds={['t2']} folderId={FOLDERS.INBOX} />
		);
		await user.click(screen.getByRole('button', { name: REMOVE_CLIENT }));
		rerender(<ItemTags kind="message" id="10" tagIds={[]} folderId={FOLDERS.INBOX} />);

		const undo = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		await user.click(await screen.findByRole('button', { name: /undo/i }));
		await undo;
		rerender(<ItemTags kind="message" id="10" tagIds={['t2']} folderId={FOLDERS.INBOX} />);
		await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Client' })).toHaveFocus());
	});

	test('a removal does not move the focus once another item is open', async () => {
		createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		const { user, rerender } = setupTest(
			<>
				<input aria-label="List" />
				<ItemTags kind="message" id="10" tagIds={['t1', 't2']} folderId={FOLDERS.INBOX} />
			</>
		);
		await user.click(screen.getByRole('button', { name: REMOVE_CLIENT }));
		await user.click(screen.getByRole('textbox', { name: 'List' }));

		// Another item opened before the removal came back: it never had that tag
		rerender(
			<>
				<input aria-label="List" />
				<ItemTags kind="message" id="11" tagIds={['t1', 't3']} folderId={FOLDERS.INBOX} />
			</>
		);

		expect(screen.getByRole('textbox', { name: 'List' })).toHaveFocus();
	});

	test('in Spam the tags can be neither removed nor added', async () => {
		showFirst(1);
		const { user } = setupTest(
			<ItemTags kind="message" id="10" tagIds={['t1', 't2']} folderId={FOLDERS.SPAM} />
		);
		expect(screen.queryByRole('button', { name: /Remove tag/ })).not.toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: SHOW_MORE }));
		expect(screen.queryByRole('button', { name: /add tags/i })).not.toBeInTheDocument();
	});

	test('ADD TAGS lists every tag of the user and applies a check at once', async () => {
		showFirst(1);
		const interceptor = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		const { user } = setupTest(
			<ItemTags kind="message" id="10" tagIds={['t1', 't2']} folderId={FOLDERS.INBOX} />
		);
		await user.click(screen.getByRole('button', { name: SHOW_MORE }));
		await user.click(screen.getByRole('button', { name: /add tags/i }));
		expect(screen.getAllByRole('menuitemcheckbox').map((item) => item.textContent)).toEqual([
			'Client',
			'Personal',
			'Urgent'
		]);
		await user.click(screen.getByRole('menuitemcheckbox', { name: 'Personal' }));
		expect((await interceptor).action).toEqual(
			expect.objectContaining({ id: '10', op: 'tag', tn: 'Personal' })
		);
	});

	test('a click on the tags does not reach the card around them', async () => {
		const onCardClick = vi.fn((event: React.MouseEvent) => event.isDefaultPrevented());
		const { user } = setupTest(
			// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
			<div onClick={onCardClick}>
				<ItemTags kind="message" id="10" tagIds={['t2']} folderId={FOLDERS.INBOX} />
			</div>
		);
		await user.click(screen.getByRole('button', { name: 'Client' }));
		expect(onCardClick).toHaveReturnedWith(true);
	});
	describe('a tag from a shared folder', () => {
		beforeEach(() => {
			populateFoldersStore({ additionalFolders: SHARED_FOLDER_LINK });
		});

		test('on a message, says whose folder it comes from', async () => {
			const { user } = setupTest(
				<ItemTags kind="message" id="10" tagIds={[SHARED_FINANCE]} folderId={SHARED_FOLDER_ID} />
			);

			await user.hover(
				within(screen.getByTestId(READING_PANE_TAGS)).getAllByText('Finance').at(-1) as HTMLElement
			);

			expect(await screen.findByText(`Tag from ${SHARED_FOLDER_OWNER}'s folder`)).toBeVisible();
		});

		test('on a conversation, says whose folder from the folders of its messages', async () => {
			populateConversationInEmailStore({
				conversationParams: { id: '20', folderId: SHARED_FOLDER_ID },
				conversationMessagesNumber: 2
			});
			const { user } = setupTest(
				<ItemTags kind="conversation" id="20" tagIds={[SHARED_FINANCE]} folderId={FOLDERS.INBOX} />
			);

			await user.hover(
				within(screen.getByTestId(READING_PANE_TAGS)).getAllByText('Finance').at(-1) as HTMLElement
			);

			expect(await screen.findByText(`Tag from ${SHARED_FOLDER_OWNER}'s folder`)).toBeVisible();
		});
	});
});
