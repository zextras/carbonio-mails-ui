/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Text, useModal } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import React, { FC, useCallback, useState } from 'react';
import { v4 as uuid } from 'uuid';
import {
	ExtraWindowCreationParams,
	ExtraWindowsContextType,
	ExtraWindowsCreationResult
} from '../../../types';
import { ExtraWindow } from './extra-window';

// Enable debug console output
const DEBUG = false;

/**
 * Context for providing extra windows' related functions
 */
const ExtraWindowsContext = React.createContext<ExtraWindowsContextType>({});

/**
 * Debug output
 * @param text console message
 * @param args console message arguments
 */
const debug = (text: string, ...args: unknown[]): void => {
	// eslint-disable-next-line no-console
	if (DEBUG) console.debug(`************* ${text}`, args);
};

/**
 * A wrapper for the ExtraWindow context provider
 *
 * @param children
 */
const ExtraWindowsManager: FC = ({ children }) => {
	const [windowsData, setWindowsData] = useState<Array<ExtraWindowsCreationResult>>([]);
	const createModal = useModal();

	debug('ExtraWindowsManager renders and the windows data is', windowsData);

	/**
	 *
	 * @param criteria
	 */
	const getWindow: ExtraWindowsContextType['getWindow'] = useCallback(
		({ windowId, windowName }) => {
			if (windowId) {
				return windowsData.find((windowData) => windowData.id === windowId);
			}

			if (windowName) {
				return windowsData.find((windowData) => windowData?.windowProps?.name === windowName);
			}

			return undefined;
		},
		[windowsData]
	);

	/**
	 * Adds a new window to the state
	 * @param addedWindowData
	 */
	const addWindow = useCallback((addedWindowData: ExtraWindowsCreationResult): void => {
		setWindowsData((currentData) => {
			currentData.push(addedWindowData);
			return [...currentData];
		});
	}, []);

	/**
	 * Replaces in the state the window data identified by the same id
	 * @param updatedWindowData
	 */
	const updateWindow = useCallback((updatedWindowData: ExtraWindowsCreationResult): void => {
		setWindowsData((currentData) => {
			const updatedData = [...currentData];
			currentData.forEach((data, index) => {
				if (data.id === updatedWindowData.id) {
					updatedData[index] = updatedWindowData;
				}
			});
			return updatedData;
		});
	}, []);

	/**
	 * Removes from the state a window data
	 * @param windowId
	 */
	const removeWindow = useCallback((windowId: string): void => {
		setWindowsData((currentData) => {
			const updatedData = [...currentData];
			updatedData.forEach((data, index) => {
				if (data.id === windowId) {
					debug('removeWindow:before', { windowId, id: data.id, updatedData });
					updatedData.splice(index, 1);
					debug('removeWindow:after', { updatedData });
				}
			});

			return updatedData;
		});
	}, []);

	/**
	 * Lists the information about all the opened extra windows
	 */
	const listWindows = useCallback((): Array<ExtraWindowsCreationResult> => {
		debug('listWindows', windowsData);
		return windowsData.map((data) => ({
			...data
		}));
	}, [windowsData]);

	/**
	 * Returns information about the extra window currently focused. If no extra
	 * window is present or focused <code>undefined</code> is returned
	 */
	const getFocusedWindow = useCallback(
		(): ExtraWindowsCreationResult | undefined =>
			windowsData.reduce<ExtraWindowsCreationResult | undefined>((result, data) => {
				if (data.window?.document && data.window.document.hasFocus()) {
					return data;
				}
				return result;
			}, undefined),
		[windowsData]
	);

	/**
	 * Creation of an extra window
	 * @param props
	 */
	const createWindow = useCallback(
		(params: ExtraWindowCreationParams): ExtraWindowsCreationResult => {
			// Check if a window with the same name already exists
			const existingWindow = getWindow({ windowName: params.name });
			debug('check existing window', existingWindow);
			if (existingWindow && existingWindow.window) {
				// Get the current focused extra window
				const currentWindow = getFocusedWindow();

				// Blur the current extra window and focus the selected one
				currentWindow && currentWindow.window?.blur();
				existingWindow.window.focus();

				return existingWindow;
			}

			// Generates a unique id
			const windowId = uuid();

			debug('createWindow', windowId);

			// Creates a new data block
			const windowData: ExtraWindowsCreationResult = {
				id: windowId
			};

			/*
			 * Defines a callback to be notified when the new window will
			 * open successfully. When invoked it will update the data block
			 * with the window reference.
			 *
			 * Also, if defined in the params by the caller,
			 * the caller's callback will be invoked
			 */
			const onOpen = (windowObj: Window): void => {
				const openedWindow = getWindow({ windowId });
				debug('onOpen', { windowId, windowObj, openedWindow });
				if (openedWindow) {
					const updatedData = { ...openedWindow };
					updatedData.window = windowObj;
					updateWindow(updatedData);
				}
				params.onOpen && params.onOpen(windowObj);
			};

			/*
			 * Defines a callback to be notified if the opening of the new
			 * window is blocked by the browser's policies
			 * When invoked it will update windows data structure removing
			 * the window's data block
			 *
			 * Also, if defined in the params by the caller,
			 * the caller's callback will be invoked
			 */
			const onBlock = (): void => {
				params.onBlock && params.onBlock();
				removeWindow(windowId);

				// Get the focused extra window
				const focusedExtraWindow = getFocusedWindow();

				/*
				 * Create the modal message to notify the user.
				 * If a focused extra window is present, the container
				 * of the modal will be set to the window's document body
				 *
				 * FIXME texts
				 */
				const closeModal = createModal({
					title: t('label.extra_windows.opening_blocked.title', 'Cannot open new window'),
					containerWindow: focusedExtraWindow?.window,
					confirmLabel: t('action.ok', 'Ok'),
					showCloseIcon: false,
					onConfirm: () => {
						closeModal();
					},
					onClose: () => {
						closeModal();
					},
					onSecondaryAction: () => {
						closeModal();
					},
					children: (
						<Text overflow="break-word">
							{t(
								'messages.extra_windows.opening_blocked',
								'To complete the operation, Carbonio needs to open a new window. Check your browser settings'
							)}
						</Text>
					)
				});
			};

			/*
			 * Defines a callback to be notified when the window will be closed.
			 * When invoked it will update windows data structure removing
			 * the window's data block.
			 *
			 * Also, if defined in the params by the caller,
			 * the caller's callback will be invoked
			 */
			const onUnload = (): void => {
				debug('onUnload', windowId);
				params.onUnload && params.onUnload();
				removeWindow(windowId);
			};

			// Creates the props for the new ExtraWindow
			const windowProps = {
				id: windowId,
				...params,
				onOpen,
				onBlock,
				onUnload
			};
			windowData.windowProps = windowProps;

			// Creates the component and adds it to the data block
			if (params.returnComponent) {
				windowData.component = <ExtraWindow key={windowId} {...windowProps} />;
			}

			addWindow(windowData);
			return windowData;
		},
		[addWindow, createModal, getFocusedWindow, getWindow, removeWindow, updateWindow]
	);

	/**
	 * Closes the window identified by the given id.
	 * The function invoke the window close method, which in turn will
	 * invoke the onUnload callback
	 *
	 * @param windowId
	 */
	const closeWindow = useCallback(
		(windowId: string): void => {
			const closingWindowData = getWindow({ windowId });
			if (!closingWindowData) {
				return;
			}

			closingWindowData.window?.close();
			removeWindow(windowId);
		},
		[getWindow, removeWindow]
	);

	return (
		<ExtraWindowsContext.Provider
			value={{ createWindow, closeWindow, listWindows, getWindow, getFocusedWindow }}
		>
			{Object.values(windowsData).map((window) =>
				window && window.windowProps ? (
					<ExtraWindow key={window.id} {...window.windowProps} />
				) : null
			)}
			{children}
		</ExtraWindowsContext.Provider>
	);
};

/**
 * Return the context of the closest ExtraWindowManager or <code>undefined</code>
 * if no ancestor ExtraWindowManager exists
 */
const useExtraWindowsManager = (): ExtraWindowsContextType =>
	React.useContext<ExtraWindowsContextType>(ExtraWindowsContext);

export { useExtraWindowsManager, ExtraWindowsManager };
