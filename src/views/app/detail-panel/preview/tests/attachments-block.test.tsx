/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { useAppContext } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { previewContextMock } from '@test-utils/carbonio-ui-preview';
import { getMessageById } from 'store/emails/store';
import AttachmentsBlock from 'views/app/detail-panel/preview/attachments-block';

const CLICK_TO_DOWNLOAD = 'Click to download';

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

		expect(await screen.findByText(CLICK_TO_DOWNLOAD)).toBeVisible();
	});
	test('carbonio-preview not available, file is a pdf, tooltip says click to download', async () => {
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

		expect(await screen.findByText(CLICK_TO_DOWNLOAD)).toBeVisible();
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

		expect(previewContextMock.createPreview).toHaveBeenCalledWith(
			expect.objectContaining({
				src: `${window.location.origin}/service/preview/pdf/1/test/?first_page=1`
			})
		);
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
	test('carbonio-docs-editor available without carbonio-preview, file is a pdf, tooltip says click to download', async () => {
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

		expect(await screen.findByText(CLICK_TO_DOWNLOAD)).toBeVisible();
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

describe('Opening an attachment', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test.each`
		case                                                            | servicesCatalog         | part       | filename              | contentType
		${'an attachment without a preview of its own'}                 | ${[]}                   | ${'2'}     | ${'report.xsl'}       | ${'text/xsl'}
		${'a pdf without carbonio-preview'}                             | ${[]}                   | ${'2'}     | ${'any-document.pdf'} | ${'application/pdf'}
		${'an image without carbonio-preview'}                          | ${[]}                   | ${'2'}     | ${'picture.png'}      | ${'image/png'}
		${'a pdf in a nested part, which carbonio-preview cannot show'} | ${['carbonio-preview']} | ${'2.1.2'} | ${'nested.pdf'}       | ${'application/pdf'}
		${'a pdf the preview service does not convert'}                 | ${['carbonio-preview']} | ${'2'}     | ${'other.pdf'}        | ${'application/x-pdf'}
		${'an image the preview service does not convert'}              | ${['carbonio-preview']} | ${'2'}     | ${'vector.svg'}       | ${'image/svg+xml'}
	`(
		'$case is downloaded, not opened in a tab',
		async ({ servicesCatalog, part, filename, contentType }) => {
			useAppContext.mockReturnValue({ servicesCatalog });
			const clickSpy = vi
				.spyOn(HTMLAnchorElement.prototype, 'click')
				.mockImplementation(() => undefined);
			const messageAttachments = [
				{ cd: 'attachment' as const, name: part, filename, size: 123, contentType }
			];
			const { user } = setupTest(
				<AttachmentsBlock
					messageId={'1'}
					messageSubject={'test'}
					messageAttachments={messageAttachments}
				/>
			);

			await user.hover(screen.getByText(filename));
			expect(await screen.findByText(CLICK_TO_DOWNLOAD)).toBeVisible();
			await user.click(screen.getByText(filename));

			const openedUrls = clickSpy.mock.contexts.map((anchor) => (anchor as HTMLAnchorElement).href);
			expect(openedUrls).toEqual([
				`${window.location.origin}/service/home/~/?auth=co&id=1&part=${part}&disp=a`
			]);
			expect(previewContextMock.createPreview).not.toHaveBeenCalled();
		}
	);
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
