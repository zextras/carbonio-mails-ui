/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import {
	useIntegratedComponent,
	useUserSettings
} from '../../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { setupTest, screen } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { generateNewMessageEditor } from '../../../../../../store/editor/editor-generators';
import { setupEditorStore } from '../../../../../../tests/generators/editor-store';
import { MailsEditorV2 } from '../../../../../../types';
import { TextEditorContainer, TextEditorContainerProps } from '../text-editor-container';

describe('TextEditorContainer', () => {
	it('should render textarea when composer is not available and RichText is not enabled', () => {
		const editor = generateNewMessageEditor();
		const editors = [{ ...editor, text: { plainText: 'PlainText', richText: '<p>RichText</p>' } }];
		setupEditorStore({ editors });
		setUpMocks({ composerIsAvailable: false });

		setupTest(
			<TextEditorContainer {...createMockTextEditorContainerProps({ editorId: editor.id })} />
		);

		expect(screen.getByTestId('MailPlainTextEditor')).toBeInTheDocument();
		expect(screen.getByText('PlainText')).toBeInTheDocument();
	});

	it('should render textarea when composer is available and RichText is not enabled', () => {
		const editor = generateNewMessageEditor();
		const editors = [{ ...editor, text: { plainText: 'PlainText', richText: '<p>RichText</p>' } }];
		setupEditorStore({ editors });
		setUpMocks({ composerIsAvailable: true });

		setupTest(
			<TextEditorContainer {...createMockTextEditorContainerProps({ editorId: editor.id })} />
		);

		expect(screen.getByTestId('MailPlainTextEditor')).toBeInTheDocument();
		expect(screen.getByText('PlainText')).toBeInTheDocument();
	});

	it('should render textarea when composer is not available and RichText is enabled', () => {
		const editor = generateNewMessageEditor();
		const editors = [{ ...editor, text: { plainText: 'PlainText', richText: '<p>RichText</p>' } }];
		setupEditorStore({ editors });
		setUpMocks({ composerIsAvailable: false });

		setupTest(
			<TextEditorContainer {...createMockTextEditorContainerProps({ editorId: editor.id })} />
		);

		expect(screen.getByTestId('MailPlainTextEditor')).toBeInTheDocument();
		expect(screen.getByText('PlainText')).toBeInTheDocument();
	});

	it('should render composer with rich text editor when composer is available and RichText is enabled', () => {
		const editor = generateNewMessageEditor();
		const editors: Array<MailsEditorV2> = [
			{ ...editor, isRichText: true, text: { plainText: 'PlainText', richText: '<p>RichText</p>' } }
		];
		setupEditorStore({ editors });
		setUpMocks({ composerIsAvailable: true });
		setupTest(
			<TextEditorContainer {...createMockTextEditorContainerProps({ editorId: editor.id })} />
		);

		expect(screen.getByTestId('MailEditorWrapper')).toBeInTheDocument();
		expect(screen.getByText('Composer with RichText')).toBeInTheDocument();
	});
});

type setupMockProp = {
	composerIsAvailable: boolean;
};

const createMockTextEditorContainerProps = (
	overrides: Partial<TextEditorContainerProps> = {}
): TextEditorContainerProps => ({
	editorId: 'editor-123',
	onDragOver: jest.fn(),
	onFilesSelected: jest.fn(),
	minHeight: 300,
	disabled: false,
	...overrides
});

function setUpMocks({ composerIsAvailable = false }: setupMockProp): void {
	useIntegratedComponent.mockReturnValue([
		jest.fn().mockImplementation((): JSX.Element => <div>Composer with RichText</div>),
		composerIsAvailable
	]);
	useUserSettings.mockReturnValue({ prefs: {}, attrs: {}, props: [] });
}
