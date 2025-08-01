/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import axios from 'axios';

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

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('uploadToFiles', () => {
	const file = new File(['content'], 'myfile.txt', { type: 'text/plain' });
	describe('happy path', () => {
		it('uploads file successfully and returns nodeId', async () => {
			mockedAxios.post.mockResolvedValueOnce({
				data: { nodeId: '12345' }
			});

			const result = await uploadToFiles({ file });

			expect(mockedAxios.post).toHaveBeenCalledWith(
				'/services/files/upload',
				file,
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'text/plain',
						Filename: encodeBase64('myfile.txt'),
						ParentId: 'LOCAL_ROOT'
					})
				})
			);

			expect(result).toBe('12345');
		});
		it('encodes filename using encodeBase64', async () => {
			mockedAxios.post.mockResolvedValueOnce({ data: { nodeId: 'abc123' } });

			await uploadToFiles(file);

			expect(mockedAxios.post).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(File),
				expect.objectContaining({
					headers: expect.objectContaining({
						Filename: encodeBase64(file.name)
					})
				})
			);
		});
		it('works with binary files', async () => {
			const binFile = new File([new ArrayBuffer(4)], 'image.png', {
				type: 'image/png'
			});

			mockedAxios.post.mockResolvedValueOnce({ data: { nodeId: 'img321' } });

			const nodeId = await uploadToFiles(binFile);

			expect(nodeId).toBe('img321');
			expect(mockedAxios.post).toHaveBeenCalledWith(
				'/services/files/upload',
				binFile,
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'image/png'
					})
				})
			);
		});
		it('falls back to application/octet-stream when file.type is empty', async () => {
			const customFile = new File(['abc'], 'noTypeFile.bin');
			mockedAxios.post.mockResolvedValueOnce({ data: { nodeId: '98765' } });

			await uploadToFiles(customFile);

			expect(mockedAxios.post).toHaveBeenCalledWith(
				'/services/files/upload',
				customFile,
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'application/octet-stream'
					})
				})
			);
		});
	});
	describe('error handling', () => {
		it('throws error if upload succeeds but no nodeId is returned', async () => {
			mockedAxios.post.mockResolvedValueOnce({
				data: {}
			});

			await expect(uploadToFiles(file)).rejects.toThrow(
				'File upload failed: Upload successful but no valid nodeId returned'
			);
		});

		it('throws error if axios.post rejects', async () => {
			mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

			await expect(uploadToFiles(file)).rejects.toThrow('File upload failed');
		});
		it('throws if the server answers with HTTP 2xx but data is null', async () => {
			mockedAxios.post.mockResolvedValueOnce({ data: null });
			await expect(uploadToFiles(file)).rejects.toThrow(
				'File upload failed: Upload successful but no valid nodeId returned'
			);
		});

		it('throws if the server returns HTTP 4xx/5xx without response payload (network failure)', async () => {
			const networkError = new Error('ECONNREFUSED');
			(networkError as any).code = 'ECONNREFUSED';
			mockedAxios.post.mockRejectedValueOnce(networkError);

			await expect(uploadToFiles(file)).rejects.toThrow('File upload failed: ECONNREFUSED');
		});

		it('throws if nodeId is an empty string (falsy but not undefined)', async () => {
			mockedAxios.post.mockResolvedValueOnce({ data: { nodeId: '' } });
			await expect(uploadToFiles(file)).rejects.toThrow(
				'File upload failed: Upload successful but no valid nodeId returned'
			);
		});

		it('throws if nodeId is not a string', async () => {
			mockedAxios.post.mockResolvedValueOnce({ data: { nodeId: 123 } });
			await expect(uploadToFiles(file)).rejects.toThrow(
				'File upload failed: Upload successful but no valid nodeId returned'
			);
		});
	});
});
