/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setupEditorStore } from '../../../tests/generators/editor-store';
import { generateEditorV2Case } from '../../../tests/generators/editors';
import { generateMessage } from '../../../tests/generators/generateMessage';
import { InlineAttachments, MailAttachment } from '../../../types';
import {
	getAddAttachment,
	getAddEditor,
	getAddInlineAttachment,
	getDeleteEditor,
	getEditor,
	getSetDid,
	getSetIsRichText,
	getSetOriginalId,
	getSetOriginalMessage,
	getUpdateAutoSendTime,
	getUpdateEditor,
	getUpdateIsUrgent,
	getUpdateRecipients,
	getUpdateSubject,
	getUpdateText
} from '../editor/hooks';

describe('all editor hooks', () => {
	test('getEditor gets an editor from store', async () => {
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		setupEditorStore({ editors: [editor] });
		const editorFromStore = getEditor({ id: editor.id });
		expect(editorFromStore).toEqual(editor);
	});
	test('getAddEditor adds an editor to the store', async () => {
		setupEditorStore({ editors: [] });
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		getAddEditor({ id: editor.id, editor });
		const editorFromStore = getEditor({ id: editor.id });
		expect(editorFromStore).toEqual(editor);
	});
	test('getUpdateEditor updates an editor in the store', async () => {
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		setupEditorStore({ editors: [editor] });
		const newEditor = { ...editor, subject: 'new subject' };
		getUpdateEditor({ id: editor.id, opt: newEditor });
		const editorFromStore = getEditor({ id: editor.id });
		expect(editorFromStore).toEqual(newEditor);
	});
	test('getUpdateSubject updates an editor subject in the store', async () => {
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		setupEditorStore({ editors: [editor] });
		const newSubject = 'new subject';
		getUpdateSubject({ id: editor.id, subject: newSubject });
		const editorFromStore = getEditor({ id: editor.id });
		expect(editorFromStore?.subject).toEqual(newSubject);
	});
	test('getDeleteEditor deletes an editor from the store', async () => {
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		setupEditorStore({ editors: [editor] });
		getDeleteEditor({ id: editor.id });
		const editorFromStore = getEditor({ id: editor.id });
		expect(editorFromStore).toEqual(null);
	});
	test('getUpdateText updates an editor text in the store', async () => {
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		setupEditorStore({ editors: [editor] });
		const newText = { richText: '<h1>new text<h1>', plainText: 'new text' };
		getUpdateText({ id: editor.id, text: newText });
		const editorFromStore = getEditor({ id: editor.id });
		expect(editorFromStore?.text?.richText).toEqual(newText.richText);
		expect(editorFromStore?.text?.plainText).toEqual(newText.plainText);
	});
	test('getUpdateAutoSendTime updates an editor autoSendTime in the store', async () => {
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		setupEditorStore({ editors: [editor] });
		const newAutoSendTime = 123456789;
		getUpdateAutoSendTime({ id: editor.id, autoSendTime: newAutoSendTime });
		const editorFromStore = getEditor({ id: editor.id });
		expect(editorFromStore?.autoSendTime).toEqual(newAutoSendTime);
	});
	test('getSetDid update an editor did in the store', async () => {
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		setupEditorStore({ editors: [editor] });
		const newDid = 'new did';
		getSetDid({ id: editor.id, did: newDid });
		const editorFromStore = getEditor({ id: editor.id });
		expect(editorFromStore?.did).toEqual(newDid);
	});
	test('getSetIsRichText update an editor isRichText in the store', async () => {
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		setupEditorStore({ editors: [editor] });
		const currentIsRichText = getEditor({ id: editor.id })?.isRichText;
		const newIsRichText = !!currentIsRichText;
		getSetIsRichText({ id: editor.id, isRichText: newIsRichText });
		const editorFromStore = getEditor({ id: editor.id });
		expect(editorFromStore?.isRichText).toEqual(newIsRichText);
	});
	test('getSetOriginalId update an editor originalId in the store', async () => {
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		setupEditorStore({ editors: [editor] });
		const newOriginalId = 'new originalId';
		getSetOriginalId({ id: editor.id, originalId: newOriginalId });
		const editorFromStore = getEditor({ id: editor.id });
		expect(editorFromStore?.originalId).toEqual(newOriginalId);
	});
	test('getSetOriginalMessage update an editor originalMessage in the store', async () => {
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		setupEditorStore({ editors: [editor] });
		const newMessage = generateMessage({});
		getSetOriginalMessage({
			id: editor.id,
			originalMessage: newMessage
		});
		const editorFromStore = getEditor({ id: editor.id });
		expect(editorFromStore?.originalMessage).toEqual(newMessage);
	});
	test('getUseUpdateRecipients updates an editor recipients in the store', async () => {
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		const newRecipients = { to: [], cc: [], bcc: [] };
		setupEditorStore({ editors: [editor] });
		getUpdateRecipients({ id: editor.id, recipients: newRecipients });
		const editorFromStore = getEditor({ id: editor.id });
		expect(editorFromStore?.recipients).toEqual(newRecipients);
	});
	test('getUpdateIsUrgent updates an editor isUrgent in the store', async () => {
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		const newIsUrgent = true;
		setupEditorStore({ editors: [editor] });
		getUpdateIsUrgent({ id: editor.id, isUrgent: newIsUrgent });
		const editorFromStore = getEditor({ id: editor.id });
		expect(editorFromStore?.isUrgent).toEqual(newIsUrgent);
	});
	test('getAddAttachment adds an attachment to an editor in the store', async () => {
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		const newEditor = await generateEditorV2Case(2);
		const newAttachments = newEditor.attachments;
		setupEditorStore({ editors: [editor] });
		newAttachments?.forEach((attachment: MailAttachment) =>
			getAddAttachment({ id: editor.id, attachment })
		);
		const editorFromStore = getEditor({ id: editor.id });
		newAttachments?.forEach((attachment) =>
			expect(editorFromStore?.attachments).toContain(attachment)
		);
	});
	test.todo('getRemoveAttachment removes an attachment from an editor in the store');
	test('getAddInlineAttachment adds an inline attachment in the store', async () => {
		const editorId = 1;
		const editor = await generateEditorV2Case(editorId);
		const newEditor = await generateEditorV2Case(2);
		const newInlineAttachments = newEditor.inlineAttachments;
		setupEditorStore({ editors: [editor] });
		newInlineAttachments?.forEach((inlineAttachment: InlineAttachments[0]) =>
			getAddInlineAttachment({ id: editor.id, inlineAttachment })
		);
		const editorFromStore = getEditor({ id: editor.id });
		newInlineAttachments?.forEach((inlineAttachment) =>
			expect(editorFromStore?.inlineAttachments).toContain(inlineAttachment)
		);
	});
});
