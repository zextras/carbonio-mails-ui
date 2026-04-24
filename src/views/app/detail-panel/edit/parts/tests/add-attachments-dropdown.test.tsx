/* eslint-disable sonarjs/no-duplicate-string */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { fireEvent } from '@testing-library/react';
import { forEach, reduce, times } from 'lodash';
import { HttpResponse } from 'msw';
import type { Mock } from 'vitest';

import { setupTest, screen } from '@test-setup';
import {
	getIntegratedFunction,
	useActions,
	useIntegratedFunction,
	useUserSettings
} from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { createAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { TESTID_SELECTORS } from '__test__/constants';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor, generateReplyMsgEditor } from 'store/editor/editor-generators';
import { getEditor } from 'store/editor/index';
import { FileNode } from 'views/app/detail-panel/edit/edit-utils-hooks/use-upload-from-files';
import { AddAttachmentsDropdown } from 'views/app/detail-panel/edit/parts/add-attachments-dropdown';
import { generateMessage } from '../../../../../../__test__/generators/generateMessage';

type FilesUploadResult = { attachmentId: string };

type SelectNodesFunction = ({
	confirmAction
}: {
	confirmAction: (nodes: Array<FileNode>) => void;
}) => void;

const generateFilesIntegrationMocks = (
	filesCount: number
): { nodes: Array<FileNode>; attachments: Record<string, string> } => {
	const nodes = times<FileNode>(filesCount, () => ({
		id: faker.string.uuid(),
		name: faker.system.fileName(),
		size: 1_000_000,
		mime_type: faker.system.mimeType(),
		__typename: 'File'
	}));

	const attachments = reduce<FileNode, Record<string, string>>(
		nodes,
		(result, node) => ({
			...result,
			[node.id]: faker.string.uuid()
		}),
		{}
	);

	const selectNodes: SelectNodesFunction = ({ confirmAction }): void => confirmAction(nodes);

	const uploadToTarget = ({ nodeId }: { nodeId: string }): Promise<FilesUploadResult> =>
		Promise.resolve({ attachmentId: attachments[nodeId] });

	getIntegratedFunction.mockImplementation((id: string) => [selectNodes, true]);

	useIntegratedFunction.mockImplementation((id: string) => [uploadToTarget, true]);

	return {
		nodes,
		attachments
	};
};

