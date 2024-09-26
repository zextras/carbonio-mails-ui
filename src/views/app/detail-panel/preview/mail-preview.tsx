/* eslint-disable no-nested-ternary */
/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { MailPreviewBlock } from './parts/mail-preview-block';
import { MailContent } from './parts/mail-preview-content';
import type { MailMessage, OpenEmlPreviewType } from '../../../../types';
import { ExtraWindowCreationParams, MessageAction } from '../../../../types';
import { useGlobalExtraWindowManager } from '../../extra-windows/global-extra-window-manager';

export type MailPreviewProps = {
	message: MailMessage;
	expanded: boolean;
	messageActions: Array<MessageAction>;
	isAlone: boolean;
	isMessageView: boolean;
	isExternalMessage?: boolean;
	isInsideExtraWindow?: boolean;
	showingEml?: boolean;
};

const MailPreview: FC<MailPreviewProps> = ({
	message,
	expanded,
	messageActions,
	isAlone,
	isMessageView,
	isExternalMessage = false,
	isInsideExtraWindow = false,
	showingEml = false
}) => {
	const mailContainerRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(expanded || isAlone);
	const { createWindow } = useGlobalExtraWindowManager();

	const onClick = useCallback(() => {
		setOpen((o) => !o);
	}, []);

	const isMailPreviewOpen = useMemo(
		() => (isMessageView ? true : isAlone ? true : open),
		[isAlone, isMessageView, open]
	);

	/**
	 * To avoid component dependency cycles we define here, outside the
	 * AttachmentsBlock component, the function that open the EML preview
	 */
	const openEmlPreview: OpenEmlPreviewType = useCallback<OpenEmlPreviewType>(
		(parentMessageId: string, attachmentName: string, emlMessage: MailMessage): void => {
			const createWindowParams: ExtraWindowCreationParams = {
				name: `${parentMessageId}-${attachmentName}`,
				returnComponent: false,
				children: (
					<MailPreview
						message={emlMessage}
						expanded={false}
						isAlone
						messageActions={messageActions}
						isMessageView
						isExternalMessage
						isInsideExtraWindow
						showingEml
					/>
				),
				title: emlMessage.subject,
				closeOnUnmount: false
			};
			if (createWindow) {
				createWindow(createWindowParams);
			}
		},
		[createWindow, messageActions]
	);

	const [containerHeight, setContainerHeight] = useState(open ? '100%' : 'fit-content');

	useEffect(() => {
		setContainerHeight(open ? '100%' : 'fit-content');
	}, [open]);

	return (
		<Container
			ref={mailContainerRef}
			height={containerHeight}
			data-testid={`MailPreview-${message.id}`}
			padding={isInsideExtraWindow ? { all: 'large' } : undefined}
			background="white"
		>
			<MailPreviewBlock
				onClick={onClick}
				message={message}
				open={isMailPreviewOpen}
				messageActions={messageActions}
				isExternalMessage={isExternalMessage}
				isInsideExtraWindow={isInsideExtraWindow}
			/>

			<Container
				width="fill"
				height="fit"
				style={{
					flex: '1',
					overflow: 'auto'
				}}
			>
				{(open || isAlone) && (
					<MailContent
						message={message}
						isMailPreviewOpen={isMailPreviewOpen}
						openEmlPreview={openEmlPreview}
						isExternalMessage={isExternalMessage}
						isInsideExtraWindow={isInsideExtraWindow}
						showingEml={showingEml}
					/>
				)}
			</Container>
		</Container>
	);
};

export default MailPreview;
