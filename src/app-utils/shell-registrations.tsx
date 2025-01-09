/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, PropsWithChildren, useEffect } from 'react';

import { addComponentsToShell } from './add-shell-components';
import { registerShellActions } from './register-shell-actions';
import { registerShellIntegrations } from './register-shell-integrations';

export const ShellRegistrations: FC<PropsWithChildren> = ({ children }) => {
	useEffect(() => {
		addComponentsToShell();
		registerShellIntegrations();
		registerShellActions();
	}, []);

	return <>{children}</>;
};
