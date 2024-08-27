/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Container, Padding } from '@zextras/carbonio-design-system';
import { uniqBy } from 'lodash';

import MailPreview from './preview/mail-preview';
import PreviewPanelHeader from './preview/preview-panel-header';
import { EXTRA_WINDOW_ACTION_ID } from '../../../constants';
import { useAppSelector } from '../../../hooks/redux';
import { useRequestDebouncedMessage } from '../../../hooks/use-request-debounced-message';
import { selectMessage } from '../../../store/messages-slice';
import type { MailsStateType, MessageAction } from '../../../types';
import { useExtraWindow } from '../extra-windows/use-extra-window';

export type MessagePreviewPanelProps = {
	folderId: string;
	messageId: string;
	messageActions: Array<MessageAction>;
};

export const MessagePreviewPanel: FC<MessagePreviewPanelProps> = ({
	folderId,
	messageId,
	messageActions
}) => {
	const { isInsideExtraWindow } = useExtraWindow();
	const isExtraWindowActions = messageActions.some(
		(action: MessageAction) => action.id === EXTRA_WINDOW_ACTION_ID
	);
	const actions = isExtraWindowActions
		? messageActions.filter((action: MessageAction) => action.id !== EXTRA_WINDOW_ACTION_ID)
		: uniqBy([...messageActions[0], ...messageActions[1]], 'id');

	const message = useAppSelector((state: MailsStateType) => selectMessage(state, messageId));

	useRequestDebouncedMessage(messageId, message?.isComplete);

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
								messageActions={actions}
								isMessageView
								isInsideExtraWindow={isInsideExtraWindow}
							/>
						</Padding>
					</Container>
				</Container>
			)}
		</Container>
	);
};
