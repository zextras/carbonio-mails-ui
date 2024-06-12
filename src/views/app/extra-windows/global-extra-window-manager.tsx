/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect } from 'react';

import { ExtraWindowsManager, useExtraWindowsManager } from './extra-window-manager';
import { ExtraWindowsContextType, ExtraWindowsCreationResult } from '../../../types';

const globalContext: ExtraWindowsContextType = {
	createWindow: (): ExtraWindowsCreationResult => {
		throw new Error('global extra window manager not initialized');
	},
	closeWindow: () => {
		throw new Error('global extra window manager not initialized');
	},
	getWindow: () => {
		throw new Error('global extra window manager not initialized');
	},
	getFocusedWindow: () => {
		throw new Error('global extra window manager not initialized');
	}
};

const GlobalExtraWindowManagerProvider = (): null => {
	const context = useExtraWindowsManager();
	useEffect(() => {
		globalContext.createWindow = context.createWindow;
		globalContext.closeWindow = context.closeWindow;
		globalContext.listWindows = context.listWindows;
		globalContext.getWindow = context.getWindow;
		globalContext.getFocusedWindow = context.getFocusedWindow;
	}, [context]);
	return null;
};

export const GlobalExtraWindowManager = ({
	children
}: React.PropsWithChildren<Record<string, unknown>>): React.JSX.Element => (
	<ExtraWindowsManager>
		<GlobalExtraWindowManagerProvider />
		{children}
	</ExtraWindowsManager>
);

export const useGlobalExtraWindowManager = (): ExtraWindowsContextType => {
	if (!globalContext) {
		throw new Error('global extra window manager not initialized');
	}
	return globalContext;
};
