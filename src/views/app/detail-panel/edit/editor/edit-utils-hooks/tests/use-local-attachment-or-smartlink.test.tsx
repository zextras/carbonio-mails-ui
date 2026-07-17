/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { waitFor } from '@testing-library/react';

import { useLocalAttachmentOrSmartlink } from '../use-local-attachment-or-smartlink';
import { setupTest, screen } from '@test-setup';
import { useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';

const MAX_MESSAGE_SIZE = 10485760; // 10MB
const SMARTLINK_MODAL_TESTID = 'convert-to-smartlink-modal';
const TRIGGER_LABEL = 'add local files';

const createFileWithSize = (name: string, size: number, type = 'text/plain'): File => {
	const file = new File(['content'], name, { type });
	Object.defineProperty(file, 'size', { value: size });
	return file;
};

const HookProbe = ({ editorId, files }: { editorId: string; files: File[] }): React.JSX.Element => {
	const { addLocalFiles, maxAllowedMailSize } = useLocalAttachmentOrSmartlink({ editorId });
	return (
		<>
			<button
				onClick={(): void => {
					addLocalFiles(files);
				}}
				type="button"
			>
				{TRIGGER_LABEL}
			</button>
			<span data-testid="max-allowed-mail-size">{maxAllowedMailSize}</span>
		</>
	);
};

function setupHook({ editorSize = 0, files }: { editorSize?: number; files: File[] }): {
	user: ReturnType<typeof setupTest>['user'];
	editorId: string;
} {
	const settings = generateSettings({
		attrs: { zimbraMtaMaxMessageSize: `${MAX_MESSAGE_SIZE}` }
	});
	useUserSettings.mockReturnValue(settings);

	const editor = generateNewMessageEditor();
	editor.size = editorSize;
	setupEditorStore({ editors: [editor] });

	const { user } = setupTest(<HookProbe editorId={editor.id} files={files} />);
	return { user, editorId: editor.id };
}

function unsavedAttachmentFilenames(editorId: string): Array<string | undefined> {
	return (useEditorsStore.getState().editors[editorId]?.unsavedAttachments ?? []).map(
		(attachment) => attachment.filename
	);
}

describe('useLocalAttachmentOrSmartlink', () => {
	it('exposes the maximum allowed mail size from the user settings', () => {
		setupHook({ files: [] });

		expect(screen.getByTestId('max-allowed-mail-size')).toHaveTextContent(`${MAX_MESSAGE_SIZE}`);
	});

	it('attaches the files to the editor when the total size is below the limit', async () => {
		const files = [
			createFileWithSize('small1.txt', 100000),
			createFileWithSize('small2.txt', 100000)
		];
		const { user, editorId } = setupHook({ files });

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));

		expect(unsavedAttachmentFilenames(editorId)).toEqual(['small1.txt', 'small2.txt']);
		expect(screen.queryByTestId(SMARTLINK_MODAL_TESTID)).not.toBeInTheDocument();
	});

	it('opens the smart link modal instead of attaching when the total size exceeds the limit', async () => {
		const files = [createFileWithSize('large.zip', MAX_MESSAGE_SIZE)];
		const { user, editorId } = setupHook({ files });

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));

		expect(await screen.findByTestId(SMARTLINK_MODAL_TESTID)).toBeInTheDocument();
		expect(screen.getByText('Upload attachment as Smart Link')).toBeInTheDocument();
		expect(screen.getByText('Would you like to convert it into a Smart Link?')).toBeInTheDocument();
		expect(unsavedAttachmentFilenames(editorId)).toEqual([]);
	});

	it('accounts for the current editor size when deciding to open the modal', async () => {
		// The file alone is below the limit, but editor size + file size exceeds it
		const files = [createFileWithSize('medium.pdf', 4200000, 'application/pdf')];
		const { user, editorId } = setupHook({ editorSize: 5000000, files });

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));

		expect(await screen.findByTestId(SMARTLINK_MODAL_TESTID)).toBeInTheDocument();
		expect(unsavedAttachmentFilenames(editorId)).toEqual([]);
	});

	it('closes the modal without attaching when the user cancels', async () => {
		const files = [createFileWithSize('large.zip', MAX_MESSAGE_SIZE)];
		const { user, editorId } = setupHook({ files });

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));
		await screen.findByTestId(SMARTLINK_MODAL_TESTID);

		await user.click(screen.getByRole('button', { name: /cancel/i }));

		await waitFor(() => {
			expect(screen.queryByTestId(SMARTLINK_MODAL_TESTID)).not.toBeInTheDocument();
		});
		expect(unsavedAttachmentFilenames(editorId)).toEqual([]);
	});

	it('closes the modal when the close icon is clicked', async () => {
		const files = [createFileWithSize('large.zip', MAX_MESSAGE_SIZE)];
		const { user } = setupHook({ files });

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));
		await screen.findByTestId(SMARTLINK_MODAL_TESTID);

		await user.click(screen.getByTestId('icon: CloseOutline'));

		await waitFor(() => {
			expect(screen.queryByTestId(SMARTLINK_MODAL_TESTID)).not.toBeInTheDocument();
		});
	});
});
