/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { MailPreviewBlock } from './parts/mail-preview-block';
import { MailPreviewContent } from './parts/mail-preview-content';
import { getLocationOrigin } from './utils';
import { MSG_PREVIEW_ROUTE } from '../../../../constants';
import type { MailMessage, OpenEmlPreviewType } from '../../../../types';

export type MailPreviewProps = {
	message: MailMessage;
	expanded: boolean;
	isAlone: boolean;
	isMessageView: boolean;
	isExternalMessage?: boolean;
	isInsideExtraWindow?: boolean;
};

const MailPreview: FC<MailPreviewProps> = ({
	message,
	expanded,
	isAlone,
	isMessageView,
	isExternalMessage = false,
	isInsideExtraWindow = false
}) => {
	const mailContainerRef = useRef<HTMLDivElement>(null);
	const [isOpen, setIsOpen] = useState(expanded || isAlone);
	const [containerHeight, setContainerHeight] = useState(isOpen ? '100%' : 'fit-content');

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
			window.open(
				`${getLocationOrigin()}/carbonio/${MSG_PREVIEW_ROUTE}/folder/${parentMessageId}/message/${emlMessage.id}/${attachmentName}`,
				emlMessage.subject
			);
		},
		[]
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
