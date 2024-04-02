/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setupEditorStore } from '../../../tests/generators/editor-store';
import { generateEditorV2Case } from '../../../tests/generators/editors';
import { generateStore } from '../../../tests/generators/store';
import { addEditor } from '../editor/hooks/editors';
import { useEditorsStore } from '../editor/store';

describe('store', () => {
	test('toggleSmartLink should invert the value of requiresSmartLinkConversion of the attachment', async () => {
		const oldEditor = await generateEditorV2Case(1, generateStore().dispatch);

		useEditorsStore.getState().addEditor(oldEditor.id, oldEditor);
		useEditorsStore
			.getState()
			.toggleSmartLink(oldEditor.id, oldEditor.savedAttachments[0].partName);

		const newEditor = useEditorsStore.getState().editors[oldEditor.id];

		expect(newEditor.savedAttachments[0].requiresSmartLinkConversion).not.toBe(
			oldEditor.savedAttachments[0].requiresSmartLinkConversion
		);
	});

	test('toggleSmartLink should not change the value of requiresSmartLinkConversion if there is no current editor', async () => {
		const oldEditor = await generateEditorV2Case(1, generateStore().dispatch);

		useEditorsStore.getState().addEditor(oldEditor.id, oldEditor);
		useEditorsStore
			.getState()
			.toggleSmartLink('wrong-editor-id', oldEditor.savedAttachments[0].partName);

		const newEditor = useEditorsStore.getState().editors[oldEditor.id];

		expect(newEditor.savedAttachments[0].requiresSmartLinkConversion).toBe(
			oldEditor.savedAttachments[0].requiresSmartLinkConversion
		);
	});
});

describe('setTotalSmartLinksSize', () => {
	it('should calculate the right total size for smart link attachments', async () => {
		setupEditorStore({ editors: [] });
		const reduxStore = generateStore();
		const editor = await generateEditorV2Case(1, reduxStore.dispatch);
		editor.savedAttachments = editor.savedAttachments.map((attachment) => ({
			...attachment,
			requiresSmartLinkConversion: true,
			size: 100
		}));
		addEditor({ id: editor.id, editor });
		useEditorsStore.getState().setTotalSmartLinksSize(editor.id);
		const expectedSize = editor.savedAttachments.reduce((acc, attachment) => {
			if (attachment.requiresSmartLinkConversion) {
				return acc + attachment.size;
			}
			return acc;
		}, 0);

		const editorFromStore = useEditorsStore.getState().editors[editor.id];
		expect(editorFromStore.totalSmartLinksSize).toEqual(expectedSize);
	});
});
