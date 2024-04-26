/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PRODUCT_FLAVOR } from '../constants';
import { ProductFlavor, useProductFlavorStore } from '../store/zustand/product-flavor/store';

export const applyProductFlavourAPI = (): Promise<ProductFlavor> =>
	fetch('/zx/login/v3/account')
		.then(async (data) => {
			const { backupSelfUndeleteAllowed } = await data.json();
			if (data.status === 200) {
				useProductFlavorStore.getState().setAdvanced();
				return PRODUCT_FLAVOR.ADVANCED;
			}
			return PRODUCT_FLAVOR.COMMUNITY;
		})
		.catch(() => PRODUCT_FLAVOR.COMMUNITY);
