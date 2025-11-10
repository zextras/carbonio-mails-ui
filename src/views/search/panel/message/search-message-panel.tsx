/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useRef, useEffect } from 'react';

import { Container, Padding } from '@zextras/carbonio-design-system';
import { useNavigate } from 'react-router-dom';

import { SearchPanelHeader } from '../../parts/search-panel-header';
import { API_REQUEST_STATUS, SEARCH_ROUTE } from 'constants/index';
import { useCompleteMessageOrFetch } from 'store/emails/hooks/use-complete-message-or-fetch';
import MailPreview from 'views/app/detail-panel/preview/mail-preview';

export const SearchMessagePanel = ({ messageId }: { messageId: string }): React.JSX.Element => {
	const { message, messageStatus } = useCompleteMessageOrFetch({
		messageId,
		shouldMarkAsRead: true
	});
	const navigate = useNavigate();

	const prevReadStatusRef = useRef<boolean | undefined>(undefined);
	const shouldCollapseRef = useRef(false);

	// Track read status changes to determine if we should collapse
	useEffect(() => {
		const wasRead = prevReadStatusRef.current;
		const isNowUnread = message?.read === false;

		// If message was read and is now marked unread, mark for collapse
		if (wasRead === true && isNowUnread) {
			shouldCollapseRef.current = true;
		}

		prevReadStatusRef.current = message?.read;
	}, [message?.read]);

	// Reset state when switching to a different message
	useEffect(() => {
		prevReadStatusRef.current = undefined;
		shouldCollapseRef.current = false;
	}, [messageId]);

	if (messageStatus === API_REQUEST_STATUS.error) {
		navigate(`/${SEARCH_ROUTE}`, { replace: true });
	}

	if (!message) {
		return <></>;
	}

	return (
		<Container
			orientation="vertical"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			data-testid={`MessagePanel-${message.id}`}
		>
			<SearchPanelHeader item={message} />
			{message?.isComplete && (
				<Container
					style={{ overflowY: 'auto' }}
					height="fill"
					background="gray5"
					padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
					mainAlignment="flex-start"
					data-testid={`SearchMessagePanel-${messageId}`}
				>
					<Container height="fit" mainAlignment="flex-start" background="gray5">
						{message && messageStatus === API_REQUEST_STATUS.fulfilled && (
							<Padding bottom="medium" width="100%">
								<MailPreview
									message={message}
									expanded={!shouldCollapseRef.current}
									isAlone
									isMessageView
								/>
							</Padding>
						)}
						{(messageStatus === API_REQUEST_STATUS.error || messageStatus === null) && (
							<div data-testid="empty-fragment" />
						)}
					</Container>
				</Container>
			)}
		</Container>
	);
};
