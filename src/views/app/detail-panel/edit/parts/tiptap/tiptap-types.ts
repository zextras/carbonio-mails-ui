/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Editor } from '@tiptap/core';

export type TipTapEditorValue = {
	plainText: string;
	richText: string;
};

export type TipTapAccountSettingsPrefs = {
	locale: string;
	font: string;
	fontSize: string;
	color: string;
};

export type TipTapEditorProps = {
	value: TipTapEditorValue;
	onChange: (value: TipTapEditorValue) => void;
	onFileSelect: (files: Array<File>) => void;
	onPaste?: (event: ClipboardEvent) => boolean | void;
	onDragOver?: (event: DragEvent) => void;
	accountSettingsPrefs: TipTapAccountSettingsPrefs;
	disabled?: boolean;
	editorRef?: React.Ref<Editor | null>;
};
