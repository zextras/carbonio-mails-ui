/* eslint-disable @typescript-eslint/no-use-before-define,sonarjs/no-duplicate-string */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { setupTest } from '@test-setup';
import ComposeMessage from 'views/settings/compose-msg-settings';

describe('compose-msg-settings', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const settingObjectEmpty: Record<string, string> = {
		zimbraPrefHtmlEditorDefaultFontFamily: '',
		zimbraPrefHtmlEditorDefaultFontSize: '',
		zimbraPrefHtmlEditorDefaultFontColor: '',
		zimbraPrefComposeFormat: '',
		zimbraPrefMailRequestReadReceipts: 'FALSE'
	};

	it('should render correctly', async () => {
		const mockUpdateSettings = getMockUpdateSettings(settingObjectEmpty);

		setupTest(
			<ComposeMessage settingsObj={settingObjectEmpty} updateSettings={mockUpdateSettings} />,
			{}
		);

		expect(screen.getByText('labels.composing_messages')).toBeInTheDocument();
		expect(screen.getByText('labels.compose')).toBeInTheDocument();
		expect(screen.getByLabelText('label.as_html')).toBeInTheDocument();
		expect(screen.getByLabelText('label.as_text')).toBeInTheDocument();
		expect(screen.getByText('settings.font')).toBeInTheDocument();
		expect(screen.getByText('label.size')).toBeInTheDocument();
		expect(screen.getByTestId('color-picker-color-box')).toBeInTheDocument();
	});

	it('should render correctly with default values from the pref(s) attributes', async () => {
		const settingObject = generateSettingObject();
		const mockUpdateSettings = getMockUpdateSettings(settingObject);

		setupTest(
			<ComposeMessage settingsObj={settingObject} updateSettings={mockUpdateSettings} />,
			{}
		);

		expect(screen.getByText('Arial')).toBeInTheDocument();
		expect(screen.getByText('12pt')).toBeInTheDocument();
		expect(screen.getByLabelText('label.as_html')).toBeChecked();
		expect(screen.getByLabelText('label.as_text')).not.toBeChecked();
		expect(screen.getByTestId('color-picker-color-box')).toHaveStyle('background-color: #24cb77');
	});

	it('should call update settings with modified settings', async () => {
		const settingObject = generateSettingObject();
		const mockUpdateSettings = getMockUpdateSettings(settingObject);

		const { user } = setupTest(
			<ComposeMessage settingsObj={settingObject} updateSettings={mockUpdateSettings} />,
			{}
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
		const settingObject = generateSettingObject();
		const mockUpdateSettings = getMockUpdateSettings(settingObject);

		const { user } = setupTest(
			<ComposeMessage settingsObj={settingObject} updateSettings={mockUpdateSettings} />,
			{}
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

	it('compose format radio buttons should be exclusive', async () => {
		const settingObject = generateSettingObject();
		const mockUpdateSettings = getMockUpdateSettings(settingObject);

		const { user, rerender } = setupTest(
			<ComposeMessage settingsObj={settingObject} updateSettings={mockUpdateSettings} />,
			{}
		);

		expect(screen.getByRole('radio', { name: 'label.as_html' })).toBeChecked();

		await user.click(screen.getByRole('radio', { name: 'label.as_text' }));

		rerender(<ComposeMessage settingsObj={settingObject} updateSettings={mockUpdateSettings} />);

		expect(screen.getByRole('radio', { name: 'label.as_text' })).toBeChecked();
		expect(screen.getByRole('radio', { name: 'label.as_html' })).not.toBeChecked();
	});

	describe('Read Receipt section', () => {
		it('should render the Read Receipt section with switch and description', () => {
			const settingObject = generateSettingObject();
			const mockUpdateSettings = getMockUpdateSettings(settingObject);

			setupTest(
				<ComposeMessage settingsObj={settingObject} updateSettings={mockUpdateSettings} />,
				{}
			);

			expect(screen.getByText('label.composing_messages_read_receipt')).toBeInTheDocument();
			expect(screen.getByText('label.always_request_read_receipts')).toBeInTheDocument();
			expect(screen.getByText('label.read_receipt_description')).toBeInTheDocument();
		});

		it('should call updateSettings when Read Receipt switch is toggled on', async () => {
			const settingObject = generateSettingObject();
			const mockUpdateSettings = getMockUpdateSettings(settingObject);

			const { user } = setupTest(
				<ComposeMessage settingsObj={settingObject} updateSettings={mockUpdateSettings} />,
				{}
			);

			await user.click(screen.getByTestId('icon: ToggleLeftOutline'));

			await waitFor(() =>
				expect(mockUpdateSettings).toHaveBeenCalledWith({
					target: {
						name: 'zimbraPrefMailRequestReadReceipts',
						value: 'TRUE'
					}
				})
			);
		});

		it('should call updateSettings when Read Receipt switch is toggled off', async () => {
			const settingObject = {
				...generateSettingObject(),
				zimbraPrefMailRequestReadReceipts: 'TRUE'
			};
			const mockUpdateSettings = getMockUpdateSettings(settingObject);

			const { user } = setupTest(
				<ComposeMessage settingsObj={settingObject} updateSettings={mockUpdateSettings} />,
				{}
			);

			await user.click(screen.getByTestId('icon: ToggleRight'));

			await waitFor(() =>
				expect(mockUpdateSettings).toHaveBeenCalledWith({
					target: {
						name: 'zimbraPrefMailRequestReadReceipts',
						value: 'FALSE'
					}
				})
			);
		});
	});

	function getMockUpdateSettings(
		settingObject: Record<string, string>
	): Mock<(value: any) => void> {
		return vi.fn((changedKeyValue) => {
			const { name, value } = changedKeyValue.target;
			const updatedSettings = { ...settingObject, [name]: value as string };
			Object.assign(settingObject, updatedSettings);
		});
	}

	function generateSettingObject(): Record<string, string> {
		return {
			zimbraPrefHtmlEditorDefaultFontFamily: 'arial, helvetica, sans-serif',
			zimbraPrefHtmlEditorDefaultFontSize: '12pt',
			zimbraPrefHtmlEditorDefaultFontColor: '#24cb77',
			zimbraPrefComposeFormat: 'html',
			zimbraPrefMailRequestReadReceipts: 'FALSE'
		};
	}
});
