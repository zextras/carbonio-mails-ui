/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MailsEditorV2 } from '../../../../types';
import { useEditorsStore } from '../store';

/**
 * Returns the editor with given ID or null if not found.
 * @params id
 */
export const useEditor = ({ id }: { id: MailsEditorV2['id'] }): MailsEditorV2 | null =>
	useEditorsStore((s) => s.editors?.[id] ?? null);

export const getEditor = ({ id }: { id: MailsEditorV2['id'] }): MailsEditorV2 | null =>
	useEditorsStore.getState()?.editors?.[id] ?? null;

/**
 * @param id
 * @param editor
 */
export const addEditor = ({
	id,
	editor
}: {
	id: MailsEditorV2['id'];
	editor: MailsEditorV2;
}): void => {
	useEditorsStore.getState().addEditor(id, editor);
	// useEditorsStore.subscribe(
	// 	(state) => [state.editors[id].from, state.editors[id].subject],
	// 	(s): void => console.log('*** ho cambiato qualcosa a cui sono sottoscritto')
	// );
};

/**
 * Remove a specific editor.
 * @params id
 */
export const deleteEditor = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore.getState().deleteEditor(id);

/**
 * Update an editor
 * @param id
 * @param editor
 */
export const updateEditor = ({
	id,
	editor
}: {
	id: string;
	editor: Partial<MailsEditorV2>;
}): void => useEditorsStore.getState().updateEditor(id, editor);
