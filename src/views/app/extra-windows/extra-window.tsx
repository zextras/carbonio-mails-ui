/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ThemeProvider, useModal } from '@zextras/carbonio-design-system';
import { PreviewManager } from '@zextras/carbonio-ui-preview';
import { omit } from 'lodash';
import React, { FC, memo, ReactNode, useMemo, useState } from 'react';
import NewWindow from 'react-new-window';
import { DefaultTheme } from 'styled-components';
import { v4 as uuid } from 'uuid';

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

/**
 * Renders the given children inside a new window/tab
 * @param props
 */
const ExtraWindow: FC<ExtraWindowProps> = (props) => {
	const [windowObj, setWindowObj] = useState<Window | null>(null);
	const newWindowProps = useMemo(
		() => ({
			features: {}, // Workaround to set the correct default
			...omit(props, ['children']),
			copyStyles: true,
			onOpen: (newWindowObj: Window): void => {
				newWindowObj.focus();
				setWindowObj(newWindowObj);
				props.onOpen && props.onOpen(newWindowObj);
			},
			onBlock: (): void => {
				console.log('******* ExtraWindow onBlock');
				props.onBlock && props.onBlock();
			},
			onUnload: (): void => {
				props.onUnload && props.onUnload();
			}
		}),
		[props]
	);

	const themeExtension = (theme: DefaultTheme): DefaultTheme => ({
		...theme,
		windowObj: windowObj || theme.windowObj
	});

	return (
		<NewWindow {...newWindowProps}>
			<ThemeProvider extension={themeExtension}>
				<PreviewManager>{props.children}</PreviewManager>
			</ThemeProvider>
		</NewWindow>
	);
};

const MemoizedExtraWindow = memo(ExtraWindow);

type ExtraWindowsContextType = {
	createWindow?: (props: ExtraWindowCreationParams) => ExtraWindowsCreationResult;
	closeWindow?: (windowId: string) => void;
	listWindows?: () => Array<ExtraWindowsCreationResult>;
	getWindow?: (criteria: {
		windowId?: string;
		windowName?: string;
	}) => ExtraWindowsCreationResult | undefined;
};

/**
 * Context for providing extra windows' related functions
 */
const ExtraWindowsContext = React.createContext<ExtraWindowsContextType>({});

const ExtraWindowManagerChildren: FC = ({ children }) => children;

/**
 * A wrapper for the ExtraWindow context provider
 *
 * @param children
 */
const ExtraWindowsManager: FC = ({ children }) => {
	const [windowsData, setWindowsData] = useState<Array<ExtraWindowsCreationResult>>([]);

	console.log('************* ExtraWindowsManager renders and the windows data is', windowsData);

	/**
	 *
	 * @param criteria
	 */
	const getWindow: ExtraWindowsContextType['getWindow'] = ({ windowId, windowName }) => {
		if (windowId) {
			return windowsData.find((windowData) => windowData.id === windowId);
		}

		if (windowName) {
			return windowsData.find((windowData) => windowData?.windowProps?.name === windowName);
		}

		return undefined;
	};

	/**
	 * Adds a new window to the state
	 * @param addedWindowData
	 */
	const addWindow = (addedWindowData: ExtraWindowsCreationResult): void => {
		windowsData.push(addedWindowData);
		setWindowsData([...windowsData]);
	};

	/**
	 * Replaces in the state the window data identified by the same id
	 * @param updatedWindowData
	 */
	const updateWindow = (updatedWindowData: ExtraWindowsCreationResult): void => {
		windowsData.forEach((data, index) => {
			if (data.id === updatedWindowData.id) {
				windowsData[index] = updatedWindowData;
			}
		});
		setWindowsData([...windowsData]);
	};

	/**
	 * Removes from the state a window data
	 * @param windowId
	 */
	const removeWindow = (windowId: string): void => {
		windowsData.forEach((data, index) => {
			if (data.id === windowId) {
				windowsData.splice(index, 1);
				setWindowsData([...windowsData]);
			}
		});
	};

	/**
	 * TODO useCallback
	 * Creation of an extra window
	 * @param props
	 */
	const createWindow = (params: ExtraWindowCreationParams): ExtraWindowsCreationResult => {
		// Check if a window with the same name already exists
		const existingWindow = getWindow({ windowName: params.name });
		console.log('***** check existing window', existingWindow);
		if (existingWindow && existingWindow.window) {
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
	};

	/**
	 * Closes the window identified by the given id.
	 * The function invoke the window close method, which in turn will
	 * invoke the onUnload callback
	 *
	 * @param windowId
	 */
	const closeWindow = (windowId: string): void => {
		const closingWindowData = getWindow({ windowId });
		if (!closingWindowData) {
			return;
		}

		closingWindowData.window?.close();
		removeWindow(windowId);
	};

	/**
	 * Lists the information about all the opened extra windows
	 */
	const listWindows = (): Array<ExtraWindowsCreationResult> => {
		console.log('************** listWindows', windowsData);
		return Object.values(windowsData);
	};

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
		<ExtraWindowsContext.Provider value={{ createWindow, closeWindow, listWindows, getWindow }}>
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
