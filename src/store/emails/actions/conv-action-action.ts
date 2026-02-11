/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { convActionSoapApi } from 'api/index';
import { handleConvActionResponse, optimisticallyHandleConvActions } from 'store/emails/store';
import { ConvActionParameters } from 'types/conversations';

export async function convActionEmailStoreAction({
	ids,
	operation,
	parent,
	tagName
}: ConvActionParameters): ReturnType<typeof convActionSoapApi> {
	optimisticallyHandleConvActions({ ids, operation });
	const response = await convActionSoapApi({ ids, operation, parent, tagName });
	handleConvActionResponse(response, { ids, operation });
	return response;
}
