/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import axios, { AxiosResponse } from 'axios';

type FileUploadSuccessResponse = {
	nodeId: string;
};

// this encode function is currently being used by carbonio-files-ui
function encodeBase64(str: string): string {
	// taken from https://stackoverflow.com/a/30106551/17280436
	// btoa is not enough for cyrillic
	// see also https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
	return btoa(
		encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) =>
			String.fromCharCode(parseInt(p1, 16))
		)
	);
}

export async function uploadToFiles(file: File): Promise<AxiosResponse<FileUploadSuccessResponse>> {
	const headers = {
		'Content-Type': file.type || 'application/octet-stream',
		'Content-Length': file.size,
		Filename: encodeBase64(file.name),
		ParentId: 'LOCAL_ROOT'
	};

	return axios.post('/services/files/upload', file, { headers });
}
