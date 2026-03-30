/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MailVerificationHeader } from './soap';
import { SoapMailMessage } from 'types/soap/soap-mail-message';
import { ZimbraRequest } from 'types/soap/zimbra-request';

// https://files.zimbra.com/docs/ soap_api/9.0.0/api-reference/zimbraMail/SearchConv.html

export type SearchConvRequest = ZimbraRequest & {
	offset: number;
	sortBy: string;
	limit: number;
	query?: string;
	cid: string;
	fetch: string;
	html: boolean;
	needExp: 1 | 0;
	max?: number;
	recip: '0' | '1' | '2' | 'false' | 'true';
	header: Array<{ n: MailVerificationHeader }>;
	read?: 0 | 1;
};

export type SearchConvResponse = {
	more: boolean;
	offset: string;
	m: Array<SoapMailMessage>;
	orderBy: string;
};

export type SearchConvParameters = {
	conversationId: string;
	folderId?: string;
	fetch: string;
	shouldMarkAsRead?: boolean;
	html: boolean;
};
