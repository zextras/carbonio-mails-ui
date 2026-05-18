/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { CloseModalFn, CreateModalFn, Theme } from '@zextras/carbonio-design-system';
import type { Folder, Grant } from '@zextras/carbonio-ui-commons';

export type SelectFoldersUIActionExecutionConfig = {
	showSharedAccounts: boolean;
	showThrashFolder: boolean;
	showSpamFolder: boolean;
	allowRootSelection: boolean;
	allowFolderCreation: boolean;
	title: string;
	hintText: string;
	confirmActionLabel: string;
	confirmActionTooltip: string;
	disabledConfirmActionTooltip: string;
	selectedFolder?: Folder;
};

export type ActionFn = {
	execute: () => void;
	canExecute: () => boolean;
};

export type ActionDescriptor = {
	id: string;
	label: string;
	icon: keyof Theme['icons'];
	color?: number;
};

export type UIActionDescriptor = ActionFn & ActionDescriptor;

export type UIActionAggregator = ActionDescriptor & {
	items: UIActionDescriptor[];
};

export type ActionProps = {
	folder: Folder;
	grant: Grant;
	onEdit: (grant: Grant) => void;
	onRevoke: (grant: Grant) => void;
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

export type UIAction<ExecutionParams> = UIActionExecutionParams<ExecutionParams> & {
	id: string;
	icon: string;
	label: string;
	openModal?: (params: ExecutionParams) => void;
};

export type GetAttachmentsDownloadLinkProps = {
	messageId: string;
	messageSubject: string;
	attachments: Array<string | undefined>;
};

/*
 * The "any" is inherited from the return type of the useMessageActions hook.
 * We define an alias, and then we will refactor the MessageAction type
 */
export type MessageAction = any;

export type Test<Folder> = {
	id: string;
	icon: string;
	label: string;
	openModal?: (params: Folder) => void;
	config?: Partial<SelectFoldersUIActionExecutionConfig>;
	uiUtilities?: {
		closeModal: CloseModalFn;
		createModal: CreateModalFn;
	};
	callbacks?: {
		onComplete: (folder: Folder) => void;
		onCancel?: () => void;
		onError?: () => void;
	};
};
