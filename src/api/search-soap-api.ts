/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["conversation"] }] */

import { ErrorSoapBodyResponse, legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { SearchSoapApiParams } from 'types/conversations';
import { SearchRequest, SearchResponse } from 'types/soap/search';

export async function searchSoapApi({
	folderId,
	limit = 100,
	before,
	types = 'conversation',
	sortBy = 'dateDesc',
	query,
	offset,
	wantContent = 'full',
	locale,
	abortSignal
}: SearchSoapApiParams): Promise<SearchResponse | ErrorSoapBodyResponse> {
	const queryPart = [`inId:"${folderId}"`];
	let finalsortBy = sortBy;
	if (before) queryPart.push(`before:${before.getTime()}`);
	// TODO WHY DO WE USE A QUERYPART AND CHANGE THE SORT ORDER THIS ONE?
	switch (sortBy) {
		case 'readAsc':
			queryPart.push('is:unread');
			finalsortBy = 'dateAsc';
			break;
		case 'readDesc':
			queryPart.push('is:unread');
			finalsortBy = 'dateDesc';
			break;
		case 'priorityAsc':
		case 'priorityDesc':
			queryPart.push('priority:high');
			break;
		case 'flagAsc':
		case 'flagDesc':
			queryPart.push('is:flagged');
			break;
		case 'attachAsc':
			queryPart.push('has:attachment');
			finalsortBy = 'sizeAsc';
			break;
		case 'attachDesc':
			queryPart.push('has:attachment');
			finalsortBy = 'sizeDesc';
			break;
		case 'changeDateAsc':
		case 'changeDateDesc':
			break;
		default:
			break;
	}

	let finalQuery = '';

	if (folderId) {
		finalQuery = queryPart.join(' ');
	}
	if (!folderId && query) {
		finalQuery = query;
	}

	return legacySoapFetch<SearchRequest, SearchResponse | ErrorSoapBodyResponse>(
		'Search',
		{
			_jsns: 'urn:zimbraMail',
			limit,
			needExp: 1,
			recip: '2',
			fullConversation: 1,
			wantContent,
			sortBy: finalsortBy,
			query: finalQuery,
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
