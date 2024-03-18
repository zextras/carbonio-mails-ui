/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MailsEditorV2, SmartLinkAttachment } from '../../../../types';
import { useEditorsStore } from '../store';

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
};

/**
 * Remove a specific editor.
 * @params id
 */
export const deleteEditor = ({ id }: { id: MailsEditorV2['id'] }): void => {
	const editor = getEditor({ id });
	const smartLinks: Array<SmartLinkAttachment> = JSON.parse(
		localStorage.getItem('smartlinks') ?? '[]'
	);
	localStorage.setItem(
		'smartlinks',
		JSON.stringify(smartLinks.filter((item: SmartLinkAttachment) => item.draftId !== editor?.did))
	);
	return useEditorsStore.getState().deleteEditor(id);
};
