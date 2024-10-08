/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { SoapMailMessage } from './soap-mail-message';
import { ZimbraRequest } from './zimbra-request';

export type GetMsgRequest = ZimbraRequest & {
	m: {
		id: string;
		part?: string;
		html: 0 | 1;
		needExp: 0 | 1;
		max?: number;
	};
};

export type GetMsgResponse = {
	m: Array<SoapMailMessage>;
};

export type GetMsgParameters = {
	msgId: string;
	max?: number;
};

export type GetMsgForPrintParameter = {
	ids: Array<string>;
	part?: string;
};

export type GetMsgForPrintResponse = {
	GetMsgResponse: Array<GetMsgResponse>;
	_jsns: 'urn:zimbra';
};
