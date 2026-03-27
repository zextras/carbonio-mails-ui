/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NameSpace } from '@zextras/carbonio-ui-soap-lib';

import { EditorAttachmentFiles } from 'types/editor';

export type IconColors = Array<{
	color: string;
	extension: string;
}>;

export type AttachmentType = {
	filename?: string;
	size: number;
	link: string;
	downloadlink: string;
	messageId: string;
	isEml?: boolean;
	part: string;
	iconColors: IconColors;
	att: EditorAttachmentFiles;
};

export type CopyToFileRequest = {
	_jsns: NameSpace;
	mid: string;
	part: string;
	destinationFolderId: string;
};

export type CopyToFileResponse = {
	status?: string;
	value?: Record<string, unknown>;
};
