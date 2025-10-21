/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEditorsStore } from 'store/editor/store';
import { setupEditorStore } from '__test__/generators/editor-store';
import { readyToBeSentEditorTestCase } from '__test__/generators/editors';

describe('store', () => {
	test('setSize should set the editor size for the provided editor id', async () => {
		const editor = await readyToBeSentEditorTestCase();
		setupEditorStore({ editors: [editor] });

		useEditorsStore.getState().setSize(editor.id, 123);

		const newEditor = useEditorsStore.getState().editors[editor.id];
		expect(newEditor.size).toEqual(123);
	});
	test('size should be aligned in the new editor', async () => {
		const editor = await readyToBeSentEditorTestCase({ size: 123 });
		setupEditorStore({ editors: [editor] });

		const newEditor = useEditorsStore.getState().editors[editor.id];
		expect(newEditor.size).toEqual(123);
	});

	test('setIsSmimeSign should set the isSmimeSign value for the provided editor id', async () => {
		const editor = await readyToBeSentEditorTestCase();
		setupEditorStore({ editors: [editor] });

		useEditorsStore.getState().setIsSmimeSign(editor.id, true);

		const newEditor = useEditorsStore.getState().editors[editor.id];
		expect(newEditor.isSmimeSign).toEqual(true);
	});

	test('isSmimeSign should be aligned in the new editor', async () => {
		const editor = await readyToBeSentEditorTestCase({ isSmimeSign: true });
		setupEditorStore({ editors: [editor] });

		const newEditor = useEditorsStore.getState().editors[editor.id];
		expect(newEditor.isSmimeSign).toEqual(true);
	});

	test('setIsSmimeEncrypt should set the isSmimeEncrypt value for the provided editor id', async () => {
		const editor = await readyToBeSentEditorTestCase();
		setupEditorStore({ editors: [editor] });

		useEditorsStore.getState().setIsSmimeEncrypt(editor.id, true);

		const newEditor = useEditorsStore.getState().editors[editor.id];
		expect(newEditor.isSmimeEncrypt).toEqual(true);
	});

	test('isSmimeEncrypt should be aligned in the new editor', async () => {
		const editor = await readyToBeSentEditorTestCase({ isSmimeEncrypt: true });
		setupEditorStore({ editors: [editor] });

		const newEditor = useEditorsStore.getState().editors[editor.id];
		expect(newEditor.isSmimeEncrypt).toEqual(true);
	});
});
