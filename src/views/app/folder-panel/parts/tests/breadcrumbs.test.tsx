/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { act } from 'react';

import { useTheme } from '@zextras/carbonio-design-system';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { capitalize, forEach, noop, without } from 'lodash';
import type { Mock } from 'vitest';

import { setupHook, within, setupTest, screen } from '@test-setup';
import { SORTING_OPTIONS } from 'constants/index';
import { getFolderPathForBreadcrumb } from 'helpers/folders';
import { Breadcrumbs } from 'views/app/folder-panel/parts/breadcrumbs';

vi.mock('../../../../../helpers/folders', () => ({
	getFolderPathForBreadcrumb: vi.fn()
}));

describe('Breadcrumbs Component', () => {
	const setIsSelectModeOnMock = vi.fn();
	const defaultProps = {
		itemsCount: 5,
		isSelectModeOn: false,
		setIsSelectModeOn: setIsSelectModeOnMock,
		folderPath: 'root/folder/subfolder',
		folderId: '123',
		isSearchModule: false
	};

	beforeEach(() => {
		(getFolderPathForBreadcrumb as Mock).mockReturnValue({
			folderPathFirstPart: 'root/folder/',
			folderPathLastPart: 'subfolder'
		});
	});

	it('renders the Breadcrumbs component', () => {
		setupTest(<Breadcrumbs {...defaultProps} />);
		expect(screen.getByTestId('BreadcrumbPathStart')).toBeInTheDocument();
		expect(screen.getByTestId('BreadcrumbCount')).toBeInTheDocument();
	});

	it('displays the correct folder starting path', () => {
		setupTest(<Breadcrumbs {...defaultProps} />);
		expect(screen.getByTestId('BreadcrumbPathStart')).toHaveTextContent('root/folder/');
	});

	it('the starting path has a gray1 color', () => {
		setupTest(<Breadcrumbs {...defaultProps} />);
		const { result } = setupHook(useTheme);
		expect(screen.getByTestId('BreadcrumbPathStart')).toHaveStyle(
			`color: ${result.current.palette.gray1.regular}`
		);
	});

	it('displays the correct folder ending path', () => {
		setupTest(<Breadcrumbs {...defaultProps} />);
		expect(screen.getByTestId('BreadcrumbPathEnd')).toHaveTextContent('subfolder');
	});

	it('the ending path has a text color', () => {
		setupTest(<Breadcrumbs {...defaultProps} />);
		const { result } = setupHook(useTheme);
		expect(screen.getByTestId('BreadcrumbPathEnd')).toHaveStyle(
			`color: ${result.current.palette.text.regular}`
		);
	});

	it('displays the correct items count', () => {
		setupTest(<Breadcrumbs {...defaultProps} />);
		expect(screen.getByTestId('BreadcrumbCount')).toHaveTextContent('5');
	});

	it('displays the correct items count when count exceeds 100', () => {
		setupTest(<Breadcrumbs {...defaultProps} itemsCount={1_000} />);
		expect(screen.getByTestId('BreadcrumbCount')).toHaveTextContent('1000');
	});

	it('toggles selection mode when SelectIconCheckbox is clicked', async () => {
		const { user } = setupTest(<Breadcrumbs {...defaultProps} />);
		const checkbox = await screen.findByTestId('select-icon-checkbox');
		await act(async () => {
			await user.click(checkbox);
		});
		expect(setIsSelectModeOnMock).toHaveBeenCalledWith(expect.any(Function));
	});

	it('renders SortingComponent and LayoutComponent when not in search module', () => {
		setupTest(<Breadcrumbs {...defaultProps} />);
		expect(screen.getByTestId('layout-component')).toBeInTheDocument();
		expect(screen.getByTestId('sorting-dropdown')).toBeInTheDocument();
	});

	it('does not render SortingComponent and LayoutComponent when in search module', () => {
		setupTest(<Breadcrumbs {...defaultProps} isSearchModule />);
		expect(screen.queryByTestId('layout-component')).not.toBeInTheDocument();
		expect(screen.queryByTestId('sorting-dropdown')).not.toBeInTheDocument();
	});
});

