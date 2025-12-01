/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from '@testing-library/react';

import { setupEditorStore } from '../../../../__test__/generators/editor-store';
import { setupHook } from '../../../../__test__/test-setup';
import { generateNewMessageEditor } from '../../editor-generators';
import { useEditorIsDirty } from '../statuses';

describe('useEditorIsDirty', () => {
	describe('isDirty value', () => {
		it('returns true when the editor has unsaved changes', () => {
			const editor = generateNewMessageEditor();
			editor.isDirty = true;

			setupEditorStore({ editors: [editor] });
			const { result } = setupHook(useEditorIsDirty, { initialProps: [editor.id] });

			expect(result.current.isDirty).toBe(true);
		});

		it('returns false when the editor has no unsaved changes', () => {
			const editor = generateNewMessageEditor();
			editor.isDirty = false;

			setupEditorStore({ editors: [editor] });
			const { result } = setupHook(useEditorIsDirty, { initialProps: [editor.id] });

			expect(result.current.isDirty).toBe(false);
		});
	});

	describe('setIsDirty function', () => {
		it('sets the isDirty value to true', () => {
			const editor = generateNewMessageEditor();
			editor.isDirty = false;
			setupEditorStore({ editors: [editor] });
			const { result } = setupHook(useEditorIsDirty, { initialProps: [editor.id] });

			expect(result.current.isDirty).toBe(false);

			act(() => {
				result.current.setDirty();
			});

			const { result: updatedResult } = setupHook(useEditorIsDirty, {
				initialProps: [editor.id]
			});
			expect(updatedResult.current.isDirty).toBe(true);
		});
	});

	describe('resetIsDirty function', () => {
		it('sets the isDirty value to false', () => {
			const editor = generateNewMessageEditor();
			editor.isDirty = true;
			setupEditorStore({ editors: [editor] });
			const { result } = setupHook(useEditorIsDirty, { initialProps: [editor.id] });

			expect(result.current.isDirty).toBe(true);

			act(() => {
				result.current.resetDirty();
			});

			const { result: updatedResult } = setupHook(useEditorIsDirty, {
				initialProps: [editor.id]
			});
			expect(updatedResult.current.isDirty).toBe(false);
		});
	});
});
