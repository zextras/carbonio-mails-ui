/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { setAppContext, useAppContext } from '@zextras/carbonio-shell-ui';
import { isNil } from 'lodash';

import { requestServiceCatalogApi } from 'api/request-service-catalog-api';
import { AppContext } from 'app-utils/app-context-initializer';

export const InitializeServicesCatalog = (): null => {
	const { servicesCatalog } = useAppContext<AppContext>();

	useEffect(() => {
		if (!servicesCatalog) {
			requestServiceCatalogApi().then((res) => {
				if (!isNil(res)) {
					setAppContext({ servicesCatalog: res });
				} else {
					setAppContext({ servicesCatalog: [] });
				}
			});
		}
	}, [servicesCatalog]);

	return null;
};
