/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
	m: Array<{
		id: string;
	}>;
	_jsns: string;
};
