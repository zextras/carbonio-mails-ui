/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { map } from 'lodash';

import { searchConvSoapAPI } from '../../api/search-conv';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import type { SearchConvParameters, SearchConvReturn } from '../../types';

export const searchConv = async ({
	conversationId,
	folderId,
	fetch = 'all'
}: SearchConvParameters): Promise<SearchConvReturn> => {
	const result = await searchConvSoapAPI({
		conversationId,
		fetch,
		folderId
	});
	const messages = map(result?.m ?? [], (msg) => normalizeMailMessageFromSoap(msg, true));

	return {
		messages,
		orderBy: result.orderBy,
		hasMore: result.more,
		offset: result.offset
	};
};
