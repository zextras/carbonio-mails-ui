/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { SyntheticEvent } from 'react';

import { FOLDERS } from '@zextras/carbonio-ui-commons';
import type { Folder } from '@zextras/carbonio-ui-commons';

import { generateFolder } from '@test-utils/folders/folders-generator';
import { buildImportArchiveOnClick } from 'views/sidebar/use-folder-actions';

type Params = Parameters<typeof buildImportArchiveOnClick>[0];

function makeParams(folderOverrides?: Partial<Folder>): Params {
	return {
		folder: generateFolder({ id: FOLDERS.INBOX, absFolderPath: '/Inbox', ...folderOverrides }),
		name: 'user@example.com',
		createModal: vi.fn(),
		closeModal: vi.fn(),
		createSnackbar: vi.fn()
	};
}

function fakeEvent(): SyntheticEvent<HTMLElement, Event> {
	return { stopPropagation: vi.fn() } as unknown as SyntheticEvent<HTMLElement, Event>;
}

function getCapturedInput(appendSpy: ReturnType<typeof vi.spyOn>): HTMLInputElement {
	const call = (appendSpy.mock.calls as [Node][]).find(
		([node]) => node instanceof HTMLInputElement
	);
	if (!call) throw new Error('No file input was appended to document.body');
	return call[0] as HTMLInputElement;
}

function setInputFile(input: HTMLInputElement, file: File | null): void {
	Object.defineProperty(input, 'files', {
		value: file ? ({ 0: file, length: 1, item: () => file } as unknown as FileList) : null,
		configurable: true,
		writable: false
	});
}

