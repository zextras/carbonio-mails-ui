/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { useAppContext } from '../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { previewContextMock } from '../../../../../carbonio-ui-commons/test/mocks/carbonio-ui-preview';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { getMsgAsyncThunk } from '../../../../../store/actions';
import { selectMessage } from '../../../../../store/messages-slice';
import { generateStore } from '../../../../../tests/generators/store';
import AttachmentsBlock from '../attachments-block';

describe('attachments-block', () => {
	test('carbonio-preview available, file is a pdf, tooltip says click to preview', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: ['carbonio-preview'] });
		const store = generateStore();
		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'large-document.pdf',
				size: 123,
				contentType: 'application/pdf',
				requiresSmartLinkConversion: false
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>,
			{ store }
		);

		await user.hover(screen.getByText('large-document.pdf'));

		expect(await screen.findByText('Click to preview')).toBeVisible();
	});
	test('carbonio-preview available, file is a document, tooltip says click to download', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: ['carbonio-preview'] });
		const store = generateStore();
		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'random.txt',
				size: 123,
				contentType: 'text/plain',
				requiresSmartLinkConversion: false
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>,
			{ store }
		);

		await user.hover(screen.getByText('random.txt'));

		expect(await screen.findByText('Click to download')).toBeVisible();
	});
	test('carbonio-preview not available, file is a pdf, tooltip says click to preview', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: [] });
		const store = generateStore();
		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'any-document.pdf',
				size: 123,
				contentType: 'application/pdf',
				requiresSmartLinkConversion: false
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>,
			{ store }
		);

		await user.hover(screen.getByText('any-document.pdf'));

		expect(await screen.findByText('Click to preview')).toBeVisible();
	});
	test('carbonio-preview available, file is a pdf, onclick call createPreview', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: ['carbonio-preview'] });
		const store = generateStore();
		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'any-document.pdf',
				size: 123,
				contentType: 'application/pdf',
				requiresSmartLinkConversion: false
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>,
			{ store }
		);

		await user.click(screen.getByText('any-document.pdf'));

		expect(previewContextMock.createPreview).toHaveBeenCalled();
	});
	test('carbonio-docs-editor available, file is a document, onclick call createPreview', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: ['carbonio-docs-editor'] });
		const store = generateStore();
		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'any-document.csv',
				size: 123,
				contentType: 'text/csv',
				requiresSmartLinkConversion: false
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>,
			{ store }
		);

		await user.click(screen.getByText('any-document.csv'));

		expect(previewContextMock.createPreview).toHaveBeenCalled();
	});
	test('carbonio-docs-editor available, file is a document, tooltip says click to preview', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: ['carbonio-docs-editor'] });
		const store = generateStore();
		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'document.csv',
				size: 123,
				contentType: 'text/csv',
				requiresSmartLinkConversion: false
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>,
			{ store }
		);

		await user.hover(screen.getByText('document.csv'));

		expect(await screen.findByText('Click to preview')).toBeVisible();
	});
	test('carbonio-docs-editor available, file is a pdf, tooltip says click to preview', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: ['carbonio-docs-editor'] });
		const store = generateStore();
		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'document.pdf',
				size: 123,
				contentType: 'application/pdf',
				requiresSmartLinkConversion: false
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>,
			{ store }
		);

		await user.hover(screen.getByText('document.pdf'));

		expect(await screen.findByText('Click to preview')).toBeVisible();
	});
	test('carbonio-docs-editor not available, file is a document, onclick wont call createPreview', async () => {
		useAppContext.mockReturnValue({ servicesCatalog: [] });
		const store = generateStore();
		const messageAttachments = [
			{
				cd: 'attachment',
				name: 'test',
				filename: 'large-document.csv',
				size: 123,
				contentType: 'text/csv',
				requiresSmartLinkConversion: false
			} as const
		];
		const { user } = setupTest(
			<AttachmentsBlock
				messageId={'1'}
				messageSubject={'test'}
				messageAttachments={messageAttachments}
			/>,
			{ store }
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
		const store = generateStore();

		// Invoke the fetch of the message and the store update
		await store.dispatch<any>(getMsgAsyncThunk({ msgId }));
		const state = store.getState();
		const message = selectMessage(state, msgId);

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
		const { user } = setupTest(<AttachmentsBlock {...props} />, { store });

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
			const store = generateStore();

			// Invoke the fetch of the message and the store update
			store.dispatch<any>(getMsgAsyncThunk({ msgId }));
			// await store.dispatch(getMsg({ msgId }));
			const state = store.getState();
			const message = selectMessage(state, msgId);
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
			const { user } = setupTest(<AttachmentsBlock {...props} />, { store });

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
