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

const mockTextEditorContainerProps: TextEditorContainerProps = {
	editorId: 'editor-123',
	onDragOver: jest.fn(),
	onFilesSelected: jest.fn(),
	minHeight: 300,
	disabled: false
};

jest.mock('@zextras/carbonio-shell-ui', () => ({
	useIntegratedComponent: jest.fn(),
	useUserSettings: jest.fn()
}));

jest.mock('../../../../../../store/zustand/editor', () => ({
	useEditorIsRichText: jest.fn(),
	useEditorText: jest.fn()
}));

type setupMockProp = {
	composerIsAvailable: boolean;
	isRichText: boolean;
};

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

describe('TextEditorContainer', () => {
	it('should not render composer and render textarea when composer is not available', () => {
		setUpMocks({ composerIsAvailable: false, isRichText: false });

		setupTest(<TextEditorContainer {...mockTextEditorContainerProps} />);

		expect(screen.getByTestId('MailPlainTextEditor')).toBeInTheDocument();
		expect(screen.getByText('PlainText')).toBeInTheDocument();
	});

	it('should render composer with rich text editor when composer is available', () => {
		setUpMocks({ composerIsAvailable: true, isRichText: true });
		setupTest(<TextEditorContainer {...mockTextEditorContainerProps} />);

		expect(screen.getByTestId('MailEditorWrapper')).toBeInTheDocument();
		expect(screen.getByText('Composer with RichText')).toBeInTheDocument();
	});

	// TODO: test is not aligned with the title
	// it('should not render composer and render textarea when composer is not available and rich-text is true', () => {
	// 	setUpMocks({ composerIsAvailable: false, isRichText: true });
	//
	// 	setupTest(<TextEditorContainer {...mockTextEditorContainerProps} />);
	//
	// 	expect(screen.getByTestId('MailPlainTextEditor')).toBeInTheDocument();
	// 	expect(screen.getByText('PlainText')).toBeInTheDocument();
	// });
});
