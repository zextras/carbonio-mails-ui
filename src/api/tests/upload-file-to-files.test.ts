/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';

import {
	APIInterceptor,
	createAPIInterceptor
} from '@test-utils/network/msw/create-api-interceptor';
import { encodeBase64, uploadToFiles } from 'api/upload-file-to-files';

describe('encodeBase64', () => {
	it('should handle empty string', () => {
		expect(encodeBase64('')).toBe('');
	});

	it('should correctly encode ASCII filename', () => {
		expect(encodeBase64('document.txt')).toBe('ZG9jdW1lbnQudHh0');
	});

	it('encodes string with spaces and punctuation', () => {
		expect(encodeBase64('a b!c?')).toBe('YSBiIWM/');
	});

	it('should correctly encode Cyrillic filename', () => {
		expect(encodeBase64('документ.txt')).toBe('0LTQvtC60YPQvNC10L3Rgi50eHQ=');
	});

	it('should correctly encode mixed ASCII and Unicode', () => {
		expect(encodeBase64('file_привет_世界_🚀.txt')).toBe(
			'ZmlsZV/Qv9GA0LjQstC10YJf5LiW55WMX/CfmoAudHh0'
		);
	});

	it('encodes accented characters', () => {
		expect(encodeBase64('café')).toBe('Y2Fmw6k=');
	});

	it('should correctly encode emoji', () => {
		expect(encodeBase64('🚀🌟.png')).toBe('8J+agPCfjJ8ucG5n');
	});

	it('should handle space and special chars', () => {
		expect(encodeBase64('my file (1).txt')).toBe('bXkgZmlsZSAoMSkudHh0');
	});
	it('encodes long strings correctly', () => {
		const longStr = 'a'.repeat(1000);
		expect(atob(encodeBase64(longStr))).toBe(longStr);
	});
	it('matches native btoa for pure ASCII', () => {
		const str = 'ThisIsASCII123';
		expect(encodeBase64(str)).toBe(btoa(str));
	});
});

const baseRequest = (response: HttpResponse<any>): APIInterceptor =>
	createAPIInterceptor('post', '/services/files/upload', response);
const stubUploadToFilesApi = (data: { nodeId?: any }): APIInterceptor =>
	baseRequest(HttpResponse.json(data));
const stubUploadToFilesApiError = (error?: Error): APIInterceptor =>
	baseRequest(HttpResponse.error());

const stubUploadToFilesApiNullResponse = (): APIInterceptor => baseRequest(HttpResponse.json(null));

const waitResolution = (api: APIInterceptor): Promise<void> =>
	waitFor(() => {
		expect(api.getCalledTimes()).toBe(1);
	});

describe('uploadToFiles', () => {
	const file = new File(['content'], 'myfile.txt', { type: 'text/plain' });
	describe('happy path', () => {
		it('uploads file successfully and returns nodeId', async () => {
			const api = stubUploadToFilesApi({ nodeId: '12345' });

			const { upload } = uploadToFiles({ file });

			const nodeId = await upload;
			const { headers } = api.getLastRequest();
			expect(headers.get('Content-Type')).toBe('text/plain');
			expect(headers.get('Filename')).toBe(encodeBase64('myfile.txt'));
			expect(headers.get('ParentId')).toBe('LOCAL_ROOT');

			expect(nodeId).toBe('12345');
		});
		it('encodes filename using encodeBase64', async () => {
			const api = stubUploadToFilesApi({ nodeId: 'abc123' });

			const { upload } = uploadToFiles({ file });
			await upload;

			expect(api.getLastRequest().headers.get('Filename')).toBe(encodeBase64(file.name));
		});
		it('works with binary files', async () => {
			const binFile = new File([new ArrayBuffer(4)], 'image.png', {
				type: 'image/png'
			});
			const api = stubUploadToFilesApi({ nodeId: 'img321' });

			const { upload } = uploadToFiles({ file: binFile });
			const nodeId = await upload;

			expect(nodeId).toBe('img321');
			expect(api.getLastRequest().headers.get('Content-Type')).toBe('image/png');
		});
		it('falls back to application/octet-stream when file.type is empty', async () => {
			const customFile = new File(['abc'], 'noTypeFile.bin');
			const api = stubUploadToFilesApi({ nodeId: '98765' });

			const { upload } = uploadToFiles({ file: customFile });
			await upload;

			expect(api.getLastRequest().headers.get('Content-Type')).toBe('application/octet-stream');
		});
	});
	describe('error handling', () => {
		it('throws error if upload succeeds but no nodeId is returned', async () => {
			stubUploadToFilesApi({});
			const { upload } = uploadToFiles({ file });

			await expect(upload).rejects.toThrow(
				'File upload failed: Upload successful but no valid nodeId returned'
			);
		});

		it('throws error if axios.post rejects', async () => {
			stubUploadToFilesApiError();
			const { upload } = uploadToFiles({ file });
			await expect(upload).rejects.toThrow('File upload failed');
		});

		it('throws if the server answers with HTTP 2xx but data is null', async () => {
			stubUploadToFilesApiNullResponse();
			const { upload } = uploadToFiles({ file });

			await expect(upload).rejects.toThrow(
				'File upload failed: Upload successful but no valid nodeId returned'
			);
		});

		it('throws if the server returns HTTP 4xx/5xx without response payload (network failure)', async () => {
			stubUploadToFilesApiError(new Error('ECONNREFUSED'));

			await expect(uploadToFiles({ file }).upload).rejects.toThrow('File upload failed');
		});

		it('throws if nodeId is an empty string (falsy but not undefined)', async () => {
			stubUploadToFilesApi({ nodeId: '' });
			await expect(uploadToFiles({ file }).upload).rejects.toThrow(
				'File upload failed: Upload successful but no valid nodeId returned'
			);
		});

		it('throws if nodeId is not a string', async () => {
			stubUploadToFilesApi({ nodeId: 123 });
			await expect(uploadToFiles({ file }).upload).rejects.toThrow(
				'File upload failed: Upload successful but no valid nodeId returned'
			);
		});
		it.skip('should abort the request when abortController.abort() is called', async () => {
			const api = stubUploadToFilesApi({ nodeId: '123' });
			const { upload, abortController } = uploadToFiles({ file });
			const s = await upload;
			expect(s).toBe('123');

			expect(api.getLastRequest()).toBe(
				expect.objectContaining({
					signal: abortController.signal
				})
			);

			abortController.abort();

			await expect(upload).rejects.toThrow();
			expect(abortController.signal.aborted).toBe(true);
		});
	});
});
