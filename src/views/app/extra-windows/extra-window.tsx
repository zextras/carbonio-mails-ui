/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ThemeProvider } from '@zextras/carbonio-design-system';
import { PreviewManager } from '@zextras/carbonio-ui-preview';
import { omit } from 'lodash';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { DefaultTheme } from 'styled-components';
import { ExtraWindowProps } from '../../../types';
import NewWindow from './new-window';

/**
 * Renders the given children inside a new window/tab
 * @param props
 */
const ExtraWindow: FC<ExtraWindowProps> = (props) => {
	const [windowObj, setWindowObj] = useState<Window | null>(null);

	/*
	 * Creates the new window's props in order to:
	 * - fix the window.open features (workaround for a react-new-window bug)
	 * - extract the children from the original props
	 * - force the copyStyles property (another react-new-window bug?)
	 * - replace the callback function to intercept and handle lifecycle events
	 */
	const newWindowProps = useMemo(
		() => ({
			// Workaround for default properties
			features: {},

			// Extract children
			...omit(props, ['children']),

			// Workaround for default properties
			copyStyles: true,

			// Intercept the opening event and update the state with the window object
			onOpen: (newWindowObj: Window): void => {
				newWindowObj.focus();
				setWindowObj(newWindowObj);
				props.onOpen && props.onOpen(newWindowObj);
			},

			// Intercept the blocked opening and inform the user
			onBlock: (): void => {
				props.onBlock && props.onBlock();
			},

			/*
			 * Intercept the closing event
			 * Since this event is based on the beforeUnload DOM event
			 * it is not reliable
			 */
			onUnload: (): void => {
				props.onUnload && props.onUnload();
			}
		}),
		[props]
	);

	/**
	 * Generate a theme extensione to update the windowObj property
	 * with the new opened window object.
	 * This will impact the <code>Portal</code> component of
	 * Carbonio Design System and all its dependant components
	 * @param theme
	 */
	const themeExtension = useCallback(
		(theme: DefaultTheme): DefaultTheme => ({
			...theme,
			windowObj: windowObj || theme.windowObj
		}),
		[windowObj]
	);

	/*
	 * Sometimes the status of the window is not synced, so we need
	 * to check its real status.
	 * The onUnload callback, which should be used to disable the component and
	 * for cleanup operation, could be invoked asynchronously after the window
	 * is already closed
	 */
	const windowIsClosed = useMemo<boolean>(() => windowObj?.closed === true, [windowObj]);

	return !windowIsClosed ? (
		<NewWindow {...newWindowProps}>
			<ThemeProvider extension={themeExtension}>
				<PreviewManager>{props.children}</PreviewManager>
			</ThemeProvider>
		</NewWindow>
	) : null;
};

export { ExtraWindow };
