/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Text, ThemeProvider, useModal } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { PreviewManager } from '@zextras/carbonio-ui-preview';
import { omit } from 'lodash';
import React, { FC, memo, ReactNode, useCallback, useMemo, useState } from 'react';
import { DefaultTheme } from 'styled-components';
import { v4 as uuid } from 'uuid';
import NewWindow from './new-window';

type EventHandler = () => void;
type OpenEventHandler = (window: Window) => void;

type ExtraWindowFeatures = {
	popup?: boolean;
	width?: number;
	height?: number;
	left?: number;
	top?: number;
	noopener?: boolean;
	noreferrer?: boolean;
};

type ExtraWindowsCreationResult = {
	id: string;
	windowProps?: ExtraWindowProps;
	window?: Window;
	component?: React.ReactElement;
};

type ExtraWindowCreationParams = {
	/**
	 * Children to render in the new window.
	 */
	children?: React.ReactNode;

	/**
	 * If set to true, the extra window component will be returned
	 * instead of being rendered in a generic container
	 */
	returnComponent: boolean;

	/**
	 * The URL to open, if specified any children will be overridden.
	 */
	url?: string;

	/**
	 * The name of the window.
	 */
	name?: string;

	/**
	 * The title of the new window document.
	 */
	title?: string;

	/**
	 * The set of window features.
	 */
	features?: ExtraWindowFeatures;

	/**
	 * A function to be triggered before the new window unload.
	 */
	onBlock?: EventHandler | null;

	/**
	 * A function to be triggered when the new window could not be opened.
	 */
	onUnload?: EventHandler | null;

	/**
	 * A function to be triggered when the new window opened.
	 */
	onOpen?: OpenEventHandler | null;

	/**
	 * Indicate how to center the new window.
	 */
	center?: 'parent' | 'screen';

	/**
	 * If specified, copy styles from parent window's document.
	 */
	copyStyles?: boolean;

	/**
	 * If specified, close the window when the component is unmounted
	 */
	closeOnUnmount: boolean;
};

type ExtraWindowProps = ExtraWindowCreationParams & { id: string };

type ExtraWindowsContextType = {
	createWindow?: (props: ExtraWindowCreationParams) => ExtraWindowsCreationResult;
	closeWindow?: (windowId: string) => void;
	listWindows?: () => Array<ExtraWindowsCreationResult>;
	getWindow?: (criteria: {
		windowId?: string;
		windowName?: string;
	}) => ExtraWindowsCreationResult | undefined;
	getFocusedWindow?: ExtraWindowsCreationResult | undefined;
};

/**
 * Context for providing extra windows' related functions
 */
const ExtraWindowsContext = React.createContext<ExtraWindowsContextType>({});

const ExtraWindowManagerChildren: FC = ({ children }) => children;

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

const MemoizedExtraWindow = memo(ExtraWindow);

/**
 * A wrapper for the ExtraWindow context provider
 *
 * @param children
 */
const ExtraWindowsManager: FC = ({ children }) => {
	const [windowsData, setWindowsData] = useState<Array<ExtraWindowsCreationResult>>([]);
	const createModal = useModal();

	console.log('************* ExtraWindowsManager renders and the windows data is', windowsData);

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
					console.log('**** removeWindow:before', { windowId, id: data.id, updatedData });
					updatedData.splice(index, 1);
					console.log('**** removeWindow:after', { updatedData });
				}
			});

			return updatedData;
		});
	}, []);

	/**
	 * Lists the information about all the opened extra windows
	 */
	const listWindows = useCallback((): Array<ExtraWindowsCreationResult> => {
		console.log('************** listWindows', windowsData);
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
			console.log('***** check existing window', existingWindow);
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

			console.log('************* createWindow', windowId);

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
				console.log('************* onOpen', { windowId, windowObj, openedWindow });
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
				 */
				console.log(
					'**** hey, I should show a modal in the window with the title',
					focusedExtraWindow?.window?.document?.title
				);
				const closeModal = createModal({
					title: 'Zio ken!',
					// container: focusedExtraWindow?.window?.document.body,
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
						<Text overflow="break-word" style={{ paddingTop: '1rem' }}>
							Zio billy, sblocca i popup!
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
				console.log('************* onUnload', windowId);
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
		[addWindow, getWindow, removeWindow, updateWindow]
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

	/**
	 * Internal component for wrapping the list of the extra window components
	 * @param windows
	 * @constructor
	 */
	const ExtraWindowsContainer: FC<{ windows: Array<ExtraWindowsCreationResult> }> = ({
		windows
	}) => (
		<>
			{Object.values(windows).map((window) =>
				window && !window.windowProps?.returnComponent ? (
					<ExtraWindow key={window.id} {...window.windowProps} />
				) : null
			)}
		</>
	);

	const MemoizedChildren = memo(function RenderChildren(): ReactNode {
		return children;
	});

	return (
		<ExtraWindowsContext.Provider
			value={{ createWindow, closeWindow, listWindows, getWindow, getFocusedWindow }}
		>
			{Object.values(windowsData).map((window) =>
				window && !window.windowProps?.returnComponent ? (
					<ExtraWindow key={window.id} {...window.windowProps} />
				) : null
			)}
			{/* <ExtraWindowsContainer windows={windowsData} /> */}
			{/* {memoizedChildren} */}
			<MemoizedChildren></MemoizedChildren>
		</ExtraWindowsContext.Provider>
	);
};

/**
 * Return the context of the closest ExtraWindowManager or <code>undefined</code>
 * if no ancestor ExtraWindowManager exists
 */
const useExtraWindowsManager = (): ExtraWindowsContextType =>
	React.useContext<ExtraWindowsContextType>(ExtraWindowsContext);

export {
	useExtraWindowsManager,
	ExtraWindowCreationParams,
	ExtraWindowsCreationResult,
	ExtraWindowsManager,
	ExtraWindowsContextType
};
