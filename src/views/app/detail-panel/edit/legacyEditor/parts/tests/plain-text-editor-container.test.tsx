/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { PlainTextEditorContainer } from '../plain-text-editor-container';
import { setupTest } from '@test-setup';
import { useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';

describe('PlainTextEditorContainer', () => {
	const setUpMocks = (): void => {
		useUserSettings.mockReturnValue({
			prefs: { zimbraPrefHtmlEditorDefaultFontFamily: 'Arial' },
			attrs: {},
			props: []
		});
	};

	it('should render plain text editor with textarea', () => {
		const editor = generateNewMessageEditor();
		const editors = [
			{ ...editor, isRichText: false, text: { plainText: 'Test content', richText: '<p>Test</p>' } }
		];
		setupEditorStore({ editors });
		setUpMocks();

		setupTest(<PlainTextEditorContainer editorId={editor.id} />);

		const textArea = screen.getByTestId('MailPlainTextEditor');
		expect(textArea).toBeInTheDocument();
		expect(textArea).toHaveValue('Test content');
	});

	it('should render container without height constraints to allow dynamic growth', async () => {
		const editor = generateNewMessageEditor();
		const editors = [
			{
				...editor,
				isRichText: false,
				text: { plainText: 'Long text content', richText: '<p>Long text</p>' }
			}
		];
		setupEditorStore({ editors });
		setUpMocks();

		setupTest(<PlainTextEditorContainer editorId={editor.id} />);

		const containerElement = await screen.findByTestId('PlainTextEditorContainer');
		const computedStyle = getComputedStyle(containerElement);

		expect(computedStyle.height).toBe('100%');

		const textArea = screen.getByTestId('MailPlainTextEditor');
		expect(textArea).toBeInTheDocument();
	});

	it('should apply custom font family from user settings', () => {
		const editor = generateNewMessageEditor();
		const editors = [
			{ ...editor, isRichText: false, text: { plainText: 'Test', richText: '<p>Test</p>' } }
		];
		setupEditorStore({ editors });
		useUserSettings.mockReturnValue({
			prefs: { zimbraPrefHtmlEditorDefaultFontFamily: 'Courier New' },
			attrs: {},
			props: []
		});

		setupTest(<PlainTextEditorContainer editorId={editor.id} />);

		const textArea = screen.getByTestId('MailPlainTextEditor') as HTMLTextAreaElement;
		expect(textArea).toBeInTheDocument();
		expect(textArea).toHaveStyle({ fontFamily: 'Courier New' });
	});

	it('should have no outline on focus for better UX', () => {
		const editor = generateNewMessageEditor();
		const editors = [
			{ ...editor, isRichText: false, text: { plainText: 'Test', richText: '<p>Test</p>' } }
		];
		setupEditorStore({ editors });
		setUpMocks();

		setupTest(<PlainTextEditorContainer editorId={editor.id} />);

		const textArea = screen.getByTestId('MailPlainTextEditor') as HTMLTextAreaElement;
		expect(textArea).toBeInTheDocument();

		textArea.focus();
		expect(textArea).toHaveStyle({ outline: 'none' });
	});
});
