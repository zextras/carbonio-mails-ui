/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { generateNewEditor } from '../../../__test__/generators/editors';
import { useEditorsStore } from '../store';
import {
	selectUnsavedAttachmentByUploadId,
	selectUnsavedAttachmentsSize
} from '../store-selectors';
import { MailsEditorV2 } from 'types/editor';
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

describe('selectUnsavedAttachmentsSize', () => {
	const buildAttachment = (
		size: number,
		status?: 'running' | 'completed' | 'aborted'
	): MailsEditorV2['unsavedAttachments'][number] => ({
		filename: `file-${size}`,
		contentType: 'text/plain',
		isInline: false,
		size,
		uploadStatus: status ? { status } : undefined
	});

	it('returns 0 when there are no unsaved attachments', () => {
		expect(selectUnsavedAttachmentsSize({ unsavedAttachments: [] })).toBe(0);
	});

	it('sums running, completed and status-less attachments', () => {
		const unsavedAttachments = [
			buildAttachment(100, 'running'),
			buildAttachment(200, 'completed'),
			buildAttachment(300)
		];

		expect(selectUnsavedAttachmentsSize({ unsavedAttachments })).toBe(600);
	});

	it('ignores attachments whose upload was aborted', () => {
		const unsavedAttachments = [buildAttachment(100, 'completed'), buildAttachment(900, 'aborted')];

		expect(selectUnsavedAttachmentsSize({ unsavedAttachments })).toBe(100);
	});
});
