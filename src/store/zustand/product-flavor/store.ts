/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'zustand';

type ProductFlavorStore = {
	productFlavor: 'advanced' | 'community';
	setAdvanced: () => void;
	setCommunity: () => void;
};

export const useProductFlavorStore = create<ProductFlavorStore>()((set) => ({
	productFlavor: 'community',
	setAdvanced: (): void => set({ productFlavor: 'advanced' }),
	setCommunity: (): void => set({ productFlavor: 'community' })
}));
