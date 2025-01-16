/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { searchSoapApi } from '../../../api/search-soap-api';
import { SearchSoapApiParams } from '../../../types';
import { handleSearchSoapApiResults } from '../hooks/hooks';

export async function searchEmailStoreAction({
	folderId,
	limit,
	before,
	types,
	sortBy,
	query,
	offset,
	wantContent,
	locale,
	abortSignal
}: SearchSoapApiParams): ReturnType<typeof searchSoapApi> {
	const searchResponse = await searchSoapApi({
		folderId,
		limit,
		before,
		types,
		sortBy,
		query,
		offset,
		wantContent,
		locale,
		abortSignal
	});
	handleSearchSoapApiResults({ searchResponse });
	return searchResponse;
}