describe('AddAttachmentsDropdown', () => {
	it('should render an icon', async () => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		expect(screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown)).toBeVisible();
	});

	it('should render a dropdown if the user clicks on the icon', async () => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown)).toBeVisible();
	});

	it('should display an option to add files from the local file system', async () => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.getByText('composer.attachment.local')).toBeVisible();
	});

	it('should not display an option to add files from Files if the "select-nodes" integration function is not available', async () => {
		getIntegratedFunction.mockImplementation((id: string) => [vi.fn(), id !== 'select-nodes']);
		useIntegratedFunction.mockImplementation((id: string) => [vi.fn(), id !== 'select-nodes']);
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.queryByText('composer.attachment.files')).not.toBeInTheDocument();
	});

	it('should not display an option to add files from Files if the "upload-to-target-and-get-target-id" integration function is not available', async () => {
		getIntegratedFunction.mockImplementation((id: string) => [
			vi.fn(),
			id !== 'upload-to-target-and-get-target-id'
		]);
		useIntegratedFunction.mockImplementation((id: string) => [
			vi.fn(),
			id !== 'upload-to-target-and-get-target-id'
		]);
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.queryByText('composer.attachment.files')).not.toBeInTheDocument();
	});

	it('should display an option to add files from Files if the "upload-to-target-and-get-target-id" and "select-nodes" integration functions are available', async () => {
		getIntegratedFunction.mockImplementation((id: string) => [vi.fn(), id === 'select-nodes']);
		useIntegratedFunction.mockImplementation((id: string) => [
			vi.fn(),
			id === 'upload-to-target-and-get-target-id'
		]);
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.getByText('composer.attachment.files')).toBeVisible();
	});

	it('should not display an option to add a public link generated by Files if the "select-nodes" integration function is not available', async () => {
		getIntegratedFunction.mockImplementation((id: string) => [vi.fn(), id !== 'select-nodes']);
		useIntegratedFunction.mockImplementation((id: string) => [vi.fn(), id !== 'select-nodes']);
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.queryByText('composer.attachment.url')).not.toBeInTheDocument();
	});

	it('should not display an option to add a public link generated by Files if the "get-link" integration function is not available', async () => {
		getIntegratedFunction.mockImplementation((id: string) => [vi.fn(), id !== 'get-link']);
		useIntegratedFunction.mockImplementation((id: string) => [vi.fn(), id !== 'get-link']);
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.queryByText('composer.attachment.url')).not.toBeInTheDocument();
	});

	it('should display an option to add files from Files if the "get-link" and "select-nodes" integration functions are available', async () => {
		getIntegratedFunction.mockImplementation((id: string) => [vi.fn(), id === 'select-nodes']);
		useIntegratedFunction.mockImplementation((id: string) => [vi.fn(), id === 'get-link']);
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.getByText('composer.attachment.url')).toBeVisible();
	});

	it('should open convert to smartlink modal when files exceed size limit', async () => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		setupTest(<AddAttachmentsDropdown editorId={editor.id} />);

		const fileInput = screen.getByTestId('file-input');

		// Create large mock files that exceed limit
		const largeFile = new File(['large content'], 'large-file.txt', { type: 'text/plain' });
		Object.defineProperty(largeFile, 'size', { value: 50000000 }); // 50MB

		const fileList = {
			0: largeFile,
			length: 1,
			item: (): File => largeFile
		};

		Object.defineProperty(fileInput, 'files', { value: fileList });

		// Trigger file change
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.change(fileInput);
		await screen.findByTestId('convert-to-smartlink-modal'); // Adjust based on your modal content
	});

	describe('Actions', () => {
		describe('Add files from Files', () => {
			it('should update the store with the uploaded attachments when files size is within the limit', async () => {
				const FILES_COUNT = 2;
				const { attachments } = generateFilesIntegrationMocks(FILES_COUNT);

				const editor = generateNewMessageEditor();
				setupEditorStore({ editors: [editor] });
				const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
				const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
				await user.click(dropdownIcon);
				await user.click(screen.getByText('composer.attachment.files'));

				const updatedEditor = getEditor({ id: editor.id });
				expect(updatedEditor?.unsavedAttachments).toHaveLength(FILES_COUNT);
				const nodeIds = Object.keys(attachments);
				forEach(nodeIds, (nodeId) => {
					expect(
						updatedEditor?.unsavedAttachments.find(
							(attachment) => attachment.aid === attachments[nodeId]
						)
					).toBeTruthy();
				});
			});
			it('should open the smartlink modal when files size is within the limit', async () => {
				const FILES_COUNT = 50;
				generateFilesIntegrationMocks(FILES_COUNT);

				const editor = generateNewMessageEditor();
				setupEditorStore({ editors: [editor] });
				const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
				const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
				await user.click(dropdownIcon);
				await user.click(screen.getByText('composer.attachment.files'));

				await screen.findByTestId('convert-to-smartlink-modal'); // Adjust based on your modal content
			});
		});
	});

	describe('Attachment processing and upload', () => {
		const createFileWithSize = (name: string, size: number, type = 'text/plain'): File => {
			const file = new File(['content'], name, { type });
			Object.defineProperty(file, 'size', { value: size });
			return file;
		};

		beforeEach(() => {
			(useUserSettings as Mock).mockReturnValue({
				attrs: {
					zimbraMtaMaxMessageSize: '10485760' // 10MB in bytes
				}
			});

			createAPIInterceptor('post', '/service/upload', new HttpResponse(null, { status: 200 }));
		});

		it('should add small files directly without showing smartlink modal', async () => {
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });
			setupTest(<AddAttachmentsDropdown editorId={editor.id} />);

			const fileInput = screen.getByTestId('file-input');

			// Create small files (100KB each)
			const smallFile1 = createFileWithSize('small1.txt', 100000);
			const smallFile2 = createFileWithSize('small2.pdf', 100000, 'application/pdf');

			const fileList = {
				0: smallFile1,
				1: smallFile2,
				length: 2,
				item: (index: number): File | null => [smallFile1, smallFile2][index] || null
			};

			Object.defineProperty(fileInput, 'files', { value: fileList });

			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change(fileInput);

			// Modal should NOT appear for small files
			const modal = screen.queryByTestId('convert-to-smartlink-modal');
			expect(modal).not.toBeInTheDocument();

			// Files should be added to editor
			const updatedEditor = getEditor({ id: editor.id });
			expect(updatedEditor?.unsavedAttachments.length).toBeGreaterThan(0);
		});

		it('should show smartlink modal for large single file', async () => {
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });
			setupTest(<AddAttachmentsDropdown editorId={editor.id} />);

			const fileInput = screen.getByTestId('file-input');

			// Create a large file (20MB)
			const largeFile = createFileWithSize('large-video.mp4', 20000000, 'video/mp4');

			const fileList = {
				0: largeFile,
				length: 1,
				item: (): File => largeFile
			};

			Object.defineProperty(fileInput, 'files', { value: fileList });

			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change(fileInput);

			// Modal should appear
			await screen.findByTestId('convert-to-smartlink-modal');
		});

		it('should show smartlink modal when combined file size exceeds limit', async () => {
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });
			setupTest(<AddAttachmentsDropdown editorId={editor.id} />);

			const fileInput = screen.getByTestId('file-input');

			// Create multiple files that together exceed the limit
			// 3MB each * 3 files = 9MB, with BASE64 conversion (1.33x) = ~12MB > 10MB
			const file1 = createFileWithSize('doc1.pdf', 3000000, 'application/pdf');
			const file2 = createFileWithSize('doc2.pdf', 3000000, 'application/pdf');
			const file3 = createFileWithSize('doc3.pdf', 3000000, 'application/pdf');

			const fileList = {
				0: file1,
				1: file2,
				2: file3,
				length: 3,
				item: (index: number): File | null => [file1, file2, file3][index] || null
			};

			Object.defineProperty(fileInput, 'files', { value: fileList });

			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change(fileInput);

			// Modal should appear
			await screen.findByTestId('convert-to-smartlink-modal');
		});

		it('should handle different file types correctly', async () => {
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });
			setupTest(<AddAttachmentsDropdown editorId={editor.id} />);

			const fileInput = screen.getByTestId('file-input');

			// Create files of various types, all small
			const textFile = createFileWithSize('document.txt', 50000, 'text/plain');
			const pdfFile = createFileWithSize('report.pdf', 50000, 'application/pdf');
			const imageFile = createFileWithSize('photo.jpg', 50000, 'image/jpeg');
			const excelFile = createFileWithSize(
				'data.xlsx',
				50000,
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			);

			const fileList = {
				0: textFile,
				1: pdfFile,
				2: imageFile,
				3: excelFile,
				length: 4,
				item: (index: number): File | null =>
					[textFile, pdfFile, imageFile, excelFile][index] || null
			};

			Object.defineProperty(fileInput, 'files', { value: fileList });

			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change(fileInput);

			// No modal should appear for small files
			const modal = screen.queryByTestId('convert-to-smartlink-modal');
			expect(modal).not.toBeInTheDocument();
		});

		it('should respect BASE_64_CONVERSION_RATE in size calculation', async () => {
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });
			setupTest(<AddAttachmentsDropdown editorId={editor.id} />);

			const fileInput = screen.getByTestId('file-input');

			// Create a file that's just under the limit without conversion
			// but exceeds it with BASE64 conversion (1.33x)
			// 8MB * 1.33 = 10.64MB > 10MB limit
			const file = createFileWithSize('borderline.zip', 8000000, 'application/zip');

			const fileList = {
				0: file,
				length: 1,
				item: (): File => file
			};

			Object.defineProperty(fileInput, 'files', { value: fileList });

			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.change(fileInput);

			// Modal should appear because of BASE64 conversion
			await screen.findByTestId('convert-to-smartlink-modal');
		});

		it('should handle empty file selection gracefully', async () => {
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });
			setupTest(<AddAttachmentsDropdown editorId={editor.id} />);

			const fileInput = screen.getByTestId('file-input');

			const emptyFileList = {
				length: 0,
				item: (): File | null => null
			};

			Object.defineProperty(fileInput, 'files', { value: emptyFileList });

			expect(() => {
				// eslint-disable-next-line testing-library/prefer-user-event
				fireEvent.change(fileInput);
			}).not.toThrow();

			// No modal should appear
			const modal = screen.queryByTestId('convert-to-smartlink-modal');
			expect(modal).not.toBeInTheDocument();
		});
	});

	describe('Original Attachments', () => {
		it('should not display original attachments option for new message', async () => {
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });
			const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
			const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
			await user.click(dropdownIcon);

			expect(
				screen.queryByText(TESTID_SELECTORS.composer.attachmentAddOriginal)
			).not.toBeInTheDocument();
		});

		it('should not display original attachments option when replying to message without attachments', async () => {
			const originalMessage = generateMessage({});
			const editor = generateReplyMsgEditor(originalMessage);
			setupEditorStore({ editors: [editor] });
			const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
			const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
			await user.click(dropdownIcon);

			expect(
				screen.queryByText(TESTID_SELECTORS.composer.attachmentAddOriginal)
			).not.toBeInTheDocument();
		});

		it('should display original attachments option when replying to message with attachments', async () => {
			const attachments = [
				{
					name: '1',
					contentType: 'multipart/mixed',
					size: 500,
					parts: [
						{
							name: '1.1',
							contentType: 'text/plain',
							size: 100
						},
						{
							name: '1.2',
							disposition: 'attachment' as const,
							contentType: 'application/pdf',
							filename: 'document.pdf',
							size: 200
						}
					]
				}
			];
			const originalMessage = generateMessage({ parts: attachments });
			const editor = generateReplyMsgEditor(originalMessage);
			setupEditorStore({ editors: [editor] });
			const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
			const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
			await user.click(dropdownIcon);
			expect(screen.getByText(TESTID_SELECTORS.composer.attachmentAddOriginal)).toBeVisible();
		});

		it('should add original attachments to editor when clicking the option', async () => {
			const attachmentParts = [
				{
					name: '1',
					contentType: 'multipart/mixed',
					size: 500,
					parts: [
						{
							name: '1.1',
							contentType: 'text/plain',
							size: 100
						},
						{
							name: '1.2',
							disposition: 'attachment' as const,
							contentType: 'application/pdf',
							filename: 'document.pdf',
							size: 200
						}
					]
				}
			];
			const originalMessage = generateMessage({ parts: attachmentParts });
			const editor = generateReplyMsgEditor(originalMessage);
			setupEditorStore({ editors: [editor] });
			const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);

			// Initially, editor should have no saved standard attachments
			const initialEditor = getEditor({ id: editor.id });
			const initialStandardAttachments = initialEditor?.savedAttachments.filter(
				(att) => !att.isInline && !att.contentId
			);
			expect(initialStandardAttachments).toHaveLength(0);

			// Click dropdown and select original attachments option
			const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
			await user.click(dropdownIcon);
			await user.click(screen.getByText(TESTID_SELECTORS.composer.attachmentAddOriginal));

			// Now editor should have the original attachments
			const updatedEditor = getEditor({ id: editor.id });
			const standardAttachments = updatedEditor?.savedAttachments.filter(
				(att) => !att.isInline && !att.contentId
			);
			expect(standardAttachments).toBeDefined();
			expect(standardAttachments!.length).toBeGreaterThan(0);
		});

		it('should only add standard attachments and not inline attachments from original message', async () => {
			const attachmentsStandardAndInline = [
				{
					name: '1',
					contentType: 'multipart/mixed',
					size: 700,
					parts: [
						{
							name: '1.1',
							contentType: 'text/html',
							size: 100
						},
						{
							name: '1.2',
							disposition: 'attachment' as const,
							contentType: 'application/pdf',
							filename: 'document.pdf',
							size: 200
						},
						{
							name: '1.3',
							disposition: 'inline' as const,
							contentType: 'image/png',
							filename: 'image.png',
							ci: '<image123@mail>',
							size: 300
						}
					]
				}
			];
			const originalMessage = generateMessage({ parts: attachmentsStandardAndInline });
			const editor = generateReplyMsgEditor(originalMessage);
			setupEditorStore({ editors: [editor] });
			const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);

			const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
			await user.click(dropdownIcon);
			await user.click(screen.getByText(TESTID_SELECTORS.composer.attachmentAddOriginal));

			const updatedEditor = getEditor({ id: editor.id });
			const addedAttachments = updatedEditor?.savedAttachments.filter(
				(att) => !att.isInline && !att.contentId
			);

			expect(addedAttachments!.length).toBeGreaterThan(0);

			addedAttachments?.forEach((att) => {
				expect(att.isInline).toBeFalsy();
				expect(att.contentId).toBeUndefined();
			});
		});
		it('should not display original attachments option if the originalMessage in editor is undefined', async () => {
			const attachmentParts = [
				{
					name: '1',
					contentType: 'multipart/mixed',
					size: 200,
					parts: [
						{
							name: '1.1',
							disposition: 'attachment' as const,
							contentType: 'application/pdf',
							filename: 'document.pdf',
							size: 200
						}
					]
				}
			];
			const originalMessage = generateMessage({ parts: attachmentParts });
			let editor = generateReplyMsgEditor(originalMessage);
			editor = { ...editor, originalMessage: undefined };

			setupEditorStore({ editors: [editor] });
			const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
			const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
			await user.click(dropdownIcon);

			expect(
				screen.queryByText(TESTID_SELECTORS.composer.attachmentAddOriginal)
			).not.toBeInTheDocument();
		});
	});

	describe('External providers', () => {
		it('should not display any external item when no providers are registered', async () => {
			(useActions as Mock).mockReturnValue([]);
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });
			const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
			const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
			await user.click(dropdownIcon);

			expect(screen.queryByText('Add from Nextcloud')).not.toBeInTheDocument();
		});

		it('should not display any external item when useActions returns undefined', async () => {
			(useActions as Mock).mockReturnValue(undefined);
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });
			const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
			const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
			await user.click(dropdownIcon);

			expect(screen.queryByText('Add from Nextcloud')).not.toBeInTheDocument();
		});

		it('should display an item for each registered external provider', async () => {
			(useActions as Mock).mockReturnValue([
				{
					id: 'nextcloud',
					label: 'Add from Nextcloud',
					icon: 'CloudUploadOutline',
					execute: vi.fn()
				},
				{ id: 'docs', label: 'Add from Docs', icon: 'FileTextOutline', execute: vi.fn() }
			]);
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });
			const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
			const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
			await user.click(dropdownIcon);

			expect(screen.getByText('Add from Nextcloud')).toBeVisible();
			expect(screen.getByText('Add from Docs')).toBeVisible();
		});

		it('should call execute on the provider when the user clicks its item', async () => {
			const mockExecute = vi.fn();
			(useActions as Mock).mockReturnValue([
				{
					id: 'nextcloud',
					label: 'Add from Nextcloud',
					icon: 'CloudUploadOutline',
					execute: mockExecute
				}
			]);
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });
			const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
			const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
			await user.click(dropdownIcon);
			await user.click(screen.getByText('Add from Nextcloud'));

			expect(mockExecute).toHaveBeenCalledTimes(1);
		});
	});
});
