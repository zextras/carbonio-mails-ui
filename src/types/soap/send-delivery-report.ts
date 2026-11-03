/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ZimbraRequest } from 'types/soap/zimbra-request';

export type SendDeliveryReportRequest = ZimbraRequest & {
	mid: string;
};

// An empty element: only the namespace
export type SendDeliveryReportResponse = { _jsns?: string };
