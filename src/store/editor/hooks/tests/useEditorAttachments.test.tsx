import { renderHook, act } from '@testing-library/react';
import type { Mock } from 'vitest';
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEditorAttachments } from '../attachments';
import { uploadAttachmentsApi } from 'api/upload-attachments-api';
import { composeCidUrlFromContentId } from 'store/editor/editor-transformations';
import {
	getSavedInlineAttachmentsByContentId,
	filterUnsavedAttachmentsByUploadId
} from 'store/editor/editor-utils';
import { getEditor } from 'store/editor/hooks/editors';
import { useEditorsStore } from 'store/editor/store';

vi.mock('store/editor/store', () => ({ useEditorsStore: vi.fn() }));
vi.mock('store/editor/hooks/editors', () => ({ getEditor: vi.fn() }));
vi.mock('store/editor/editor-transformations', () => ({ composeCidUrlFromContentId: vi.fn() }));
vi.mock('api/upload-attachments-api', () => ({ uploadAttachmentsApi: vi.fn() }));
vi.mock('store/editor/hooks/commons', () => ({ computeAndUpdateEditorStatus: vi.fn() }));
vi.mock('store/editor/hooks/save-draft', () => ({
	useSaveDraftFromEditor: (): any => ({
		debouncedSaveDraft: vi.fn((_id, opts?: any) => {
			opts?.onComplete && opts.onComplete();
		})
	})
}));
vi.mock('helpers/attachments', () => ({ composeAttachmentDownloadUrl: vi.fn(() => 'url') }));
vi.mock('store/editor/editor-utils', () => ({
	filterUnsavedAttachmentsByUploadId: vi.fn(),
	getSavedInlineAttachmentsByContentId: vi.fn()
}));
vi.mock('hooks/use-ui-utilities', () => ({
	useUiUtilities: (): any => ({ createSnackbar: vi.fn() })
}));
vi.mock('@zextras/carbonio-shell-ui', () => ({
	t: (_: string, o: any): string => `Upload failed for the file "${o.filename}"`
}));

describe('useEditorAttachments', () => {
	const editorId = 'e1';
	const removeSavedAttachmentMock = vi.fn();
	const removeUnsavedAttachmentMock = vi.fn();
	const clearStandardAttachmentsMock = vi.fn();
	const addUnsavedAttachmentsMock = vi.fn();
	const setAttachmentUploadStatusMock = vi.fn();
	const setAttachmentUploadCompletedMock = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		(useEditorsStore as unknown as Mock).mockImplementation((sel) =>
			sel({
				editors: {
					[editorId]: {
						unsavedAttachments: [{ uploadId: 'u1', isInline: false }],
						savedAttachments: [{ partName: 'p1', isInline: false }]
					}
				},
				removeSavedAttachment: removeSavedAttachmentMock,
				removeUnsavedAttachment: removeUnsavedAttachmentMock,
				clearStandardAttachments: clearStandardAttachmentsMock
			})
		);
		(useEditorsStore as any).getState = (): any => ({
			addUnsavedAttachments: addUnsavedAttachmentsMock,
			setAttachmentUploadStatus: setAttachmentUploadStatusMock,
			setAttachmentUploadCompleted: setAttachmentUploadCompletedMock,
			removeSavedAttachment: removeSavedAttachmentMock
		});
	});

	it('removeUnsavedAttachment', () => {
		const { result } = renderHook(() => useEditorAttachments(editorId));
		act(() => result.current.removeUnsavedAttachment('u1'));
		expect(removeUnsavedAttachmentMock).toHaveBeenCalledWith(editorId, 'u1');
	});

	it('removeSavedAttachment', () => {
		const { result } = renderHook(() => useEditorAttachments(editorId));
		act(() => result.current.removeSavedAttachment('p1'));
		expect(removeSavedAttachmentMock).toHaveBeenCalledWith(editorId, 'p1');
	});

	it('removeStandardAttachments', () => {
		const { result } = renderHook(() => useEditorAttachments(editorId));
		act(() => result.current.removeStandardAttachments());
		expect(clearStandardAttachmentsMock).toHaveBeenCalledWith(editorId);
	});

	it('addUploadedAttachment', () => {
		const { result } = renderHook(() => useEditorAttachments(editorId));
		const att = result.current.addUploadedAttachment({
			attachmentId: 'a1',
			fileName: 'f',
			contentType: 't',
			size: 1
		});
		expect(att.aid).toBe('a1');
	});

	it('addStandardAttachments', () => {
		(uploadAttachmentsApi as Mock).mockReturnValue([
			{ file: new File([''], 'f'), uploadId: 'u2', abortController: {} }
		]);
		const { result } = renderHook(() => useEditorAttachments(editorId));
		const res = result.current.addStandardAttachments([new File([''], 'f')]);
		expect(res[0].filename).toBe('f');
	});

	it('addInlineAttachments with save complete', () => {
		(uploadAttachmentsApi as Mock).mockImplementation((_files, options) => {
			options.onUploadsEnd(['u3'], []);
			return [{ file: new File([''], 'f.png'), uploadId: 'u3', abortController: {} }];
		});

		(getEditor as Mock).mockReturnValue({
			unsavedAttachments: [{ uploadId: 'u3', isInline: true, contentId: 'c1' }],
			savedAttachments: [{ contentId: 'c1' }]
		});

		(filterUnsavedAttachmentsByUploadId as Mock).mockReturnValue([
			{ isInline: true, contentId: 'c1' }
		]);
		(getSavedInlineAttachmentsByContentId as Mock).mockReturnValue([{ contentId: 'c1' }]);
		(composeCidUrlFromContentId as Mock).mockReturnValue('cid:c1');

		const cb: any = { onSaveComplete: vi.fn() };
		const { result } = renderHook(() => useEditorAttachments(editorId));

		act(() => {
			result.current.addInlineAttachments([new File([''], 'f.png')], cb);
		});

		expect(cb.onSaveComplete).toHaveBeenCalledWith([
			{ contentId: 'c1', cidUrl: 'cid:c1', downloadServiceUrl: 'url' }
		]);
	});

	it('removeInlineAttachments removes unused', () => {
		(getEditor as Mock).mockReturnValue({
			savedAttachments: [
				{ isInline: true, contentId: 'c1', partName: 'p1' },
				{ isInline: true, contentId: 'c2', partName: 'p2' }
			]
		});
		(composeCidUrlFromContentId as Mock).mockImplementation((c) => `cid:${c}`);
		const { result } = renderHook(() => useEditorAttachments(editorId));
		act(() => result.current.removeInlineAttachments(['cid:c1']));
		expect(removeSavedAttachmentMock).toHaveBeenCalledWith(editorId, 'p2');
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
