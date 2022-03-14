/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect } from 'react';
import { Container, Padding } from '@zextras/carbonio-design-system';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import PreviewPanelHeader from './preview/preview-panel-header';
import MailPreview from './preview/mail-preview';
import { getMsg } from '../../../store/actions';
import { selectMessage } from '../../../store/messages-slice';

export default function MessagePreviewPanel() {
	const { folderId, messageId } = useParams();
	const dispatch = useDispatch();

	const message = useSelector((state) => selectMessage(state, messageId));

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
							<Padding key={`mail-pre-${messageId}`} bottom="medium" width="100%">
								<MailPreview
									key={`${message.id}-${message.id}`}
									message={message}
									expanded
									isAlone
									isMessageView
								/>
							</Padding>
						</Container>
					</Container>
				</>
			)}
		</Container>
	);
}
