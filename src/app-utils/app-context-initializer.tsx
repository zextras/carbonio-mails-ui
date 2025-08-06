/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect, useMemo, useState } from 'react';

import { setAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import moment from 'moment/moment';

import { ServicesCatalog } from 'api/request-service-catalog-api';

export type AppContext = {
	isMessageView: boolean;
	multipleSelectionCount: number;
	setMultipleSelectionCount: (arg: number | ((prevState: number) => number)) => void;
	servicesCatalog: ServicesCatalog;
};

export const AppContextInitializer = (): null => {
	const [multipleSelectionCount, setMultipleSelectionCount] = useState(0);
	const { zimbraPrefGroupMailBy, zimbraPrefLocale } = useUserSettings().prefs;

	const isMessageView = useMemo(
		() => (zimbraPrefGroupMailBy && zimbraPrefGroupMailBy === 'message') || false,
		[zimbraPrefGroupMailBy]
	);

	if (zimbraPrefLocale) {
		moment.locale(zimbraPrefLocale as string);
	}

	useEffect(() => {
		setAppContext({
			isMessageView,
			multipleSelectionCount,
			setMultipleSelectionCount
		});
	}, [multipleSelectionCount, isMessageView]);

	return null;
};
