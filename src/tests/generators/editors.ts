/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';

import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { AppDispatch } from '../../store/redux';
import {
	computeDraftSaveAllowedStatus,
	computeSendAllowedStatus
} from '../../store/zustand/editor/editor-utils';
import type { MailsEditorV2, SavedAttachment, UnsavedAttachment } from '../../types';

const alignState = (editor: MailsEditorV2): void => {
	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);
};

export const generateEditorV2Case = async (
	id: number,
	messagesStoreDispatch: AppDispatch
): Promise<MailsEditorV2> => {
	const { buildEditorCase } = await import(`./editorCases/editor-case-v2-${id}`);
	const editor = buildEditorCase(messagesStoreDispatch);
	alignState(editor);
	return editor;
};

export const readyToBeSentEditorTestCase = async (
	messagesStoreDispatch: AppDispatch,
	editorPropsOverride: Partial<MailsEditorV2> = {}
): Promise<MailsEditorV2> => {
	let editor = await generateEditorV2Case(1, messagesStoreDispatch);
	editor.subject = faker.lorem.words(3);
	editor.recipients = {
		to: [{ type: ParticipantRole.TO, address: faker.internet.email() }],
		cc: [],
		bcc: []
	};
	editor = { ...editor, ...editorPropsOverride };
	alignState(editor);
	return editor;
};

export const aSmartLinkAttachment = (): SavedAttachment => ({
	contentType: 'message/rfc822',
	size: 12,
	partName: '2',
	messageId: '11215',
	isInline: false,
	filename: `smartlink-attachment`,
	requiresSmartLinkConversion: true
});

export const aSavedAttachment = (): SavedAttachment => ({
	contentType: 'message/rfc822',
	size: 13,
	partName: '2',
	messageId: '11215',
	isInline: false,
	filename: `saved-attachment`,
	requiresSmartLinkConversion: false
});

export const anUnsavedAttachment = (): UnsavedAttachment => ({
	contentType: 'message/rfc822',
	size: 13,
	isInline: false,
	filename: `saved-attachment`
});
