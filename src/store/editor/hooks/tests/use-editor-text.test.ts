/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act } from '@testing-library/react';

import { setupHook } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { useEditorText } from 'store/editor/hooks/editor';
import { addEditor, getEditor } from 'store/editor/hooks/editors';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateEditorV2Case } from '__test__/generators/editors';

describe('useEditorText', () => {
	test('get the editor text', async () => {
		const initialPlainText = 'initial plain text';
		const initialRichText = 'initial <b>rich</b> text';
		setupEditorStore({ editors: [] });
		const editor = await generateEditorV2Case(1);
		editor.text = {
			plainText: initialPlainText,
			richText: initialRichText
		};
		addEditor({ id: editor.id, editor });

		const { result: hookResult } = setupHook(useEditorText, { initialProps: [editor.id] });
		expect(hookResult.current.text.plainText).toEqual(initialPlainText);
		expect(hookResult.current.text.richText).toEqual(initialRichText);
	});

	test('set the editor text', async () => {
		const initialPlainText = 'initial plain text';
		const initialRichText = 'initial <b>rich</b> text';
		const newPlainText = 'new plain text';
		const newRichText = 'new <b>rich</b> text';

		createSoapAPIInterceptor('SaveDraft');

		setupEditorStore({ editors: [] });
		const editor = await generateEditorV2Case(1);
		editor.text = {
			plainText: initialPlainText,
			richText: initialRichText
		};
		addEditor({ id: editor.id, editor });

		const { result: hookResult } = setupHook(useEditorText, { initialProps: [editor.id] });
		const { setText } = hookResult.current;

		await act(async () => {
			setText({ plainText: newPlainText, richText: newRichText });
		});

		const editorFromStore = getEditor({ id: editor.id });
		expect(editorFromStore?.text.plainText).toEqual(newPlainText);
		expect(editorFromStore?.text.richText).toEqual(newRichText);
	});
});
