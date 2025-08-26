/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type ServicesCatalog = Array<string>;

export const requestServiceCatalogApi = (): Promise<ServicesCatalog> =>
	fetch('/services/catalog/services')
		.then(async (response) => {
			if (response.ok) {
				const { items } = await response.json();
				return items;
			}
			console.error('Error fetching services catalog', response);
			return [];
		})
		.catch((e) => {
			console.error('Error fetching services catalog', e);
			return [];
		});
