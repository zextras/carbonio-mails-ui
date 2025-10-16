/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import {
	useIntegratedComponent,
	useUserSettings
} from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { setupEditorStore } from '__test__/generators/editor-store';
import { MailsEditorV2 } from 'types/index.d';
import {
	TextEditorContainer,
	TextEditorContainerProps
} from 'views/app/detail-panel/edit/parts/text-editor-container';

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
	...overrides
});

function setUpMocks({ composerIsAvailable = false }: setupMockProp): void {
	useIntegratedComponent.mockReturnValue([
		jest.fn().mockImplementation((): JSX.Element => <div>Composer with RichText</div>),
		composerIsAvailable
	]);
	useUserSettings.mockReturnValue({ prefs: {}, attrs: {}, props: [] });
}
