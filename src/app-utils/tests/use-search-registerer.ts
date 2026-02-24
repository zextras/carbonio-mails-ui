/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Shell from '@zextras/carbonio-shell-ui';

import { setupHook } from '@test-setup';
import { useSearchRegisterer } from 'app-utils/use-search-registerer';
import { MAIL_APP_ID, MAILS_ROUTE } from 'constants/index';

describe('useSearchView', () => {
	it('should add search view if integration is available', () => {
		const addSearchViewFn = vi.fn();
		vi.spyOn(Shell, 'useIntegratedFunction').mockImplementation((id) => {
			if (id === 'search-add-view') {
				return [addSearchViewFn, true];
			}
			return [(): void => undefined, false];
		});

		setupHook(useSearchRegisterer);

		expect(addSearchViewFn).toHaveBeenCalledWith({
			id: MAIL_APP_ID,
			app: MAIL_APP_ID,
			icon: 'MailModOutline',
			route: MAILS_ROUTE,
			component: expect.anything(),
			label: 'Mails',
			position: 100
		});
	});

	it('should remove search view on unmount', () => {
		const addSearchViewFn = vi.fn();
		const removeSearchViewFn = vi.fn();
		vi.spyOn(Shell, 'useIntegratedFunction').mockImplementation((id) => {
			if (id === 'search-add-view') {
				return [addSearchViewFn, true];
			}
			if (id === 'search-remove-view') {
				return [removeSearchViewFn, true];
			}
			return [(): void => undefined, false];
		});

		const { unmount } = setupHook(useSearchRegisterer);

		unmount();
		expect(removeSearchViewFn).toHaveBeenCalledWith(MAIL_APP_ID);
	});

	it('should not call addSearchView if integration is not available', () => {
		const addSearchViewFn = vi.fn();
		vi.spyOn(Shell, 'useIntegratedFunction').mockImplementation((id) => {
			if (id === 'search-add-view') {
				return [addSearchViewFn, false];
			}
			return [(): void => undefined, false];
		});

		setupHook(useSearchRegisterer);

		expect(addSearchViewFn).not.toHaveBeenCalled();
	});
});
