/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import axios from 'axios';

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
	// taken from https://stackoverflow.com/a/30106551/17280436
	// btoa is not enough for cyrillic
	// see also https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
	return btoa(
		encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) =>
			String.fromCharCode(parseInt(p1, 16))
		)
	);
}

export async function uploadToFiles(file: File): Promise<string> {
	const headers = {
		'Content-Type': file.type || 'application/octet-stream',
		Filename: encodeBase64(file.name),
		ParentId: 'LOCAL_ROOT'
	};

	try {
		const response = await axios.post<FileUploadSuccessResponse>('/services/files/upload', file, {
			headers
		});

		if (
			!response.data?.nodeId ||
			response.data.nodeId === '' ||
			typeof response.data.nodeId !== 'string'
		) {
			throw new Error('Upload successful but no valid nodeId returned');
		}
		return response.data.nodeId;
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		throw new Error(`File upload failed: ${message}`);
	}
}
