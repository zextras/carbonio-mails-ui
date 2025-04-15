/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { MailPreviewBlock } from './parts/mail-preview-block';
import { MailPreviewContent } from './parts/mail-preview-content';
import { isStandalonePreview } from '../../../../helpers/external-tabs';
import type { MailMessage } from '../../../../types';

export type MailPreviewProps = {
	message: MailMessage;
	expanded: boolean;
	isAlone: boolean;
	isMessageView: boolean;
	isExternalMessage?: boolean;
};

const MailPreview: FC<MailPreviewProps> = ({
	message,
	expanded,
	isAlone,
	isMessageView,
	isExternalMessage = false
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
			padding={isStandalonePreview() ? { all: 'large' } : undefined}
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
						isExternalMessage={isExternalMessage}
					/>
				)}
			</Container>
		</Container>
	);
};

MailPreview.displayName = 'MailPreview';

export default MailPreview;
