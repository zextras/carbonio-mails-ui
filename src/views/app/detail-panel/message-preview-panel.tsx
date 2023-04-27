/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Padding } from '@zextras/carbonio-design-system';
import React, { FC, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { getMsg } from '../../../store/actions';
import { selectMessage } from '../../../store/messages-slice';
import type { StateType } from '../../../types';
import MailPreview from './preview/mail-preview';
import PreviewPanelHeader from './preview/preview-panel-header';

const MessagePreviewPanel: FC = () => {
	const { folderId, messageId } = useParams<{ folderId: string; messageId: string }>();
	const dispatch = useAppDispatch();

	const message = useAppSelector((state: StateType) => selectMessage(state, messageId));

	useEffect(() => {
		if (!message?.isComplete) {
			dispatch(getMsg({ msgId: messageId }));
		}
	}, [dispatch, folderId, message, messageId]);

	return (
		<Container orientation="vertical" mainAlignment="flex-start" crossAlignment="flex-start">
			{message && (
				<>
					<PreviewPanelHeader item={message} folderId={folderId} />
					{/* commented to hide the panel actions */}
					{/* <PreviewPanelActions item={message} folderId={folderId} isMessageView /> */}
					<Container
						style={{ overflowY: 'auto' }}
						height="fill"
						background="gray5"
						padding={{ horizontal: 'large', bottom: 'small', top: 'large' }}
						mainAlignment="flex-start"
					>
						<Container height="fit" mainAlignment="flex-start" background="gray5">
							<Padding bottom="medium" width="100%">
								{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
								{/* @ts-ignore */}
								<MailPreview message={message} expanded isAlone isMessageView />
							</Padding>
						</Container>
					</Container>
				</>
			)}
		</Container>
	);
};

export default MessagePreviewPanel;
