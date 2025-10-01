/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { Composer } from 'views/app/detail-panel/edit/composer/composer';

jest.mock('@tinymce/tinymce-react', () => ({
	Editor: jest.fn(({ onEditorChange, disabled, ...props }) => {
		const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
			if (onEditorChange) {
				const mockEditor = {
					getContent: jest.fn((options) => {
						if (options?.format === 'text') {
							return event.target.value;
						}
						return `<p>${event.target.value}</p>`;
					})
				};
				onEditorChange(event.target.value, mockEditor);
			}
		};

		return (
			<textarea
				data-testid="tinymce-editor"
				onChange={handleChange}
				disabled={disabled}
				defaultValue={props.initialValue}
				value={props.value}
			/>
		);
	})
}));

jest.mock('@zextras/carbonio-shell-ui', () => ({
	useUserSettings: (): { prefs: { zimbraPrefLocale: string } } => ({
		prefs: {
			zimbraPrefLocale: 'en'
		}
	})
}));

describe('Composer', () => {
	const TINYMCE_EDITOR_TESTID = 'tinymce-editor';
	const FILE_INPUT_TESTID = 'file-input';

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders without crashing', () => {
		setupTest(<Composer />);
		expect(screen.getByTestId(TINYMCE_EDITOR_TESTID)).toBeInTheDocument();
	});

	it('renders file input when onFileSelect is provided', () => {
		const handleFileSelect = jest.fn();
		setupTest(<Composer onFileSelect={handleFileSelect} />);
		expect(screen.getByTestId(FILE_INPUT_TESTID)).toBeInTheDocument();
	});

	it('calls onEditorChange in controlled mode when editor content changes', async () => {
		const handleChange = jest.fn();
		const { user } = setupTest(<Composer onEditorChange={handleChange} />);

		const editor = screen.getByTestId(TINYMCE_EDITOR_TESTID);
		await user.type(editor, 'Hello World');

		expect(handleChange).toHaveBeenCalled();
	});

	it('handles file input selection correctly', async () => {
		const handleFileSelect = jest.fn();
		const { user } = setupTest(<Composer onFileSelect={handleFileSelect} />);

		const fileInput = screen.getByTestId(FILE_INPUT_TESTID);
		const file = new File(['dummy content'], 'example.png', { type: 'image/png' });

		await user.upload(fileInput, file);

		expect(handleFileSelect).toHaveBeenCalledTimes(1);
		expect(handleFileSelect).toHaveBeenCalledWith({
			editor: expect.any(Object),
			files: expect.any(FileList)
		});
	});

	it('disables editor when disabled prop is true', () => {
		setupTest(<Composer disabled />);
		const editor = screen.getByTestId(TINYMCE_EDITOR_TESTID);
		expect(editor).toBeDisabled();
	});

	it('renders with initial value', () => {
		const initialContent = 'Initial content';
		setupTest(<Composer initialValue={initialContent} />);
		const editor = screen.getByTestId(TINYMCE_EDITOR_TESTID);
		expect(editor).toHaveValue(initialContent);
	});

	it('renders with controlled value', () => {
		const controlledValue = 'Controlled content';
		setupTest(<Composer value={controlledValue} onEditorChange={jest.fn()} />);
		const editor = screen.getByTestId(TINYMCE_EDITOR_TESTID);
		expect(editor).toHaveValue(controlledValue);
	});

	it('always renders file input', () => {
		setupTest(<Composer />);
		expect(screen.getByTestId(FILE_INPUT_TESTID)).toBeInTheDocument();
	});

	it('accepts multiple files in file input', () => {
		const handleFileSelect = jest.fn();
		setupTest(<Composer onFileSelect={handleFileSelect} />);
		const fileInput = screen.getByTestId(FILE_INPUT_TESTID);
		expect(fileInput).toHaveAttribute('multiple');
		expect(fileInput).toHaveAttribute('accept', 'image/*');
	});
});
