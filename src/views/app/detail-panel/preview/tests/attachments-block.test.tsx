/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { setupTest } from '@test-setup';
import {
	getIntegratedFunction,
	useActions,
	useAppContext,
	useIntegratedFunction
} from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { previewContextMock } from '@test-utils/carbonio-ui-preview';
import { getMessageById } from 'store/emails/store';
import AttachmentsBlock from 'views/app/detail-panel/preview/attachments-block';

describe('attachments-block', () => {
	test('carbonio-preview available, file is a pdf, tooltip says click to preview', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: ['carbonio-preview'] });
		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'large-document.pdf',
				size: 123,
				contentType: 'application/pdf'
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		await user.hover(screen.getByText('large-document.pdf'));

		expect(await screen.findByText('Click to preview')).toBeVisible();
	});
	test('carbonio-preview available, file is a document, tooltip says click to download', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: ['carbonio-preview'] });

		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'random.txt',
				size: 123,
				contentType: 'text/plain'
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		await user.hover(screen.getByText('random.txt'));

		expect(await screen.findByText('Click to download')).toBeVisible();
	});
	test('carbonio-preview not available, file is a pdf, tooltip says click to preview', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: [] });

		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'any-document.pdf',
				size: 123,
				contentType: 'application/pdf'
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		await user.hover(screen.getByText('any-document.pdf'));

		expect(await screen.findByText('Click to preview')).toBeVisible();
	});
	test('carbonio-preview available, file is a pdf, onclick call createPreview', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: ['carbonio-preview'] });

		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'any-document.pdf',
				size: 123,
				contentType: 'application/pdf'
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		await user.click(screen.getByText('any-document.pdf'));

		expect(previewContextMock.createPreview).toHaveBeenCalled();
	});
	test('carbonio-docs-editor available, file is a document, onclick call createPreview', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: ['carbonio-docs-editor'] });

		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'any-document.csv',
				size: 123,
				contentType: 'text/csv'
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		await user.click(screen.getByText('any-document.csv'));

		expect(previewContextMock.createPreview).toHaveBeenCalled();
	});
	test('carbonio-docs-editor available, file is a document, tooltip says click to preview', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: ['carbonio-docs-editor'] });

		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'document.csv',
				size: 123,
				contentType: 'text/csv'
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		await user.hover(screen.getByText('document.csv'));

		expect(await screen.findByText('Click to preview')).toBeVisible();
	});
	test('carbonio-docs-editor available, file is a pdf, tooltip says click to preview', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: ['carbonio-docs-editor'] });

		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'document.pdf',
				size: 123,
				contentType: 'application/pdf'
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		await user.hover(screen.getByText('document.pdf'));

		expect(await screen.findByText('Click to preview')).toBeVisible();
	});
	test('carbonio-docs-editor not available, file is a document, onclick wont call createPreview', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: [] });

		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'large-document.csv',
				size: 123,
				contentType: 'text/csv'
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		await user.click(screen.getByText('large-document.csv'));

		expect(previewContextMock.createPreview).not.toHaveBeenCalled();
	});
});

describe('Attachments visualization', () => {
	test.each`
		msgId  | attachmentType
		${'5'} | ${'MIME formatted mail PDF'}
		${'6'} | ${'MIME formatted mail inline images'}
		${'8'} | ${'GIF'}
		${'9'} | ${'PDF'}
	`(`$attachmentType attachments are visible in email preview`, async ({ msgId }) => {
		// Generate the store

		const message = getMessageById(msgId);
		// Get the attachment filename
		const filenames = message?.attachments?.map((attachment) => attachment.filename);
		if (!filenames) {
			return;
		}

		// Create the props for the component
		const props = {
			messageSubject: message.subject,
			messageId: message.id,
			messageAttachments: message.attachments
		};

		// Render the component
		const { user } = setupTest(<AttachmentsBlock {...props} />);

		// Check if the attachments list expansion link exists
		const expansionLink = screen.queryByTestId('attachment-list-expand-link');
		if (expansionLink) {
			await user.click(expansionLink);
			await screen.findByTestId('attachment-list-collapse-link');
		}

		// Check the visibility of the attachment blocks
		filenames.forEach((filename) => {
			try {
				screen.getByTestId(`attachment-container-${filename}`);
			} catch (e) {
				throw new Error(`The attachment block for the file ${filename} is not present`);
			}
		});
	});
});

