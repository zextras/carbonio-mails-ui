/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import type { MailsEditor } from '../../../../../types';

type UseGetAttachItemsPropType = {
	onFileClick: ((ev: React.SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void) | undefined;
	setOpenDD: (arg: boolean) => void;
	editorId: string;
	updateEditorCb: (arg: Partial<MailsEditor>) => void;
	saveDraftCb: (arg: Partial<MailsEditor>) => void;
	setValue: (arg1: string, arg2: string) => void;
	changeEditorText: (text: [string, string]) => void;
};
type UseGetAttachItemsReturnType = {
	customComponent?: ReactElement;
	label: string;
	id?: string | undefined;
	icon?: string | undefined;
	onClick?: ((ev: React.SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void) | undefined;
	type?: string | undefined;
	primary?: boolean | undefined;
	group?: string | undefined;
	disabled?: boolean | undefined;
};
