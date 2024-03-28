/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AddEditorParams, MailsEditorV2 } from '../../../../types';
import { useEditorsStore } from '../store';

export const getEditor = ({ id }: { id: MailsEditorV2['id'] }): MailsEditorV2 | null =>
	useEditorsStore.getState()?.editors?.[id] ?? null;

/**
 * @param id
 * @param editor
 */
export const addEditor = ({ id, editor }: AddEditorParams): void => {
	useEditorsStore.getState().addEditor(id, editor);
};

/**
 * Remove a specific editor.
 * @params id
 */
export const deleteEditor = ({ id }: { id: MailsEditorV2['id'] }): void =>
	useEditorsStore.getState().deleteEditor(id);
