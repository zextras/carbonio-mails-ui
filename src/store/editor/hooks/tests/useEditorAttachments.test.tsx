import { renderHook, act, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateCompleteMessageFromAPI } from '../../../../__test__/generators/api';
import {
	SavedAttachment,
	SaveDraftRequest,
	SaveDraftResponse,
	UnsavedAttachment
} from '../../../../types';
import { generateNewEditor, generateNewMessageEditor } from '../../editor-generators';
import { useEditorsStore } from '../../store';
import { useEditorAttachments } from '../attachments';
import { mockUploadApiSuccess } from '@test-utils/api/upload-file-api-mocks';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { uploadAttachmentsApi } from 'api/upload-attachments-api';
import { composeCidUrlFromContentId } from 'store/editor/editor-transformations';
import { filterUnsavedAttachmentsByUploadId } from 'store/editor/editor-utils';
import { getEditor } from 'store/editor/hooks/editors';

const generateUnsavedStandardAttachment = (
	partial?: Partial<UnsavedAttachment>
): UnsavedAttachment => ({
	contentType: 'image/png',
	filename: 'test.png',
	isInline: false,
	size: 300,
	...partial
});
const generateSavedStandardAttachment = (partial?: Partial<SavedAttachment>): SavedAttachment => ({
	contentId: '',
	contentType: 'image/png',
	filename: 'test.png',
	isInline: false,
	messageId: '1',
	partName: '1.2',
	size: 0,
	...partial
});

