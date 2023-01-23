/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { includes, uniqBy } from 'lodash';
import { DefaultTheme } from 'styled-components';
import { calcColor, getFileExtension } from '../../../../../commons/utilities';
import {
	AttachmentPart,
	EditorAttachmentFiles,
	GetAttachmentsDownloadLinkProps,
	IconColors
} from '../../../../../types';

type GetAttachmentsLinkProps = {
	messageId: string;
	messageSubject: string;
	attachments: Array<string | undefined>;
	attachmentType: string | undefined;
};

export const getAttachmentsLink = ({
	messageId,
	messageSubject,
	attachments,
	attachmentType
}: GetAttachmentsLinkProps): string => {
	if (attachments.length > 1) {
		return `https://localhost:9000/service/home/~/?auth=co&id=${messageId}&filename=${messageSubject}&charset=UTF-8&part=${attachments.join(
			','
		)}&disp=a&fmt=zip`;
	}
	if (includes(['image/gif', 'image/png', 'image/jpeg', 'image/jpg'], attachmentType)) {
		return `https://localhost:9000/service/preview/image/${messageId}/${attachments.join(
			','
		)}/0x0/?quality=high`;
	}
	if (includes(['application/pdf'], attachmentType)) {
		return `https://localhost:9000/service/preview/pdf/${messageId}/${attachments.join(
			','
		)}/?first_page=1`;
	}
	if (
		includes(
			[
				'text/csv',
				'text/plain',
				'application/msword',
				'application/vnd.ms-excel',
				'application/vnd.ms-powerpoint',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'application/vnd.openxmlformats-officedocument.presentationml.presentation',
				'application/vnd.oasis.opendocument.spreadsheet',
				'application/vnd.oasis.opendocument.presentation',
				'application/vnd.oasis.opendocument.text'
			],
			attachmentType
		)
	) {
		return `https://localhost:9000/service/preview/document/${messageId}/${attachments.join(',')}`;
	}
	return `https://localhost:9000/service/home/~/?auth=co&id=${messageId}&part=${attachments.join(
		','
	)}&disp=a`;
};

export const getAttachmentsDownloadLink = ({
	messageId,
	messageSubject,
	attachments
}: GetAttachmentsDownloadLinkProps): string => {
	if (attachments?.length > 1) {
		return `https://localhost:9000/service/home/~/?auth=co&id=${messageId}&filename=${messageSubject}&charset=UTF-8&part=${attachments.join(
			','
		)}&disp=a&fmt=zip`;
	}
	return `https://localhost:9000/service/home/~/?auth=co&id=${messageId}&part=${attachments?.join(
		','
	)}&disp=a`;
};

export const getAttachmentIconColors = ({
	attachments,
	theme
}: {
	attachments: AttachmentPart[] | EditorAttachmentFiles[];
	theme: DefaultTheme;
}): IconColors =>
	uniqBy(
		attachments.map((att: AttachmentPart | EditorAttachmentFiles) => {
			const fileExtn = getFileExtension(att).value;
			const color = calcColor(att.contentType ?? '', theme);

			return {
				extension: fileExtn,
				color
			};
		}),
		'extension'
	);
