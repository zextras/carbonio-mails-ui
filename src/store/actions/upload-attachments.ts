/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import axios from 'axios';
import { map, remove } from 'lodash';
import { v4 as uuid } from 'uuid';

import { convertToDecimal } from '../../commons/utilities';

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
 * Uploads a single file and provides a set of callbacks to be notified upon
 * progress, completion or failure of the upload
 *
 * @param file
 * @param options
 *
 * @return An object containing the given uploaded file, the assigned uploadId and
 * the AbortController to cancel the upload connection
 */
export const uploadAttachment = (
	file: File,
	options?: UploadAttachmentOptions
): UploadAttachmentResult => {
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
					options?.onUploadProgress && options?.onUploadProgress(file, uploadId, percent);
				}
			},
			signal: abortController.signal
		})
		.then((res) => res.data)
		.then((txt) => parse(`[${txt}]`))
		.then((val) => {
			if (!val[2]) {
				options?.onUploadError &&
					options?.onUploadError(file, uploadId, 'The upload process returned no aid');
				return;
			}

			options?.onUploadComplete && options?.onUploadComplete(file, uploadId, val[2][0].aid);
		})
		.catch((reason) => {
			options?.onUploadError && options?.onUploadError(file, uploadId, reason);
		});

	return {
		file,
		uploadId,
		abortController
	};
};

/**
 * Uploads a list of files and provides callback a set of callbacks to be notified upon
 * progress, completion or failure of the single upload, plus a callback to be
 * notified when all uploads end (with success of failure)
 *
 * @param files
 * @param options
 *
 * @return An array of objects containing, for each element, the given uploaded file, the assigned uploadId and
 * the AbortController to cancel the upload connection
 */
export const uploadAttachments = (
	files: Array<File>,
	options?: UploadAttachmentsOptions
): Array<UploadAttachmentResult> => {
	const runningUploads: Array<string> = [];
	const completedUploads: Array<string> = [];
	const failedUploads: Array<string> = [];

	const removeRunningUpload = (uploadId: string, reason: 'completed' | 'error'): void => {
		const removedUploadId = remove(
			runningUploads,
			(runningUploadId) => runningUploadId === uploadId
		)?.[0];

		if (!removedUploadId) {
			return;
		}

		reason === 'completed' && completedUploads.push(removedUploadId);
		reason === 'error' && failedUploads.push(removedUploadId);

		if (runningUploads.length === 0 && options?.onUploadsEnd) {
			options.onUploadsEnd(completedUploads, failedUploads);
		}
	};

	const customizedOptions: UploadAttachmentsOptions = {
		...options,
		onUploadComplete: (file, uploadId, attachmentId): void => {
			options?.onUploadComplete && options.onUploadComplete(file, uploadId, attachmentId);
			removeRunningUpload(uploadId, 'completed');
		},
		onUploadError: (file, uploadId, error): void => {
			options?.onUploadError && options.onUploadError(file, uploadId, error);
			removeRunningUpload(uploadId, 'error');
		}
	};

	const uploadsInfo = map(files, (file) => uploadAttachment(file, customizedOptions));

	// Populate the list of the running uploads
	uploadsInfo.forEach((uploadInfo) => {
		runningUploads.push(uploadInfo.uploadId);
	});

	return uploadsInfo;
};
