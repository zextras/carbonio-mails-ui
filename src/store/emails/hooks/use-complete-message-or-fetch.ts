/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useMemo, useRef } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { debounce } from 'lodash';

import { API_REQUEST_STATUS, DEFAULT_API_DEBOUNCE_TIME } from 'constants/index';
import { getMessageEmailStoreAction } from 'store/emails/actions/get-message';
import { useMessageById, useMessageStatus } from 'store/emails/store';
import { IncompleteMessage, MailMessage, SearchRequestStatus } from 'types/index.d';

type MessageWithStatus = {
	message: MailMessage | IncompleteMessage | undefined;
	messageStatus: SearchRequestStatus;
};

/**
 * Get the message from the store or fetch it.
 * Ensures that incomplete messages are fetched if their status indicates they are not yet fulfilled.
 */
export function useCompleteMessageOrFetch(messageId: string): MessageWithStatus {
	const message = useMessageById(messageId);
	const messageStatus = useMessageStatus(messageId);
	const settings = useUserSettings();
	const prefMarkMsgRead = settings?.prefs?.zimbraPrefMarkMsgRead !== '-1';
	const prevMessageIdRef = useRef<string | null>(null);

	const requestDebouncedMessage = useMemo(
		() =>
			debounce(
				() => {
					if (
						messageStatus !== API_REQUEST_STATUS.pending &&
						(!message?.isComplete || messageStatus === undefined)
					) {
						const shouldMarkAsRead = !message?.read && prefMarkMsgRead;
						getMessageEmailStoreAction(messageId, shouldMarkAsRead);
					}
					prevMessageIdRef.current = messageId;
				},
				DEFAULT_API_DEBOUNCE_TIME,
				{ leading: false, trailing: true }
			),
		[message, messageId, messageStatus, prefMarkMsgRead]
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
