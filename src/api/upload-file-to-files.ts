/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import axios from 'axios';

type FileUploadSuccessResponse = {
	nodeId: string;
};

// this encode function is currently being used by carbonio-files-ui
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
		const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
		throw new Error(`File upload failed: ${message}`);
	}
}
