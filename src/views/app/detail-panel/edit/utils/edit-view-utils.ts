/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { DefaultTheme } from 'styled-components';

import { MailsEditorV2 } from '../../../../../types';
import { SmartLinkUrl } from '../../../../../types/soap/create-smart-links';

export const generateSmartLinkHtml = ({
	smartLink,
	attachments,
	index,
	theme
}: {
	smartLink: SmartLinkUrl;
	attachments: MailsEditorV2['savedAttachments'];
	index: number;
	theme: DefaultTheme;
}): string =>
	`<a style='background-color: ${theme.palette.infoBanner.regular}; 
                            padding: 7px 15px;
                            color: black;
                            display: inline-block;
                            margin-top: 5px;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                            overflow: hidden;
                            max-width: 80%;
                            border: 1px solid ${theme.palette.primary.regular}';
                            href='${smartLink.publicUrl}' download>${
		attachments[index].filename ?? smartLink.publicUrl
	}</a>`;
