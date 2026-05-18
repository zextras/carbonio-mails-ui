/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';

import { setupTest, screen } from '@test-setup';
import { NameInputRow } from 'views/sidebar/parts/edit/name-input';

describe('NameInputRow', () => {
	const inputValue = 'Test Folder';
	const folderColor = 1;
	const showWarning = false;
	const inpDisable = false;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render correctly', () => {
		setupTest(
			<NameInputRow
				setInputValue={vi.fn()}
				inpDisable={inpDisable}
				showWarning={showWarning}
				inputValue={inputValue}
				folderColor={folderColor}
				setFolderColor={vi.fn()}
			/>
		);

		expect(screen.getByText(/select color/i)).toBeVisible();
		expect(screen.getByText(/blue/i)).toBeVisible();

		expect(screen.getByText(/folder name/i)).toBeVisible();
		const folderName = screen.getByRole('textbox', { name: /folder name/i });
		expect(folderName).toBeVisible();
		expect(folderName).toHaveValue(inputValue);
	});
	it('should call colorPicker onChange with the new color', async () => {
		const setFolderColor = vi.fn();
		const { user } = setupTest(
			<NameInputRow
				setInputValue={vi.fn()}
				inpDisable={inpDisable}
				showWarning={showWarning}
				inputValue={inputValue}
				folderColor={folderColor}
				setFolderColor={setFolderColor}
			/>
		);

		await user.click(screen.getByTestId('icon: ChevronDownOutline'));
		await user.click(screen.getByText(/red/i));

		expect(setFolderColor).toHaveBeenCalledWith(ZIMBRA_STANDARD_COLORS[5].zValue);
	});
});
