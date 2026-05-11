/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect, useRef } from 'react';

import { useAuthenticated } from '@zextras/carbonio-shell-ui';

import { resetEditorsStore } from 'store/editor/store';
import { resetEmailsStore } from 'store/emails/store';

/**
 * Listens to the authentication state and resets all Zustand stores when the
 * user logs out. Mounted outside <AuthGuard> so it stays alive during logout
 * and can react to the isAuthenticated: true → false transition.
 */
export const StoreResetHandler = (): null => {
	const isAuthenticated = useAuthenticated();
	const wasAuthenticated = useRef(false);

	useEffect(() => {
		if (wasAuthenticated.current && !isAuthenticated) {
			resetEmailsStore();
			resetEditorsStore();
		}
		wasAuthenticated.current = isAuthenticated;
	}, [isAuthenticated]);

	return null;
};
