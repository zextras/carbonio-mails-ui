/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SoapConversation } from './soap-conversation';
import { ZimbraRequest } from './zimbra-request';

export type GetConvRequest = ZimbraRequest & {
	c: {
		id: string;
		fetch?: string;
		html?: 0 | 1;
		max?: number;
		needExp: 0 | 1;
	};
};

export type GetConvResponse = {
	c: Array<SoapConversation>;
};
