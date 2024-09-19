/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback } from 'react';

import { Container, Padding } from '@zextras/carbonio-design-system';

import { getParentFolderId } from '../../../../helpers/folders';
import { useCompleteMessage } from '../../../../store/zustand/search/hooks/hooks';
import { MessagePreviewPanel } from '../../../app/detail-panel/message-preview-panel';
import MailPreview from '../../../app/detail-panel/preview/mail-preview';
import { useExtraWindow } from '../../../app/extra-windows/use-extra-window';
import { SearchPreviewPanelHeader } from '../search-preview-panel-header';

export type SearchMessagePreviewPanelProps = {
	messageId: string;
};

export const SearchMessagePreviewPanel: FC<SearchMessagePreviewPanelProps> = ({ messageId }) => {
	const { isInsideExtraWindow } = useExtraWindow();

	const { message } = useCompleteMessage(messageId);

	const messagePreviewFactory = useCallback(() => {
		const folderId = getParentFolderId(message.parent);
		return <MessagePreviewPanel folderId={folderId} messageId={message.id} />;
	}, [message.id, message.parent]);

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
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
