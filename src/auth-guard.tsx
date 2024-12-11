/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactNode } from 'react';

import { useAuthenticated } from '@zextras/carbonio-shell-ui';

type AuthGuardProps = {
	children: ReactNode;
};

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
	const isAuthenticated = useAuthenticated();

	return isAuthenticated ? <>{children}</> : null;
};
