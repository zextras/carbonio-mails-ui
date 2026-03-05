/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { MailsEditorV2 } from 'types/editor';
import {
	TextEditorContainer,
	TextEditorContainerProps
} from 'views/app/detail-panel/edit/parts/text-editor-container';

// Mock the RichTextEditorContainer component
// noinspection JSUnusedGlobalSymbols
vi.mock('views/app/detail-panel/edit/parts/rich-text-editor-container', () => ({
	RichTextEditorContainer: ({ editorId }: { editorId: string }): React.JSX.Element => (
		<div data-testid="MailEditorWrapper">Composer with RichText for {editorId}</div>
	)
}));

describe('TextEditorContainer', () => {
	it('should render textarea when RichText is not enabled', () => {
		const editor = generateNewMessageEditor();
		const editors = [{ ...editor, text: { plainText: 'PlainText', richText: '<p>RichText</p>' } }];
		setupEditorStore({ editors });
		setUpMocks();

		setupTest(
			<TextEditorContainer {...createMockTextEditorContainerProps({ editorId: editor.id })} />
		);

		expect(screen.getByTestId('MailPlainTextEditor')).toBeInTheDocument();
		expect(screen.getByText('PlainText')).toBeInTheDocument();
	});

	it('should render composer with rich text editor when RichText is enabled', () => {
		const editor = generateNewMessageEditor();
		const editors: Array<MailsEditorV2> = [
			{ ...editor, isRichText: true, text: { plainText: 'PlainText', richText: '<p>RichText</p>' } }
		];
		setupEditorStore({ editors });
		setUpMocks();

		setupTest(
			<TextEditorContainer {...createMockTextEditorContainerProps({ editorId: editor.id })} />
		);

		expect(screen.getByTestId('MailEditorWrapper')).toBeInTheDocument();
		expect(screen.getByText(`Composer with RichText for ${editor.id}`)).toBeInTheDocument();
	});

	it('should set container height to "100%" when in rich text mode', () => {
		const editor = generateNewMessageEditor();
		const editors: Array<MailsEditorV2> = [
			{ ...editor, isRichText: true, text: { plainText: 'PlainText', richText: '<p>RichText</p>' } }
		];
		setupEditorStore({ editors });
		setUpMocks();

		setupTest(
			<TextEditorContainer {...createMockTextEditorContainerProps({ editorId: editor.id })} />
		);

		const containerElement = screen.getByTestId('TextEditorContainer');
		expect(containerElement).toBeInTheDocument();

		expect(containerElement).toHaveStyle({ height: '100%' });
	});

	it('should set container height to "fit" when in plain text mode', () => {
		const editor = generateNewMessageEditor();
		const editors = [
			{
				...editor,
				isRichText: false,
				text: { plainText: 'PlainText', richText: '<p>RichText</p>' }
			}
		];
		setupEditorStore({ editors });
		setUpMocks();

		setupTest(
			<TextEditorContainer {...createMockTextEditorContainerProps({ editorId: editor.id })} />
		);

		const containerElement = screen.getByTestId('TextEditorContainer');
		expect(containerElement).toBeInTheDocument();
		expect(containerElement).toHaveStyle({ height: 'fit' });
	});
});

const createMockTextEditorContainerProps = (
	overrides: Partial<TextEditorContainerProps> = {}
): TextEditorContainerProps => ({
	editorId: 'editor-123',
	onDragOver: vi.fn(),
	...overrides
});

function setUpMocks(): void {
	useUserSettings.mockReturnValue({ prefs: {}, attrs: {}, props: [] });
}
