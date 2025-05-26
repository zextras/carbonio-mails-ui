/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect } from 'react';

import { setAppContext, useAppContext } from '@zextras/carbonio-shell-ui';
import { isNil } from 'lodash';

import { requestServiceCatalogApi } from '../../api/request-service-catalog-api';
import { AppContext } from '../../types';

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
