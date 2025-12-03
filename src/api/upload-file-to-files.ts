/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type FileUploadSuccessResponse = {
	nodeId: string;
};

/**
 * Encodes a string into Base64 format, handling Unicode characters correctly.
 *
 * This function is necessary because the native `btoa` function does not handle
 * Unicode characters properly. It first encodes the string into a URI component
 * to escape special characters, then converts the escaped characters back to their
 * original form before applying `btoa`.
 *
 * References:
 * - https://stackoverflow.com/a/30106551/17280436
 * - https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
 *
 * @param {string} str - The input string to encode.
 * @returns {string} The Base64-encoded string.
 */
export function encodeBase64(str: string): string {
	return btoa(
		encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) =>
			String.fromCharCode(parseInt(p1, 16))
		)
	);
}
type UploadResult = {
	upload: Promise<string>;
	abortController: AbortController;
};

export function uploadToFiles({ file }: { file: File }): UploadResult {
	const abortController = new AbortController();

	const upload = async (): UploadResult['upload'] => {
		const headers = {
			'Content-Type': file.type || 'application/octet-stream',
			Filename: encodeBase64(file.name),
			ParentId: 'LOCAL_ROOT'
		};

		try {
			const response = await fetch('/services/files/upload', {
				method: 'POST',
				body: file,
				headers,
				signal: abortController.signal
			});

			const data = await response.json();

			if (!data?.nodeId || data.nodeId === '' || typeof data.nodeId !== 'string') {
				throw new Error('Upload successful but no valid nodeId returned');
			}

			return data.nodeId;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			throw new Error(`File upload failed: ${message}`);
		}
	};

	return {
		upload: upload(),
		abortController
	};
}
