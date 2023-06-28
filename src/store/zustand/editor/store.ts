/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import produce from 'immer';
import { create } from 'zustand';
import { EditorsStateTypeV2, MailsEditorV2 } from '../../../types';

// extra currying as suggested in https://github.com/pmndrs/zustand/blob/main/docs/guides/typescript.md#basic-usage
export const useEditorsStore = create<EditorsStateTypeV2>()((set) => ({
	editors: {},
	updateEditor: (id: string, opt: Partial<MailsEditorV2>): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id] = {
						...state.editors[id],
						...opt
					};
				}
			})
		);
	},
	updateSubject: (id: string, subject: string): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].subject = subject;
				}
			})
		);
	},
	createEditor: (id: string, editor: MailsEditorV2): void => {
		set(
			produce((state) => {
				state.editors[id] = editor;
			})
		);
	}
}));
