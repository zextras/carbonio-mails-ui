/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { waitFor } from '@testing-library/react';

import { useFilesAttachmentOrSmartlink } from '../use-files-attachment-or-smartlink';
import { FileNode } from '../use-upload-from-files';
import { setupTest, screen } from '@test-setup';
import { useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';

const MAX_MESSAGE_SIZE = 10485760; // 10MB
const SMARTLINK_MODAL_TESTID = 'convert-to-smartlink-modal';
const TRIGGER_LABEL = 'add files';

const createFileNode = (name: string, size: number): FileNode => ({
	id: `node-${name}`,
	name,
	size,
	mime_type: 'application/pdf',
	__typename: 'File'
});

const HookProbe = ({
	editorId,
	fileNodes,
	onUploadFiles
}: {
	editorId: string;
	fileNodes: FileNode[];
	onUploadFiles: (fileNodes: FileNode[]) => void;
}): React.JSX.Element => {
	const { addFilesFromFiles } = useFilesAttachmentOrSmartlink({ editorId, onUploadFiles });
	return (
		<button
			onClick={(): void => {
				addFilesFromFiles(fileNodes);
			}}
			type="button"
		>
			{TRIGGER_LABEL}
		</button>
	);
};

function setupHook({ editorSize = 0, fileNodes }: { editorSize?: number; fileNodes: FileNode[] }): {
	user: ReturnType<typeof setupTest>['user'];
	onUploadFiles: ReturnType<typeof vi.fn>;
} {
	const settings = generateSettings({
		attrs: { zimbraMtaMaxMessageSize: `${MAX_MESSAGE_SIZE}` }
	});
	useUserSettings.mockReturnValue(settings);

	const editor = generateNewMessageEditor();
	editor.size = editorSize;
	setupEditorStore({ editors: [editor] });

	const onUploadFiles = vi.fn();
	const { user } = setupTest(
		<HookProbe editorId={editor.id} fileNodes={fileNodes} onUploadFiles={onUploadFiles} />
	);
	return { user, onUploadFiles };
}

describe('useFilesAttachmentOrSmartlink', () => {
	it('uploads the files directly when the total size is below the limit', async () => {
		const fileNodes = [createFileNode('small1.pdf', 100000), createFileNode('small2.pdf', 100000)];
		const { user, onUploadFiles } = setupHook({ fileNodes });

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));

		expect(onUploadFiles).toHaveBeenCalledWith(fileNodes);
		expect(screen.queryByTestId(SMARTLINK_MODAL_TESTID)).not.toBeInTheDocument();
	});

	it('uploads directly an empty file list', async () => {
		const { user, onUploadFiles } = setupHook({ fileNodes: [] });

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));

		expect(onUploadFiles).toHaveBeenCalledWith([]);
		expect(screen.queryByTestId(SMARTLINK_MODAL_TESTID)).not.toBeInTheDocument();
	});

	it('opens the smart link modal when the total size exceeds the limit', async () => {
		const fileNodes = [createFileNode('large.pdf', MAX_MESSAGE_SIZE)];
		const { user, onUploadFiles } = setupHook({ fileNodes });

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));

		expect(await screen.findByTestId(SMARTLINK_MODAL_TESTID)).toBeInTheDocument();
		expect(screen.getByText('Upload attachment as Smart Link')).toBeInTheDocument();
		expect(screen.getByText('Would you like to convert it into a Smart Link?')).toBeInTheDocument();
		expect(onUploadFiles).not.toHaveBeenCalled();
	});

	it('accounts for the current editor size when deciding to open the modal', async () => {
		// The file alone is below the limit, but editor size + file size exceeds it
		const fileNodes = [createFileNode('medium.pdf', 4200000)];
		const { user, onUploadFiles } = setupHook({ editorSize: 5000000, fileNodes });

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));

		expect(await screen.findByTestId(SMARTLINK_MODAL_TESTID)).toBeInTheDocument();
		expect(onUploadFiles).not.toHaveBeenCalled();
	});

	it('closes the modal without uploading when the user cancels', async () => {
		const fileNodes = [createFileNode('large.pdf', MAX_MESSAGE_SIZE)];
		const { user, onUploadFiles } = setupHook({ fileNodes });

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));
		await screen.findByTestId(SMARTLINK_MODAL_TESTID);

		await user.click(screen.getByRole('button', { name: /cancel/i }));

		await waitFor(() => {
			expect(screen.queryByTestId(SMARTLINK_MODAL_TESTID)).not.toBeInTheDocument();
		});
		expect(onUploadFiles).not.toHaveBeenCalled();
	});

	it('closes the modal when the close icon is clicked', async () => {
		const fileNodes = [createFileNode('large.pdf', MAX_MESSAGE_SIZE)];
		const { user } = setupHook({ fileNodes });

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));
		await screen.findByTestId(SMARTLINK_MODAL_TESTID);

		await user.click(screen.getByTestId('icon: CloseOutline'));

		await waitFor(() => {
			expect(screen.queryByTestId(SMARTLINK_MODAL_TESTID)).not.toBeInTheDocument();
		});
	});
});
