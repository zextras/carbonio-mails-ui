/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { filter, reduce, reject } from 'lodash';

import { areContentIdsEqual } from '../../commons/content-id-utils';
import { SavedAttachment, UnsavedAttachment } from 'types/attachments';

export const isSavedAttachment = (
	attachment: SavedAttachment | UnsavedAttachment
): attachment is SavedAttachment => 'partName' in attachment;

export const isUnsavedAttachment = (
	attachment: SavedAttachment | UnsavedAttachment
): attachment is UnsavedAttachment => !isSavedAttachment(attachment);

export const isAttachmentUploading = (attachment: UnsavedAttachment): boolean =>
	attachment.uploadStatus?.status === 'running';

export const filterSavedStandardAttachment = (
	attachments: Array<SavedAttachment>
): Array<SavedAttachment> => reject(attachments, 'isInline');

export const filterUnsavedStandardAttachment = (
	attachments: Array<UnsavedAttachment>
): Array<UnsavedAttachment> => reject(attachments, 'isInline');

export const filterSavedInlineAttachment = (
	attachments: Array<SavedAttachment>
): Array<SavedAttachment> => filter(attachments, 'isInline');

export const filterUnsavedInlineAttachment = (
	attachments: Array<UnsavedAttachment>
): Array<UnsavedAttachment> => filter(attachments, 'isInline');

export const getSavedInlineAttachmentByContentId = (
	contentId: string,
	savedAttachments: Array<SavedAttachment>
): SavedAttachment | null =>
	reduce<SavedAttachment, SavedAttachment | null>(
		savedAttachments,
		(result, attachment) =>
			attachment.isInline && areContentIdsEqual(attachment.contentId ?? '', contentId)
				? attachment
				: result,
		null
	);

const isContentIdWithinIdList = (contentId: string, idList: Array<string>): boolean =>
	reduce(idList, (result, id) => result || areContentIdsEqual(contentId, id), false);

export const getSavedInlineAttachmentsByContentId = (
	contentIds: Array<string>,
	savedAttachments: Array<SavedAttachment>
): Array<SavedAttachment> =>
	filter(
		savedAttachments,
		(attachment) =>
			attachment.isInline &&
			!!attachment.contentId &&
			isContentIdWithinIdList(attachment.contentId, contentIds)
	);

export const filterUnsavedAttachmentsByUploadId = (
	unsavedAttachments: Array<UnsavedAttachment>,
	uploadIds: Array<string>
): Array<UnsavedAttachment> =>
	filter(
		unsavedAttachments,
		(attachment) => attachment.uploadId !== undefined && uploadIds.includes(attachment.uploadId)
	);
