/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { screen, waitFor } from '@testing-library/react';

import { UserEvent } from '@test-setup';

type ConversationTestUtilities = {
	checkPanelClosed: () => Promise<void>;
	checkPanelOpen: () => Promise<HTMLElement>;
	findConversationInList: () => Promise<HTMLElement>;
	hoverConversationInList: (user: UserEvent) => Promise<{ hoverActionsContainer: HTMLElement }>;
	openConversationContextMenu: (user: UserEvent) => Promise<HTMLElement>;
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
	openConversationContextMenu: async (user: UserEvent): Promise<HTMLElement> => {
		const hoverActionsSection = await screen.findByTestId(`ConversationListItem-${id}`);
		await user.hover(hoverActionsSection);
		const hoverContainer = screen.getByTestId(`hover-container-${id}`);

		await user.rightClick(hoverContainer);
		return screen.getByTestId('dropdown-popper-list');
	}
});
