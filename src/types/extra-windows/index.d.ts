/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

export type ExtraWindowFeatures = {
	popup?: boolean;
	width?: number;
	height?: number;
	left?: number;
	top?: number;
	noopener?: boolean;
	noreferrer?: boolean;
};

export type EventHandler = () => void;

export type OpenEventHandler = (window: Window) => void;

export type ExtraWindowCreationParams = {
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

export type ExtraWindowProps = ExtraWindowCreationParams & { id: string };

export type ExtraWindowContextType = {
	windowId: string | undefined;
};

export type ExtraWindowsContextType = {
	createWindow?: (props: ExtraWindowCreationParams) => ExtraWindowsCreationResult;
	closeWindow?: (windowId: string) => void;
	listWindows?: () => Array<ExtraWindowsCreationResult>;
	getWindow?: (criteria: {
		windowId?: string;
		windowName?: string;
	}) => ExtraWindowsCreationResult | undefined;
	getFocusedWindow?: () => ExtraWindowsCreationResult | undefined;
};

export type ExtraWindowsCreationResult = {
	id: string;
	windowProps?: ExtraWindowProps;
	window?: Window;
	component?: React.ReactElement;
};
