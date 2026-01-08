/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Padding } from '@zextras/carbonio-design-system';

import { IncompleteMessage, MailMessage } from '../../../../types';
import { DetailPanelBody } from '../../../parts/detail-panel-body';
import { DetailPanelBodyContainer } from '../../../parts/detail-panel-body-container';
import { DetailPanelContainer } from '../../../parts/detail-panel-container';
import { DetailPanelMessageLoading } from '../../../parts/detail-panel-message-loading';
import MailPreview from '../preview/mail-preview';
import { PreviewPanelHeader } from '../preview/preview-panel-header';

export const MessagePreviewPanel: FC<{
	folderId: string;
	message: MailMessage | IncompleteMessage | undefined;
	isMessageLoaded: boolean;
	isEml?: boolean;
}> = ({ folderId, message, isMessageLoaded, isEml }) => (
	<DetailPanelContainer>
		<PreviewPanelHeader
			folderId={folderId}
			itemType={'message'}
			isRead={message?.read}
			subject={message?.subject}
		/>
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
	</DetailPanelContainer>
);
