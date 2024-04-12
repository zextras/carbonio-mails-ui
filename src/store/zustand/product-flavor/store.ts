/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';

import { PRODUCT_FLAVOUR } from '../../../constants';

type ProductFlavorType = typeof PRODUCT_FLAVOUR;

type ProductFlavorStore = {
	productFlavor: ProductFlavorType[keyof typeof PRODUCT_FLAVOUR];
	setAdvanced: () => void;
	setCommunity: () => void;
};

export const useProductFlavorStore = create<ProductFlavorStore>()((set) => ({
	productFlavor: PRODUCT_FLAVOUR.COMMUNITY,
	setAdvanced: (): void => set({ productFlavor: PRODUCT_FLAVOUR.ADVANCED }),
	setCommunity: (): void => set({ productFlavor: PRODUCT_FLAVOUR.COMMUNITY })
}));
