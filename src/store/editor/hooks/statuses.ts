/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { computeDraftSaveAllowedStatus, computeSendAllowedStatus } from 'store/editor/editor-utils';
import { getEditor } from 'store/editor/hooks/editors';
import { useEditorsStore } from 'store/editor/store';
import { MailsEditorV2 } from 'types/index.d';

/**
 * Analyzes the given editor and updates in the store the allow status for the
 * draft save and the send operations
 * @param editorId
 */
export const computeAndUpdateEditorStatus = (editorId: MailsEditorV2['id']): void => {
	const editor = getEditor({ id: editorId });
	if (!editor) {
		console.warn('Cannot find the editor', editorId);
		return;
	}

	useEditorsStore
		.getState()
		.setDraftSaveAllowedStatus(editorId, computeDraftSaveAllowedStatus(editor));

	useEditorsStore.getState().setSendAllowedStatus(editorId, computeSendAllowedStatus(editor));
};

/**
 * Returns reactive reference to the isModified value and to its setter
 * @param id
 * @returns
 */
export const useEditorIsDirty = (
	id: MailsEditorV2['id']
): {
	isDirty: MailsEditorV2['isDirty'];
	setDirty: () => void;
	resetDirty: () => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].isDirty);
	const setter = useEditorsStore((state) => state.setIsDirty);

	return useMemo(
		() => ({
			isDirty: value,
			setDirty: (): void => {
				setter(id, true);
			},
			resetDirty: (): void => {
				setter(id, false);
			}
		}),
		[id, setter, value]
	);
};
