/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';

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
	const [isOpen, setIsOpen] = useState(expanded || isAlone);
	const [containerHeight, setContainerHeight] = useState(isOpen ? '100%' : 'fit-content');
	const { createWindow } = useGlobalExtraWindowManager();

	const onClick = useCallback(() => setIsOpen((prevOpen) => !prevOpen), []);

	const isMailPreviewOpen = useMemo(
		() => isMessageView || isAlone || isOpen,
		[isMessageView, isAlone, isOpen]
	);

	useEffect(() => {
		setContainerHeight(isOpen ? '100%' : 'fit-content');
	}, [isOpen]);

	const openEmlPreview: OpenEmlPreviewType = useCallback(
		(parentMessageId, attachmentName, emlMessage) => {
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
			createWindow?.(createWindowParams);
		},
		[createWindow, messagePreviewFactory]
	);

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
				{isMailPreviewOpen && (
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
