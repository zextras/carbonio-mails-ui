/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { within } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { capitalize, forEach, noop, without } from 'lodash';

import { screen, setupTest } from '@test-setup';
import { SORTING_OPTIONS } from 'constants/index';
import { Breadcrumbs } from 'views/app/folder-panel/parts/breadcrumbs';

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
describe('Breadcrumbs', () => {
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
			if (option.label !== SORTING_OPTIONS.to.label)
				expect(
					within(screen.getByTestId(dropdownRegex)).getByText(capitalize(option.label))
				).toBeInTheDocument();
			else {
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
			if (option.label !== SORTING_OPTIONS.from.label)
				expect(
					within(screen.getByTestId(dropdownRegex)).getByText(capitalize(option.label))
				).toBeInTheDocument();
			else {
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
