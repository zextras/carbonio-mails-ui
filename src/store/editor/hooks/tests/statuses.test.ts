/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { setupEditorStore } from '../../../../__test__/generators/editor-store';
import { setupHook } from '../../../../__test__/test-setup';
import { generateNewMessageEditor } from '../../editor-generators';
import { useEditorIsModified } from '../statuses';

describe('useEditorIsModified', () => {
	describe('isModified value', () => {
		it('returns true when the editor is modified', () => {
			const editor = generateNewMessageEditor();
			editor.isModified = true;

			setupEditorStore({ editors: [editor] });
			const { result } = setupHook(useEditorIsModified, { initialProps: [editor.id] });

			expect(result.current.isModified).toBe(true);
		});

		it('returns false when the editor is not modified', () => {
			const editor = generateNewMessageEditor();
			editor.isModified = false;

			setupEditorStore({ editors: [editor] });
			const { result } = setupHook(useEditorIsModified, { initialProps: [editor.id] });

			expect(result.current.isModified).toBe(false);
		});
	});

	describe('setIsModified function', () => {
		it('sets the isModified value to true', () => {
			const editor = generateNewMessageEditor();
			editor.isModified = false;
			setupEditorStore({ editors: [editor] });
			const { result } = setupHook(useEditorIsModified, { initialProps: [editor.id] });

			expect(result.current.isModified).toBe(false);

			result.current.setIsModified();

			const { result: updatedResult } = setupHook(useEditorIsModified, {
				initialProps: [editor.id]
			});
			expect(updatedResult.current.isModified).toBe(true);
		});
	});
});
