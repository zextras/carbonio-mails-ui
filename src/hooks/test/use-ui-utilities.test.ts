/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { setupHook } from '../../carbonio-ui-commons/test/test-setup';
import { useUiUtilities } from '../use-ui-utilities';

describe('useUiUtilities', () => {
	test('the result contains the createModal function', () => {
		const { result: hookResult } = setupHook(useUiUtilities);
		expect('createModal' in hookResult.current).toBeTruthy();
	});

	test('the result contains the createModal function', () => {
		const { result: hookResult } = setupHook(useUiUtilities);
		expect('createSnackbar' in hookResult.current).toBeTruthy();
	});
});
