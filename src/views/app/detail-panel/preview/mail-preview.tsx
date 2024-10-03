/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';

/* eslint-disable no-nested-ternary */

import { MailPreviewBlock } from './parts/mail-preview-block';
import { MailPreviewContent } from './parts/mail-preview-content';
import type { MailMessage, OpenEmlPreviewType } from '../../../../types';
import { ExtraWindowCreationParams } from '../../../../types';
import { useGlobalExtraWindowManager } from '../../extra-windows/global-extra-window-manager';

export type MailPreviewProps = {
	message: MailMessage;
	expanded: boolean;
	isAlone: boolean;
	isMessageView: boolean;
	isExternalMessage?: boolean;
	isInsideExtraWindow?: boolean;
	messagePreviewFactory: () => React.JSX.Element;
};

const MailPreview: FC<MailPreviewProps> = ({
	message,
	expanded,
	isAlone,
	isMessageView,
	isExternalMessage = false,
	isInsideExtraWindow = false,
	messagePreviewFactory
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
						isMessageView
						isExternalMessage
						isInsideExtraWindow
						messagePreviewFactory={messagePreviewFactory}
					/>
				),
				title: emlMessage.subject,
				closeOnUnmount: false
			};
			if (createWindow) {
				createWindow(createWindowParams);
			}
		},
		[createWindow, messagePreviewFactory]
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
				isExternalMessage={isExternalMessage}
				messagePreviewFactory={messagePreviewFactory}
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
					<MailPreviewContent
						message={message}
						isMailPreviewOpen={isMailPreviewOpen}
						openEmlPreview={openEmlPreview}
						isExternalMessage={isExternalMessage}
						isInsideExtraWindow={isInsideExtraWindow}
					/>
				)}
			</Container>
		</Container>
	);
};

MailPreview.displayName = 'MailPreview';

export default MailPreview;
