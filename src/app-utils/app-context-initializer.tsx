/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useMemo, useState } from 'react';

import { setAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import moment from 'moment/moment';

export const AppContextInitializer = (): null => {
	const [count, setCount] = useState(0);
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
			count,
			setCount
		});
	}, [count, isMessageView]);

	return null;
};
