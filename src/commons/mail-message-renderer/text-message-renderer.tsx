/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo, useState } from 'react';

import { Button, Row, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { getOriginalTextContent, getQuotedTextFromOriginalContent } from '../get-quoted-text-util';
import { plainTextToHTML, replaceLinkToAnchor } from '../utils';

export const TextMessageRenderer: FC<{ body: { content: string; contentType: string } }> = ({
	body
}) => {
	const [showQuotedText, setShowQuotedText] = useState(false);
	const orignalText = getOriginalTextContent(body.content);
	const quoted = getQuotedTextFromOriginalContent(body.content, orignalText);

	const contentToDisplay = useMemo(
		() => (showQuotedText ? body.content : orignalText),
		[showQuotedText, body.content, orignalText]
	);

	const convertedHTML = useMemo(
		() => replaceLinkToAnchor(plainTextToHTML(contentToDisplay)),
		[contentToDisplay]
	);
	return (
		<>
			<Text
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
