/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Padding } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { useNavigate } from 'react-router-dom';

import { SearchPanelHeader } from '../../parts/search-panel-header';
import { API_REQUEST_STATUS, SEARCH_ROUTE } from 'constants/index';
import { useCompleteMessageOrFetch } from 'store/emails/hooks/hooks';
import MailPreview from 'views/app/detail-panel/preview/mail-preview';

export const SearchMessagePanel = ({ messageId }: { messageId: string }): React.JSX.Element => {
	const zimbraPrefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	const { message, messageStatus } = useCompleteMessageOrFetch({
		messageId,
		shouldMarkAsRead: zimbraPrefMarkMsgRead
	});
	const navigate = useNavigate();

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
								<MailPreview message={message} expanded isAlone isMessageView />
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
