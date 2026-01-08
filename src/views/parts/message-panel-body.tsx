/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Padding } from '@zextras/carbonio-design-system';

import { DetailPanelBody } from './detail-panel-body';
import { DetailPanelBodyContainer } from './detail-panel-body-container';
import { DetailPanelMessageLoading } from './detail-panel-message-loading';
import MailPreview from '../app/detail-panel/preview/mail-preview';

type MessagePanelBodyProps = {
	isEml?: boolean;
	message?: any;
	isMessageFetched?: any;
};
export const MessagePanelBody = ({
	isEml,
	isMessageFetched,
	message
}: MessagePanelBodyProps): React.JSX.Element => (
	<DetailPanelBodyContainer>
		{isMessageFetched ? (
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
);
