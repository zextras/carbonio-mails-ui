/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ServicesCatalog } from '../types';

export const requestServiceCatalog = (): Promise<ServicesCatalog> =>
	fetch('/services/catalog/services')
		.then(async (data) => {
			const { items } = await data.json();
			return items;
		})
		.catch(() => []);
