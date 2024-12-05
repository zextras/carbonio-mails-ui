/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { runSearch } from '@zextras/carbonio-search-ui';
import { useIntegratedFunction } from '@zextras/carbonio-shell-ui';

export const useRunSearchIntegration = (): typeof runSearch | undefined => {
	const [runSearchFn, isAvailable] = useIntegratedFunction<typeof runSearch>('search-run-search');

	return isAvailable ? runSearchFn : undefined;
};
