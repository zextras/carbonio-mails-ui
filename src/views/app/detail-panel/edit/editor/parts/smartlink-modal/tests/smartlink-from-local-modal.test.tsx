/* eslint-disable testing-library/no-node-access */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { SmartlinkFromLocalModal } from '../smartlink-from-local-modal';
import { setupTest } from '@test-setup';
import { useIntegratedFunction } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { uploadToFiles } from 'api/upload-file-to-files';
import { useEditorsStore } from 'store/editor';
import { generateEditor } from 'store/editor/editor-generators';
import { MailsEditorV2 } from 'types/editor';

function createDeferredPromise<T>(): {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (error: unknown) => void;
} {
	let resolve: (value: T) => void;
	let reject: (error: unknown) => void;

	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve: resolve!, reject: reject! };
}

vi.mock('api/upload-file-to-files');

describe('SmartlinkFromLocalModal', () => {
	const mockOnClose = vi.fn();

	const sampleFiles = [
		new File(['file1 content'], 'file1.txt'),
		new File(['file2 content'], 'file2.txt')
	];

	it('renders modal with header, text, and footer buttons', () => {
		const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
		useEditorsStore.setState({ editors: { [editor.id]: editor } });
		setupTest(
			<SmartlinkFromLocalModal onClose={mockOnClose} editorId={editor.id} files={sampleFiles} />
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

	it('calls onClose when Cancel is clicked', async () => {
		const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
		useEditorsStore.setState({ editors: { [editor.id]: editor } });
		const { user } = setupTest(
			<SmartlinkFromLocalModal onClose={mockOnClose} editorId={editor.id} files={sampleFiles} />
		);

		await user.click(screen.getByText('Cancel'));
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('shows uploading animation when files are being processed', async () => {
		const uploadDeferred = createDeferredPromise<string>();
		const publicLinkDeferred = createDeferredPromise<string>();

		// Mock uploadToFiles
		(uploadToFiles as Mock).mockReturnValue({
			upload: uploadDeferred.promise,
			abortController: new AbortController()
		});

		const getLinkSpy = vi.fn().mockReturnValue(publicLinkDeferred.promise);
		useIntegratedFunction.mockImplementation((integratedFunctionId: any) => {
			if (integratedFunctionId === 'get-link') {
				return [getLinkSpy, true];
			}

			return [vi.fn(), true];
		});

		const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
		useEditorsStore.setState({ editors: { [editor.id]: editor } });

		const { user } = setupTest(
			<SmartlinkFromLocalModal onClose={mockOnClose} editorId={editor.id} files={sampleFiles} />
		);

		const confirmButton = screen.getByRole('button', { name: /confirm/i });

		await user.click(confirmButton);

		// Now verify the loading state appears
		expect(await screen.findByText('Uploading attachment as Smart Link')).toBeInTheDocument();
		expect(
			screen.getByText('You are uploading a large attachment. This may take a moment, please wait')
		).toBeInTheDocument();
		expect(screen.getByText('Uploading')).toBeInTheDocument();
		expect(screen.getByTestId('icon: CloseOutline')).toBeInTheDocument();
		expect(
			screen.queryByRole('button', {
				name: /confirm/i
			})
		).not.toBeInTheDocument();
		expect(
			screen.getByRole('button', {
				name: /cancel/i
			})
		).toBeInTheDocument();
	});

	describe('in richText mode', () => {
		it('correctly adds the smartlink url before the signature', async () => {
			(uploadToFiles as Mock).mockReturnValueOnce({
				upload: Promise.resolve('uploadResult1'),
				abortController: new AbortController()
			});

			const getLinkSpy = vi.fn().mockResolvedValueOnce({ url: 'url1' });
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
				<SmartlinkFromLocalModal
					onClose={mockOnClose}
					editorId={editor.id}
					files={[new File(['file1 content'], 'file1.txt')]}
				/>
			);

			const confirmButton = screen.getByRole('button', {
				name: /confirm/i
			});
			await user.click(confirmButton);

			expect(uploadToFiles).toHaveBeenCalledTimes(1);
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
			(uploadToFiles as Mock)
				.mockReturnValueOnce({
					upload: Promise.resolve('uploadResult1'),
					abortController: new AbortController()
				})
				.mockReturnValueOnce({
					upload: Promise.resolve('uploadResult2'),
					abortController: new AbortController()
				});
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
				<SmartlinkFromLocalModal
					onClose={mockOnClose}
					editorId={editor.id}
					files={[
						new File(['file1 content'], 'file1.txt'),
						new File(['file2 content'], 'file2.txt')
					]}
				/>
			);

			const confirmButton = screen.getByRole('button', {
				name: /confirm/i
			});
			await user.click(confirmButton);

			expect(uploadToFiles).toHaveBeenCalledTimes(2);
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
			(uploadToFiles as Mock)
				.mockReturnValueOnce({
					upload: Promise.resolve('uploadResult1'),
					abortController: new AbortController()
				})
				.mockReturnValueOnce({
					upload: Promise.resolve('uploadResult2'),
					abortController: new AbortController()
				});
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
				<SmartlinkFromLocalModal
					onClose={mockOnClose}
					editorId={editor.id}
					files={[
						new File(['file1 content'], 'file1.txt'),
						new File(['file2 content'], 'file2.txt')
					]}
				/>
			);

			const confirmButton = screen.getByRole('button', {
				name: /confirm/i
			});
			await user.click(confirmButton);

			expect(uploadToFiles).toHaveBeenCalledTimes(2);
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
			(uploadToFiles as Mock).mockImplementation(() => ({
				upload: Promise.reject(new Error('Upload failed')),
				abortController: new AbortController()
			}));
			createSoapAPIInterceptor('SaveDraft');

			const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
			useEditorsStore.setState({ editors: { [editor.id]: editor } });
			const { user } = setupTest(
				<SmartlinkFromLocalModal
					onClose={mockOnClose}
					editorId={editor.id}
					files={[
						new File(['file1 content'], 'file1.txt'),
						new File(['file2 content'], 'file2.txt')
					]}
				/>
			);
			const confirmButton = screen.getByRole('button', {
				name: /confirm/i
			});

			await user.click(confirmButton);

			expect(mockOnClose).toHaveBeenCalled();
			const errorSnackbar = screen.getByText('Something went wrong, please try again');
			expect(errorSnackbar).toBeInTheDocument();
		});

		it('handles missing public link URL', async () => {
			(uploadToFiles as Mock).mockImplementation(() => ({
				upload: Promise.resolve('uploadResult'),
				abortController: new AbortController()
			}));

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
				<SmartlinkFromLocalModal
					onClose={mockOnClose}
					editorId={editor.id}
					files={[
						new File(['file1 content'], 'file1.txt'),
						new File(['file2 content'], 'file2.txt')
					]}
				/>
			);

			const confirmButton = screen.getByRole('button', {
				name: /confirm/i
			});
			await user.click(confirmButton);
			expect(mockOnClose).toHaveBeenCalled();
			const errorSnackbar = screen.getByText('Something went wrong, please try again');
			expect(errorSnackbar).toBeInTheDocument();
		});

		it('abort', async () => {
			const uploadDeferred = createDeferredPromise<string>();

			const abortController = new AbortController();

			(uploadToFiles as Mock).mockReturnValue({
				upload: uploadDeferred.promise,
				abortController
			});

			const editor = generateEditor({ action: 'new' }) as MailsEditorV2;
			useEditorsStore.setState({ editors: { [editor.id]: editor } });

			const { user } = setupTest(
				<SmartlinkFromLocalModal
					onClose={mockOnClose}
					editorId={editor.id}
					files={[
						new File(['file1 content'], 'file1.txt'),
						new File(['file2 content'], 'file2.txt')
					]}
				/>
			);

			const confirmButton = screen.getByRole('button', {
				name: /confirm/i
			});
			await user.click(confirmButton);

			await waitFor(() => {
				expect(uploadToFiles).toHaveBeenCalled();
			});

			const cancelButton = screen.getByRole('button', {
				name: /cancel/i
			});
			await user.click(cancelButton);

			expect(abortController.signal.aborted).toBe(true);
			const canceledError = new Error('Request aborted');
			canceledError.name = 'CanceledError';
			uploadDeferred.reject(canceledError);

			expect(mockOnClose).toHaveBeenCalled();

			await waitFor(() => {
				const errorSnackbar = screen.getByText(/upload cancelled/i);
				expect(errorSnackbar).toBeInTheDocument();
			});
		});
	});
});
