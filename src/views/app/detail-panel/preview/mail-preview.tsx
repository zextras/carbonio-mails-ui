/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { isFocusModeMailView } from 'helpers/external-tabs';
import { MailMessage } from 'types/messages';
import { MailPreviewBlock } from 'views/app/detail-panel/preview/parts/mail-preview-block';
import { MailPreviewContent } from 'views/app/detail-panel/preview/parts/mail-preview-content';

export type MailPreviewProps = {
	message: MailMessage;
	expanded: boolean;
	isAlone: boolean;
	isMessageView: boolean;
	isEml?: boolean;
};

const MailPreview: FC<MailPreviewProps> = ({
	message,
	expanded,
	isAlone,
	isMessageView,
	isEml = false
}) => {
	const [isOpen, setIsOpen] = useState(expanded || isAlone);

	const containerHeight = useMemo(() => {
		if (isOpen) {
			return '100%';
		}
		return 'fit-content';
	}, [isOpen]);

	const onClick = useCallback(() => setIsOpen((prevOpen) => !prevOpen), []);

	const isMailPreviewOpen = useMemo(
		() => isMessageView || isAlone || isOpen,
		[isMessageView, isAlone, isOpen]
	);

	return (
		<Container
			height={containerHeight}
			data-testid={`MailPreview-${message.id}`}
			padding={isFocusModeMailView() ? { all: 'large' } : undefined}
			background="white"
		>
			<MailPreviewBlock
				onClick={onClick}
				message={message}
				open={isMailPreviewOpen}
				isEml={isEml}
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
						isEml={isEml}
					/>
				)}
			</Container>
		</Container>
	);
};

MailPreview.displayName = 'MailPreview';

export default MailPreview;
