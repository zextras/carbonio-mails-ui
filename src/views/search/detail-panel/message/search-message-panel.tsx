/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useNavigate } from 'react-router-dom';

import { MessagePanelBody } from '../../../../components/detail-panel/message-panel-body';
import { SearchPanelHeader } from '../../parts/search-panel-header';
import { API_REQUEST_STATUS, SEARCH_ROUTE } from 'constants/index';
import { useCompleteMessageOrFetch } from 'store/emails/hooks/hooks';

export const SearchMessagePanel = ({ messageId }: { messageId: string }): React.JSX.Element => {
	const { message, messageStatus } = useCompleteMessageOrFetch({
		messageId
	});
	const navigate = useNavigate();

	if (messageStatus === API_REQUEST_STATUS.error) {
		navigate(`/${SEARCH_ROUTE}`, { replace: true });
	}

	if (!message) {
		return <></>;
	}

	const isMessageLoaded = messageStatus === API_REQUEST_STATUS.fulfilled;
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
					<MessagePanelBody message={message} isMessageFetched={isMessageLoaded} />
				</Container>
			)}
		</Container>
	);
};
