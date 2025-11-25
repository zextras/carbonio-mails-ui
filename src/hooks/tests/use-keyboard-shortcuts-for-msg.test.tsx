/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import type { Mock } from 'vitest';

import { setupHook } from '../../__test__/test-setup';
import { MAILS_ROUTE, SEARCH_ROUTE } from 'constants/index';
import { useMsgMoveToTrashFn } from 'hooks/actions/use-msg-move-to-trash';
import { useMsgSetFlagFn } from 'hooks/actions/use-msg-set-flag';
import { useMsgSetNotSpamFn } from 'hooks/actions/use-msg-set-not-spam';
import { useMsgSetReadFn } from 'hooks/actions/use-msg-set-read';
import { useMsgSetSpamFn } from 'hooks/actions/use-msg-set-spam';
import { useMsgSetUnflagFn } from 'hooks/actions/use-msg-set-unflag';
import { useMsgSetUnreadFn } from 'hooks/actions/use-msg-set-unread';
import { useKeyboardShortcutsForMsg } from 'hooks/use-keyboard-shortcuts-for-msg';
import { hasModalOverlay, isInputContext } from 'hooks/utils';

// Mock all dependencies
vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useNavigate: vi.fn()
}));

vi.mock('hooks/utils', () => ({
	hasModalOverlay: vi.fn().mockReturnValue(false),
	isInputContext: vi.fn().mockReturnValue(false)
}));

vi.mock('hooks/actions/use-msg-move-to-trash', () => ({
	useMsgMoveToTrashFn: vi.fn()
}));

vi.mock('hooks/actions/use-msg-set-flag', () => ({
	useMsgSetFlagFn: vi.fn()
}));

vi.mock('hooks/actions/use-msg-set-not-spam', () => ({
	useMsgSetNotSpamFn: vi.fn()
}));

vi.mock('hooks/actions/use-msg-set-read', () => ({
	useMsgSetReadFn: vi.fn()
}));

vi.mock('hooks/actions/use-msg-set-spam', () => ({
	useMsgSetSpamFn: vi.fn()
}));

vi.mock('hooks/actions/use-msg-set-unflag', () => ({
	useMsgSetUnflagFn: vi.fn()
}));

vi.mock('hooks/actions/use-msg-set-unread', () => ({
	useMsgSetUnreadFn: vi.fn()
}));

