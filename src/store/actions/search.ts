/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["conversation"] }] */

import { AsyncThunk, createAsyncThunk } from '@reduxjs/toolkit';
import { ErrorSoapBodyResponse, getTags, soapFetch } from '@zextras/carbonio-shell-ui';
import { keyBy, map, reduce } from 'lodash';

import { normalizeConversation } from '../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import type {
	FetchConversationsParameters,
	FetchConversationsReturn,
	SearchRequest,
	SearchResponse
} from '../../types';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function getSearchFactory(name: string) {
	return createAsyncThunk<FetchConversationsReturn | undefined, FetchConversationsParameters>(
		name,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		async (
			{
				folderId,
				limit = 100,
				before,
				types = 'conversation',
				sortBy = 'dateDesc',
				query,
				offset,
				recip = '2',
				wantContent = 'full',
				locale
			},
			{ rejectWithValue }
		) => {
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
				case 'attachDesc':
					queryPart.push('has:attachment');
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

			try {
				const result = await soapFetch<SearchRequest, SearchResponse | ErrorSoapBodyResponse>(
					'Search',
					{
						_jsns: 'urn:zimbraMail',
						limit,
						needExp: 1,
						recip,
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
					}
				);
				if (!result) {
					return rejectWithValue(undefined);
				}

				if ('Fault' in result) {
					return rejectWithValue(result.Fault);
				}

				const tags = getTags();
				if (types === 'conversation') {
					const conversations = map(result?.c ?? [], (obj, index) => ({
						...normalizeConversation({ c: obj, tags }),
						sortIndex: index + (offset ?? 0)
					}));
					return {
						conversations: keyBy(conversations, 'id'),
						hasMore: result.more,
						offset: result.offset,
						types
					};
				}
				if (types === 'message') {
					return {
						messages: reduce(
							result.m ?? [],
							(acc, msg, index) => {
								const normalized = {
									...normalizeMailMessageFromSoap(msg, false),
									sortIndex: index + (offset ?? 0)
								};
								return { ...acc, [normalized.id]: normalized };
							},
							{}
						),
						hasMore: result.more,
						offset: result.offset,
						types
					};
				}
			} catch (err) {
				return rejectWithValue(err);
			}
			return undefined;
		}
	);
}

export const search = getSearchFactory('fetchConversations');
