/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["conversation"] }] */

import { ErrorSoapBodyResponse, soapFetch } from '@zextras/carbonio-shell-ui';

import type { SearchSoapApiParams, SearchRequest, SearchResponse } from 'types/index.d';

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

	return soapFetch<SearchRequest, SearchResponse | ErrorSoapBodyResponse>(
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
