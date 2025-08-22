/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo, useState } from 'react';

import { Button, Row, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { linkifyText } from './text-linkify';
import {
	getOriginalTextContent,
	getQuotedTextFromOriginalContent
} from '../../get-quoted-text-util';

type TextMessageRendererType = {
	body: { content: string };
};

export const TextMessageRenderer = ({ body }: TextMessageRendererType): React.JSX.Element => {
	const [showQuotedText, setShowQuotedText] = useState(false);
	const originalText = getOriginalTextContent(body.content);
	const quoted = getQuotedTextFromOriginalContent(body.content, originalText);

	const convertedHTML = useMemo(() => {
		const content = showQuotedText ? body.content : originalText;
		const html = linkifyText(content);
		return html.replace(/\r\n|\r|\n/g, '<br />');
	}, [showQuotedText, body.content, originalText]);

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
