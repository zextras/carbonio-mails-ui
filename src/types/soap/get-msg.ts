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
		html: 0 | 1;
		needExp: 0 | 1;
	};
};

export type GetMsgResponse = {
	m: Array<SoapMailMessage>;
};
