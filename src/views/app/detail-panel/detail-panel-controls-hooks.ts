/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useNavigate, useParams } from 'react-router-dom';

import { MAILS_ROUTE } from '../../../constants';
import type { FolderPanelRouteParams } from '../../../types/routes';

type ConversationPanelState = {
	id: string;
};
type ConversationDetailPanelControls = {
	closeConversationPanel: () => void;
	openConversationPanel: (toOpen: string) => void;
	currentConversation?: ConversationPanelState;
};
export const useConversationDetailPanelControls = (): ConversationDetailPanelControls => {
	const { folderId, itemId } = useParams<FolderPanelRouteParams>();
	const navigate = useNavigate();

	return {
		closeConversationPanel: (): void => {
			navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
		},
		openConversationPanel: (toOpen: string): void => {
			navigate(`/${MAILS_ROUTE}/folder/${folderId}/conversation/${toOpen}`, {
				replace: true
			});
		},
		currentConversation: itemId ? { id: itemId } : undefined
	};
};

type MessagePanelState = {
	id: string;
};
type MessageDetailPanelControls = {
	closeMessagePanel: () => void;
	openMessagePanel: (toOpen: string) => void;
	currentMessage?: MessagePanelState;
};
export const useMessageDetailPanelControls = (): MessageDetailPanelControls => {
	const { folderId, itemId } = useParams<FolderPanelRouteParams>();
	const navigate = useNavigate();

	return {
		closeMessagePanel: (): void => {
			navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
		},
		openMessagePanel: (toOpen: string): void => {
			navigate(`/${MAILS_ROUTE}/folder/${folderId}/message/${toOpen}`, {
				replace: true
			});
		},
		currentMessage: itemId ? { id: itemId } : undefined
	};
};
