/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import axios from 'axios';

import { convertToDecimal } from '../commons/utilities';

export type UploadAttachmentResponse = Array<{ aid: string } | null>;

function parse(str: string): Array<Array<{ aid: string }>> {
	// eslint-disable-next-line no-new-func
	return Function(`'use strict'; return (${str})`)();
}

export type UploadCallbacks = {
	onUploadProgress?: (file: File, uploadId: string, percentage: number) => void;
	onUploadComplete?: (file: File, uploadId: string, attachmentId: string) => void;
	onUploadError?: (file: File, uploadId: string, error: string) => void;
};

export type UploadAttachmentOptions = UploadCallbacks;

export type UploadAttachmentsOptions = UploadCallbacks & {
	onUploadsEnd?: (completedUploadsId: Array<string>, failedUploadsId: Array<string>) => void;
};

export type UploadAttachmentResult = {
	file: File;
	uploadId: string;
	abortController: AbortController;
};

/**
 * Uploads a single file to the server and returns the attachment ID.
 *
 * @param file - The file to be uploaded.
 * @returns A promise that resolves to an object containing the attachment ID (`aid`).
 */
export const uploadFileApi = async (file: File): Promise<{ aid: string }> => {
	const response = await axios.post('/service/upload?fmt=extended,raw&lbfums', file, {
		headers: {
			'Cache-Control': 'no-cache',
			'X-Requested-With': 'XMLHttpRequest',
			'Content-Type': `${file.type || 'application/octet-stream'};`,
			'Content-Disposition': `attachment; filename="${convertToDecimal(file.name)}"`
		}
	});
	if (response) {
		const val = parse(`[${response.data}]`);
		const { aid } = val[2][0];

		return {
			aid
		};
	}
	return { aid: 'no aid found' };
};
