/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ZimbraRequest } from './zimbra-request';
import { SmartLinkAttachment } from '../attachments';

export type CreateSmartLinksRequest = ZimbraRequest & {
	attachments: Array<SmartLinkAttachment>;
};

export type CreateSmartLinksResponse = Array<{
	publicUrl: string;
}>;
