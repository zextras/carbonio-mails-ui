/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { convActionSoapApi } from '../../../api';
import { ConvActionOperation } from '../../../types';
import { handleConvAction } from '../store';

export async function convActionEmailStoreAction({
	ids,
	operation,
	parent,
	tagName
}: {
	ids: Array<string>;
	operation: ConvActionOperation;
	parent?: string;
	tagName?: string;
}): ReturnType<typeof convActionSoapApi> {
	const response = await convActionSoapApi({ ids, operation, parent, tagName });
	handleConvAction(response);
	return response;
}
