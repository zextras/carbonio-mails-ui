/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { renderHook } from '@testing-library/react-hooks';
import * as hooks from '@zextras/carbonio-shell-ui';
import { ErrorSoapBodyResponse, QueryChip } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import { useRunSearch } from './search-view-hooks';
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateSettings } from '../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { buildSoapErrorResponseBody } from '../../carbonio-ui-commons/test/mocks/utils/soap';
import { updateConversations } from '../../store/zustand/message-store/store';
import { generateConversation } from '../../tests/generators/generateConversation';
import { SearchRequest, SearchResponse } from '../../types';

describe('search view hooks', () => {
	it('should reset conversations list when api result empty', async () => {
		updateConversations([generateConversation({ id: '1' })], 0);
		const queryChip: QueryChip = {
			hasAvatar: false,
			id: '0',
			label: 'ciao'
		};
		const settings = generateSettings({
			prefs: {
				zimbraPrefGroupMailBy: 'conversation'
			}
		});
		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		const searchInterceptor = createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [],
			more: false
		});
		// eslint-disable-next-line @typescript-eslint/ban-types
		const useDisableSearch = (): [boolean, Function] => [false, noop];

		const { result, waitFor } = renderHook(() =>
			useRunSearch({
				query: [queryChip],
				updateQuery: noop,
				useDisableSearch,
				invalidQueryTooltip: 'INVALID',
				isSharedFolderIncluded: false
			})
		);

		await searchInterceptor;
		await waitFor(() => {
			expect(result.current.searchResults.conversationIds.size).toBe(0);
		});
	});

	it('should set invalid query if API query error', async () => {
		updateConversations([generateConversation({ id: '1' })], 0);
		const settings = generateSettings({
			prefs: {
				zimbraPrefGroupMailBy: 'conversation'
			}
		});
		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);
		// eslint-disable-next-line @typescript-eslint/ban-types
		const useDisableSearch = (): [boolean, Function] => [false, noop];
		const interceptor = createSoapAPIInterceptor<SearchRequest, ErrorSoapBodyResponse>(
			'Search',
			buildSoapErrorResponseBody({
				detailCode: 'mail.QUERY_PARSE_ERROR',
				reason: 'Failed to execute search'
			})
		);

		const { result, waitFor } = renderHook(() =>
			useRunSearch({
				query: [
					{
						hasAvatar: false,
						id: '0',
						label: 'ciao'
					}
				],
				updateQuery: noop,
				useDisableSearch,
				invalidQueryTooltip: 'INVALID',
				isSharedFolderIncluded: false
			})
		);

		await interceptor;
		await waitFor(() => {
			expect(result.current.isInvalidQuery).toBe(true);
		});
	});
});
