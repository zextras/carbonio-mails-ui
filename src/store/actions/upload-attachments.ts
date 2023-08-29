/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import axios from 'axios';
import { v4 as uuid } from 'uuid';

import { convertToDecimal } from '../../commons/utilities';

export type UploadAttachmentResponse = Array<{ aid: string } | null>;

function parse(str: string): Array<Array<{ aid: string }>> {
	// eslint-disable-next-line no-new-func
	return Function(`'use strict'; return (${str})`)();
}

export type UploadCallbacks = {
	onUploadProgress?: (uploadId: string, percentage: number) => void;
	onUploadComplete?: (uploadId: string, attachmentId: string) => void;
	onUploadError?: (uploadId: string, error: string) => void;
};

export type AttachmentUploadOptions = UploadCallbacks & {};

export const uploadAttachment = (
	file: File,
	{ onUploadProgress, onUploadComplete, onUploadError }: AttachmentUploadOptions
): {
	uploadId: string;
	abortController: AbortController;
} => {
	const uploadId: string = uuid();
	const abortController = new AbortController();

	axios
		.post('/service/upload?fmt=extended,raw', file, {
			headers: {
				'Cache-Control': 'no-cache',
				'X-Requested-With': 'XMLHttpRequest',
				'Content-Type': `${file.type || 'application/octet-stream'};`,
				'Content-Disposition': `attachment; filename="${convertToDecimal(file.name)}"`
			},
			onUploadProgress: (progressEvent) => {
				const { loaded, total } = progressEvent;
				const percent = total ? Math.round((loaded * 100) / total) : 0;
				if (percent < 100) {
					onUploadProgress && onUploadProgress(uploadId, percent);
				}
			},
			signal: abortController.signal
		})
		.then((res) => res.data)
		.then((txt) => parse(`[${txt}]`))
		.then((val) => {
			if (!val[2]) {
				onUploadError && onUploadError(uploadId, 'The upload process returned no aid');
				return;
			}

			onUploadComplete && onUploadComplete(uploadId, val[2][0].aid);
		})
		.catch((reason) => {
			onUploadError && onUploadError(uploadId, reason);
		});

	return {
		uploadId,
		abortController
	};
};
