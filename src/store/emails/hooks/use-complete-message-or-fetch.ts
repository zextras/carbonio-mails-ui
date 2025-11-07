/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useMemo } from 'react';

import { debounce } from 'lodash';

import { API_REQUEST_STATUS, DEFAULT_API_DEBOUNCE_TIME } from 'constants/index';
import { getMessageEmailStoreAction } from 'store/emails/actions/get-message';
import { useMessageById, useMessageStatus } from 'store/emails/store';
import { IncompleteMessage, MailMessage, SearchRequestStatus } from 'types/index.d';

type MessageWithStatus = {
	message: MailMessage | IncompleteMessage | undefined;
	messageStatus: SearchRequestStatus;
};

type UseCompleteMessageOrFetchParams = {
	messageId: string;
	shouldMarkAsRead?: boolean;
};

/**
 * Hook to ensure a complete message is fetched from the store or via an API call.
 * If the message is incomplete or not present, it triggers a fetch action.
 *
 * @param messageId - the ID of the message to fetch
 * @param shouldMarkAsRead - whether to mark the message as read when fetching
 */
export function useCompleteMessageOrFetch({
	messageId,
	shouldMarkAsRead = false
}: UseCompleteMessageOrFetchParams): MessageWithStatus {
	const message = useMessageById(messageId);
	const messageStatus = useMessageStatus(messageId);

	const requestDebouncedMessage = useMemo(
		() =>
			debounce(
				() => {
					if (
						messageStatus !== API_REQUEST_STATUS.pending &&
						(!message?.isComplete || messageStatus === undefined)
					) {
						getMessageEmailStoreAction(messageId, shouldMarkAsRead);
					}
				},
				DEFAULT_API_DEBOUNCE_TIME,
				{ leading: false, trailing: true }
			),
		[message, messageId, messageStatus, shouldMarkAsRead]
	);

	useEffect(() => {
		requestDebouncedMessage();
		return () => {
			requestDebouncedMessage.cancel();
		};
	}, [requestDebouncedMessage]);

	return {
		message,
		messageStatus
	};
}
