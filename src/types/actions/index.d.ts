/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { CreateModalFn } from '@zextras/carbonio-design-system';

import type { Folder } from '../../carbonio-ui-commons/types/folder';
import type { TagActionItemType } from '../tags';

export type ActionProps = {
	folder: Folder;
	grant: Grant;
	setActiveModal: (arg: string) => void;
	onMouseLeave: () => void;
	onMouseEnter: () => void;
};

export type UIActionExecutionParams = {
	uiUtilities: {
		createModal: CreateModalFn;
	};
};

export type UIAction<ExecutionParams extends UIActionExecutionParams> = {
	id: string;
	icon: string;
	label: string;
	execute?: (params: ExecutionParams) => void;
};

export type MessageActionReturnType = UIAction & {
	onClick: (ev: KeyboardEvent | SyntheticEvent<HTMLElement, Event>) => void;
	items?: ItemType[];
	customComponent?: React.ReactElement;
};

export type ConvActionReturnType = UIAction & {
	disabled?: boolean;
	onClick: (ev: KeyboardEvent | SyntheticEvent<HTMLElement, Event>) => void;
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
