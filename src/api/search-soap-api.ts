/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { SearchSoapApiParams } from 'types/conversations';
import { SearchRequest, SearchResponse } from 'types/soap/search';

export async function searchSoapApi({
	limit = 100,
	types = 'conversation',
	sortBy = 'dateDesc',
	query = '',
	offset,
	locale,
	abortSignal
}: SearchSoapApiParams): Promise<SearchResponse | ErrorSoapBodyResponse> {
	let finalsortBy = sortBy;
	switch (sortBy) {
		case 'readAsc':
			finalsortBy = 'dateAsc';
			break;
		case 'readDesc':
			finalsortBy = 'dateDesc';
			break;
		case 'attachAsc':
			finalsortBy = 'sizeAsc';
			break;
		case 'attachDesc':
			finalsortBy = 'sizeDesc';
			break;
		default:
			break;
	}

	return legacySoapFetch<SearchRequest, SearchResponse | ErrorSoapBodyResponse>(
		'Search',
		{
			_jsns: 'urn:zimbraMail',
			limit,
			recip: '2',
			fullConversation: 1,
			sortBy: finalsortBy,
			query,
			offset,
			types,
			...(locale
				? {
						locale: {
							_content: locale
						}
					}
				: undefined)
		},
		undefined,
		abortSignal
	);
}
