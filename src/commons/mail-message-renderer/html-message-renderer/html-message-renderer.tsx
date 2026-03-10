/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useRef } from 'react';

import { Container } from '@zextras/carbonio-design-system';

import { BannerMessageTruncated } from './banner-message-truncated';
import { BannerViewExternalImages } from './banner-view-external-images';
import { ShadowDomWrapper } from './shadow-dom-wrapper';
import { ShowQuotedTextButton } from './show-quoted-text-button';
import { useHtmlMessageRenderer } from './use-html-message-renderer';
import { MailMessage } from 'types/messages';

type HtmlMessageRendererProps = {
	message: MailMessage;
};

export const HtmlMessageRenderer = ({ message }: HtmlMessageRendererProps): React.JSX.Element => {
	const divRef = useRef<HTMLDivElement>(null);

	const {
		messageContent,
		processedContent,
		externalImageState,
		isLoadingMessage,
		showQuotedText,
		trustMenuItems,
		loadFullMessage,
		handleShowQuotedText
	} = useHtmlMessageRenderer(message);

	return (
		<div ref={divRef} style={{ height: '100%' }}>
			{externalImageState.hasExternalImages && !externalImageState.showExternalImages && (
				<BannerViewExternalImages
					setShowExternalImages={externalImageState.setShowExternalImages}
					setDisplayBanner={externalImageState.setDisplayBanner}
					items={trustMenuItems}
				/>
			)}

			{message?.body?.truncated && (
				<BannerMessageTruncated loadMessage={loadFullMessage} isLoadingMessage={isLoadingMessage} />
			)}

			<ShadowDomWrapper>
				<Container
					width="fit"
					height="100%"
					data-testid="html-message-renderer-container"
					style={{ overflowY: 'auto', padding: '0.75rem 0px' }}
					dangerouslySetInnerHTML={{
						__html: processedContent
					}}
				/>
			</ShadowDomWrapper>

			{!showQuotedText && messageContent.quotedText.length > 0 && (
				<ShowQuotedTextButton onShowQuotedText={handleShowQuotedText} />
			)}
		</div>
	);
};
