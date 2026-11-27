/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, waitFor } from '@testing-library/react';
import {
	Folder,
	FOLDERS,
	useFolderStore,
	useTagStore,
	ZIMBRA_STANDARD_COLORS
} from '@zextras/carbonio-ui-commons';

import { setupHook } from '@test-setup';
import { generateConversation } from '__test__/generators/generateConversation';
import { generateMessage } from '__test__/generators/generateMessage';
import { useConversationFolderIds, useTagPillItems } from 'hooks/use-tag-pill-items';
import {
	getConversationMessagesParents,
	updateConversations,
	updateMessages
} from 'store/emails/store';

const FINANCE = 'nil:Finance';
/** The tooltip of a shared tag whose owner is not named: its name first. */
const sharedTooltip = (name: string): string => `${name} (from a shared folder)`;

describe('useTagPillItems', () => {
	beforeEach(() => {
		useTagStore.setState({
			tags: {
				1: { id: '1', name: 'urgent', color: 5 },
				2: { id: '2', name: 'Client', color: 1 },
				3: { id: '3', name: 'board', rgb: '#1b1f3b' }
			}
		});
	});

	it('returns the tags of the item in alphabetical order, ignoring case', () => {
		const { result } = setupHook(useTagPillItems, { initialProps: [['1', '2', '3']] });

		expect(result.current.map((item) => item.name)).toEqual(['board', 'Client', 'urgent']);
	});

	it('gives each tag its colour, the custom rgb first', () => {
		const { result } = setupHook(useTagPillItems, { initialProps: [['1', '3']] });

		expect(result.current).toEqual([
			{ id: '3', name: 'board', color: '#1b1f3b' },
			{ id: '1', name: 'urgent', color: ZIMBRA_STANDARD_COLORS[5].hex }
		]);
	});

	it('shows the tags set by the owner of a shared folder last, as shared tags', () => {
		const { result } = setupHook(useTagPillItems, {
			initialProps: [[FINANCE, '1', 'nil:Accounting']]
		});

		expect(result.current).toEqual([
			{ id: '1', name: 'urgent', color: ZIMBRA_STANDARD_COLORS[5].hex },
			{
				id: 'nil:Accounting',
				name: 'Accounting',
				shared: true,
				tooltip: sharedTooltip('Accounting')
			},
			{ id: FINANCE, name: 'Finance', shared: true, tooltip: sharedTooltip('Finance') }
		]);
	});

	it('keeps the shared tags when the user has no tags of their own', () => {
		useTagStore.setState({ tags: {} });

		const { result } = setupHook(useTagPillItems, { initialProps: [[FINANCE]] });

		expect(result.current).toEqual([
			{ id: FINANCE, name: 'Finance', shared: true, tooltip: sharedTooltip('Finance') }
		]);
	});

	describe('tooltip of a shared tag', () => {
		const MARTA = 'marta.rossi@example.com';
		const LUCA = 'luca.bianchi@example.com';

		beforeEach(() => {
			useFolderStore.setState({
				folders: {
					'z1:1': { id: 'z1:1', name: 'USER_ROOT', owner: MARTA } as unknown as Folder,
					'z2:1': { id: 'z2:1', name: 'USER_ROOT', owner: LUCA } as unknown as Folder
				}
			});
		});

		it('names the owner of the shared folder the item is in', () => {
			const { result } = setupHook(useTagPillItems, { initialProps: [[FINANCE], ['z1:257']] });

			expect(result.current[0].tooltip).toBe(`Finance (from ${MARTA}'s folder)`);
		});

		it('names the owner once when all the messages are in folders of the same owner', () => {
			const { result } = setupHook(useTagPillItems, {
				initialProps: [[FINANCE], ['z1:257', 'z1:300']]
			});

			expect(result.current[0].tooltip).toBe(`Finance (from ${MARTA}'s folder)`);
		});

		it('says "a shared folder" when the messages are in folders of different owners', () => {
			const { result } = setupHook(useTagPillItems, {
				initialProps: [[FINANCE], ['z1:257', 'z2:400', '2']]
			});

			expect(result.current[0].tooltip).toBe(sharedTooltip('Finance'));
		});

		it("names the owner when the other messages are in the user's own folders", () => {
			// A tag from a shared folder can only come from the messages in that folder
			const { result } = setupHook(useTagPillItems, {
				initialProps: [[FINANCE], ['z1:257', FOLDERS.INBOX]]
			});

			expect(result.current[0].tooltip).toBe(`Finance (from ${MARTA}'s folder)`);
		});

		it('names the owner of a folder mounted on its own, whose account root is not loaded', () => {
			useFolderStore.setState({
				folders: {
					'267': {
						id: '267',
						name: 'Shared projects',
						zid: 'z3',
						rid: '257',
						owner: MARTA
					} as unknown as Folder
				}
			});

			const { result } = setupHook(useTagPillItems, { initialProps: [[FINANCE], ['z3:257']] });

			expect(result.current[0].tooltip).toBe(`Finance (from ${MARTA}'s folder)`);
		});

		it('says "a shared folder" when the owner is not known', () => {
			const { result } = setupHook(useTagPillItems, { initialProps: [[FINANCE]] });

			expect(result.current[0].tooltip).toBe(sharedTooltip('Finance'));
		});

		it("gives no tooltip to the user's own tags", () => {
			const { result } = setupHook(useTagPillItems, { initialProps: [['1'], ['z1:257']] });

			expect(result.current[0].tooltip).toBeUndefined();
		});
	});

	it('keeps a colon in the name of a shared tag', () => {
		const { result } = setupHook(useTagPillItems, { initialProps: [['nil:Q1: plan']] });

		expect(result.current[0].name).toBe('Q1: plan');
	});

	it('skips empty and unknown ids and repeated tags', () => {
		const { result } = setupHook(useTagPillItems, { initialProps: [['', '99', '2', '2']] });

		expect(result.current.map((item) => item.id)).toEqual(['2']);
	});

	it('returns no tags for an item without tags', () => {
		const { result } = setupHook(useTagPillItems, { initialProps: [undefined] });

		expect(result.current).toEqual([]);
	});
});

describe('useConversationFolderIds', () => {
	const CONVERSATION = '500';

	beforeEach(async () => {
		updateMessages([
			generateMessage({ id: '501', cid: CONVERSATION, folderId: '2' }),
			generateMessage({ id: '502', cid: CONVERSATION, folderId: 'z1:257' }),
			generateMessage({ id: '503', cid: CONVERSATION, folderId: '2' })
		]);
		updateConversations([
			generateConversation({ id: CONVERSATION, messageIds: ['501', '502', '503'] })
		]);
		await waitFor(() => expect(getConversationMessagesParents(CONVERSATION)).toHaveLength(3));
	});

	const getParents = (): Array<string> =>
		setupHook(useConversationFolderIds, { initialProps: [CONVERSATION, true] }).result.current;

	it('returns the folders of the messages of the conversation, each once', () => {
		expect(getParents()).toEqual(['2', 'z1:257']);
	});

	it('follows a message moved to another folder', async () => {
		const { result } = setupHook(useConversationFolderIds, { initialProps: [CONVERSATION, true] });

		act(() => {
			updateMessages([generateMessage({ id: '502', cid: CONVERSATION, folderId: 'z2:400' })]);
		});

		await waitFor(() => expect(result.current).toEqual(['2', 'z2:400']));
	});

	it('reads nothing when the conversation has no tag from a shared folder', () => {
		const { result } = setupHook(useConversationFolderIds, { initialProps: [CONVERSATION, false] });

		expect(result.current).toEqual([]);
	});
});
