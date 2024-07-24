/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';

import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../tests/generators/store';
import ComposeMessage from '../compose-msg-settings';

jest.mock('@zextras/carbonio-shell-ui', () => ({
	t: jest.fn((key) => key)
}));

describe('compose-msg-settings', () => {
	const mockUpdateSettings = jest.fn();
	const store = generateStore();

	const settingObjectEmpty = {
		zimbraPrefHtmlEditorDefaultFontFamily: '',
		zimbraPrefHtmlEditorDefaultFontSize: '',
		zimbraPrefHtmlEditorDefaultFontColor: '',
		zimbraPrefComposeFormat: ''
	};

	const settingObject = {
		zimbraPrefHtmlEditorDefaultFontFamily: 'arial, helvetica, sans-serif', // Arial
		zimbraPrefHtmlEditorDefaultFontSize: '12pt',
		zimbraPrefHtmlEditorDefaultFontColor: '#24cb77',
		zimbraPrefComposeFormat: 'html'
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should render correctly', async () => {
		setupTest(
			<ComposeMessage settingsObj={settingObjectEmpty} updateSettings={mockUpdateSettings} />,
			{
				store
			}
		);

		expect(screen.getByText('labels.composing_messages')).toBeInTheDocument();
		expect(screen.getByText('labels.compose_colin')).toBeInTheDocument();
		expect(screen.getByLabelText('label.as_html')).toBeInTheDocument();
		expect(screen.getByLabelText('label.as_text')).toBeInTheDocument();
		expect(screen.getByText('settings.font')).toBeInTheDocument();
		expect(screen.getByText('label.size')).toBeInTheDocument();
		expect(screen.getByTestId('color-picker-color-box')).toBeInTheDocument();
	});

	it('should render correctly with default values from the pref(s) attributes', async () => {
		setupTest(<ComposeMessage settingsObj={settingObject} updateSettings={mockUpdateSettings} />, {
			store
		});

		expect(screen.getByText('Arial')).toBeInTheDocument();
		expect(screen.getByText('12pt')).toBeInTheDocument();
		expect(screen.getByLabelText('label.as_html')).toBeChecked();
		expect(screen.getByLabelText('label.as_text')).not.toBeChecked();
		expect(screen.getByTestId('color-picker-color-box')).toHaveAttribute('color', '#24cb77');
	});

	it('should call update settings with modified settings', async () => {
		const { user } = setupTest(
			<ComposeMessage settingsObj={settingObject} updateSettings={mockUpdateSettings} />,
			{
				store
			}
		);

		// Font Family
		act(() => {
			user.click(screen.getByText('Arial'));
		});

		const newSelectedFont = await screen.findByText('Tahoma');
		act(() => {
			user.click(newSelectedFont);
		});

		await waitFor(() =>
			expect(mockUpdateSettings).toHaveBeenCalledWith({
				target: {
					name: 'zimbraPrefHtmlEditorDefaultFontFamily',
					value: 'tahoma, arial, helvetica, sans-serif'
				}
			})
		);

		// Font Size
		act(() => {
			user.click(screen.getByText('12pt'));
		});

		const newSelectedFontSize = await screen.findByText('48pt');
		act(() => {
			user.click(newSelectedFontSize);
		});

		await waitFor(() =>
			expect(mockUpdateSettings).toHaveBeenCalledWith({
				target: {
					name: 'zimbraPrefHtmlEditorDefaultFontSize',
					value: '48pt'
				}
			})
		);
	});

	it('should call update settings when composer format is changed', async () => {
		const { user } = setupTest(
			<ComposeMessage settingsObj={settingObject} updateSettings={mockUpdateSettings} />,
			{
				store
			}
		);

		act(() => {
			user.click(screen.getByText('label.as_text'));
		});

		await waitFor(() =>
			expect(mockUpdateSettings).toHaveBeenCalledWith({
				target: {
					name: 'zimbraPrefComposeFormat',
					value: 'text'
				}
			})
		);
	});

	// TODO: fix this test
	// it('should disable the setting inputs when the compose format is text', async () => {
	// 	const { user } = setupTest(
	// 		<ComposeMessage settingsObj={settingObject} updateSettings={mockUpdateSettings} />,
	// 		{
	// 			store
	// 		}
	// 	);
	//
	// 	// screen.logTestingPlaygroundURL();
	//
	// 	await user.click(
	// 		screen.getByRole('radio', {
	// 			name: /label\.as_text/i
	// 		})
	// 	);
	// 	expect(
	// 		screen.getByRole('radio', {
	// 			name: /label\.as_text/i
	// 		})
	// 	).toBeChecked();
	//
	// 	// const radioText = screen.getByRole('radio', { name: 'label.as_text' });
	// 	//
	// 	// await act(async () => {
	// 	// 	await user.click(radioText);
	// 	// });
	// 	//
	// 	// act(() => {
	// 	// 	jest.advanceTimersByTime(1000);
	// 	// });
	// 	//
	// 	// await waitFor(() => expect(screen.getByLabelText('label.as_text')).toBeChecked());
	// });
});
