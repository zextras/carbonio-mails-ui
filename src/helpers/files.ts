/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const buildArrayFromFileList = (filesList: FileList): Array<File> => {
	const files: Array<File> = [];
	if (!filesList) {
		return files;
	}
	for (let fileIndex = 0; fileIndex < filesList.length; fileIndex += 1) {
		files.push(filesList[fileIndex]);
	}

	return files;
};

interface BlobInfo {
	id: () => string;
	name: () => string;
	filename: () => string;
	blob: () => Blob;
	base64: () => string;
	blobUri: () => string;
	uri: () => string | undefined;
}
export function blobToFile(blob: BlobInfo): File {
	return new File([blob.blob()], blob.filename(), { type: blob.blob().type });
}