const sortingDropdown = 'sorting-dropdown';
const defaultProps = {
	folderId: FOLDERS.INBOX,
	folderPath: '',
	isSearchModule: false,
	isSelectModeOn: false,
	itemsCount: 0,
	setIsSelectModeOn: noop
};
const dropdownRegex = /dropdown-popper-list/i;
const listIconRegex = /icon: AzListOutline/i;
const sortingOptionsWithoutSize = without(Object.values(SORTING_OPTIONS), SORTING_OPTIONS.size);
describe('Breadcrumbs sorting', () => {
	it('the sorting component appears on the breadcrumbs component', async () => {
		setupTest(<Breadcrumbs {...defaultProps} />);
		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
	});
	it('in a folder different from SENT, clicking on the sorting component icon opens a dropdown containing all the sorting options excluded TO', async () => {
		const { user } = setupTest(<Breadcrumbs {...defaultProps} />);
		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		forEach(sortingOptionsWithoutSize, (option) => {
			if (
				option.label !== SORTING_OPTIONS.to.label &&
				option.label !== SORTING_OPTIONS.changeDate.label
			) {
				// Date option has "(Default)" suffix
				const expectedText =
					option.label === SORTING_OPTIONS.date.label
						? `${capitalize(option.label)} (Default)`
						: capitalize(option.label);
				expect(
					within(screen.getByTestId(dropdownRegex)).getByText(expectedText)
				).toBeInTheDocument();
			} else {
				const excludedOptionRegexPattern = new RegExp(
					`sorting_dropdown.${SORTING_OPTIONS.to.label}`,
					'i'
				);
				const dropdownElement = within(screen.getByTestId(dropdownRegex)).queryByText(
					excludedOptionRegexPattern
				);
				expect(dropdownElement).not.toBeInTheDocument();
			}
		});
	});
	it('in SENT folder, clicking on the sorting component icon opens a dropdown containing all the sorting options excluded FROM', async () => {
		const props = {
			...defaultProps,
			folderId: FOLDERS.SENT
		};
		const { user } = setupTest(<Breadcrumbs {...props} />);
		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		forEach(sortingOptionsWithoutSize, (option) => {
			// Exclude both FROM and changeDate options in SENT folder
			if (
				option.label !== SORTING_OPTIONS.from.label &&
				option.label !== SORTING_OPTIONS.changeDate.label
			) {
				// Date option has "(Default)" suffix
				const expectedText =
					option.label === SORTING_OPTIONS.date.label
						? `${capitalize(option.label)} (Default)`
						: capitalize(option.label);
				expect(
					within(screen.getByTestId(dropdownRegex)).getByText(expectedText)
				).toBeInTheDocument();
			} else {
				const excludedOptionRegexPattern = new RegExp(
					`sorting_dropdown.${SORTING_OPTIONS.from.value}`,
					'i'
				);
				const dropdownElement = within(screen.getByTestId(dropdownRegex)).queryByText(
					excludedOptionRegexPattern
				);
				expect(dropdownElement).not.toBeInTheDocument();
			}
		});
	});
	it('clicking on the sorting component icon when open will close the dropdown', async () => {
		const { user } = setupTest(<Breadcrumbs {...defaultProps} />);
		expect(await screen.findByTestId(sortingDropdown)).toBeInTheDocument();
		const sortIcon = screen.getByRoleWithIcon('button', { icon: listIconRegex });
		if (sortIcon) await user.click(sortIcon);
		expect(await screen.findByTestId(dropdownRegex)).toBeInTheDocument();
		if (sortIcon) await user.click(sortIcon);
		expect(screen.queryByTestId(dropdownRegex)).not.toBeInTheDocument();
	});
});
