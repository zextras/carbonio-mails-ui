/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type Account } from '@zextras/carbonio-shell-ui';
import { filter, forEach, isEmpty, map, reduce } from 'lodash';
import { type MailMessage } from '../../types';
import {
	_CI_REGEX,
	_CI_SRC_REGEX,
	findAttachments,
	plainTextToHTML
} from '../mail-message-renderer';
import { getBodyWrapper } from './get-body-wrapper';
import { getCompleteHTML } from './get-complete-html';
import { getHeader } from './get-header';

function getSs(conversationMessage: Array<MailMessage>): Array<string> {
	return map(conversationMessage, (msg) => {
		const { body } = msg;
		switch (body.contentType) {
			case 'text/html': {
				const parts = findAttachments(msg.parts ?? [], []);
				const parser = new DOMParser();
				const htmlDoc = parser.parseFromString(body.content, 'text/html');
				const imgMap = reduce(
					parts as any,
					(r, v) => {
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
						p.setAttribute('src', p.getAttribute('dfsrc') ?? '');
					}
					if (!_CI_SRC_REGEX.test(p.src)) return;
					const ci = _CI_SRC_REGEX.exec(p.getAttribute('src') ?? '')?.[1] ?? '';
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					if (imgMap[ci]) {
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						const part = imgMap[ci];
						p.setAttribute('pnsrc', p.getAttribute('src') ?? '');
						p.setAttribute('src', `/service/home/~/?auth=co&id=${msg.id}&part=${part.name}`);
					}
				});

				return getHeader(msg, htmlDoc.body.innerHTML);
			}
			case 'text/plain': {
				return !isEmpty(body.content)
					? getHeader(msg, `<p>${plainTextToHTML(body.content)}</p>`)
					: getHeader(msg, '<p>No Content</p>');
			}
			default:
				return getHeader(msg, '<p>No Content</p>');
		}
	});
}

export const getContentForPrint = ({
	messages,
	account,
	conversations,
	isMsg = false
}: {
	messages: any;
	account: Account;
	conversations: any;
	isMsg: boolean;
}): string => {
	let content = '';
	map(conversations, (conv) => {
		const filteredMessages = filter(messages, { conversation: conv.id }) ?? [];
		const conversationMessages = isMsg ? messages : filteredMessages;
		const ss = getSs(conversationMessages);
		content += getBodyWrapper({ content: ss.join('<br/>'), subject: conv.subject });
	});

	return getCompleteHTML({ content, account });
};
