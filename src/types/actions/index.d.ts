/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { SyntheticEvent } from 'react';

import { CreateModalFn } from '@zextras/carbonio-design-system';
import { Grant } from '@zextras/carbonio-shell-ui';

import type { Folder } from '../../carbonio-ui-commons/types/folder';
import { ItemType } from '../../carbonio-ui-commons/types/tags';
import type { TagActionItemType } from '../tags';

export type ActionProps = {
	folder: Folder;
	grant: Grant;
	setActiveModal: (arg: string) => void;
	onMouseLeave: () => void;
	onMouseEnter: () => void;
};

export interface UIActionExecutionParams<CompleteResult = never> {
	/**
	 * @deprecated remove it as soon as all the actions are provided by hooks
	 */
	uiUtilities?: {
		createModal: CreateModalFn;
	};
	callbacks?: {
		onComplete?: (result: CompleteResult) => void;
		onError?: (error: string) => void;
		onCancel?: () => void;
	};
}

export type UIAction<
	ExecutionParams extends UIActionExecutionParams = never,
	CanExecuteParams = never
> = {
	id: string;
	icon: string;
	label: string;
	execute?: (params: ExecutionParams) => void;
	canExecute?: (params: CanExecuteParams) => boolean;
};

export type MessageActionReturnType = UIAction<never> & {
	onClick: (ev?: KeyboardEvent | SyntheticEvent<HTMLElement, Event>) => void;
	items?: ItemType[];
	customComponent?: React.ReactElement;
};

export type ConvActionReturnType = UIAction<never> & {
	disabled?: boolean;
	onClick: (ev?: KeyboardEvent | SyntheticEvent<HTMLElement, Event>) => void;
	customComponent?: JSX.Element;
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