describe('useEditorAttachments', () => {
	describe('Remove attachments', () => {
		it('removeUnsavedAttachment', () => {
			const editor = generateNewMessageEditor();
			useEditorsStore.getState().addEditor(editor.id, editor);
			const unsavedAttachment = generateUnsavedStandardAttachment({ uploadId: 'u1' });
			useEditorsStore.getState().addUnsavedAttachment(editor.id, unsavedAttachment);

			const { result } = renderHook(() => useEditorAttachments(editor.id));
			expect(result.current.unsavedStandardAttachments).toHaveLength(1);

			act(() => result.current.removeUnsavedAttachment('u1'));

			expect(result.current.unsavedStandardAttachments).toHaveLength(0);
		});

		it('removeSavedAttachment', () => {
			const editor = generateNewMessageEditor();
			useEditorsStore.getState().addEditor(editor.id, editor);
			const savedAttachment = generateSavedStandardAttachment({ partName: 'p1' });
			useEditorsStore.getState().addSavedAttachment(editor.id, savedAttachment);

			const { result } = renderHook(() => useEditorAttachments(editor.id));

			act(() => result.current.removeSavedAttachment('p1'));
			expect(result.current.savedStandardAttachments).toHaveLength(0);
		});

		it('removeStandardAttachments', () => {
			const editor = generateNewMessageEditor();
			useEditorsStore.getState().addEditor(editor.id, editor);
			const savedAttachment1 = generateSavedStandardAttachment({ partName: 'p1' });
			const savedAttachment2 = generateSavedStandardAttachment({ partName: 'p2' });
			useEditorsStore.getState().addSavedAttachment(editor.id, savedAttachment1);
			useEditorsStore.getState().addSavedAttachment(editor.id, savedAttachment2);

			const { result } = renderHook(() => useEditorAttachments(editor.id));
			expect(result.current.savedStandardAttachments).toHaveLength(2);
			act(() => result.current.removeStandardAttachments());
			expect(result.current.savedStandardAttachments).toHaveLength(0);
		});
	});

	describe('Add uploaded attachment', () => {
		it('addUploadedAttachment', () => {
			const editor = generateNewMessageEditor();
			useEditorsStore.getState().addEditor(editor.id, editor);
			const { result } = renderHook(() => useEditorAttachments(editor.id));
			const att = result.current.addUploadedAttachment({
				attachmentId: 'a1',
				fileName: 'f',
				contentType: 't',
				size: 1
			});
			expect(att.aid).toBe('a1');
		});
		// TODO: add test that checks upload attachment is in standard attachments
	});

	it('addStandardAttachments', () => {
		const editor = generateNewMessageEditor();
		useEditorsStore.getState().addEditor(editor.id, editor);
		const { result } = renderHook(() => useEditorAttachments(editor.id));
		const res = result.current.addStandardAttachments([new File([''], 'f')]);
		expect(res[0].filename).toBe('f');
	});

	it('addInlineAttachments with save complete', async () => {
		const uploadId = 'my-upload-id';
		const editor = generateNewEditor({
			isRichText: true
		});
		editor.isRichText = true;
		useEditorsStore.getState().addEditor(editor.id, editor);
		const attachmentId = 'attachment123';
		const pngImage = new File([''], 'f.png', { type: 'image/png' });
		mockUploadApiSuccess(pngImage, attachmentId);
		const messageResponse = generateCompleteMessageFromAPI();
		messageResponse.mp = [
			{
				part: '1.2',
				ct: 'image/png',
				filename: 'f.png',
				cd: 'inline',
				ci: `<${uploadId}@carbonio>`
			}
		];
		const saveDraftRequestPromise = createSoapAPIInterceptor<SaveDraftRequest, SaveDraftResponse>(
			'SaveDraft',
			{
				m: [messageResponse]
			}
		);

		const { result } = renderHook(() => useEditorAttachments(editor.id));

		const onSaveComplete = vi.fn();
		act(() => {
			result.current.addInlineAttachments([pngImage], {
				onSaveComplete
			});
		});
		const saveDraftRequest = await saveDraftRequestPromise;
		// TODO: the uploadId is randomly generated and we have no control over it.
		//  The save draft should return a response with the same contentId/uuid/uploadId
		//  in order to have a real simulation of the behavior
		await waitFor(() => {
			expect(onSaveComplete).toHaveBeenCalledWith([]);
		});
	});

	it('keepOnlyInlineAttachments removes unused ones', async () => {
		const editor = generateNewMessageEditor();
		editor.savedAttachments = [
			{
				isInline: true,
				contentId: 'c1',
				partName: 'p1',
				filename: 'firstimage.png',
				contentType: 'image/png',
				size: 10,
				messageId: 'm1'
			},
			{
				isInline: true,
				contentId: 'c2',
				partName: 'p2',
				filename: 'secondimage.jpeg',
				contentType: 'image/jpeg',
				size: 10,
				messageId: 'm1'
			}
		];
		useEditorsStore.getState().addEditor(editor.id, editor);

		// (composeCidUrlFromContentId as Mock).mockImplementation((c) => `cid:${c}`);
		const { result } = renderHook(() => useEditorAttachments(editor.id));
		await result.current.keepOnlyInlineAttachments(['cid:c1']);
		const updatedEditor = getEditor({ id: editor.id });
		expect(updatedEditor?.savedAttachments).toBe([
			{
				isInline: true,
				contentId: 'c1',
				partName: 'p1',
				filename: 'firstimage.png',
				contentType: 'image/png',
				size: 10,
				messageId: 'm1'
			}
		]);
	});
	it('upload error sets aborted', () => {
		(uploadAttachmentsApi as Mock).mockImplementation((_f, o) => {
			o.onUploadError(new File([''], 'f'), 'u5', 'err');
			return [{ file: new File([''], 'f'), uploadId: 'u5', abortController: {} }];
		});
		const { result } = renderHook(() => useEditorAttachments(editorId));
		result.current.addStandardAttachments([new File([''], 'f')]);
		expect(setAttachmentUploadStatusMock).toHaveBeenCalledWith(editorId, 'u5', {
			status: 'aborted',
			abortReason: 'err'
		});
	});

	it('upload progress sets running', () => {
		(uploadAttachmentsApi as Mock).mockImplementation((_f, o) => {
			o.onUploadProgress(new File([''], 'f'), 'u6', 30);
			return [{ file: new File([''], 'f'), uploadId: 'u6', abortController: {} }];
		});
		const { result } = renderHook(() => useEditorAttachments(editorId));
		result.current.addStandardAttachments([new File([''], 'f')]);
		expect(setAttachmentUploadStatusMock).toHaveBeenCalledWith(editorId, 'u6', {
			status: 'running',
			progress: 30
		});
	});

	it('upload complete sets completed', () => {
		(uploadAttachmentsApi as Mock).mockImplementation((_f, o) => {
			o.onUploadComplete(new File([''], 'f'), 'u7', 'a7');
			return [{ file: new File([''], 'f'), uploadId: 'u7', abortController: {} }];
		});
		const { result } = renderHook(() => useEditorAttachments(editorId));
		result.current.addStandardAttachments([new File([''], 'f')]);
		expect(setAttachmentUploadCompletedMock).toHaveBeenCalledWith(editorId, 'u7', 'a7');
	});

	it('uploads end calls callback', () => {
		(uploadAttachmentsApi as Mock).mockImplementation((_f, o) => {
			o.onUploadsEnd(['u8'], []);
			return [{ file: new File([''], 'f'), uploadId: 'u8', abortController: {} }];
		});
		(getEditor as Mock).mockReturnValue({
			unsavedAttachments: [{ uploadId: 'u8', isInline: false }],
			savedAttachments: []
		});
		(filterUnsavedAttachmentsByUploadId as Mock).mockReturnValue([
			{ isInline: false, contentId: 'cidx' }
		]);
		const cb: any = { onUploadsEnd: vi.fn() };
		const { result } = renderHook(() => useEditorAttachments(editorId));
		result.current.addStandardAttachments([new File([''], 'f')], cb);
		expect(cb.onUploadsEnd).toHaveBeenCalledWith(['u8'], []);
	});

	it('hasStandardAttachments reflects attachments presence', () => {
		const { result } = renderHook(() => useEditorAttachments(editorId));
		expect(result.current.hasStandardAttachments).toBe(true);
	});
});
