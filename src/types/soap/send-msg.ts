/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SoapFault } from '@zextras/carbonio-ui-soap-lib';

import { SoapDraftMessageObj } from 'types/soap/save-draft';
import { ZimbraRequest } from 'types/soap/zimbra-request';

export type SoapSendMsgRequest = ZimbraRequest & {
	m: SoapDraftMessageObj;
	sign?: boolean;
	encrypt?: boolean;
	encryptionPassword?: string;
	encryptionType?: 'smime';
};

export type SoapSendMsgResponse = {
	// only the id of the copy saved to Sent, and no id when nothing is saved (SendMsg.java:289-294)
	m: Array<{
		id?: string;
	}>;
	_jsns: string;
};

// an argument of the error, e.g. n "invalid" with an address the server refused (ServiceException.Argument)
export type SoapFaultArgument = {
	n: string;
	t: string;
	_content: string;
};

export type SoapSendMsgFault = {
	Fault: SoapFault & {
		Detail: { Error: SoapFault['Detail']['Error'] & { a?: Array<SoapFaultArgument> } };
	};
};
