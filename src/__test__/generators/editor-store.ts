/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEditorsStore } from 'store/editor/store';
import { MailsEditorV2 } from 'types/editor';

export function setupEditorStore({ editors }: { editors?: Array<MailsEditorV2> }): void {
	if (editors) {
		editors.forEach((editor) => {
			useEditorsStore.getState().addEditor(editor.id, editor);
		});
	}
}
