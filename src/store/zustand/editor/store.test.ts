/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEditorsStore } from './store';
import { generateEditorV2Case } from '../../../tests/generators/editors';
import { generateStore } from '../../../tests/generators/store';

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
