/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MailVerificationHeader } from './soap';
import { SoapMailMessage } from './soap-mail-message';
import { ZimbraRequest } from './zimbra-request';

export type GetMsgRequest = ZimbraRequest & {
	m: {
		id: string;
		part?: string;
		html: 0 | 1;
		needExp: 0 | 1;
		max?: number;
		header: Array<{ n: MailVerificationHeader }>;
		read?: 0 | 1;
	};
	encryptionPassword?: string;
};

export type GetMsgResponse = {
	m: Array<SoapMailMessage>;
};

export type GetMsgParameters = {
	msgId: string;
	max?: number;
	smimePassword?: string;
	part?: string;
	read?: 0 | 1;
};
