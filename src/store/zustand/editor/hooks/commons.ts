/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getEditor } from './editors';
import { MailsEditorV2 } from '../../../../types';
import { computeDraftSaveAllowedStatus, computeSendAllowedStatus } from '../editor-utils';
import { useEditorsStore } from '../store';

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
		.updateDraftSaveAllowedStatus(editorId, computeDraftSaveAllowedStatus(editor));

	useEditorsStore.getState().updateSendAllowedStatus(editorId, computeSendAllowedStatus(editor));
};
