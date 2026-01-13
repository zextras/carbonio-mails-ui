/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from '@testing-library/react';

import { setupEditorStore } from '../../../../__test__/generators/editor-store';
import { setupHook } from '../../../../__test__/test-setup';
import { generateNewMessageEditor } from '../../editor-generators';
import { useEditorIsDirty, useEditorSetDirty } from '../statuses';

describe('useEditorIsDirty', () => {
	it('returns true when the editor has unsaved changes', () => {
		const editor = generateNewMessageEditor();
		editor.isDirty = true;

		setupEditorStore({ editors: [editor] });
		const {
			result: { current: isDirty }
		} = setupHook(useEditorIsDirty, { initialProps: [editor.id] });

		expect(isDirty).toBe(true);
	});

	it('returns false when the editor has no unsaved changes', () => {
		const editor = generateNewMessageEditor();
		editor.isDirty = false;

		setupEditorStore({ editors: [editor] });
		const {
			result: { current: isDirty }
		} = setupHook(useEditorIsDirty, { initialProps: [editor.id] });

		expect(isDirty).toBe(false);
	});
});

describe('useEditorSetDirty', () => {
	it('should return an object with two functions: setDirty and resetDirty', () => {
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });
		const {
			result: { current: hookResult }
		} = setupHook(useEditorSetDirty, { initialProps: [editor.id] });

		expect(hookResult).toEqual({
			setDirty: expect.any(Function),
			resetDirty: expect.any(Function)
		});
	});

	describe('setIsDirty function', () => {
		it('sets the dirty value to true', () => {
			const editor = generateNewMessageEditor();

			setupEditorStore({ editors: [editor] });
			const {
				result: {
					current: { setDirty }
				}
			} = setupHook(useEditorSetDirty, { initialProps: [editor.id] });

			act(() => {
				setDirty();
			});
			const { result: updatedResult } = setupHook(useEditorIsDirty, {
				initialProps: [editor.id]
			});

			expect(updatedResult.current).toBe(true);
		});
	});

	describe('resetIsDirty function', () => {
		it('sets the dirty value to false', () => {
			const editor = generateNewMessageEditor();

			setupEditorStore({ editors: [editor] });
			const {
				result: {
					current: { resetDirty }
				}
			} = setupHook(useEditorSetDirty, { initialProps: [editor.id] });

			act(() => {
				resetDirty();
			});
			const { result: updatedResult } = setupHook(useEditorIsDirty, {
				initialProps: [editor.id]
			});

			expect(updatedResult.current).toBe(false);
		});
	});
});
