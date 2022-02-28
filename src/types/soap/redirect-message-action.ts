/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ZimbraRequest } from './zimbra-request';

export type EmailAddresses = {
	a: string;
	t: 't';
	p?: string;
};

export type MessageSpecification = {
	id: string;
	e: EmailAddresses[];
};

export type RedirectMessageActionRequest = ZimbraRequest & {
	m: MessageSpecification;
};
