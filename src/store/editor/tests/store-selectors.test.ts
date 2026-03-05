/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { generateNewEditor } from '../../../__test__/generators/editors';
import { useEditorsStore } from '../store';
import { selectUnsavedAttachmentByUploadId } from '../store-selectors';
import { EditorsStateTypeV2 } from 'types/state';

describe('Store selectors', () => {
	const uploadId = 'upload-100';
	const editorId = '3';
	const attachment = {
		uploadId,
		contentType: '',
		filename: '',
		isInline: false,
		size: 0
	};
	const setupEditorWithUnsavedAttachment = (): EditorsStateTypeV2 => {
		const editor = generateNewEditor();
		useEditorsStore.getState().addEditor(editorId, editor);
		useEditorsStore.getState().addUnsavedAttachment(editorId, attachment);
		return useEditorsStore.getState();
	};

	it('returns unsaved attachment by given uploadId', () => {
		const state = setupEditorWithUnsavedAttachment();

		const unsavedAttachment = selectUnsavedAttachmentByUploadId(state, editorId, uploadId);

		expect(unsavedAttachment).toBe(attachment);
	});
	it('returns undefined if uploadId mismatches', () => {
		const state = setupEditorWithUnsavedAttachment();

		const unsavedAttachment = selectUnsavedAttachmentByUploadId(state, editorId, 'other-upload-id');

		expect(unsavedAttachment).toBeUndefined();
	});
	it('returns undefined if no such editor', () => {
		const state = setupEditorWithUnsavedAttachment();

		const unsavedAttachment = selectUnsavedAttachmentByUploadId(
			state,
			'this-editor-does-not-exist',
			uploadId
		);

		expect(unsavedAttachment).toBeUndefined();
	});
});
