/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, screen } from '@testing-library/react';
import { FOLDERS, TagPillItem } from '@zextras/carbonio-ui-commons';

import { setupHook } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateConversationInEmailStore } from '__test__/generators/generateConversation';
import { ConvActionRequest } from 'types/soap/conv-action';
import { MsgActionRequest } from 'types/soap/msg-action';
import { useTagEditing } from 'views/app/detail-panel/preview/parts/tags/use-reading-pane-tags';

const CLIENT: TagPillItem = { id: 't2', name: 'Client' };
const NO_CALLBACKS = { onUndo: vi.fn(), onError: vi.fn() };

// The "+N" of a conversation row edits the tags of the whole conversation.
describe('useTagEditing of a conversation', () => {
	test('removes the tag from the whole conversation, named as such', async () => {
		const interceptor = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
		const { result } = setupHook(useTagEditing, {
			initialProps: [{ kind: 'conversation', id: '20', folderId: FOLDERS.INBOX }]
		});

		expect(result.current.removeLabel?.(CLIENT)).toBe('Remove tag Client from conversation');
		act(() => result.current.onRemove?.(CLIENT, NO_CALLBACKS));

		expect((await interceptor).action).toEqual(
			expect.objectContaining({ id: '20', op: '!tag', tn: 'Client' })
		);
	});

	test('Undo tags again only the messages that had the tag', async () => {
		await act(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '20' },
				messageGeneratorParams: [
					{ id: '1', tags: ['t2'] },
					{ id: '2', tags: ['t1'] },
					{ id: '3', tags: ['t1', 't2'] }
				]
			})
		);
		const removal = createSoapAPIInterceptor<ConvActionRequest>('ConvAction');
		const { result, user } = setupHook(useTagEditing, {
			initialProps: [{ kind: 'conversation', id: '20', folderId: FOLDERS.INBOX }]
		});
		act(() => result.current.onRemove?.(CLIENT, NO_CALLBACKS));
		await removal;
		const undoButton = await screen.findByRole('button', { name: /undo/i });
		const undo = createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		await user.click(undoButton);
		expect((await undo).action).toEqual(
			expect.objectContaining({ id: '1,3', op: 'tag', tn: 'Client' })
		);
	});

	test('in Spam the tags can be neither removed nor managed', () => {
		const { result } = setupHook(useTagEditing, {
			initialProps: [{ kind: 'conversation', id: '20', folderId: FOLDERS.SPAM }]
		});
		expect(result.current.onRemove).toBeUndefined();
		expect(result.current.menu).toBeUndefined();
	});
});
