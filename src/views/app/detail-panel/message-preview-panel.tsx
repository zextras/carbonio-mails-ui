/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Container, Padding } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { Spinner } from 'assets/spinner';
import { IncompleteMessage, MailMessage } from 'types/messages';
import MailPreview from 'views/app/detail-panel/preview/mail-preview';
import { PreviewPanelHeader } from 'views/app/detail-panel/preview/preview-panel-header';

export const MessagePreviewPanel: FC<{
	folderId: string;
	message: MailMessage | IncompleteMessage | undefined;
	isMessageLoaded: boolean;
	isEml?: boolean;
}> = ({ folderId, message, isMessageLoaded, isEml }) => {
	const [t] = useTranslation();
	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			<PreviewPanelHeader
				folderId={folderId}
				itemType={'message'}
				isRead={message?.read}
				subject={message?.subject}
			/>
			<Container
				style={{ overflowY: 'auto' }}
				height="fill"
				background="gray5"
				padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
				mainAlignment="flex-start"
			>
				{isMessageLoaded ? (
					<Container height="fit" mainAlignment="flex-start" background="gray5">
						<Padding bottom="medium" width="100%">
							{message && (
								<MailPreview message={message} expanded isAlone isMessageView isEml={isEml} />
							)}
						</Padding>
					</Container>
				) : (
					<Container
						style={{ overflowY: 'auto' }}
						height="fill"
						background="gray5"
						mainAlignment="center"
						crossAlignment="center"
					>
						<Spinner text={t('displayer.loading_message', 'Loading message, please wait...')} />
					</Container>
				)}
			</Container>
		</Container>
	);
};
