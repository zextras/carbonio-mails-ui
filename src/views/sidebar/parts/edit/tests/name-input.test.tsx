/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { setupTest, screen } from '../../../../../carbonio-ui-commons/test/test-setup';
import NameInputRow from '../name-input';
import { ZIMBRA_STANDARD_COLORS } from '../../../../../carbonio-ui-commons/constants';

describe('NameInputRow', () => {
	const inputValue = 'Test Folder';
	const folderColor = 1;
	const showWarning = false;
	const inpDisable = false;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should render correctly', () => {
		setupTest(
			<NameInputRow
				setInputValue={jest.fn()}
				inpDisable={inpDisable}
				showWarning={showWarning}
				inputValue={inputValue}
				folderColor={folderColor}
				setFolderColor={jest.fn()}
			/>
		);

		expect(screen.getByText('label.select_color')).toBeVisible();
		expect(screen.getByText('color.blue')).toBeVisible();

		expect(screen.getByText('label.folder_name')).toBeVisible();
		const folderName = screen.getByRole('textbox', { name: /label\.folder_name/i });
		expect(folderName).toBeVisible();
		expect(folderName).toHaveValue(inputValue);
	});
	it('should call colorPicker onChange with the new color', async () => {
		const setFolderColor = jest.fn();
		const { user } = setupTest(
			<NameInputRow
				setInputValue={jest.fn()}
				inpDisable={inpDisable}
				showWarning={showWarning}
				inputValue={inputValue}
				folderColor={folderColor}
				setFolderColor={setFolderColor}
			/>
		);

		await user.click(screen.getByTestId('icon: ChevronDownOutline'));
		await user.click(screen.getByText('color.red'));

		expect(setFolderColor).toHaveBeenCalledWith(ZIMBRA_STANDARD_COLORS[5].zValue);
	});
});
