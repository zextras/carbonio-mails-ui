/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen, setupTest, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';
import NameInputRow from '../name-input';

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

		expect(screen.getByText(/select color/i)).toBeVisible();
		expect(screen.getByText(/blue/i)).toBeVisible();

		expect(screen.getByText(/folder name/i)).toBeVisible();
		const folderName = screen.getByRole('textbox', { name: /folder name/i });
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
		await user.click(screen.getByText(/red/i));

		expect(setFolderColor).toHaveBeenCalledWith(ZIMBRA_STANDARD_COLORS[5].zValue);
	});
});
