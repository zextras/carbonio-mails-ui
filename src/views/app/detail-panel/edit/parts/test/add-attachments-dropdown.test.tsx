/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
import { forEach, reduce, times } from 'lodash';

import {
	getIntegratedFunction,
	useIntegratedFunction
} from '../../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { setupTest, screen } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { getEditor } from '../../../../../../store/zustand/editor';
import { generateNewMessageEditor } from '../../../../../../store/zustand/editor/editor-generators';
import { TESTID_SELECTORS } from '../../../../../../tests/constants';
import { setupEditorStore } from '../../../../../../tests/generators/editor-store';
import { generateStore } from '../../../../../../tests/generators/store';
import { FileNode } from '../../edit-utils-hooks/use-upload-from-files';
import { AddAttachmentsDropdown } from '../add-attachments-dropdown';

type FilesNode = { id: string; name: string; size: number; mime_type: string };
type FilesUploadResult = { attachmentId: string };

type SelectNodesFunction = ({
	confirmAction
}: {
	confirmAction: (nodes: Array<FileNode>) => void;
}) => void;

const generateFilesIntegrationMocks = (
	filesCount: number
): { nodes: Array<FilesNode>; attachments: Record<string, string> } => {
	const nodes = times<FilesNode>(filesCount, () => ({
		id: faker.string.uuid(),
		name: faker.system.fileName(),
		size: faker.number.int({ min: 1, max: 3_000_000 }),
		mime_type: faker.system.mimeType()
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
		const editor = generateNewMessageEditor(generateStore().dispatch);
		setupEditorStore({ editors: [editor] });
		setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		expect(screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown)).toBeVisible(();
	});

	it('should render a dropdown if the user clicks on the icon', async () => {
		const editor = generateNewMessageEditor(generateStore().dispatch);
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown)).toBeVisible();
	});

	it('should display an option to add files from the local file system', async () => {
		const editor = generateNewMessageEditor(generateStore().dispatch);
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.getByText('composer.attachment.local')).toBeVisible();
	});

	it('should not display an option to add files from Files if the "select-nodes" integration function is not available', async () => {
		getIntegratedFunction.mockImplementation((id: string) => [jest.fn(), id !== 'select-nodes']);
		useIntegratedFunction.mockImplementation((id: string) => [jest.fn(), id !== 'select-nodes']);
		const editor = generateNewMessageEditor(generateStore().dispatch);
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.queryByText('composer.attachment.files')).not.toBeInTheDocument();
	});

	it('should not display an option to add files from Files if the "upload-to-target-and-get-target-id" integration function is not available', async () => {
		getIntegratedFunction.mockImplementation((id: string) => [
			jest.fn(),
			id !== 'upload-to-target-and-get-target-id'
		]);
		useIntegratedFunction.mockImplementation((id: string) => [
			jest.fn(),
			id !== 'upload-to-target-and-get-target-id'
		]);
		const editor = generateNewMessageEditor(generateStore().dispatch);
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.queryByText('composer.attachment.files')).not.toBeInTheDocument();
	});

	it('should display an option to add files from Files if the "upload-to-target-and-get-target-id" and "select-nodes" integration functions are available', async () => {
		getIntegratedFunction.mockImplementation((id: string) => [jest.fn(), id === 'select-nodes']);
		useIntegratedFunction.mockImplementation((id: string) => [
			jest.fn(),
			id === 'upload-to-target-and-get-target-id'
		]);
		const editor = generateNewMessageEditor(generateStore().dispatch);
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.getByText('composer.attachment.files')).toBeVisible();
	});

	it('should not display an option to add a public link generated by Files if the "select-nodes" integration function is not available', async () => {
		getIntegratedFunction.mockImplementation((id: string) => [jest.fn(), id !== 'select-nodes']);
		useIntegratedFunction.mockImplementation((id: string) => [jest.fn(), id !== 'select-nodes']);
		const editor = generateNewMessageEditor(generateStore().dispatch);
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.queryByText('composer.attachment.url')).not.toBeInTheDocument();
	});

	it('should not display an option to add a public link generated by Files if the "get-link" integration function is not available', async () => {
		getIntegratedFunction.mockImplementation((id: string) => [jest.fn(), id !== 'get-link']);
		useIntegratedFunction.mockImplementation((id: string) => [jest.fn(), id !== 'get-link']);
		const editor = generateNewMessageEditor(generateStore().dispatch);
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.queryByText('composer.attachment.url')).not.toBeInTheDocument();
	});

	it('should display an option to add files from Files if the "get-link" and "select-nodes" integration functions are available', async () => {
		getIntegratedFunction.mockImplementation((id: string) => [jest.fn(), id === 'select-nodes']);
		useIntegratedFunction.mockImplementation((id: string) => [jest.fn(), id === 'get-link']);
		const editor = generateNewMessageEditor(generateStore().dispatch);
		setupEditorStore({ editors: [editor] });
		const { user } = setupTest(<AddAttachmentsDropdown editorId={editor.id} />);
		const dropdownIcon = screen.getByTestId(TESTID_SELECTORS.icons.attachmentDropdown);
		await user.click(dropdownIcon);
		expect(screen.getByText('composer.attachment.url')).toBeVisible();
	});

	describe('Actions', () => {
		describe('Add files from Files', () => {
			it('should update the store with the uploaded attachments', async () => {
				const FILES_COUNT = 4;
				const { attachments } = generateFilesIntegrationMocks(FILES_COUNT);

				const editor = generateNewMessageEditor(generateStore().dispatch);
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
		});
	});
});
