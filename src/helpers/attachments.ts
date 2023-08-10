/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AxiosProgressEvent } from 'axios';
import { findLast, reduce } from 'lodash';

import { getUpdateUploadProgress } from '../store/zustand/editor/hooks';
import type { EditorAttachmentFiles, MailMessagePart, MailsEditorV2 } from '../types';

export function findAttachments(
	parts: MailMessagePart[],
	acc: Array<EditorAttachmentFiles>
): Array<EditorAttachmentFiles> {
	return reduce(
		parts,
		(found, part: MailMessagePart) => {
			if (part && (part.disposition === 'attachment' || part.disposition === 'inline') && part.ci) {
				found.push(part);
			}
			if (part.parts) return findAttachments(part.parts, found);
			return acc;
		},
		acc
	);
}

export type OnUploadProgressProps = {
	editorId: MailsEditorV2['id'];
	file: File;
	attachmentFiles: MailsEditorV2['attachmentFiles'];
	progressEvent: AxiosProgressEvent;
};

export function onUploadProgress({
	editorId,
	file,
	attachmentFiles,
	progressEvent
}: OnUploadProgressProps): void {
	const percentCompleted =
		progressEvent.total && Math.round((progressEvent.loaded * 100) / progressEvent.total);
	if (percentCompleted) {
		const fileUploadingId = findLast(attachmentFiles, {
			name: file.name,
			size: file.size
		})?.id;
		if (fileUploadingId) {
			getUpdateUploadProgress({ editorId, fileUploadingId, percentCompleted });
		}
	}
}

export function findAttachmentFiles(
	parts: Array<MailMessagePart>,
	acc: Array<EditorAttachmentFiles>
): Array<EditorAttachmentFiles> {
	return reduce(
		parts,
		(found, part) => {
			if (part && part.disposition === 'attachment' && !part.ci) {
				found.push({ ...part, filename: part.filename ?? '' });
			}
			if (part.parts) return findAttachmentFiles(part.parts, found);
			return acc;
		},
		acc as Array<EditorAttachmentFiles>
	);
}
