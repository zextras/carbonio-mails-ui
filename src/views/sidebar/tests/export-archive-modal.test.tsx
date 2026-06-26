/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { ExportArchiveModal } from 'views/sidebar/export-archive-modal';

describe('ExportArchiveModal', () => {
	it('renders the TGZ format option', () => {
		const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
		setupTest(<ExportArchiveModal folder={folder} onFormatChange={vi.fn()} />);

		expect(screen.getByText('modal.export_archive.file_type.tgz')).toBeInTheDocument();
	});

	it('renders the ZIP format option', () => {
		const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
		setupTest(<ExportArchiveModal folder={folder} onFormatChange={vi.fn()} />);

		expect(screen.getByText('modal.export_archive.file_type.zip')).toBeInTheDocument();
	});

	it('calls onFormatChange with "zip" when the ZIP card is clicked', async () => {
		const onFormatChange = vi.fn();
		const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
		const { user } = setupTest(
			<ExportArchiveModal folder={folder} onFormatChange={onFormatChange} />
		);

		await user.click(screen.getByText('modal.export_archive.file_type.zip'));

		expect(onFormatChange).toHaveBeenCalledWith('zip');
	});

	it('calls onFormatChange with "tgz" when the TGZ card is clicked after switching to ZIP', async () => {
		const onFormatChange = vi.fn();
		const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
		const { user } = setupTest(
			<ExportArchiveModal folder={folder} onFormatChange={onFormatChange} />
		);

		await user.click(screen.getByText('modal.export_archive.file_type.zip'));
		await user.click(screen.getByText('modal.export_archive.file_type.tgz'));

		expect(onFormatChange).toHaveBeenLastCalledWith('tgz');
	});

	it('does not call onFormatChange on initial render', () => {
		const onFormatChange = vi.fn();
		const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
		setupTest(<ExportArchiveModal folder={folder} onFormatChange={onFormatChange} />);

		expect(onFormatChange).not.toHaveBeenCalled();
	});
});
