/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useState } from 'react';

import { Button, Row, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import Autolinker from 'autolinker';

import {
	getOriginalTextContent,
	getQuotedTextFromOriginalContent
} from 'commons/get-quoted-text-util';
import { plainTextToHTML } from 'commons/utils';

type TextMessageRendererType = {
	body: { content: string };
};

export const TextMessageRenderer = ({ body }: TextMessageRendererType): React.JSX.Element => {
	const [showQuotedText, setShowQuotedText] = useState(false);
	const originalText = getOriginalTextContent(body.content);
	const quoted = getQuotedTextFromOriginalContent(body.content, originalText);

	const contentToDisplay = useMemo(
		() => (showQuotedText ? body.content : originalText),
		[showQuotedText, body.content, originalText]
	);

	const convertedHTML = useMemo(
		() =>
			Autolinker.link(plainTextToHTML(contentToDisplay), {
				urls: { schemeMatches: true, tldMatches: true, ipV4Matches: false },
				newWindow: true, // open links in new tab
				stripPrefix: false, // keep "www."
				stripTrailingSlash: false, // keep trailing slashes
				sanitizeHtml: true // avoid XSS
			}),
		[contentToDisplay]
	);
	return (
		<>
			<Text
				data-testid="text-message-renderer-container"
				overflow="break-word"
				color="text"
				style={{ fontFamily: 'monospace' }}
				dangerouslySetInnerHTML={{
					__html: convertedHTML
				}}
			/>
			{!showQuotedText && quoted.length > 0 && (
				<Row mainAlignment="center" crossAlignment="center" padding={{ top: 'medium' }}>
					<Button
						label={t('label.show_quoted_text', 'Show quoted text')}
						icon="EyeOutline"
						type="outlined"
						onClick={(): void => setShowQuotedText(true)}
					/>
				</Row>
			)}
		</>
	);
};
