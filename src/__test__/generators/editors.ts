/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { ParticipantRole } from '@zextras/carbonio-ui-commons';

import { EditViewActions } from '../../constants';
import { getDefaultIdentity } from '../../helpers/identities';
import { computeDraftSaveAllowedStatus, computeSendAllowedStatus } from 'store/editor/editor-utils';
import { SavedAttachment, UnsavedAttachment } from 'types/attachments';
import { MailsEditorV2 } from 'types/editor';

const alignState = (editor: MailsEditorV2): void => {
	editor.draftSaveAllowedStatus = computeDraftSaveAllowedStatus(editor);
	editor.sendAllowedStatus = computeSendAllowedStatus(editor);
};

export const generateEditorV2Case = async (id: number): Promise<MailsEditorV2> => {
	const { buildEditorCase } = await import(`./editorCases/editor-case-v2-${id}.ts`);
	const editor = buildEditorCase();
	alignState(editor);
	return editor;
};

export const readyToBeSentEditorTestCase = async (
	editorPropsOverride: Partial<MailsEditorV2> = {}
): Promise<MailsEditorV2> => {
	let editor = await generateEditorV2Case(1);
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

export const aSavedAttachment = (): SavedAttachment => ({
	contentType: 'message/rfc822',
	size: 13,
	partName: '2',
	messageId: '11215',
	isInline: false,
	filename: `saved-attachment`
});

export const anUnsavedAttachment = (): UnsavedAttachment => ({
	contentType: 'message/rfc822',
	size: 13,
	isInline: false,
	filename: `saved-attachment`
});

export function generateNewEditor(customData: Partial<MailsEditorV2> = {}): MailsEditorV2 {
	return {
		recipients: { to: [], cc: [], bcc: [] },
		id: '',
		isDirty: false,
		isRichText: false,
		isUrgent: false,
		sendAllowedStatus: {
			allowed: true
		},
		requestReadReceipt: false,
		savedAttachments: [],
		size: 0,
		subject: '',
		text: {
			plainText: 'Hello',
			richText: '<p>Hello</p>'
		},
		unsavedAttachments: [],
		action: EditViewActions.NEW,
		identityId: getDefaultIdentity().id,
		did: '123',
		...customData
	};
}