describe('Attachment actions visualization', () => {
	test.each`
		msgId   | attachmentType
		${'8'}  | ${'GIF'}
		${'9'}  | ${'PDF'}
		${'14'} | ${'VCARD'}
	`(
		`$attachmentType attachments are visible in email preview`,
		async ({ msgId, attachmentType }) => {
			// Generate the store

			const message = getMessageById(msgId);

			// Get the attachment filename
			const filenames = message?.attachments?.map((attachment) => attachment.filename);

			if (!filenames) {
				return;
			}
			// Create the props for the component
			const props = {
				messageSubject: message.subject,
				messageId: message.id,
				messageAttachments: message.attachments
			};

			// Render the component
			const { user } = setupTest(<AttachmentsBlock {...props} />);

			// Check if the attachments list expansion link exists
			const expansionLink = screen.queryByTestId('attachment-list-expand-link');
			if (expansionLink) {
				await user.click(expansionLink);
				await screen.findByTestId('attachment-list-collapse-link');
			}

			// Check the visibility of the attachment actions icon
			filenames.forEach((filename) => {
				try {
					screen.getByTestId(`remove-attachments-${filename}`);
					screen.getByTestId(`download-attachment-${filename}`);
					if (attachmentType === 'VCARD') screen.getByTestId(`import-contacts-${filename}`);
				} catch (e) {
					throw new Error(
						`The attachment block or action icon for the file ${filename} is not present`
					);
				}
			});
		}
	);
});

describe('Attachment link validation', () => {
	test('preview is available, should call image preview endpoint when content type is image/tiff', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: ['carbonio-preview'] });

		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'image.tiff',
				size: 12345,
				contentType: 'image/tiff'
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		await user.hover(screen.getByText('image.tiff'));
		expect(await screen.findByText('Click to preview')).toBeVisible();

		await user.click(screen.getByText('image.tiff'));
		expect(previewContextMock.createPreview).toHaveBeenCalledTimes(1);

		const createPreviewParam = previewContextMock.createPreview.mock.calls[0][0];
		expect(createPreviewParam.src).toBe(
			'http://localhost/service/preview/image/1/test/0x0/?quality=high'
		);
	});
});

describe('External save attachment providers', () => {
	const messageAttachments = [
		{
			cd: 'attachment',
			name: 'part1',
			filename: 'report.pdf',
			size: 5000,
			contentType: 'application/pdf'
		} as const
	];

	beforeEach(() => {
		useAppContext.mockReturnValue({ servicesCatalog: [] });
	});

	afterEach(() => {
		(useActions as Mock).mockReturnValue([]);
	});

	test('provider label appears as a link in the footer when registered', () => {
		const mockExecute = vi.fn();
		(useActions as Mock).mockReturnValue([
			{
				id: 'save-to-external',
				label: 'Save to External',
				icon: 'CloudUploadOutline',
				execute: mockExecute
			}
		]);

		setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		expect(screen.getByText('Save to External')).toBeVisible();
	});

	test('clicking the provider footer link calls provider.execute()', async () => {
		const mockExecute = vi.fn();
		(useActions as Mock).mockReturnValue([
			{
				id: 'save-to-external',
				label: 'Save to External',
				icon: 'CloudUploadOutline',
				execute: mockExecute
			}
		]);

		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		await user.click(screen.getByText('Save to External'));
		expect(mockExecute).toHaveBeenCalledTimes(1);
	});

	test('provider item appears in attachment dropdown when registered', async () => {
		const mockExecute = vi.fn();
		(useActions as Mock).mockReturnValue([
			{
				id: 'save-to-external',
				label: 'Save to External Storage',
				icon: 'CloudUploadOutline',
				execute: mockExecute
			}
		]);

		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		// Before opening the dropdown only the footer link is present
		expect(screen.getAllByText('Save to External Storage')).toHaveLength(1);

		await user.click(screen.getByTestId('attachment-actions-report.pdf'));

		// After opening the dropdown both the footer link and the dropdown item are present
		expect(await screen.findAllByText('Save to External Storage')).toHaveLength(2);
	});

	test('clicking provider dropdown item calls provider.execute()', async () => {
		const mockExecute = vi.fn();
		(useActions as Mock).mockReturnValue([
			{
				id: 'save-to-external',
				label: 'Save to External Storage',
				icon: 'CloudUploadOutline',
				execute: mockExecute
			}
		]);

		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		await user.click(screen.getByTestId('attachment-actions-report.pdf'));
		// The dropdown item is a <div> while the footer link is an <a>
		const allItems = await screen.findAllByText('Save to External Storage');
		const dropdownItem = allItems.find((el) => el.tagName === 'DIV');
		if (!dropdownItem) throw new Error('Dropdown item not found');
		await user.click(dropdownItem);
		expect(mockExecute).toHaveBeenCalledTimes(1);
	});

	test('no provider items shown in footer when none registered', () => {
		(useActions as Mock).mockReturnValue([]);

		setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		expect(screen.queryByText('Save to External')).not.toBeInTheDocument();
	});
});

