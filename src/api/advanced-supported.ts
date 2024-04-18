/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { addSettingsView } from '@zextras/carbonio-shell-ui';
import { t } from 'i18next';

import { MAILS_ROUTE, PRODUCT_FLAVOR } from '../constants';
import { useProductFlavorStore } from '../store/zustand/product-flavor/store';
import SettingsView from '../views/settings/settings-view';
import { getSettingsSubSections } from '../views/settings/subsections';

export const advancedSupportedAPI = fetch('/zx/auth/supported')
	.then((data) => {
		if (data.status === 200) {
			useProductFlavorStore.getState().setAdvanced();
			return PRODUCT_FLAVOR.ADVANCED;
		}
		return PRODUCT_FLAVOR.COMMUNITY;
	})
	.then((productFlavor) => {
		addSettingsView({
			route: MAILS_ROUTE,
			label: t('label.app_name', 'Mails'),
			subSections: getSettingsSubSections(productFlavor),
			component: SettingsView
		});
	});
