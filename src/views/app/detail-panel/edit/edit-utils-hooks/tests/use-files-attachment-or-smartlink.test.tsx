/* eslint-disable sonarjs/no-duplicate-string */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';
import { useModal } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import type { Mock } from 'vitest';

import { useFilesAttachmentOrSmartlink } from '../use-files-attachment-or-smartlink';
import { FileNode } from '../use-upload-from-files';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';

const createFileNode = (name: string, size: number): FileNode => ({
	id: `node-${name}`,
	name,
	size,
	mime_type: 'application/pdf',
	__typename: 'File'
});

// FIXME: rewrite this test with real modal interaction
describe.skip('useFilesAttachmentOrSmartlink', () => {
	const editorId = 'test-editor-id';
	const mockOnUploadFiles = vi.fn();
	const mockCreateModal = vi.fn();
	const mockCloseModal = vi.fn();
	const MODAL_ID = 'smartlink-from-files-modal';

	beforeEach(() => {
		vi.clearAllMocks();

		(useUserSettings as Mock).mockReturnValue({
			attrs: {
				zimbraMtaMaxMessageSize: '10485760'
			}
		});

		(useModal as Mock).mockReturnValue({
			createModal: mockCreateModal,
			closeModal: mockCloseModal
		});

		const editor = generateNewMessageEditor();
		editor.id = editorId;
		editor.size = 0;

		const state = useEditorsStore.getState();
		state.editors = {};
		state.editors[editorId] = editor;
	});

	afterEach(() => {
		const state = useEditorsStore.getState();
		state.editors = {};
	});

	describe('addFilesFromFiles', () => {
		it('should upload files directly when total size is below limit', () => {
			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			const smallFile1 = createFileNode('small1.pdf', 100000);
			const smallFile2 = createFileNode('small2.pdf', 100000);

			act(() => {
				result.current.addFilesFromFiles([smallFile1, smallFile2]);
			});

			expect(mockOnUploadFiles).toHaveBeenCalledWith([smallFile1, smallFile2]);
			expect(mockCreateModal).not.toHaveBeenCalled();
		});

		it('should show SmartlinkFromFilesModal when total size exceeds limit', () => {
			const state = useEditorsStore.getState();
			const currentEditor = state.editors[editorId];
			if (currentEditor) {
				state.editors[editorId] = {
					...currentEditor,
					size: 5000000
				};
			}

			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			// 5MB (editor) + 4.2MB * 1.33 = 10.586MB > 10.485MB limit
			const largeFile = createFileNode('large.pdf', 4200000);

			act(() => {
				result.current.addFilesFromFiles([largeFile]);
			});

			expect(mockOnUploadFiles).not.toHaveBeenCalled();
			expect(mockCreateModal).toHaveBeenCalledTimes(1);
			expect(mockCreateModal).toHaveBeenCalledWith(
				expect.objectContaining({
					id: MODAL_ID,
					maxHeight: '90vh',
					size: 'medium'
				}),
				true
			);
		});

		it('should handle multiple file nodes correctly', () => {
			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			const file1 = createFileNode('file1.pdf', 50000);
			const file2 = createFileNode('file2.pdf', 50000);

			act(() => {
				result.current.addFilesFromFiles([file1, file2]);
			});

			expect(mockOnUploadFiles).toHaveBeenCalledWith([file1, file2]);
			expect(mockCreateModal).not.toHaveBeenCalled();
		});

		it('should calculate file size with BASE_64_CONVERSION_RATE', () => {
			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			const largeFile = createFileNode('large.zip', 20000000);

			act(() => {
				result.current.addFilesFromFiles([largeFile]);
			});

			expect(mockOnUploadFiles).not.toHaveBeenCalled();
			expect(mockCreateModal).toHaveBeenCalledTimes(1);
		});

		it('should pass editorId to SmartlinkFromFilesModal', () => {
			const state = useEditorsStore.getState();
			const currentEditor = state.editors[editorId];
			if (currentEditor) {
				state.editors[editorId] = {
					...currentEditor,
					size: 8000000
				};
			}

			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			const largeFile = createFileNode('large.pdf', 2000000);

			act(() => {
				result.current.addFilesFromFiles([largeFile]);
			});

			expect(mockCreateModal).toHaveBeenCalledWith(
				expect.objectContaining({
					children: expect.anything()
				}),
				true
			);

			const modalCall = mockCreateModal.mock.calls[0][0];
			expect(modalCall.id).toBe(MODAL_ID);
		});

		it('should handle empty file array', () => {
			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			act(() => {
				result.current.addFilesFromFiles([]);
			});

			expect(mockOnUploadFiles).toHaveBeenCalledWith([]);
			expect(mockCreateModal).not.toHaveBeenCalled();
		});

		it('should show modal when combined file size exceeds limit', () => {
			const state = useEditorsStore.getState();
			const currentEditor = state.editors[editorId];
			if (currentEditor) {
				state.editors[editorId] = {
					...currentEditor,
					size: 5000000
				};
			}

			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			// 3MB each * 2 files = 6MB, with BASE64 conversion (1.33x) = ~8MB
			// 5MB (editor) + 8MB = 13MB > 10MB limit
			const file1 = createFileNode('doc1.pdf', 3000000);
			const file2 = createFileNode('doc2.pdf', 3000000);

			act(() => {
				result.current.addFilesFromFiles([file1, file2]);
			});

			expect(mockCreateModal).toHaveBeenCalledTimes(1);
		});

		it('should return Promise<null> when showing modal', () => {
			const state = useEditorsStore.getState();
			const currentEditor = state.editors[editorId];
			if (currentEditor) {
				state.editors[editorId] = {
					...currentEditor,
					size: 8000000
				};
			}

			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			const largeFile = createFileNode('large.pdf', 3000000);

			let returnValue: unknown;
			act(() => {
				returnValue = result.current.addFilesFromFiles([largeFile]);
			});

			expect(returnValue).toBeInstanceOf(Promise);
		});
	});

	describe('modal configuration', () => {
		it('should configure modal with correct onClose handler', () => {
			const state = useEditorsStore.getState();
			const currentEditor = state.editors[editorId];
			if (currentEditor) {
				state.editors[editorId] = {
					...currentEditor,
					size: 10000000
				};
			}

			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			const largeFile = createFileNode('large.pdf', 2000000);

			act(() => {
				result.current.addFilesFromFiles([largeFile]);
			});

			const modalConfig = mockCreateModal.mock.calls[0][0];

			act(() => {
				modalConfig.onClose();
			});

			expect(mockCloseModal).toHaveBeenCalledWith(MODAL_ID);
		});

		it('should configure SmartlinkFromFilesModal with onClose handler that closes modal', () => {
			const state = useEditorsStore.getState();
			const currentEditor = state.editors[editorId];
			if (currentEditor) {
				state.editors[editorId] = {
					...currentEditor,
					size: 8000000
				};
			}

			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			const largeFile = createFileNode('large.pdf', 3000000);

			act(() => {
				result.current.addFilesFromFiles([largeFile]);
			});

			expect(mockCreateModal).toHaveBeenCalledTimes(1);

			const modalConfig = mockCreateModal.mock.calls[0][0];

			// eslint-disable-next-line testing-library/no-node-access
			const smartlinkModalProps = modalConfig.children.props;
			expect(smartlinkModalProps.onClose).toBeDefined();
			expect(smartlinkModalProps.editorId).toBe(editorId);
			expect(smartlinkModalProps.fileNodes).toHaveLength(1);

			act(() => {
				smartlinkModalProps.onClose();
			});

			expect(mockCloseModal).toHaveBeenCalledWith(MODAL_ID);
			expect(mockCloseModal).toHaveBeenCalledTimes(1);
		});

		it('should pass correct fileNodes to SmartlinkFromFilesModal', () => {
			const state = useEditorsStore.getState();
			const currentEditor = state.editors[editorId];
			if (currentEditor) {
				state.editors[editorId] = {
					...currentEditor,
					size: 5000000
				};
			}

			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			const file1 = createFileNode('file1.pdf', 3000000);
			const file2 = createFileNode('file2.pdf', 3000000);

			act(() => {
				result.current.addFilesFromFiles([file1, file2]);
			});

			const modalConfig = mockCreateModal.mock.calls[0][0];
			// eslint-disable-next-line testing-library/no-node-access
			const smartlinkModalProps = modalConfig.children.props;

			expect(smartlinkModalProps.fileNodes).toEqual([file1, file2]);
			expect(smartlinkModalProps.fileNodes).toHaveLength(2);
		});
	});

	describe('edge cases', () => {
		it('should handle exactly at the size limit', () => {
			const maxSize = 10485760;
			const editorSize = 5000000;
			// Calculate file size to be exactly at limit
			const fileSize = Math.floor((maxSize - editorSize) / 1.33);

			const state = useEditorsStore.getState();
			const currentEditor = state.editors[editorId];
			if (currentEditor) {
				state.editors[editorId] = {
					...currentEditor,
					size: editorSize
				};
			}

			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			const file = createFileNode('exact.pdf', fileSize);

			act(() => {
				result.current.addFilesFromFiles([file]);
			});

			expect(mockOnUploadFiles).toHaveBeenCalledWith([file]);
		});

		it('should handle different file types', () => {
			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			const pdfFile: FileNode = {
				id: 'node-1',
				name: 'document.pdf',
				size: 50000,
				mime_type: 'application/pdf',
				__typename: 'File'
			};
			const imageFile: FileNode = {
				id: 'node-2',
				name: 'photo.jpg',
				size: 50000,
				mime_type: 'image/jpeg',
				__typename: 'File'
			};
			const videoFile: FileNode = {
				id: 'node-3',
				name: 'clip.mp4',
				size: 50000,
				mime_type: 'video/mp4',
				__typename: 'File'
			};

			act(() => {
				result.current.addFilesFromFiles([pdfFile, imageFile, videoFile]);
			});

			expect(mockOnUploadFiles).toHaveBeenCalledWith([pdfFile, imageFile, videoFile]);
		});

		it('should account for existing editor size when determining whether to show modal', () => {
			const existingAttachment = {
				aid: 'existing-aid',
				filename: 'existing.pdf',
				size: 5000000,
				contentType: 'application/pdf',
				isInline: false
			};

			const baseEditor = generateNewMessageEditor();
			const editor = {
				...baseEditor,
				id: editorId,
				unsavedAttachments: [existingAttachment],
				size: 5000000 * 1.33
			};

			const state = useEditorsStore.getState();
			state.editors = {};
			state.editors[editorId] = editor;

			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			// 4MB file + 6.65MB existing = ~11.98MB > 10.485MB
			const file = createFileNode('additional.pdf', 4000000);

			act(() => {
				result.current.addFilesFromFiles([file]);
			});

			expect(mockCreateModal).toHaveBeenCalledTimes(1);
		});

		it('should not show modal when combined size is just under the limit', () => {
			const baseEditor = generateNewMessageEditor();
			const editor = {
				...baseEditor,
				id: editorId,
				size: 0
			};

			const state = useEditorsStore.getState();
			state.editors = {};
			state.editors[editorId] = editor;

			const { result } = renderHook(() =>
				useFilesAttachmentOrSmartlink({
					editorId,
					onUploadFiles: mockOnUploadFiles
				})
			);

			// 7.5MB * 1.33 = 9.975MB < 10MB
			const file = createFileNode('just-under.pdf', 7500000);

			act(() => {
				result.current.addFilesFromFiles([file]);
			});

			expect(mockCreateModal).not.toHaveBeenCalled();
			expect(mockOnUploadFiles).toHaveBeenCalledWith([file]);
		});
	});
});
