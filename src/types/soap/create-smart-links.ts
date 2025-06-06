/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SmartLinkAttachment } from 'types/attachments/index.d';
import { ZimbraRequest } from 'types/soap/zimbra-request';

export type CreateSmartLinksRequest = ZimbraRequest & {
	attachments: Array<SmartLinkAttachment>;
};

export type SmartLinkUrl = {
	publicUrl: string;
};

export type CreateSmartLinksResponse = {
	smartLinks: Array<SmartLinkUrl>;
};
