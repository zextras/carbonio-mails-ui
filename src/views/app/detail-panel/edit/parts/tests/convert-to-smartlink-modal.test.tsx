/* eslint-disable testing-library/no-node-access */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { ConvertToSmartlinkModal } from '../convert-to-smartlink-modal';
import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { getPublicLinkUrl } from 'api/get-public-link-url';
import { uploadToFiles } from 'api/upload-file-to-files';
import { useEditorsStore } from 'store/editor';
import { generateEditor } from 'store/editor/editor-generators';
import { MailsEditorV2 } from 'types/editor';

jest.mock('api/upload-file-to-files', () => ({
	uploadToFiles: jest.fn()
}));
jest.mock('api/get-public-link-url', () => ({
	getPublicLinkUrl: jest.fn()
}));

describe('ConvertToSmartlinkModal', () => {
	const mockOnClose = jest.fn();

	const sampleFiles = [
		new File(['file1 content'], 'file1.txt'),
		new File(['file2 content'], 'file2.txt')
	];

	it('renders modal with header, text, and footer buttons', () => {
		const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
		useEditorsStore.setState({ editors: { [editor.id]: editor } });
		setupTest(
			<ConvertToSmartlinkModal onClose={mockOnClose} editorId={editor.id} files={sampleFiles} />
		);

		expect(screen.getByText('Attachments too large')).toBeInTheDocument();
		expect(screen.getByText('convert attachments to smart links?')).toBeInTheDocument();
		expect(screen.getByText('Create')).toBeInTheDocument();
		expect(screen.getByText('Cancel')).toBeInTheDocument();
	});

	it('calls onClose when Cancel is clicked', async () => {
		const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
		useEditorsStore.setState({ editors: { [editor.id]: editor } });
		const { user } = setupTest(
			<ConvertToSmartlinkModal onClose={mockOnClose} editorId={editor.id} files={sampleFiles} />
		);

		await user.click(screen.getByText('Cancel'));
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});
	describe('in richText mode', () => {
		it('correctly adds the smartlink url before the signature', async () => {
			(uploadToFiles as jest.Mock).mockResolvedValueOnce('uploadResult1');
			(getPublicLinkUrl as jest.Mock).mockResolvedValueOnce('url1');
			createSoapAPIInterceptor('SaveDraft');

			const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
			useEditorsStore.setState({ editors: { [editor.id]: editor } });
			const { user } = setupTest(
				<ConvertToSmartlinkModal
					onClose={mockOnClose}
					editorId={editor.id}
					files={[new File(['file1 content'], 'file1.txt')]}
				/>
			);

			const confirmButton = screen.getByRole('button', {
				name: /create/i
			});
			await user.click(confirmButton);

			expect(uploadToFiles).toHaveBeenCalledTimes(1);
			expect(getPublicLinkUrl).toHaveBeenCalledTimes(1);

			const newEditor = useEditorsStore.getState()?.editors?.[editor.id];

			const testDom = new DOMParser().parseFromString(newEditor.text.richText, 'text/html');

			const smartlink = testDom.querySelector('a') as Element;
			const signatureDiv = testDom.querySelector('.signature-div') as Element;

			// Test document position: smartlink should come before signatureDiv if both exist
			if (smartlink && signatureDiv) {
				const position = smartlink.compareDocumentPosition(signatureDiv);
				expect(position && Node.DOCUMENT_POSITION_FOLLOWING).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
			}

			// Test order in DOM tree
			const siblings = Array.from(testDom.body.children);
			const anchorIndex = siblings.indexOf(smartlink);
			const signatureIndex = siblings.indexOf(signatureDiv);

			if (anchorIndex !== -1 && signatureIndex !== -1) {
				expect(anchorIndex).toBeLessThan(signatureIndex);
			}
			// intercepting the save draft snackbar to reach the lifecycle of the component
			// not interested in the outcome of the save draft, an error is acceptable for our purpose
			const errorSnackbar = await screen.findByText(/Something went wrong, please try again/);
			expect(errorSnackbar).toBeInTheDocument();
		});
		it('correctly adds multiple smartlink urls before the signature', async () => {
			(uploadToFiles as jest.Mock)
				.mockResolvedValueOnce('uploadResult1')
				.mockResolvedValueOnce('uploadResult2');
			(getPublicLinkUrl as jest.Mock).mockResolvedValueOnce('url1').mockResolvedValueOnce('url2');
			createSoapAPIInterceptor('SaveDraft');

			const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
			useEditorsStore.setState({ editors: { [editor.id]: editor } });
			const { user } = setupTest(
				<ConvertToSmartlinkModal
					onClose={mockOnClose}
					editorId={editor.id}
					files={[
						new File(['file1 content'], 'file1.txt'),
						new File(['file2 content'], 'file2.txt')
					]}
				/>
			);

			const confirmButton = screen.getByRole('button', {
				name: /create/i
			});
			await user.click(confirmButton);

			expect(uploadToFiles).toHaveBeenCalledTimes(2);
			expect(getPublicLinkUrl).toHaveBeenCalledTimes(2);

			const newEditor = useEditorsStore.getState()?.editors?.[editor.id];

			const testDom = new DOMParser().parseFromString(newEditor.text.richText, 'text/html');

			const smartlinks = testDom.querySelectorAll('a');
			const smartlink1 = smartlinks[0] as Element;
			const smartlink2 = smartlinks[1] as Element;
			const signatureDiv = testDom.querySelector('.signature-div') as Element;

			// Test document position: smartlink1 should come before smartlink2
			const positionSmartLink1 = smartlink1.compareDocumentPosition(smartlink2);
			expect(positionSmartLink1 && Node.DOCUMENT_POSITION_FOLLOWING).toBe(
				Node.DOCUMENT_POSITION_FOLLOWING
			);
			// Test document position: smartlink2 should come before signatureDiv
			const positionSmartLink2 = smartlink2.compareDocumentPosition(signatureDiv);
			expect(positionSmartLink2 && Node.DOCUMENT_POSITION_FOLLOWING).toBe(
				Node.DOCUMENT_POSITION_FOLLOWING
			);

			// Test order in DOM tree
			const siblings = Array.from(testDom.body.children);
			const anchorIndex1 = siblings.indexOf(smartlink1);
			const anchorIndex2 = siblings.indexOf(smartlink2);
			const signatureIndex = siblings.indexOf(signatureDiv);

			expect(anchorIndex1).toBeLessThan(anchorIndex2);
			expect(anchorIndex2).toBeLessThan(signatureIndex);
			// intercepting the save draft snackbar to reach the lifecycle of the component
			// not interested in the outcome of the save draft, an error is acceptable for our purpose
			const errorSnackbar = await screen.findByText(/Something went wrong, please try again/);
			expect(errorSnackbar).toBeInTheDocument();
		});

		describe('on api failure', () => {
			it('shows error snackbar and closes on API failure', async () => {
				(uploadToFiles as jest.Mock).mockRejectedValueOnce(new Error('Upload failed'));
				createSoapAPIInterceptor('SaveDraft');

				const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
				useEditorsStore.setState({ editors: { [editor.id]: editor } });
				const { user } = setupTest(
					<ConvertToSmartlinkModal
						onClose={mockOnClose}
						editorId={editor.id}
						files={[
							new File(['file1 content'], 'file1.txt'),
							new File(['file2 content'], 'file2.txt')
						]}
					/>
				);

				await user.click(screen.getByText('Create'));

				expect(mockOnClose).toHaveBeenCalled();
				const errorSnackbar = screen.getByText('Something went wrong, please try again');
				expect(errorSnackbar).toBeInTheDocument();
			});

			it('handles missing public link URL', async () => {
				(uploadToFiles as jest.Mock).mockResolvedValue('uploadResult');
				(getPublicLinkUrl as jest.Mock).mockResolvedValue(null); // no URL

				createSoapAPIInterceptor('SaveDraft');

				const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
				useEditorsStore.setState({ editors: { [editor.id]: editor } });
				const { user } = setupTest(
					<ConvertToSmartlinkModal
						onClose={mockOnClose}
						editorId={editor.id}
						files={[
							new File(['file1 content'], 'file1.txt'),
							new File(['file2 content'], 'file2.txt')
						]}
					/>
				);

				await user.click(screen.getByText('Create'));
				expect(mockOnClose).toHaveBeenCalled();
				const errorSnackbar = screen.getByText('Something went wrong, please try again');
				expect(errorSnackbar).toBeInTheDocument();
			});
		});
	});
});
