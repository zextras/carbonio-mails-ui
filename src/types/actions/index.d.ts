/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { SyntheticEvent } from 'react';

import { CreateModalFn } from '@zextras/carbonio-design-system';
import { DefaultTheme } from 'styled-components';

import type { Folder } from '../../carbonio-ui-commons/types/folder';
import { ItemType } from '../../carbonio-ui-commons/types/tags';
import type { TagActionItemType } from '../tags';

export type ActionFn = {
	execute: () => void;
	canExecute: () => boolean;
};

export type UIActionDescriptor = ActionFn & {
	id: string;
	label: string;
	icon: keyof DefaultTheme['icons'];
};

export type ActionProps = {
	folder: Folder;
	// FIXME: IRIS-4953 Import the right type
	grant: Grant;
	setActiveModal: (arg: string) => void;
	onMouseLeave: () => void;
	onMouseEnter: () => void;
};

export type UIActionExecutionParams<CompleteResult> = {
	uiUtilities: {
		createModal: CreateModalFn;
	};
	callbacks?: {
		onComplete?: (result: CompleteResult) => void;
		onError?: (error: string) => void;
		onCancel?: () => void;
	};
};

export type UIAction<ExecutionParams extends UIActionExecutionParams> = {
	id: string;
	icon: string;
	label: string;
	openModal?: (params: ExecutionParams) => void;
};

export type MessageActionReturnType = UIAction<never> & {
	onClick: (ev?: KeyboardEvent | SyntheticEvent<HTMLElement, Event>) => void | Promise<void>;
	items?: ItemType[];
	customComponent?: React.ReactElement;
};

export type ConvActionReturnType = UIAction<never> & {
	disabled?: boolean;
	onClick: (ev?: KeyboardEvent | SyntheticEvent<HTMLElement, Event>) => void;
	customComponent?: React.JSX.Element;
	items?: ItemType[];
};

export type ActionReturnType =
	| false
	| MessageActionReturnType
	| ConvActionReturnType
	| TagActionItemType;

/*
 * The "any" is inherited from the return type of the useMessageActions hook.
 * We define an alias, and then we will refactor the MessageAction type
 */
export type MessageAction = any;
