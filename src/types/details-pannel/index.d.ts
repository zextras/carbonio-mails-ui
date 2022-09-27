/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type MailEditHeaderType = {
	folderId: string | number;
	header: string | undefined;
	toggleAppBoard: boolean;
	setToggleAppBoard: (arg: boolean) => void;
};

export type AttachmentType = {
	filename?: string;
	size: number;
	link: string;
	downloadlink: string;
	message: MailMessage;
	part: string;
	iconColors: Array<{ extension: 'string'; color: string }>;
	att: EditorAttachmentFiles;
};

export type AttachmentPartType = {
	contentType: string;
	size: number;
	name: string;
	disposition?: 'attachment' | 'inline';
	filename?: string;
	parts: AttachmentPartType[];
};

export type PreviewPanelActionsType = {
	item: Conversation;
	folderId: string;
	isMessageView: boolean;
	conversation: Conversation;
};
