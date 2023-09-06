/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export type AttachmentUploadProcessStatus = {
	status: 'completed' | 'running' | 'aborted';
	abortReason?: string;
	progress?: number;
};

export type AbstractAttachment = {
	filename: string;
	contentType: string;
	size: number;
	isInline: boolean;
	contentId?: string;
};
export type UnsavedAttachment = AbstractAttachment & {
	aid?: string;
	uploadId?: string;
	uploadStatus?: AttachmentUploadProcessStatus;
	uploadAbortController?: AbortController;
};
export type SavedAttachment = AbstractAttachment & {
	messageId: string;
	partName: string;
};
