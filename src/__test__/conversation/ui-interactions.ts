/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { screen, waitFor, within } from '@testing-library/react';

import { UserEvent } from '@test-setup';

type ConversationContextMenuActions = {
	markAsSpam: () => Promise<HTMLElement>;
	notSpam: () => Promise<HTMLElement>;
};
type ConversationTestUtilities = {
	checkPanelClosed: () => Promise<void>;
	checkPanelOpen: () => Promise<HTMLElement>;
	findConversationInList: () => Promise<HTMLElement>;
	hoverConversationInList: (user: UserEvent) => Promise<{ hoverActionsContainer: HTMLElement }>;
	openConversationContextMenu: (user: UserEvent) => Promise<ConversationContextMenuActions>;
	snackbars: {
		seeConversationMovedToSpam: ({ status }: { status: 'open' | 'closed' }) => Promise<void>;
		seeConversationNotSpamAnymore: ({ status }: { status: 'open' | 'closed' }) => Promise<void>;
	};
};
export const conversationTestUtilities = (id: string): ConversationTestUtilities => ({
	findConversationInList: (): Promise<HTMLElement> =>
		screen.findByTestId(`conversation-list-item-${id}`),
	checkPanelOpen: (): Promise<HTMLElement> =>
		screen.findByTestId(`conversation-preview-panel-${id}`),
	hoverConversationInList: async (
		user: UserEvent
	): Promise<{ hoverActionsContainer: HTMLElement }> => {
		const hoverActionsSection = await screen.findByTestId(`ConversationListItem-${id}`);
		await user.hover(hoverActionsSection);
		const hoverContainer = screen.getByTestId(`hover-container-${id}`);
		return { hoverActionsContainer: hoverContainer };
	},
	checkPanelClosed: async (): Promise<void> => {
		await waitFor(() => {
			expect(screen.queryByTestId(`conversation-preview-panel-${id}`)).not.toBeInTheDocument();
		});
	},
	snackbars: {
		seeConversationMovedToSpam: async ({
			status
		}: {
			status: 'open' | 'closed';
		}): Promise<void> => {
			const spamMessage = 'Conversation marked as Spam';
			if (status === 'open') {
				await screen.findByText(spamMessage);
			} else {
				vi.advanceTimersByTime(3000); // snackbar lasts 3 seconds
				await waitFor(() => {
					expect(screen.queryByText(spamMessage)).not.toBeInTheDocument();
				});
			}
		},
		seeConversationNotSpamAnymore: async ({
			status
		}: {
			status: 'open' | 'closed';
		}): Promise<void> => {
			const notSpamMessage = 'Conversation marked as Not Spam';
			if (status === 'open') {
				await screen.findByText(notSpamMessage);
			} else {
				vi.advanceTimersByTime(3000); // snackbar lasts 3 seconds
				await waitFor(() => {
					expect(screen.queryByText(notSpamMessage)).not.toBeInTheDocument();
				});
			}
		}
	},
	openConversationContextMenu: async (user: UserEvent): Promise<ConversationContextMenuActions> => {
		const hoverActionsSection = await screen.findByTestId(`ConversationListItem-${id}`);
		await user.hover(hoverActionsSection);
		const hoverContainer = screen.getByTestId(`hover-container-${id}`);

		await user.rightClick(hoverContainer);
		const contextMenu = screen.getByTestId('dropdown-popper-list');
		return {
			async markAsSpam(): Promise<HTMLElement> {
				return within(contextMenu).findByText('Mark as spam');
			},
			async notSpam(): Promise<HTMLElement> {
				return within(contextMenu).findByText('Not spam');
			}
		};
	}
});
