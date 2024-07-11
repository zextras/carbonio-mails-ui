/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { setupTest } from '../../carbonio-ui-commons/test/test-setup';
import { SearchMessageList } from './search-message-list';

describe('Search items list', () => {
	it('should display messages with subject', async () => {
		setupTest(<SearchMessageList searchResults={} query={} loading={} filterCount={} setShowAdvanceFilters={} isInvalidQuery={} searchDisabled={});
	});
});
