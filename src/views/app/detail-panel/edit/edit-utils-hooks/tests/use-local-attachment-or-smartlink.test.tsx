/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';
import { useModal } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import type { Mock } from 'vitest';

import { useLocalAttachmentOrSmartlink } from '../use-local-attachment-or-smartlink';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorAttachments } from 'store/editor/hooks';
import { useEditorsStore } from 'store/editor/store';

const createFileWithSize = (name: string, size: number, type = 'text/plain'): File => {
	const file = new File(['content'], name, { type });
	Object.defineProperty(file, 'size', { value: size });
	return file;
};

// FIXME: rewrite tests using real modal, not spying modal
describe.skip('useAttachmentOrSmartlink', () => {
	const editorId = 'test-editor-id';
	const mockAddStandardAttachments = vi.fn();
	const mockCreateModal = vi.fn();
	const mockCloseModal = vi.fn();
	const MODAL_ID = 'smartlink-from-local-modal';
	const TEXT_PLAIN = 'text/plain';

	beforeEach(() => {
		(useUserSettings as Mock).mockReturnValue({
			attrs: {
				zimbraMtaMaxMessageSize: '10485760'
			}
		});

		(useModal as Mock).mockReturnValue({
			createModal: mockCreateModal,
			closeModal: mockCloseModal
		});

		(useEditorAttachments as Mock).mockReturnValue({
			addStandardAttachments: mockAddStandardAttachments
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

	describe('addFiles', () => {
		it('should add files directly when total size is below limit', () => {
			const { result } = renderHook(() => useLocalAttachmentOrSmartlink({ editorId }));

			const smallFile = createFileWithSize('small.txt', 100000, TEXT_PLAIN);

			act(() => {
				result.current.addLocalFiles([smallFile]);
			});

			expect(mockAddStandardAttachments).toHaveBeenCalledWith([smallFile], {});
			expect(mockCreateModal).not.toHaveBeenCalled();
		});

		it('should show SmartlinkFromLocalModal when total size exceeds limit', () => {
			const state = useEditorsStore.getState();
			const currentEditor = state.editors[editorId];
			if (currentEditor) {
				state.editors[editorId] = {
					...currentEditor,
					size: 5000000
				};
			}

			const { result } = renderHook(() => useLocalAttachmentOrSmartlink({ editorId }));

			// 5MB (editor) + 4.2MB * 1.33 = 10.586MB > 10.485MB limit
			const largeFile = createFileWithSize('large.txt', 4200000, TEXT_PLAIN);

			act(() => {
				result.current.addLocalFiles([largeFile]);
			});

			expect(mockAddStandardAttachments).not.toHaveBeenCalled();
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

		it('should handle multiple files correctly', () => {
			const { result } = renderHook(() => useLocalAttachmentOrSmartlink({ editorId }));

			const file1 = createFileWithSize('file1.txt', 50000, TEXT_PLAIN);
			const file2 = createFileWithSize('file2.txt', 50000, TEXT_PLAIN);

			act(() => {
				result.current.addLocalFiles([file1, file2]);
			});

			expect(mockAddStandardAttachments).toHaveBeenCalledWith([file1, file2], {});
			expect(mockCreateModal).not.toHaveBeenCalled();
		});

		it('should calculate file size with BASE_64_CONVERSION_RATE', () => {
			const { result } = renderHook(() => useLocalAttachmentOrSmartlink({ editorId }));

			const file = createFileWithSize('test.txt', 20000000, TEXT_PLAIN);

			act(() => {
				result.current.addLocalFiles([file]);
			});

			expect(mockAddStandardAttachments).not.toHaveBeenCalled();
			expect(mockCreateModal).toHaveBeenCalledTimes(1);
		});

		it('should pass editorId to SmartlinkFromLocalModal', () => {
			const state = useEditorsStore.getState();
			const currentEditor = state.editors[editorId];
			if (currentEditor) {
				state.editors[editorId] = {
					...currentEditor,
					size: 8000000
				};
			}

			const { result } = renderHook(() => useLocalAttachmentOrSmartlink({ editorId }));

			const largeFile = createFileWithSize('large.txt', 2000000, TEXT_PLAIN);

			act(() => {
				result.current.addLocalFiles([largeFile]);
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
			const { result } = renderHook(() => useLocalAttachmentOrSmartlink({ editorId }));

			act(() => {
				result.current.addLocalFiles([]);
			});

			expect(mockAddStandardAttachments).toHaveBeenCalledWith([], {});
			expect(mockCreateModal).not.toHaveBeenCalled();
		});
	});

	describe('return values', () => {
		it('should return maxAllowedMailSize', () => {
			const { result } = renderHook(() => useLocalAttachmentOrSmartlink({ editorId }));

			expect(result.current.maxAllowedMailSize).toBe(10485760);
		});

		it('should return BASE_64_CONVERSION_RATE', () => {
			const { result } = renderHook(() => useLocalAttachmentOrSmartlink({ editorId }));

			expect(result.current.BASE_64_CONVERSION_RATE).toBe(1.33);
		});

		it('should return addFiles function', () => {
			const { result } = renderHook(() => useLocalAttachmentOrSmartlink({ editorId }));

			expect(typeof result.current.addLocalFiles).toBe('function');
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

			const { result } = renderHook(() => useLocalAttachmentOrSmartlink({ editorId }));

			const file = createFileWithSize('exact.txt', fileSize, TEXT_PLAIN);

			act(() => {
				result.current.addLocalFiles([file]);
			});

			expect(mockAddStandardAttachments).toHaveBeenCalledWith([file], {});
		});

		it('should handle different file types', () => {
			const { result } = renderHook(() => useLocalAttachmentOrSmartlink({ editorId }));

			const pdfFile = createFileWithSize('document.pdf', 50000, 'application/pdf');
			const imageFile = createFileWithSize('photo.jpg', 50000, 'image/jpeg');
			const videoFile = createFileWithSize('clip.mp4', 50000, 'video/mp4');

			act(() => {
				result.current.addLocalFiles([pdfFile, imageFile, videoFile]);
			});

			expect(mockAddStandardAttachments).toHaveBeenCalledWith([pdfFile, imageFile, videoFile], {});
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

			const { result } = renderHook(() => useLocalAttachmentOrSmartlink({ editorId }));

			const largeFile = createFileWithSize('large.txt', 2000000, TEXT_PLAIN);

			act(() => {
				result.current.addLocalFiles([largeFile]);
			});

			const modalConfig = mockCreateModal.mock.calls[0][0];

			act(() => {
				modalConfig.onClose();
			});

			expect(mockCloseModal).toHaveBeenCalledWith(MODAL_ID);
		});

		it('should pass files to SmartlinkFromLocalModal', () => {
			const state = useEditorsStore.getState();
			const currentEditor = state.editors[editorId];
			if (currentEditor) {
				state.editors[editorId] = {
					...currentEditor,
					size: 5000000
				};
			}

			const { result } = renderHook(() => useLocalAttachmentOrSmartlink({ editorId }));

			const file1 = createFileWithSize('file1.txt', 3000000, TEXT_PLAIN);
			const file2 = createFileWithSize('file2.txt', 3000000, TEXT_PLAIN);

			act(() => {
				result.current.addLocalFiles([file1, file2]);
			});

			expect(mockCreateModal).toHaveBeenCalledTimes(1);
		});

		it('should configure SmartlinkFromLocalModal with onClose handler that closes modal', () => {
			const state = useEditorsStore.getState();
			const currentEditor = state.editors[editorId];
			if (currentEditor) {
				state.editors[editorId] = {
					...currentEditor,
					size: 8000000
				};
			}

			const { result } = renderHook(() => useLocalAttachmentOrSmartlink({ editorId }));

			const largeFile = createFileWithSize('large.txt', 3000000, TEXT_PLAIN);

			act(() => {
				result.current.addLocalFiles([largeFile]);
			});

			expect(mockCreateModal).toHaveBeenCalledTimes(1);

			const modalConfig = mockCreateModal.mock.calls[0][0];

			// eslint-disable-next-line testing-library/no-node-access
			const smartlinkModalProps = modalConfig.children.props;
			expect(smartlinkModalProps.onClose).toBeDefined();
			expect(smartlinkModalProps.editorId).toBe(editorId);
			expect(smartlinkModalProps.files).toHaveLength(1);

			act(() => {
				smartlinkModalProps.onClose();
			});

			expect(mockCloseModal).toHaveBeenCalledWith(MODAL_ID);
			expect(mockCloseModal).toHaveBeenCalledTimes(1);
		});
	});
});
