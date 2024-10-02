/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Container, Padding, Shimmer } from '@zextras/carbonio-design-system';
import { replaceHistory } from '@zextras/carbonio-shell-ui';

import { API_REQUEST_STATUS } from '../../../../constants';
import { useCompleteMessage } from '../../../../store/zustand/search/hooks/hooks';
import MailPreview from '../../../app/detail-panel/preview/mail-preview';
import { useExtraWindow } from '../../../app/extra-windows/use-extra-window';
import { SearchPreviewPanelHeader } from '../../preview/search-preview-panel-header';

export const SearchMessagePanel = ({ messageId }: { messageId: string }): React.JSX.Element => {
	const { message, messageStatus } = useCompleteMessage(messageId);

	const { isInsideExtraWindow } = useExtraWindow();

	const messagePreviewFactory = useCallback(
		() => <SearchMessagePanel messageId={message.id} />,
		[message.id]
	);

	if (!message) {
		replaceHistory({
			path: '/',
			route: 'search'
		});
		return <></>;
	}

	return (
		<Container
			orientation="vertical"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			data-testid={`MessagePanel-${message.id}`}
		>
			{!isInsideExtraWindow && <SearchPreviewPanelHeader item={message} />}
			{message?.isComplete && (
				<Container
					style={{ overflowY: 'auto' }}
					height="fill"
					background="gray5"
					padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
					mainAlignment="flex-start"
				>
					<Container height="fit" mainAlignment="flex-start" background="gray5">
						{message && messageStatus === API_REQUEST_STATUS.fulfilled && (
							<Padding bottom="medium" width="100%">
								<MailPreview
									message={message}
									expanded
									isAlone
									isMessageView
									isInsideExtraWindow={isInsideExtraWindow}
									messagePreviewFactory={messagePreviewFactory}
								/>
							</Padding>
						)}
						{messageStatus === API_REQUEST_STATUS.pending && (
							<Shimmer.Logo size="large" data-testid={`shimmer-message-${messageId}`} />
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
