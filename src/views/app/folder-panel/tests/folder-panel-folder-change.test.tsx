/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { useParams } from 'react-router-dom';
import type { Mock } from 'vitest';

import { setupTest } from '@test-setup';
import FolderPanel from 'views/app/folder-panel';
import { useIsMessageView } from 'views/search/search-view-hooks';

vi.mock('../../../search/search-view-hooks', () => ({ useIsMessageView: vi.fn() }));
vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useParams: vi.fn()
}));
vi.mock('../messages/message-list', async () => {
	const { StatefulList } = await import('./stateful-list');
	return { MessageList: (): React.JSX.Element => <StatefulList testId="message-list" /> };
});
vi.mock('../conversations/conversation-list', async () => {
	const { StatefulList } = await import('./stateful-list');
	return { ConversationList: (): React.JSX.Element => <StatefulList testId="conversation-list" /> };
});

describe('FolderPanel when the folder changes', () => {
	describe.each([
		{ list: 'MessageList', testId: 'message-list', isMessageView: true },
		{ list: 'ConversationList', testId: 'conversation-list', isMessageView: false }
	])('$list', ({ testId, isMessageView }) => {
		beforeEach(() => {
			(useIsMessageView as Mock).mockReturnValue(isMessageView);
			(useParams as Mock).mockReturnValue({ folderId: FOLDERS.INBOX });
		});

		it('should drop the state of the list, selection included, when the folder changes', async () => {
			const { user, rerender } = setupTest(<FolderPanel />);
			await user.click(screen.getByTestId(testId));
			expect(screen.getByTestId(testId)).toHaveTextContent(/^selected$/);

			(useParams as Mock).mockReturnValue({ folderId: FOLDERS.SENT });
			rerender(<FolderPanel />);

			expect(screen.getByTestId(testId)).toHaveTextContent(/^not selected$/);
		});

		it('should keep the state of the list while the folder stays the same', async () => {
			const { user, rerender } = setupTest(<FolderPanel />);
			await user.click(screen.getByTestId(testId));

			rerender(<FolderPanel />);

			expect(screen.getByTestId(testId)).toHaveTextContent(/^selected$/);
		});
	});
});
