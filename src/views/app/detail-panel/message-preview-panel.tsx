/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import { Container, Padding } from '@zextras/carbonio-design-system';
import { uniqBy } from 'lodash';

import MailPreview from './preview/mail-preview';
import PreviewPanelHeader from './preview/preview-panel-header';
import { EXTRA_WINDOW_ACTION_ID } from '../../../constants';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { getMsg } from '../../../store/actions';
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
	const dispatch = useAppDispatch();

	const isExtraWindowActions = messageActions.some(
		(action: MessageAction) => action.id === EXTRA_WINDOW_ACTION_ID
	);

	const actions = isExtraWindowActions
		? messageActions.filter((action: MessageAction) => action.id !== EXTRA_WINDOW_ACTION_ID)
		: uniqBy([...messageActions[0], ...messageActions[1]], 'id');

	const message = useAppSelector((state: MailsStateType) => selectMessage(state, messageId));

	const [flexGrow, setFlexGrow] = useState('unset');
	const mailPreviewRef = useRef<HTMLDivElement>(null);
	const handleHeightChange = useCallback(() => {
		console.log('Pre-updateFlexGrow');
		if (mailPreviewRef.current && isInsideExtraWindow) {
			console.log('In-updateFlexGrow');
			setFlexGrow('1');
		}
	}, [isInsideExtraWindow]);

	useEffect(() => {
		if (!message?.isComplete) {
			dispatch(getMsg({ msgId: messageId }));
		}
	}, [dispatch, folderId, message, messageId]);

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			{message && (
				<>
					{!isInsideExtraWindow && <PreviewPanelHeader item={message} folderId={folderId} />}
					<Container
						style={{ overflowY: 'auto' }}
						height="fill"
						background="gray5"
						padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
						mainAlignment="flex-start"
					>
						<Container
							flexGrow={flexGrow}
							height="fit"
							mainAlignment="flex-start"
							background="gray5"
						>
							<Padding bottom="medium" width="100%" style={{ flexGrow }}>
								<MailPreview
									ref={mailPreviewRef}
									message={message}
									expanded
									isAlone
									messageActions={actions}
									isMessageView
									isInsideExtraWindow={isInsideExtraWindow}
									onHeightChange={handleHeightChange}
								/>
							</Padding>
						</Container>
					</Container>
				</>
			)}
		</Container>
	);
};
