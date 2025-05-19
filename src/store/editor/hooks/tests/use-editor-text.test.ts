/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { act } from '@testing-library/react';

import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupHook } from '../../../../carbonio-ui-commons/test/test-setup';
import { setupEditorStore } from '../../../../tests/generators/editor-store';
import { generateEditorV2Case } from '../../../../tests/generators/editors';
import { generateNewMessageEditor } from '../../editor-generators';
import { useEditorText } from '../editor';
import { addEditor, getEditor } from '../editors';

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
		const { getText } = hookResult.current;
		expect(getText().plainText).toEqual(initialPlainText);
		expect(getText().richText).toEqual(initialRichText);
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

	describe('Text provider', () => {
		it('should return the text from the test provider when the provider is set', () => {
			const providerTextValue = {
				richText: faker.lorem.paragraph(),
				plainText: faker.lorem.paragraph()
			};
			const textProvider = {
				setCurrentText: jest.fn(),
				getCurrentText: jest.fn().mockReturnValue(providerTextValue)
			};
			const editor = generateNewMessageEditor();
			editor.textProvider = textProvider;
			setupEditorStore({ editors: [editor] });

			const { result: hookResult } = setupHook(useEditorText, { initialProps: [editor.id] });
			const { getText } = hookResult.current;

			expect(getText()).toEqual(providerTextValue);
			expect(textProvider.getCurrentText).toHaveBeenCalled();
		});

		it('should return the text from the store when the provider is not set', () => {
			const text = {
				richText: faker.lorem.paragraph(),
				plainText: faker.lorem.paragraph()
			};
			const editor = generateNewMessageEditor();
			editor.text = text;
			editor.textProvider = undefined;
			setupEditorStore({ editors: [editor] });

			const { result: hookResult } = setupHook(useEditorText, { initialProps: [editor.id] });
			const { getText } = hookResult.current;

			expect(getText()).toEqual(text);
		});

		it('should invoke the provider function when the setText is invoked and the provider is set', async () => {
			createSoapAPIInterceptor('SaveDraft');

			const text = {
				richText: faker.lorem.paragraph(),
				plainText: faker.lorem.paragraph()
			};
			const editor = generateNewMessageEditor();
			editor.textProvider = {
				setCurrentText: jest.fn(),
				getCurrentText: jest.fn()
			};
			setupEditorStore({ editors: [editor] });

			const { result: hookResult } = setupHook(useEditorText, { initialProps: [editor.id] });
			const { setText } = hookResult.current;

			await act(async () => {
				setText(text);
			});

			expect(editor.textProvider.setCurrentText).toHaveBeenCalledWith(text);
		});
	});
});
