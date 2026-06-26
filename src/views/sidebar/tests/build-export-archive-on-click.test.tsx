/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { SyntheticEvent } from 'react';

import { FOLDERS } from '@zextras/carbonio-ui-commons';
import type { Folder } from '@zextras/carbonio-ui-commons';

import { generateFolder } from '@test-utils/folders/folders-generator';
import { buildExportArchiveOnClick } from 'views/sidebar/use-folder-actions';

type Params = Parameters<typeof buildExportArchiveOnClick>[0];

function makeParams(folderOverrides?: Partial<Folder>): Params {
	return {
		folder: generateFolder({ id: FOLDERS.INBOX, absFolderPath: '/Inbox', ...folderOverrides }),
		name: 'user@example.com',
		createModal: vi.fn(),
		closeModal: vi.fn()
	};
}

function fakeEvent(): SyntheticEvent<HTMLElement, Event> {
	return { stopPropagation: vi.fn() } as unknown as SyntheticEvent<HTMLElement, Event>;
}

function getDownloadedHref(appendSpy: ReturnType<typeof vi.spyOn>): string | undefined {
	const call = (appendSpy.mock.calls as [Node][]).find(
		([node]) => node instanceof HTMLAnchorElement
	);
	return call ? (call[0] as HTMLAnchorElement).href : undefined;
}

describe('buildExportArchiveOnClick', () => {
	let appendSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		appendSpy = vi.spyOn(document.body, 'appendChild');
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('modal opening', () => {
		it('opens the confirmation modal with the correct title', () => {
			const params = makeParams();
			buildExportArchiveOnClick(params)(fakeEvent());

			expect(params.createModal).toHaveBeenCalledWith(
				expect.objectContaining({ title: 'modal.export.title' })
			);
		});

		it('passes ExportArchiveModal as children with the correct folder', () => {
			const params = makeParams();
			buildExportArchiveOnClick(params)(fakeEvent());

			const { children } = (params.createModal as ReturnType<typeof vi.fn>).mock.calls[0][0];
			expect(children.props.folder).toBe(params.folder);
		});

		it('closes the modal when onClose is called', () => {
			const params = makeParams();
			buildExportArchiveOnClick(params)(fakeEvent());

			const { onClose, id: modalId } = (params.createModal as ReturnType<typeof vi.fn>).mock
				.calls[0][0];
			onClose();

			expect(params.closeModal).toHaveBeenCalledWith(modalId);
		});
	});

	describe('onConfirm — file download', () => {
		function triggerExport(params: Params): {
			onConfirm: () => void;
			onFormatChange: (fmt: string) => void;
		} {
			buildExportArchiveOnClick(params)(fakeEvent());
			const { onConfirm, children } = (params.createModal as ReturnType<typeof vi.fn>).mock
				.calls[0][0];
			return { onConfirm, onFormatChange: children.props.onFormatChange };
		}

		it('downloads a TGZ file by default when confirmed without changing format', () => {
			const params = makeParams({ id: FOLDERS.INBOX, name: 'Inbox' });
			const { onConfirm } = triggerExport(params);

			onConfirm();

			expect(getDownloadedHref(appendSpy)).toContain('fmt=tgz');
		});

		it('downloads a ZIP file when the ZIP format is selected before confirming', () => {
			const params = makeParams({ id: FOLDERS.INBOX, name: 'Inbox' });
			const { onConfirm, onFormatChange } = triggerExport(params);

			onFormatChange('zip');
			onConfirm();

			expect(getDownloadedHref(appendSpy)).toContain('fmt=zip');
		});

		it('includes the folder id in the TGZ download URL', () => {
			const params = makeParams({ id: FOLDERS.INBOX, name: 'Inbox' });
			const { onConfirm } = triggerExport(params);

			onConfirm();

			expect(getDownloadedHref(appendSpy)).toContain(`id=${params.folder.id}`);
		});

		it('includes the folder name with .tgz extension in the TGZ download URL', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
			const params = { ...makeParams(), folder };
			const { onConfirm } = triggerExport(params);

			onConfirm();

			expect(getDownloadedHref(appendSpy)).toContain(`filename=archive-${folder.name}.tgz`);
		});

		it('includes the folder name with .zip extension in the ZIP download URL', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
			const params = { ...makeParams(), folder };
			const { onConfirm, onFormatChange } = triggerExport(params);

			onFormatChange('zip');
			onConfirm();

			expect(getDownloadedHref(appendSpy)).toContain(`filename=archive-${folder.name}.zip`);
		});

		it('replaces spaces in the folder name with hyphens in the download URL', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX, name: 'My Folder' });
			const params = { ...makeParams(), folder };
			const { onConfirm } = triggerExport(params);

			onConfirm();

			expect(getDownloadedHref(appendSpy)).toContain('filename=archive-My-Folder.tgz');
		});

		it('uses folder.owner in the download URL for linked folders', () => {
			const base = generateFolder({ id: '1:2', absFolderPath: '/Shared' });
			const linkedFolder = { ...base, isLink: true, owner: 'owner@example.com' } as Folder;
			const params = { ...makeParams(), folder: linkedFolder };
			const { onConfirm } = triggerExport(params);

			onConfirm();

			expect(getDownloadedHref(appendSpy)).toContain('/service/home/owner@example.com/');
		});

		it('uses the current user name in the URL for non-linked folders', () => {
			const params = makeParams({ id: FOLDERS.INBOX, isLink: false });
			const { onConfirm } = triggerExport(params);

			onConfirm();

			expect(getDownloadedHref(appendSpy)).toContain('/service/home/user@example.com/');
		});

		it('closes the modal after confirming', () => {
			const params = makeParams();
			const { onConfirm } = triggerExport(params);
			const { id: modalId } = (params.createModal as ReturnType<typeof vi.fn>).mock.calls[0][0];

			onConfirm();

			expect(params.closeModal).toHaveBeenCalledWith(modalId);
		});
	});
});
