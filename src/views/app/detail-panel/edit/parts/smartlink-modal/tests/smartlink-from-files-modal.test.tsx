/* eslint-disable testing-library/no-node-access */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';

import { FileNode } from '../../../edit-utils-hooks/use-upload-from-files';
import { SmartlinkFromFilesModal } from '../smartlink-from-files-modal';
import { setupTest } from '@test-setup';
import { useIntegratedFunction } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { useEditorsStore } from 'store/editor';
import { generateEditor } from 'store/editor/editor-generators';
import { MailsEditorV2 } from 'types/editor';

describe('SmartlinkFromFilesModal', () => {
	const mockOnClose = vi.fn();
	const fileNode1: FileNode = {
		id: '1',
		name: 'file1.txt',
		size: 5000,
		mime_type: faker.system.mimeType(),
		__typename: 'File'
	};
	const fileNode2: FileNode = {
		id: '2',
		name: 'file2.txt',
		size: 5000,
		mime_type: faker.system.mimeType(),
		__typename: 'File'
	};

	it('renders modal with header, text, and footer buttons', () => {
		const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
		useEditorsStore.setState({ editors: { [editor.id]: editor } });
		setupTest(
			<SmartlinkFromFilesModal onClose={mockOnClose} editorId={editor.id} fileNodes={[fileNode1]} />
		);

		expect(screen.getByText('Upload attachment as Smart Link')).toBeInTheDocument();
		expect(screen.getByText('The attachment exceeds the size limit')).toBeInTheDocument();
		expect(screen.getByText('Would you like to convert it into a Smart Link?')).toBeInTheDocument();
		expect(screen.getByTestId('icon: CloseOutline')).toBeInTheDocument();
		expect(
			screen.getByRole('button', {
				name: /confirm/i
			})
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', {
				name: /cancel/i
			})
		).toBeInTheDocument();
	});

	it('calls onClose when Cancel button is clicked', async () => {
		const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
		useEditorsStore.setState({ editors: { [editor.id]: editor } });
		const { user } = setupTest(
			<SmartlinkFromFilesModal onClose={mockOnClose} editorId={editor.id} fileNodes={[fileNode1]} />
		);
		await user.click(screen.getByText('Cancel'));
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('calls onClose when the close modal icon is clicked', async () => {
		const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
		useEditorsStore.setState({ editors: { [editor.id]: editor } });
		const { user } = setupTest(
			<SmartlinkFromFilesModal onClose={mockOnClose} editorId={editor.id} fileNodes={[fileNode1]} />
		);
		await user.click(screen.getByTestId('icon: CloseOutline'));
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	describe('in richText mode', () => {
		it('correctly adds the smartlink url before the signature', async () => {
			const getLinkSpy = vi.fn().mockResolvedValue({ url: 'url1' });
			useIntegratedFunction.mockImplementation((integratedFunctionId: any) => {
				if (integratedFunctionId === 'get-link') {
					return [getLinkSpy, true];
				}

				return [vi.fn(), true];
			});
			createSoapAPIInterceptor('SaveDraft');

			const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
			useEditorsStore.setState({ editors: { [editor.id]: editor } });
			const { user } = setupTest(
				<SmartlinkFromFilesModal
					onClose={mockOnClose}
					editorId={editor.id}
					fileNodes={[fileNode1]}
				/>
			);

			const confirmButton = screen.getByRole('button', {
				name: /confirm/i
			});
			await user.click(confirmButton);

			expect(getLinkSpy).toHaveBeenCalledTimes(1);

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
			const getLinkSpy = vi
				.fn()
				.mockResolvedValueOnce({ url: 'url1' })
				.mockResolvedValueOnce({ url: 'url2' });
			useIntegratedFunction.mockImplementation((integratedFunctionId: any) => {
				if (integratedFunctionId === 'get-link') {
					return [getLinkSpy, true];
				}

				return [vi.fn(), true];
			});

			createSoapAPIInterceptor('SaveDraft');

			const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
			useEditorsStore.setState({ editors: { [editor.id]: editor } });
			const { user } = setupTest(
				<SmartlinkFromFilesModal
					onClose={mockOnClose}
					editorId={editor.id}
					fileNodes={[fileNode1, fileNode2]}
				/>
			);

			const confirmButton = screen.getByRole('button', {
				name: /confirm/i
			});
			await user.click(confirmButton);

			expect(getLinkSpy).toHaveBeenCalledTimes(2);

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
	});
	describe('in plainText mode', () => {
		it('correctly adds multiple smartlink urls at the end of the document', async () => {
			const getLinkSpy = vi
				.fn()
				.mockResolvedValueOnce({ url: 'url1' })
				.mockResolvedValueOnce({ url: 'url2' });
			useIntegratedFunction.mockImplementation((integratedFunctionId: any) => {
				if (integratedFunctionId === 'get-link') {
					return [getLinkSpy, true];
				}

				return [vi.fn(), true];
			});

			createSoapAPIInterceptor('SaveDraft');

			const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
			useEditorsStore.setState({ editors: { [editor.id]: editor } });
			const { user } = setupTest(
				<SmartlinkFromFilesModal
					onClose={mockOnClose}
					editorId={editor.id}
					fileNodes={[fileNode1, fileNode2]}
				/>
			);

			const confirmButton = screen.getByRole('button', {
				name: /confirm/i
			});
			await user.click(confirmButton);

			expect(getLinkSpy).toHaveBeenCalledTimes(2);

			const newEditor = useEditorsStore.getState()?.editors?.[editor.id];

			const newText = newEditor.text.plainText;
			await waitFor(() => {
				expect(newText).toBe(editor.text.plainText.concat('\nurl1\n').concat('url2'));
			});
			// intercepting the save draft snackbar to reach the lifecycle of the component
			// not interested in the outcome of the save draft, an error is acceptable for our purpose
			const errorSnackbar = await screen.findByText(/Something went wrong, please try again/);
			expect(errorSnackbar).toBeInTheDocument();
		});
	});

	describe('on api failure', () => {
		it('shows error snackbar and closes on API failure', async () => {
			const getLinkSpy = vi.fn().mockRejectedValue(new Error('API failure'));
			useIntegratedFunction.mockImplementation((integratedFunctionId: any) => {
				if (integratedFunctionId === 'get-link') {
					return [getLinkSpy, true];
				}

				return [vi.fn(), true];
			});
			createSoapAPIInterceptor('SaveDraft');

			const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
			useEditorsStore.setState({ editors: { [editor.id]: editor } });
			const { user } = setupTest(
				<SmartlinkFromFilesModal
					onClose={mockOnClose}
					editorId={editor.id}
					fileNodes={[fileNode1, fileNode2]}
				/>
			);

			const confirmButton = screen.getByRole('button', {
				name: /confirm/i
			});

			await user.click(confirmButton);

			expect(mockOnClose).toHaveBeenCalled();
			const errorSnackbar = await screen.findByText('Something went wrong, please try again');
			expect(errorSnackbar).toBeInTheDocument();
		});

		it('handles missing public link URL', async () => {
			const getLinkSpy = vi.fn().mockResolvedValue(null);
			useIntegratedFunction.mockImplementation((integratedFunctionId: any) => {
				if (integratedFunctionId === 'get-link') {
					return [getLinkSpy, true];
				}

				return [vi.fn(), true];
			});
			createSoapAPIInterceptor('SaveDraft');

			const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
			useEditorsStore.setState({ editors: { [editor.id]: editor } });
			const { user } = setupTest(
				<SmartlinkFromFilesModal
					onClose={mockOnClose}
					editorId={editor.id}
					fileNodes={[fileNode1, fileNode2]}
				/>
			);

			const confirmButton = screen.getByRole('button', {
				name: /confirm/i
			});
			await user.click(confirmButton);
			expect(mockOnClose).toHaveBeenCalled();
			const errorSnackbar = await screen.findByText('Something went wrong, please try again');
			expect(errorSnackbar).toBeInTheDocument();
		});
	});
});
