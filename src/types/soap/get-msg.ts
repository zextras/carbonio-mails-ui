/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MailVerificationHeader } from 'types/soap/soap';
import { SoapMailMessage } from 'types/soap/soap-mail-message';
import { ZimbraRequest } from 'types/soap/zimbra-request';

export type GetMsgRequest = ZimbraRequest & {
	m: {
		id: string;
		part?: string;
		html: boolean;
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
	shouldMarkAsRead?: boolean;
	html: boolean;
};

export type GetMsgForPrintParameter = {
	ids: Array<string>;
	part?: string;
};

export type GetMsgForPrintResponse = {
	GetMsgResponse: Array<GetMsgResponse>;
};
