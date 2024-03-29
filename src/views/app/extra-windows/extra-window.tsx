/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ModalManager, ThemeProvider } from '@zextras/carbonio-design-system';
import { PreviewManager } from '@zextras/carbonio-ui-preview';
import { omit } from 'lodash';
import React, { createContext, FC, useCallback, useMemo, useRef, useState } from 'react';
import { DefaultTheme } from 'styled-components';
import type { ExtraWindowContextType, ExtraWindowProps } from '../../../types';
import NewWindow, { replaceStyles } from './new-window';

// Enable debug console output
const DEBUG = false;

/**
 * Debug output
 * @param text console message
 * @param args console message arguments
 */
const debug = (text: string, ...args: unknown[]): void => {
	// eslint-disable-next-line no-console
	if (DEBUG) console.debug(`**** extra-window **** ${text}`, args);
};

/**
 * Create a MutationObserver that monitors changes or additions of elements
 * with the class attribute inside the child window DOM tree.
 * When such a change occurs a fresh copy of the styles will be taken from the
 * parent window, and it will completely replace the styles in the child window.
 * This trick will ensure that also newly added components will have their
 * related style which didn't exist at the time of the child window opening
 *
 * Note: observing changes for "style" tags inside the parent window document head
 * is not possible since styled-component applies changes using CSSOM, so those
 * changes are not intercepted by MutationObserver.
 *
 * @param parentWindowDoc
 * @param newWindowObj
 */
const createStyledElementsObserver = (
	parentWindowDoc: Document,
	newWindowObj: Window
): MutationObserver => {
	debug('creation of STYLED ELEMENTS observer for', parentWindowDoc);
	const observer = new MutationObserver((mutationList) => {
		debug('STYLED ELEMENTS mutation detected!', mutationList);
		setTimeout(replaceStyles(parentWindowDoc, newWindowObj.document), 10);
	});
	observer.observe(newWindowObj.document.body, {
		subtree: true,
		childList: true,
		attributes: true,
		attributeFilter: ['class']
	});
	return observer;
};

/**
 * The context data of an extra window
 */
const ExtraWindowContext = createContext<ExtraWindowContextType | undefined>(undefined);

/**
 * Renders the given children inside a new window/tab
 * @param props
 */
const ExtraWindow: FC<ExtraWindowProps> = (props) => {
	const [windowObj, setWindowObj] = useState<Window | null>(null);

	const styledElementsObserverRef = useRef<MutationObserver | null>(null);

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
				styledElementsObserverRef.current = createStyledElementsObserver(
					window.document,
					newWindowObj
				);
				props.onOpen && props.onOpen(newWindowObj);
			},

			// Intercept the blocked opening and inform the user
			onBlock: (): void => {
				props.onBlock && props.onBlock();
			},

			/*
			 * Intercept the closing event
			 * Since this event is based on the beforeUnload DOM event
			 * it is not 100% reliable
			 */
			onUnload: (): void => {
				styledElementsObserverRef.current?.disconnect();
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
			<ExtraWindowContext.Provider value={{ windowId: props.id }}>
				{windowObj && (
					<ThemeProvider extension={themeExtension}>
						<PreviewManager>
							<ModalManager>{props.children}</ModalManager>
						</PreviewManager>
					</ThemeProvider>
				)}
			</ExtraWindowContext.Provider>
		</NewWindow>
	) : null;
};

export { ExtraWindowContext, ExtraWindow };
