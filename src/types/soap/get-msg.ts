/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SoapFault } from '@zextras/carbonio-ui-soap-lib';

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
	shouldMarkAsRead?: boolean;
	html: boolean;
};

// A message attached to another one is not an item of the mailbox: no cid, l, d nor f, its date only in
// sd, and id is the one of the message that contains it (ToXML.encodeMessageAsMP with a part)
export type SoapSubMessage = Omit<SoapMailMessage, 'cid' | 'l' | 'd' | 'f'> & {
	part: string;
};

export type GetAttachedMsgResponse = {
	m: Array<SoapSubMessage>;
};

export type GetAttachedMsgParameters = {
	msgId: string;
	part: string;
	html: boolean;
};

export type GetMsgForPrintParameter = {
	ids: Array<string>;
};

// A BatchResponse: one GetMsgResponse per message read, one Fault per message that failed
export type GetMsgForPrintResponse = {
	GetMsgResponse?: Array<GetMsgResponse>;
	Fault?: Array<SoapFault>;
};