describe('Attachment actions dropdown button', () => {
	const messageAttachments = [
		{
			cd: 'attachment',
			name: 'part1',
			filename: 'report.pdf',
			size: 5000,
			contentType: 'application/pdf'
		} as const
	];

	beforeEach(() => {
		useAppContext.mockReturnValue({ servicesCatalog: [] });
	});

	test('hovering the actions button shows "View all actions" tooltip', async () => {
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		await user.hover(screen.getByTestId('attachment-actions-report.pdf'));
		expect(await screen.findByText('View all actions')).toBeVisible();
	});

	test('delete item is the last entry in the dropdown', async () => {
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		await user.click(screen.getByTestId('attachment-actions-report.pdf'));

		// Dropdown items are <div> elements; find Download and Delete in the dropdown
		const downloadItems = await screen.findAllByText('Download');
		const downloadInDropdown = downloadItems.find((el) => el.tagName !== 'A');
		const deleteInDropdown = screen.getByText('Delete');

		expect(downloadInDropdown).toBeDefined();
		// Delete should follow Download in document order (i.e. Delete is after Download)
		expect(
			// eslint-disable-next-line no-bitwise
			downloadInDropdown!.compareDocumentPosition(deleteInDropdown) &
				Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});
});

describe('Save to Files in attachment dropdown', () => {
	const messageAttachments = [
		{
			cd: 'attachment',
			name: 'part1',
			filename: 'report.pdf',
			size: 5000,
			contentType: 'application/pdf'
		} as const
	];

	beforeEach(() => {
		useAppContext.mockReturnValue({ servicesCatalog: [] });
	});

	afterEach(() => {
		(getIntegratedFunction as Mock).mockReturnValue([vi.fn(), false]);
	});

	test('Save to Files item appears in dropdown when select-nodes integration is available', async () => {
		(getIntegratedFunction as Mock).mockReturnValue([vi.fn(), true]);

		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		// Before opening dropdown, "Save to Files" link is present once in the footer
		expect(screen.getAllByText('Save to Files')).toHaveLength(1);

		await user.click(screen.getByTestId('attachment-actions-report.pdf'));

		// After opening dropdown, "Save to Files" appears in both footer and dropdown
		expect(await screen.findAllByText('Save to Files')).toHaveLength(2);
	});

	test('clicking Save to Files dropdown item calls uploadIntegration', async () => {
		const mockSelectNodes = vi.fn();
		(getIntegratedFunction as Mock).mockReturnValue([mockSelectNodes, true]);

		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		await user.click(screen.getByTestId('attachment-actions-report.pdf'));
		const allSaveItems = await screen.findAllByText('Save to Files');
		const dropdownItem = allSaveItems.find((el) => el.tagName === 'DIV');
		if (!dropdownItem) throw new Error('Save to Files dropdown item not found');
		await user.click(dropdownItem);
		expect(mockSelectNodes).toHaveBeenCalledTimes(1);
	});

	test('clicking Save to Files footer link calls uploadIntegration', async () => {
		const mockSelectNodes = vi.fn();
		(getIntegratedFunction as Mock).mockReturnValue([mockSelectNodes, true]);

		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>
		);

		// Only one "Save to Files" exists before the dropdown is opened (the footer link)
		await user.click(screen.getByText('Save to Files'));
		expect(mockSelectNodes).toHaveBeenCalledTimes(1);
	});
});

describe('Import to Contacts in attachment dropdown', () => {
	const vcardAttachments = [
		{
			cd: 'attachment',
			name: 'part1',
			filename: 'contact.vcf',
			size: 500,
			contentType: 'text/vcard'
		} as const
	];

	beforeEach(() => {
		useAppContext.mockReturnValue({ servicesCatalog: [] });
	});

	afterEach(() => {
		(useIntegratedFunction as Mock).mockReturnValue([vi.fn(), false]);
	});

	test('Import to Contacts item appears in dropdown for vcard when integration is available', async () => {
		(useIntegratedFunction as Mock).mockReturnValue([vi.fn(), true]);

		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={vcardAttachments}
			/>
		);

		await user.click(screen.getByTestId('attachment-actions-contact.vcf'));
		expect(await screen.findByText('Import to Contacts')).toBeVisible();
	});

	test('clicking Import to Contacts in dropdown calls the contact creation function', async () => {
		const mockCreateContact = vi.fn();
		(useIntegratedFunction as Mock).mockReturnValue([mockCreateContact, true]);

		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={vcardAttachments}
			/>
		);

		await user.click(screen.getByTestId('attachment-actions-contact.vcf'));
		await user.click(await screen.findByText('Import to Contacts'));
		expect(mockCreateContact).toHaveBeenCalledTimes(1);
	});

	test('Import to Contacts does not appear in dropdown when integration is not available', async () => {
		(useIntegratedFunction as Mock).mockReturnValue([vi.fn(), false]);

		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={vcardAttachments}
			/>
		);

		await user.click(screen.getByTestId('attachment-actions-contact.vcf'));
		await screen.findAllByText('Download');
		expect(screen.queryByText('Import to Contacts')).not.toBeInTheDocument();
	});
});
