/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, forEach, isEmpty, map, reduce } from 'lodash';
import { DefaultTheme } from 'styled-components';
import { MailMessage } from '../../types';
import {
	findAttachments,
	plainTextToHTML,
	_CI_REGEX,
	_CI_SRC_REGEX
} from '../mail-message-renderer';
import { getBodyWrapper } from './get-body-wrapper';
import { getCompleteHTMLForEML } from './get-complete-html-for-eml';
import { getEmlHeader } from './get-eml-header';

type GetEMLContentProps = {
	messages: MailMessage[];
	conversations: Array<{ conversation: string; subject: string }>;
	isMsg?: boolean;
	theme: DefaultTheme;
};

export const getEMLContent = ({
	messages,
	conversations,
	isMsg = false,
	theme
}: GetEMLContentProps): string => {
	let content = '';

	map(conversations, (conv) => {
		const conversationMessage = isMsg
			? messages
			: filter(messages, { conversation: conv.conversation });
		const _content = map(conversationMessage, (msg: MailMessage) => {
			const { body } = msg;
			switch (body.contentType) {
				case 'text/html': {
					const parts = findAttachments(msg.parts ?? [], []);
					const parser = new DOMParser();
					const htmlDoc = parser.parseFromString(body.content, 'text/html');
					const imgMap = reduce(
						parts,
						(r, v) => {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							if (!_CI_REGEX.test(v.ci)) return r;
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							r[_CI_REGEX.exec(v.ci)[1]] = v;
							return r;
						},
						{}
					);

					const images = htmlDoc.getElementsByTagName('img');
					forEach(images, (p) => {
						if (p.hasAttribute('dfsrc')) {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							p.setAttribute('src', p.getAttribute('dfsrc'));
						}
						if (!_CI_SRC_REGEX.test(p.src)) return;
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						const ci = _CI_SRC_REGEX.exec(p.getAttribute('src'))[1];
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						if (imgMap[ci]) {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							const part = imgMap[ci];
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							p.setAttribute('pnsrc', p.getAttribute('src'));
							p.setAttribute('src', `/service/home/~/?auth=co&id=${msg.id}&part=${part.name}`);
						}
					});

					return getEmlHeader({ msg, content: htmlDoc.body.innerHTML, theme });
				}
				case 'text/plain': {
					return !isEmpty(body.content)
						? getEmlHeader({ msg, content: `<p>${plainTextToHTML(body.content)}</p>`, theme })
						: getEmlHeader({ msg, content: '<p>No Content</p>', theme });
				}
				default:
					return getEmlHeader({ msg, content: '<p>No Content</p>', theme });
			}
		});
		content += getBodyWrapper({
			content: _content.join('<br/>'),
			subject: messages?.[0]?.subject
		});
	});

	return getCompleteHTMLForEML({ content });
};
