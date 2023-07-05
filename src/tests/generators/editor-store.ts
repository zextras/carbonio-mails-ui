/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEditorsStore } from '../../store/zustand/editor/store';
import { MailsEditorV2 } from '../../types';

export function setupEditorStore({ editors }: { editors?: Array<MailsEditorV2> }): void {
	if (editors && editors?.length > 0) {
		editors.forEach((editor, index) => {
			useEditorsStore.getState().addEditor(index.toString(), editor);
		});
	}
}
