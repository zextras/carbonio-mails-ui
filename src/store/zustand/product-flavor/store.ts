/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';

import { PRODUCT_FLAVOR } from '../../../constants';

type ProductFlavorType = typeof PRODUCT_FLAVOR;
export type ProductFlavor = ProductFlavorType[keyof typeof PRODUCT_FLAVOR];

type ProductFlavorStore = {
	productFlavor: ProductFlavor;
	setAdvanced: () => void;
	setCommunity: () => void;
};

export const useProductFlavorStore = create<ProductFlavorStore>()((set) => ({
	productFlavor: PRODUCT_FLAVOR.COMMUNITY,
	setAdvanced: (): void => set({ productFlavor: PRODUCT_FLAVOR.ADVANCED }),
	setCommunity: (): void => set({ productFlavor: PRODUCT_FLAVOR.COMMUNITY })
}));