describe('useKeyboardShortcutsForMsg', () => {
	const mockNavigate = vi.fn();
	const mockExecute = vi.fn();
	const mockCanExecute = vi.fn();

	const createMockAction = (): {
		execute: Mock;
		canExecute: Mock;
	} => ({
		execute: mockExecute,
		canExecute: mockCanExecute
	});

	const createKeyboardEvent = (key: string, target?: EventTarget): KeyboardEvent => {
		const event = new KeyboardEvent('keydown', { key });
		if (target) {
			Object.defineProperty(event, 'target', { value: target, writable: false });
		}
		event.preventDefault = vi.fn();
		event.stopImmediatePropagation = vi.fn();
		return event;
	};

	beforeEach(() => {
		(useNavigate as Mock).mockReturnValue(mockNavigate);
		(hasModalOverlay as Mock).mockReturnValue(false);
		(isInputContext as Mock).mockReturnValue(false);

		// Setup default mock implementations
		mockCanExecute.mockReturnValue(true);

		(useMsgMoveToTrashFn as Mock).mockReturnValue(createMockAction());
		(useMsgSetFlagFn as Mock).mockReturnValue(createMockAction());
		(useMsgSetNotSpamFn as Mock).mockReturnValue(createMockAction());
		(useMsgSetReadFn as Mock).mockReturnValue(createMockAction());
		(useMsgSetSpamFn as Mock).mockReturnValue(createMockAction());
		(useMsgSetUnflagFn as Mock).mockReturnValue(createMockAction());
		(useMsgSetUnreadFn as Mock).mockReturnValue(createMockAction());
	});

	describe('Hook initialization', () => {
		it('should initialize with correct props', () => {
			const props = {
				messageIds: ['1', '2'],
				folderId: '123'
			};

			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			expect(result.current).toBeInstanceOf(Function);
			expect(useMsgSetReadFn).toHaveBeenCalledWith(
				expect.objectContaining({
					ids: props.messageIds,
					folderId: props.folderId
				})
			);
		});
	});

	describe('Mark as read/unread shortcuts', () => {
		it('should mark message as read when "mr" is pressed', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('m'));
				handler(createKeyboardEvent('r'));
			});

			expect(mockCanExecute).toHaveBeenCalled();
			expect(mockExecute).toHaveBeenCalled();
		});

		it('should mark message as read when "z" is pressed', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('z'));
			});

			expect(mockCanExecute).toHaveBeenCalled();
			expect(mockExecute).toHaveBeenCalled();
		});

		it('should mark message as unread when "mu" is pressed', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('m'));
				handler(createKeyboardEvent('u'));
			});

			expect(mockCanExecute).toHaveBeenCalled();
			expect(mockExecute).toHaveBeenCalled();
		});

		it('should mark message as unread when "x" is pressed', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('x'));
			});

			expect(mockCanExecute).toHaveBeenCalled();
			expect(mockExecute).toHaveBeenCalled();
		});
	});

	describe('Flag toggle shortcut', () => {
		it('should toggle flag when "mf" is pressed', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('m'));
				handler(createKeyboardEvent('f'));
			});

			expect(mockCanExecute).toHaveBeenCalled();
			expect(mockExecute).toHaveBeenCalled();
		});

		it('should call unflag when flag cannot execute', () => {
			const flagAction = { execute: vi.fn(), canExecute: vi.fn().mockReturnValue(false) };
			const unflagAction = { execute: vi.fn(), canExecute: vi.fn().mockReturnValue(true) };

			(useMsgSetFlagFn as Mock).mockReturnValue(flagAction);
			(useMsgSetUnflagFn as Mock).mockReturnValue(unflagAction);

			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('m'));
				handler(createKeyboardEvent('f'));
			});

			expect(flagAction.canExecute).toHaveBeenCalled();
			expect(flagAction.execute).not.toHaveBeenCalled();
			expect(unflagAction.canExecute).toHaveBeenCalled();
			expect(unflagAction.execute).toHaveBeenCalled();
		});
	});

	describe('Spam toggle shortcut', () => {
		it('should mark as spam when "ms" is pressed and message is not spam', () => {
			const spamAction = { execute: vi.fn(), canExecute: vi.fn().mockReturnValue(true) };
			const notSpamAction = { execute: vi.fn(), canExecute: vi.fn().mockReturnValue(false) };

			(useMsgSetSpamFn as Mock).mockReturnValue(spamAction);
			(useMsgSetNotSpamFn as Mock).mockReturnValue(notSpamAction);

			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('m'));
				handler(createKeyboardEvent('s'));
			});

			expect(spamAction.execute).toHaveBeenCalled();
			expect(notSpamAction.execute).not.toHaveBeenCalled();
		});

		it('should mark not spam when "ms" is pressed and message is spam', () => {
			const spamAction = { execute: vi.fn(), canExecute: vi.fn().mockReturnValue(false) };
			const notSpamAction = { execute: vi.fn(), canExecute: vi.fn().mockReturnValue(true) };

			(useMsgSetSpamFn as Mock).mockReturnValue(spamAction);
			(useMsgSetNotSpamFn as Mock).mockReturnValue(notSpamAction);

			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('m'));
				handler(createKeyboardEvent('s'));
			});

			expect(spamAction.execute).not.toHaveBeenCalled();
			expect(notSpamAction.execute).toHaveBeenCalled();
		});
	});

	describe('Move to trash shortcuts', () => {
		it('should move to trash when Delete key is pressed', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('Delete'));
			});

			expect(mockCanExecute).toHaveBeenCalled();
			expect(mockExecute).toHaveBeenCalled();
		});

		it('should move to trash when Backspace key is pressed', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('Backspace'));
			});

			expect(mockCanExecute).toHaveBeenCalled();
			expect(mockExecute).toHaveBeenCalled();
		});

		it('should move to trash when ".t" is pressed', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('.'));
				handler(createKeyboardEvent('t'));
			});

			expect(mockCanExecute).toHaveBeenCalled();
			expect(mockExecute).toHaveBeenCalled();
		});
	});

	describe('Close preview panel shortcuts', () => {
		it('should navigate to the folder view when Esc is pressed and the current view does not belong to the search', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('Esc'));
			});

			expect(mockNavigate).toHaveBeenCalledWith(`/${MAILS_ROUTE}/folder/folder1`, {
				replace: true
			});
		});

		it('should navigate to the search result view when Esc is pressed and the current view belongs to the search', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, {
				initialEntries: [`/${SEARCH_ROUTE}/message/msg1`],
				initialProps: [props]
			});

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('Esc'));
			});

			expect(mockNavigate).toHaveBeenCalledWith(`/${SEARCH_ROUTE}`, {
				replace: true
			});
		});
	});

	describe('Event handling', () => {
		it('should prevent default and stop propagation when executing action', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;
			const event = createKeyboardEvent('z');

			act(() => {
				handler(event);
			});

			expect(event.preventDefault).toHaveBeenCalled();
			expect(event.stopImmediatePropagation).toHaveBeenCalled();
		});

		it('should not prevent default when action cannot execute', () => {
			mockCanExecute.mockReturnValue(false);

			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;
			const event = createKeyboardEvent('z');

			act(() => {
				handler(event);
			});

			expect(mockExecute).not.toHaveBeenCalled();
		});
	});

	describe('Modifier key handling with timeout', () => {
		it('should wait for timeout when modifier key is pressed', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('m'));
			});

			// Action should not be executed immediately
			expect(mockExecute).not.toHaveBeenCalled();

			act(() => {
				vi.advanceTimersByTime(1000);
			});

			// After timeout, key sequence should be reset (no matching action for 'm' alone)
			expect(mockExecute).not.toHaveBeenCalled();
		});

		it('should execute immediately when non-modifier key follows modifier', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('m'));
				handler(createKeyboardEvent('r'));
			});

			// Should execute immediately without waiting for timeout
			expect(mockExecute).toHaveBeenCalled();
		});

		it('should handle dot modifier correctly', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('.'));
			});

			expect(mockExecute).not.toHaveBeenCalled();

			act(() => {
				handler(createKeyboardEvent('t'));
			});

			expect(mockExecute).toHaveBeenCalled();
		});

		it('should handle "n" modifier correctly', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('n'));
			});

			expect(mockExecute).not.toHaveBeenCalled();

			act(() => {
				handler(createKeyboardEvent('f'));
			});

			// 'nf' is NEW_FOLDER shortcut, but no action is defined for it in the switch
			expect(mockExecute).not.toHaveBeenCalled();
		});
	});

	describe('Key sequence reset', () => {
		it('should reset key sequence after executing action', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			// First sequence
			act(() => {
				handler(createKeyboardEvent('z'));
			});

			expect(mockExecute).toHaveBeenCalledTimes(1);

			// Second sequence should work independently
			act(() => {
				handler(createKeyboardEvent('x'));
			});

			expect(mockExecute).toHaveBeenCalledTimes(2);
		});
	});

	describe('Unhandled shortcuts', () => {
		it('should not execute any action for unrecognized shortcuts', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('q'));
			});

			expect(mockExecute).not.toHaveBeenCalled();
			expect(mockNavigate).not.toHaveBeenCalled();
		});

		it('should not execute any action for partial modifier sequences', () => {
			const props = { messageIds: ['msg1'], folderId: 'folder1' };
			const { result } = setupHook(useKeyboardShortcutsForMsg, { initialProps: [props] });

			const handler = result.current;

			act(() => {
				handler(createKeyboardEvent('m'));
				handler(createKeyboardEvent('z')); // 'mz' is not a valid shortcut
			});

			expect(mockExecute).not.toHaveBeenCalled();
		});
	});
});