describe('buildImportArchiveOnClick', () => {
	let appendSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		appendSpy = vi.spyOn(document.body, 'appendChild');
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	describe('file input creation', () => {
		it('appends a file input with accept=.tgz,.mbox,.zip to the body', () => {
			buildImportArchiveOnClick(makeParams())(fakeEvent());

			const input = getCapturedInput(appendSpy);
			expect(input.type).toBe('file');
			expect(input.accept).toBe('.tgz,.mbox,.zip');
		});

		it('removes the input and does not open the modal when no file is selected', () => {
			const params = makeParams();
			buildImportArchiveOnClick(params)(fakeEvent());

			const input = getCapturedInput(appendSpy);
			const removeSpy = vi.spyOn(input, 'remove');
			setInputFile(input, null);
			input.onchange?.({} as Event);

			expect(removeSpy).toHaveBeenCalled();
			expect(params.createModal).not.toHaveBeenCalled();
		});
	});

	describe('confirmation modal', () => {
		it('opens the modal with the correct title when a .tgz file is selected', () => {
			const params = makeParams();
			buildImportArchiveOnClick(params)(fakeEvent());

			const input = getCapturedInput(appendSpy);
			setInputFile(input, new File(['data'], 'archive.tgz'));
			input.onchange?.({} as Event);

			expect(params.createModal).toHaveBeenCalledWith(
				expect.objectContaining({ title: 'modal.import.title' })
			);
		});

		it('opens the modal with the correct title when a .mbox file is selected', () => {
			const params = makeParams();
			buildImportArchiveOnClick(params)(fakeEvent());

			const input = getCapturedInput(appendSpy);
			setInputFile(input, new File(['data'], 'archive.mbox'));
			input.onchange?.({} as Event);

			expect(params.createModal).toHaveBeenCalledWith(
				expect.objectContaining({ title: 'modal.import.title' })
			);
		});

		it('passes ImportArchiveModal as children with folder and file props', () => {
			const params = makeParams();
			buildImportArchiveOnClick(params)(fakeEvent());

			const input = getCapturedInput(appendSpy);
			const file = new File(['data'], 'archive.tgz');
			setInputFile(input, file);
			input.onchange?.({} as Event);

			const { children } = (params.createModal as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(children.props.folder).toBe(params.folder);
			expect(children.props.file).toBe(file);
		});

		it('closes the modal and removes the input when onClose is called', () => {
			const params = makeParams();
			buildImportArchiveOnClick(params)(fakeEvent());

			const input = getCapturedInput(appendSpy);
			setInputFile(input, new File(['data'], 'archive.tgz'));
			input.onchange?.({} as Event);

			const { onClose, id: modalId } = (params.createModal as ReturnType<typeof vi.fn>).mock
				.calls[0][0];
			const removeSpy = vi.spyOn(input, 'remove');
			onClose();

			expect(params.closeModal).toHaveBeenCalledWith(modalId);
			expect(removeSpy).toHaveBeenCalled();
		});
	});

	describe('startImport (onConfirm)', () => {
		function triggerImport(params: Params, file: File): { onConfirm: () => void; modalId: string } {
			buildImportArchiveOnClick(params)(fakeEvent());
			const input = getCapturedInput(appendSpy);
			setInputFile(input, file);
			input.onchange?.({} as Event);
			const { onConfirm, id: modalId } = (params.createModal as ReturnType<typeof vi.fn>).mock
				.calls[0][0];
			return { onConfirm, modalId };
		}

		it('closes the modal and shows the in-progress snackbar', () => {
			const params = makeParams();
			const { onConfirm, modalId } = triggerImport(params, new File(['data'], 'archive.tgz'));

			onConfirm();

			expect(params.closeModal).toHaveBeenCalledWith(modalId);
			expect(params.createSnackbar).toHaveBeenCalledWith(
				expect.objectContaining({
					key: 'import-archive',
					severity: 'info',
					label: 'messages.snackbar.import_archive_started'
				})
			);
		});

		it('POSTs the file to the correct URL with fmt=tgz for a .tgz archive', () => {
			const params = makeParams({ absFolderPath: '/Inbox', isLink: false });
			const file = new File(['data'], 'archive.tgz');
			const { onConfirm } = triggerImport(params, file);

			onConfirm();

			expect(global.fetch).toHaveBeenCalledWith(
				`${window.location.origin}/service/home/user@example.com/Inbox?fmt=tgz&auth=co`,
				expect.objectContaining({
					method: 'POST',
					body: file,
					headers: { 'Content-Type': 'application/x-compressed-tar' }
				})
			);
		});

		it('POSTs the file to the correct URL with fmt=mbox for a .mbox archive', () => {
			const params = makeParams({ absFolderPath: '/Inbox', isLink: false });
			const file = new File(['data'], 'archive.mbox');
			const { onConfirm } = triggerImport(params, file);

			onConfirm();

			expect(global.fetch).toHaveBeenCalledWith(
				`${window.location.origin}/service/home/user@example.com/Inbox?fmt=mbox&auth=co`,
				expect.objectContaining({
					method: 'POST',
					body: file,
					headers: { 'Content-Type': 'application/mbox' }
				})
			);
		});

		it('POSTs the file to the correct URL with fmt=zip for a .zip archive', () => {
			const params = makeParams({ absFolderPath: '/Inbox', isLink: false });
			const file = new File(['data'], 'archive.zip');
			const { onConfirm } = triggerImport(params, file);

			onConfirm();

			expect(global.fetch).toHaveBeenCalledWith(
				`${window.location.origin}/service/home/user@example.com/Inbox?fmt=zip&auth=co`,
				expect.objectContaining({
					method: 'POST',
					body: file,
					headers: { 'Content-Type': 'application/zip' }
				})
			);
		});

		it('uses folder.owner instead of the current user in the URL for linked folders', () => {
			const baseFolder = generateFolder({ id: '1:2', absFolderPath: '/SharedFolder' });
			const linkedFolder = { ...baseFolder, isLink: true, owner: 'owner@example.com' } as Folder;
			const params = { ...makeParams(), folder: linkedFolder };
			const { onConfirm } = triggerImport(params, new File(['data'], 'archive.tgz'));

			onConfirm();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/service/home/owner@example.com/'),
				expect.anything()
			);
		});

		it('shows success snackbar after a successful response', async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

			const params = makeParams();
			const { onConfirm } = triggerImport(params, new File(['data'], 'archive.tgz'));
			onConfirm();

			await vi.waitFor(() => {
				expect(params.createSnackbar).toHaveBeenCalledWith(
					expect.objectContaining({
						severity: 'success',
						label: 'messages.snackbar.import_archive_success'
					})
				);
			});
		});

		it('shows error snackbar when the server returns a non-ok response', async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

			const params = makeParams();
			const { onConfirm } = triggerImport(params, new File(['data'], 'archive.tgz'));
			onConfirm();

			await vi.waitFor(() => {
				expect(params.createSnackbar).toHaveBeenCalledWith(
					expect.objectContaining({
						severity: 'error',
						label: 'messages.snackbar.import_archive_error'
					})
				);
			});
		});

		it('shows generic error snackbar on network failure', async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network error'));

			const params = makeParams();
			const { onConfirm } = triggerImport(params, new File(['data'], 'archive.tgz'));
			onConfirm();

			await vi.waitFor(() => {
				expect(params.createSnackbar).toHaveBeenCalledWith(
					expect.objectContaining({
						severity: 'error',
						label: 'label.error_try_again'
					})
				);
			});
		});

		it('removes the file input after fetch completes', async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

			const params = makeParams();
			const { onConfirm } = triggerImport(params, new File(['data'], 'archive.tgz'));
			const input = getCapturedInput(appendSpy);
			const removeSpy = vi.spyOn(input, 'remove');

			onConfirm();

			await vi.waitFor(() => {
				expect(removeSpy).toHaveBeenCalled();
			});
		});
	});
});
