/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { getFolderIdParts } from '@zextras/carbonio-ui-commons';
import { filter } from 'lodash';
import { useParams } from 'react-router-dom';

import { useConversationMessages } from '../store/emails/store';
import type { MailMessage, NormalizedConversation } from '../types';
import type {
	DetailPanelRoutesParams,
	FolderPanelRouteParams,
	SearchDetailPanelConversationRouteParams,
	SearchDetailPanelMessagePanelRouteParams,
	SearchDetailPanelRouteParams,
	SearchListPanelRouteParams,
	SearchRoutesParams
} from '../types/routes';

const isItemAMessage = (item: MailMessage | NormalizedConversation): item is MailMessage =>
	!!(item as MailMessage)?.conversation;

const isFolderPanelRoute = (
	route: DetailPanelRoutesParams | FolderPanelRouteParams | SearchRoutesParams
): route is FolderPanelRouteParams =>
	!!(route as FolderPanelRouteParams).itemId && !!(route as FolderPanelRouteParams).folderId;

const isDetailPanelRoute = (
	route: DetailPanelRoutesParams | FolderPanelRouteParams | SearchRoutesParams
): route is DetailPanelRoutesParams =>
	!(route as FolderPanelRouteParams).itemId && !!(route as FolderPanelRouteParams).folderId;

const isSearchDetailPanelRoute = (
	route: DetailPanelRoutesParams | FolderPanelRouteParams | SearchRoutesParams
): route is SearchDetailPanelRouteParams =>
	!(route as SearchListPanelRouteParams).itemId &&
	!(route as FolderPanelRouteParams).folderId &&
	!!(
		(route as SearchDetailPanelConversationRouteParams).conversationId ||
		(route as SearchDetailPanelMessagePanelRouteParams).messageId
	);

const isSearchListPanelRoute = (
	route: DetailPanelRoutesParams | FolderPanelRouteParams | SearchRoutesParams
): route is SearchListPanelRouteParams =>
	!(route as FolderPanelRouteParams).folderId &&
	!(route as SearchDetailPanelConversationRouteParams).conversationId &&
	!(route as SearchDetailPanelMessagePanelRouteParams).messageId;

const shouldFolderPanelReplaceHistory = (
	params: FolderPanelRouteParams,
	item: MailMessage | NormalizedConversation,
	messages: MailMessage[]
): boolean => {
	if (isItemAMessage(item)) {
		return filter(messages, (m) => getFolderIdParts(params.folderId).id === m.parent).length <= 1;
	}
	return (
		params.itemId === item.id &&
		filter(messages, (m) => getFolderIdParts(params.folderId).id === m.parent).length <= 1
	);
};
const shouldDetailPanelReplaceHistory = (
	params: DetailPanelRoutesParams,
	item: MailMessage | NormalizedConversation,
	messages: MailMessage[]
): boolean => {
	if (!params.folderId) {
		return false;
	}
	if (params.conversationId) {
		return filter(messages, (m) => getFolderIdParts(params.folderId).id === m.parent).length <= 1;
	}
	return params.messageId === item.id;
};

const shouldSearchDetailPanelReplaceHistory = (
	params: SearchDetailPanelRouteParams,
	item: MailMessage | NormalizedConversation,
	messages: MailMessage[]
): boolean => {
	if (params?.conversationId) {
		return messages.length < 1;
	}
	return params?.messageId === item.id;
};

const shouldSearchListPanelReplaceHistory = (
	params: SearchListPanelRouteParams,
	item: MailMessage | NormalizedConversation,
	messages: MailMessage[]
): boolean => {
	if (params.itemId) {
		if (isItemAMessage(item)) {
			if (params.type === 'message') {
				return params.itemId === item.id;
			}
			return messages.length < 1;
		}
		return params.itemId === item.id;
	}
	return false;
};

export const useShouldReplaceHistory = (item: MailMessage | NormalizedConversation): boolean => {
	const params = useParams<
		DetailPanelRoutesParams | FolderPanelRouteParams | SearchRoutesParams
	>() as DetailPanelRoutesParams | FolderPanelRouteParams | SearchRoutesParams;

	const id = useMemo(() => {
		if (isFolderPanelRoute(params)) {
			return params.itemId ?? item.id;
		}
		if (isDetailPanelRoute(params) && params.conversationId) {
			return params.conversationId;
		}
		if (isItemAMessage(item)) {
			return item.conversation;
		}
		return item.id;
	}, [item, params]);

	const messages = useConversationMessages(id);

	return useMemo(() => {
		if (isFolderPanelRoute(params)) {
			return shouldFolderPanelReplaceHistory(params, item, messages);
		}
		if (isDetailPanelRoute(params)) {
			return shouldDetailPanelReplaceHistory(params, item, messages);
		}
		if (isSearchDetailPanelRoute(params)) {
			return shouldSearchDetailPanelReplaceHistory(params, item, messages);
		}
		if (isSearchListPanelRoute(params)) {
			return shouldSearchListPanelReplaceHistory(params, item, messages);
		}
		return false;
	}, [item, messages, params]);
};
