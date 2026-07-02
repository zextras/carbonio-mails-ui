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
import { ImportArchiveModal } from 'views/sidebar/import-archive-modal';

function makeFile(name: string, sizeBytes = 0): File {
	const file = new File([''], name);
	Object.defineProperty(file, 'size', { value: sizeBytes, configurable: true });
	return file;
}

const ARCHIVE_TGZ_FILENAME = 'archive.tgz';
const TGZ_FILE_TYPE_LABEL = 'modal.import_archive.file_type.tgz';

describe('ImportArchiveModal', () => {
	describe('file info block', () => {
		it('renders the file name', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
			setupTest(<ImportArchiveModal folder={folder} file={makeFile(ARCHIVE_TGZ_FILENAME)} />);

			expect(screen.getByText(ARCHIVE_TGZ_FILENAME)).toBeInTheDocument();
		});

		it('renders the TGZ file type description for a .tgz file', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
			setupTest(<ImportArchiveModal folder={folder} file={makeFile(ARCHIVE_TGZ_FILENAME)} />);

			expect(screen.getByText(TGZ_FILE_TYPE_LABEL)).toBeInTheDocument();
		});

		it('does not show the MBOX description for a .tgz file', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
			setupTest(<ImportArchiveModal folder={folder} file={makeFile(ARCHIVE_TGZ_FILENAME)} />);

			expect(screen.queryByText('modal.import_archive.file_type.mbox')).not.toBeInTheDocument();
		});

		it('renders the MBOX file type description for a .mbox file', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
			setupTest(<ImportArchiveModal folder={folder} file={makeFile('archive.mbox')} />);

			expect(screen.getByText('modal.import_archive.file_type.mbox')).toBeInTheDocument();
		});

		it('does not show the TGZ description for a .mbox file', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
			setupTest(<ImportArchiveModal folder={folder} file={makeFile('archive.mbox')} />);

			expect(screen.queryByText(TGZ_FILE_TYPE_LABEL)).not.toBeInTheDocument();
		});

		it('renders the ZIP file type description for a .zip file', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
			setupTest(<ImportArchiveModal folder={folder} file={makeFile('archive.zip')} />);

			expect(screen.getByText('modal.import_archive.file_type.zip')).toBeInTheDocument();
		});

		it('does not show the TGZ description for a .zip file', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
			setupTest(<ImportArchiveModal folder={folder} file={makeFile('archive.zip')} />);

			expect(screen.queryByText(TGZ_FILE_TYPE_LABEL)).not.toBeInTheDocument();
		});
	});

	describe('file size formatting', () => {
		it('renders the size in bytes when smaller than 1 KB', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX });
			setupTest(<ImportArchiveModal folder={folder} file={makeFile(ARCHIVE_TGZ_FILENAME, 500)} />);

			expect(screen.getByText('500 B')).toBeInTheDocument();
		});

		it('renders the size in KB when between 1 KB and 1 MB', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX });
			setupTest(
				<ImportArchiveModal folder={folder} file={makeFile(ARCHIVE_TGZ_FILENAME, 2 * 1024)} />
			);

			expect(screen.getByText('2.0 KB')).toBeInTheDocument();
		});

		it('renders the size in MB when between 1 MB and 1 GB', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX });
			setupTest(
				<ImportArchiveModal folder={folder} file={makeFile(ARCHIVE_TGZ_FILENAME, 3_000_000)} />
			);

			expect(screen.getByText('3.0 MB')).toBeInTheDocument();
		});

		it('renders the size in GB when 1 GB or larger', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX });
			setupTest(
				<ImportArchiveModal folder={folder} file={makeFile(ARCHIVE_TGZ_FILENAME, 2_000_000_000)} />
			);

			expect(screen.getByText('2.0 GB')).toBeInTheDocument();
		});
	});

	describe('destination block', () => {
		it('renders the translated name for the Inbox folder', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
			setupTest(<ImportArchiveModal folder={folder} file={makeFile(ARCHIVE_TGZ_FILENAME)} />);

			expect(screen.getByText('folders.inbox')).toBeInTheDocument();
		});

		it('renders the folder name for a custom (non-system) folder', () => {
			const folder = generateFolder({ id: '100', name: 'MyCustomFolder' });
			setupTest(<ImportArchiveModal folder={folder} file={makeFile(ARCHIVE_TGZ_FILENAME)} />);

			expect(screen.getByText('MyCustomFolder')).toBeInTheDocument();
		});
	});

	describe('warning banner', () => {
		it('renders the warning banner', () => {
			const folder = generateFolder({ id: FOLDERS.INBOX, name: 'Inbox' });
			setupTest(<ImportArchiveModal folder={folder} file={makeFile(ARCHIVE_TGZ_FILENAME)} />);

			expect(screen.getByText('modal.import_archive.warning')).toBeInTheDocument();
		});
	});
});
