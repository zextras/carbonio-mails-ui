/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import { setAppContext, useAppContext } from '@zextras/carbonio-shell-ui';
import { isNil } from 'lodash';

import { requestServiceCatalog } from '../../api/request-service-catalog';
import { AppContext } from '../../types';

export const InitializeServicesCatalog = (): null => {
	const { servicesCatalog } = useAppContext<AppContext>();

	useEffect(() => {
		if (!servicesCatalog) {
			requestServiceCatalog().then((res) => {
				if (!isNil(res)) {
					setAppContext((context: AppContext) => ({ ...(context ?? {}), servicesCatalog: res }));
				} else {
					setAppContext((context: AppContext) => ({ ...(context ?? {}), servicesCatalog: [] }));
				}
			});
		}
	}, [servicesCatalog]);

	return null;
};
