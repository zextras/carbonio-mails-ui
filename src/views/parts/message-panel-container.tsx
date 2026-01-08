/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect } from 'react';

import { Container, Padding } from '@zextras/carbonio-design-system';

import { DetailPanelBody } from './detail-panel-body';
import { DetailPanelBodyContainer } from './detail-panel-body-container';
import { DetailPanelMessageLoading } from './detail-panel-message-loading';
import { API_REQUEST_STATUS } from '../../constants';
import { isFocusModeMailView } from '../../helpers/external-tabs';
import { useCompleteMessageOrFetch } from '../../store/emails/hooks/hooks';
import MailPreview from '../app/detail-panel/preview/mail-preview';

type MessagePanelContainerProps = {
	messageId: string;
	onLoadError?: () => void;
	isEml?: boolean;
};
export const MessagePanelContainer = ({
	messageId,
	isEml,
	onLoadError,
	children
}: React.PropsWithChildren<MessagePanelContainerProps>): React.JSX.Element => {
	const { message, messageStatus } = useCompleteMessageOrFetch({
		messageId
	});

	useEffect(() => {
		if (isFocusModeMailView() && message?.subject) {
			document.title = message.subject;
		}
	}, [message?.subject]);

	if (messageStatus === API_REQUEST_STATUS.error) {
		if (isFocusModeMailView()) {
			window.close();
		}
		onLoadError?.();
	}
	const isMessageLoaded = messageStatus === API_REQUEST_STATUS.fulfilled;
	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			{children}
			<DetailPanelBodyContainer>
				{isMessageLoaded ? (
					<DetailPanelBody>
						<Padding bottom="medium" width="100%">
							{message && (
								<MailPreview message={message} expanded isAlone isMessageView isEml={isEml} />
							)}
						</Padding>
					</DetailPanelBody>
				) : (
					<DetailPanelMessageLoading />
				)}
			</DetailPanelBodyContainer>
		</Container>
	);
};
