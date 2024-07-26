/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useIntegratedComponent, useUserSettings } from '@zextras/carbonio-shell-ui';

import { setupTest, screen } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { useEditorIsRichText, useEditorText } from '../../../../../../store/zustand/editor';
import { TextEditorContainer, TextEditorContainerProps } from '../text-editor-container';

jest.mock('@zextras/carbonio-shell-ui', () => ({
	useIntegratedComponent: jest.fn(),
	useUserSettings: jest.fn()
}));

jest.mock('../../../../../../store/zustand/editor', () => ({
	useEditorIsRichText: jest.fn(),
	useEditorText: jest.fn()
}));

describe('TextEditorContainer', () => {
	it('should render textarea when composer is not available and RichText is not enabled', () => {
		setUpMocks({ composerIsAvailable: false, isRichText: false });

		setupTest(<TextEditorContainer {...createMockTextEditorContainerProps()} />);

		expect(screen.getByTestId('MailPlainTextEditor')).toBeInTheDocument();
		expect(screen.getByText('PlainText')).toBeInTheDocument();
	});

	it('should render textarea when composer is available and RichText is not enabled', () => {
		setUpMocks({ composerIsAvailable: true, isRichText: false });

		setupTest(<TextEditorContainer {...createMockTextEditorContainerProps()} />);

		expect(screen.getByTestId('MailPlainTextEditor')).toBeInTheDocument();
		expect(screen.getByText('PlainText')).toBeInTheDocument();
	});

	it('should render textarea when composer is not available and RichText is enabled', () => {
		setUpMocks({ composerIsAvailable: false, isRichText: true });

		setupTest(<TextEditorContainer {...createMockTextEditorContainerProps()} />);

		expect(screen.getByTestId('MailPlainTextEditor')).toBeInTheDocument();
		expect(screen.getByText('PlainText')).toBeInTheDocument();
	});

	it('should render composer with rich text editor when composer is available and RichText is enabled', () => {
		setUpMocks({ composerIsAvailable: true, isRichText: true });
		setupTest(<TextEditorContainer {...createMockTextEditorContainerProps()} />);

		expect(screen.getByTestId('MailEditorWrapper')).toBeInTheDocument();
		expect(screen.getByText('Composer with RichText')).toBeInTheDocument();
	});
});

type setupMockProp = {
	composerIsAvailable: boolean;
	isRichText: boolean;
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

function setUpMocks({ composerIsAvailable = false, isRichText = false }: setupMockProp): void {
	(useIntegratedComponent as jest.Mock).mockReturnValue([
		(): JSX.Element => <div>Composer with RichText</div>,
		composerIsAvailable
	]);
	(useUserSettings as jest.Mock).mockReturnValue({ prefs: {} });

	(useEditorIsRichText as jest.Mock).mockReturnValue({ isRichText });
	(useEditorText as jest.Mock).mockReturnValue({
		text: { plainText: 'PlainText', richText: '<p>RichText</p>' },
		setText: jest.fn()
	});
}
