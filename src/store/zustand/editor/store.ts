/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import produce from 'immer';
import { create } from 'zustand';
import { MailsEditor, NewEditorsStateType } from '../../../types';

// extra currying as suggested in https://github.com/pmndrs/zustand/blob/main/docs/guides/typescript.md#basic-usage
export const useEditorsStore = create<NewEditorsStateType>()((set) => ({
	editors: {},
	updateEditor: (id: string, opt: Partial<MailsEditor>): void => {
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
	}
}));
