/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';

import { setupTest } from '@test-setup';
import { useAppContext } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { previewContextMock } from '@test-utils/carbonio-ui-preview';
import AttachmentsBlock from 'views/app/detail-panel/preview/attachments-block';

const CreateContactFakeComponent = (): React.JSX.Element => <></>;

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

	describe('Attachment actions visualization', () => {
		it('should not display expand button when there are 2 attachments', async () => {
			const attachments = [
				{
					contentType: 'image/gif',
					name: '1.2',
					filename: 'image.gif',
					size: 0
				},
				{
					contentType: 'application/pdf',
					name: '1.3',
					filename: 'test.pdf',
					size: 0
				}
			];
			const props = {
				messageSubject: 'any subject',
				messageId: '123',
				messageAttachments: attachments
			};

			setupTest(<AttachmentsBlock {...props} />);

			const expansionLink = screen.queryByTestId('attachment-list-expand-link');
			expect(expansionLink).not.toBeInTheDocument();
		});
		it('should display expand button when there are at least 3 attachment', async () => {
			const attachments = [
				{
					contentType: 'image/gif',
					name: '1.2',
					filename: 'image.gif',
					size: 0
				},
				{
					contentType: 'application/pdf',
					name: '1.3',
					filename: 'test.pdf',
					size: 0
				},
				{
					contentType: 'image/png',
					name: '1.4',
					filename: 'test.png',
					size: 0
				}
			];
			const props = {
				messageSubject: 'any subject',
				messageId: '123',
				messageAttachments: attachments
			};

			const { user } = setupTest(<AttachmentsBlock {...props} />);
			const expansionLink = await screen.findByTestId('attachment-list-expand-link');
			await user.click(expansionLink);
			expect(await screen.findByTestId('attachment-list-collapse-link')).toBeVisible();
		});

		it('displays remove/download and import contacts action when attachment is vcard', () => {
			const spyOn = vi.spyOn(shell, 'useIntegratedFunction');
			spyOn.mockImplementation((): [() => React.JSX.Element, boolean] => [
				CreateContactFakeComponent,
				true
			]);

			const filename = 'vcard.vcf';
			const attachments = [
				{
					contentType: 'text/vcard',
					name: '1.4',
					filename,
					size: 0
				}
			];
			const props = {
				messageSubject: 'any subject',
				messageId: '123',
				messageAttachments: attachments
			};

			setupTest(<AttachmentsBlock {...props} />);

			expect(screen.getByTestId(`remove-attachments-${filename}`)).toBeInTheDocument();
			expect(screen.getByTestId(`download-attachment-${filename}`)).toBeInTheDocument();
			expect(screen.getByTestId(`import-contacts-${filename}`)).toBeInTheDocument();
		});

		test.each`
			msgId  | attachmentType | contentType          | filename
			${'8'} | ${'GIF'}       | ${'image/gif'}       | ${'test.gif'}
			${'9'} | ${'PDF'}       | ${'application/pdf'} | ${'test.pdf'}
		`(
			`displays remove and download actions for $attachmentType in email preview`,
			async ({ msgId, contentType, filename }) => {
				const attachments = [
					{
						contentType,
						name: '1.2',
						filename,
						size: 0
					}
				];
				const props = {
					messageSubject: 'any subject',
					messageId: msgId,
					messageAttachments: attachments
				};

				setupTest(<AttachmentsBlock {...props} />);
				expect(screen.getByTestId(`remove-attachments-${filename}`)).toBeInTheDocument();
				expect(screen.getByTestId(`download-attachment-${filename}`)).toBeInTheDocument();
				expect(screen.getByTestId(`attachment-container-${filename}`)).toBeInTheDocument();
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
});
