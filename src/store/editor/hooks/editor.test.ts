/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';

import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { setupEditorStore } from '../../../tests/generators/editor-store';
import { generateNewMessageEditor } from '../editor-generators';
import { useEditorsStore } from '../store';
import { useEditorTextProvider } from './editor';

describe('useEditorTextProvider', () => {
	it('should return an object with the current textProvider and its setter', () => {
		const textProvider = {
			setCurrentText: jest.fn(),
			getCurrentText: jest.fn()
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
			setCurrentText: jest.fn(),
			getCurrentText: jest.fn()
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

describe('useEditorText', () => {
	it.todo('should return an object with the current text and its setter');

	it.todo('should set the text when the setter is called');

	it.todo('should return the current text when the getter is called');

	describe('Text provider', () => {
		it.todo('should return the text from the test provider when the provider is set');

		it.todo('should return the text from the store when the provider is not set');

		it.todo(
			'should invoke the provider function when the setText is invoked and the provider is set'
		);
	});
});
