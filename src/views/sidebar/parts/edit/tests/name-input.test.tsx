/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';

import { setupTest, screen } from '@test-setup';
import { NameInputRow } from 'views/sidebar/parts/edit/name-input';

const NAME_INPUT_LABEL = /choose a representative name/i;

describe('NameInputRow', () => {
	const inputValue = 'Test Folder';
	const folderColorHex = ZIMBRA_STANDARD_COLORS[1].hex;
	const showWarning = false;
	const inpDisable = false;

	const defaultProps = {
		setInputValue: vi.fn(),
		inpDisable,
		showWarning,
		inputValue,
		folderColorHex,
		setFolderColorHex: vi.fn(),
		isColorPickerOpen: false,
		onColorPickerOpenChange: vi.fn()
	};

	it('should render correctly', () => {
		setupTest(<NameInputRow {...defaultProps} />);

		expect(screen.getByRole('button', { name: /blue/i })).toHaveAttribute('aria-pressed', 'true');
		expect(
			screen.getByText(/choose a color to make this folder easier to recognize/i)
		).toBeVisible();

		const folderName = screen.getByRole('textbox', { name: NAME_INPUT_LABEL });
		expect(folderName).toBeVisible();
		expect(folderName).toHaveValue(inputValue);
		expect(folderName).toBeEnabled();
	});

	it('should call setFolderColorHex with the hex of the clicked color', async () => {
		const setFolderColorHex = vi.fn();
		const { user } = setupTest(
			<NameInputRow {...defaultProps} setFolderColorHex={setFolderColorHex} />
		);

		await user.click(screen.getByRole('button', { name: /red/i }));

		expect(setFolderColorHex).toHaveBeenCalledWith(ZIMBRA_STANDARD_COLORS[5].hex);
	});

	it('should notify when the custom color picker opens', async () => {
		const onColorPickerOpenChange = vi.fn();
		const { user } = setupTest(
			<NameInputRow {...defaultProps} onColorPickerOpenChange={onColorPickerOpenChange} />
		);

		await user.click(screen.getByRoleWithIcon('button', { icon: 'icon: PlusCircleOutline' }));

		expect(onColorPickerOpenChange).toHaveBeenLastCalledWith(true);
	});

	it('should disable the name input while the color picker is open', () => {
		setupTest(<NameInputRow {...defaultProps} isColorPickerOpen />);

		expect(screen.getByRole('textbox', { name: NAME_INPUT_LABEL })).toBeDisabled();
	});
});
