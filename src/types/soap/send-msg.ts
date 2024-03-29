/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SoapDraftMessageObj } from './save-draft';

export type SoapSendMsgRequest = {
	_jsns: string;
	m: SoapDraftMessageObj;
};

export type SoapSendMsgResponse = {
	m: Array<{
		id: string;
	}>;
	_jsns: string;
};
