/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MailVerificationHeader } from 'types/soap/soap';
import { SoapConversation } from 'types/soap/soap-conversation';
import { ZimbraRequest } from 'types/soap/zimbra-request';

export type GetConvRequest = ZimbraRequest & {
	c: {
		id: string;
		fetch?: string;
		html?: boolean;
		max?: number;
		needExp: 0 | 1;
		header: Array<{ n: MailVerificationHeader }>;
	};
};

export type GetConvResponse = {
	c: Array<SoapConversation>;
};
