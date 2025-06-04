/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useSearchRegisterer } from 'app-utils/use-search-registerer';

export const SearchRegistration = (): null => {
	useSearchRegisterer();
	return null;
};
