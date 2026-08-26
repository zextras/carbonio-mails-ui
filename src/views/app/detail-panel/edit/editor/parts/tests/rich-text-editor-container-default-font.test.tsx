/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { setupTest, screen } from '@test-setup';
import { useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { generateSettings } from '@test-utils/settings/settings-generator';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

// A single-token font-family avoids a jsdom quirk where computed
// `font-family` lists are serialized without the space after each comma.
const ACCOUNT_FONT_FAMILY = 'helvetica';
const ACCOUNT_FONT_SIZE = '18pt';

describe('RichTextEditorContainer - default font from account settings', () => {
	it('applies the account default font family and size to the content editable and the placeholder', () => {
		useUserSettings.mockReturnValue(
			generateSettings({
				prefs: {
					zimbraPrefHtmlEditorDefaultFontFamily: ACCOUNT_FONT_FAMILY,
					zimbraPrefHtmlEditorDefaultFontSize: ACCOUNT_FONT_SIZE
				}
			})
		);
		const editor = generateNewMessageEditor();
		editor.text = { plainText: '', richText: '' };
		setupEditorStore({ editors: [editor] });

		const { container } = setupTest(
			<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />
		);

		const contentEditable = screen.getByTestId('edit-view-editor');
		expect(contentEditable).toHaveStyle({
			fontFamily: ACCOUNT_FONT_FAMILY,
			fontSize: ACCOUNT_FONT_SIZE
		});

		const placeholder = container.querySelector('.mails-lexical-placeholder');
		expect(placeholder).not.toBeNull();
		expect(placeholder).toHaveStyle({
			fontFamily: ACCOUNT_FONT_FAMILY,
			fontSize: ACCOUNT_FONT_SIZE
		});
	});
});
