/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setupEditorStore } from '../../../tests/generators/editor-store';
import {
	changeEditorValues,
	generateEditorV2Case,
	readyToBeSentEditorTestCase
} from '../../../tests/generators/editors';
import { generateStore } from '../../../tests/generators/store';
import { SavedAttachment } from '../../../types';
import { useEditorsStore } from '../editor/store';

const smartLinkAttachment = (size: number, partName: string): SavedAttachment => ({
	contentType: 'message/rfc822',
	size,
	partName,
	messageId: '2',
	isInline: false,
	filename: `smartlink-${partName}`,
	requiresSmartLinkConversion: true
});

const attachment = (size: number, partName: string): SavedAttachment => ({
	contentType: 'message/rfc822',
	size,
	partName,
	messageId: '2',
	isInline: false,
	filename: `attachment-${partName}`,
	requiresSmartLinkConversion: false
});

describe('store', () => {
	test('toggleSmartLink should set to true the requiresSmartLinkConversion value of an attachment', async () => {
		const store = generateStore();
		const oldEditor = await readyToBeSentEditorTestCase(store.dispatch, {
			savedAttachments: [attachment(444, '2')]
		});
		setupEditorStore({ editors: [oldEditor] });

		useEditorsStore.getState().toggleSmartLink(oldEditor.id, '2');

		const newEditor = useEditorsStore.getState().editors[oldEditor.id];
		expect(newEditor.savedAttachments[0].requiresSmartLinkConversion).toBe(true);
	});
	test('toggleSmartLink should set to false the requiresSmartLinkConversion value of a smartlink attachment', async () => {
		const store = generateStore();
		const oldEditor = await readyToBeSentEditorTestCase(store.dispatch, {
			savedAttachments: [smartLinkAttachment(444, '2')]
		});
		setupEditorStore({ editors: [oldEditor] });

		useEditorsStore.getState().toggleSmartLink(oldEditor.id, '2');

		const newEditor = useEditorsStore.getState().editors[oldEditor.id];
		expect(newEditor.savedAttachments[0].requiresSmartLinkConversion).toBe(false);
	});

	test('toggleSmartLink should not change the value of requiresSmartLinkConversion if there is no current editor', async () => {
		const reduxStore = generateStore();
		const oldEditor = await generateEditorV2Case(1, reduxStore.dispatch);
		oldEditor.savedAttachments = [attachment(444, '2')];
		setupEditorStore({ editors: [oldEditor] });

		useEditorsStore.getState().toggleSmartLink('wrong-editor-id', '2');

		const newEditor = useEditorsStore.getState().editors[oldEditor.id];
		expect(newEditor.savedAttachments[0].requiresSmartLinkConversion).toBe(false);
	});

	test('setTotalSmartLinksSize should calculate the right total size for smart link attachments', async () => {
		const reduxStore = generateStore();
		const editor = await generateEditorV2Case(1, reduxStore.dispatch);
		editor.savedAttachments = [smartLinkAttachment(333, '2'), attachment(444, '3')];
		setupEditorStore({ editors: [editor] });

		useEditorsStore.getState().setTotalSmartLinksSize(editor.id);

		const newEditor = useEditorsStore.getState().editors[editor.id];
		expect(newEditor.totalSmartLinksSize).toEqual(333);
	});

	test('setSize should set the editor size for the provided editor id', async () => {
		const reduxStore = generateStore();
		const editor = await generateEditorV2Case(1, reduxStore.dispatch);
		setupEditorStore({ editors: [editor] });

		useEditorsStore.getState().setSize(editor.id, 123);

		const newEditor = useEditorsStore.getState().editors[editor.id];
		expect(newEditor.size).toEqual(123);
	});
});
