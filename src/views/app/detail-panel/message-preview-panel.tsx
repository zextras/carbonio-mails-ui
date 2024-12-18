/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback } from 'react';

import { Container, Padding } from '@zextras/carbonio-design-system';

import MailPreview from './preview/mail-preview';
import PreviewPanelHeader from './preview/preview-panel-header';
import { useCompleteMessage } from '../../../store/zustand/emails/hooks/hooks';
import { useExtraWindow } from '../extra-windows/use-extra-window';

export const MessagePreviewPanel: FC<{ folderId: string; messageId: string }> = ({
	folderId,
	messageId
}) => {
	const { isInsideExtraWindow } = useExtraWindow();

	const { message } = useCompleteMessage(messageId);

	const messagePreviewFactory = useCallback(
		() => <MessagePreviewPanel folderId={folderId} messageId={messageId} />,
		[folderId, messageId]
	);

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			{!isInsideExtraWindow && (
				<PreviewPanelHeader
					folderId={folderId}
					itemType={'message'}
					isRead={message?.read}
					subject={message?.subject}
				/>
			)}
			{message?.isComplete && (
				<Container
					style={{ overflowY: 'auto' }}
					height="fill"
					background="gray5"
					padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
					mainAlignment="flex-start"
				>
					<Container height="fit" mainAlignment="flex-start" background="gray5">
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
					</Container>
				</Container>
			)}
		</Container>
	);
};
