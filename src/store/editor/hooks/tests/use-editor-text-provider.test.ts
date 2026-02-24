/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';

import { setupHook } from '@test-setup';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorTextProvider } from 'store/editor/hooks/editor';
import { useEditorsStore } from 'store/editor/store';
import { setupEditorStore } from '__test__/generators/editor-store';

describe('useEditorTextProvider', () => {
	it('should return an object with the current textProvider and its setter', () => {
		const textProvider = {
			setCurrentText: vi.fn(),
			getCurrentText: vi.fn()
		};
		const editor = generateNewMessageEditor();
		editor.textProvider = textProvider;
		setupEditorStore({ editors: [editor] });

		const {
			result: { current: hookResult }
		} = setupHook(useEditorTextProvider, { initialProps: [editor.id] });

		expect(hookResult).toEqual({
			setTextProvider: expect.any(Function),
			textProvider: editor.textProvider
		});
	});

	it('should set the textProvider when the setter is called', () => {
		const textProvider = {
			setCurrentText: vi.fn(),
			getCurrentText: vi.fn()
		};
		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [editor] });

		const { result } = setupHook(useEditorTextProvider, { initialProps: [editor.id] });

		act(() => {
			result.current.setTextProvider(textProvider);
		});

		expect(useEditorsStore.getState().editors[editor.id].textProvider).toBe(textProvider);
		expect(result.current.textProvider).toBe(textProvider);
	});
});
