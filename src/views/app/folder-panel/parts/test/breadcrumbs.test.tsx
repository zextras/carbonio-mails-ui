/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { getFolderPathForBreadcrumb } from '../../../../../helpers/folders';
import { generateStore } from '../../../../../tests/generators/store';
import { Breadcrumbs } from '../breadcrumbs';

jest.mock('../../../../../helpers/folders', () => ({
	getFolderPathForBreadcrumb: jest.fn()
}));

describe('Breadcrumbs Component', () => {
	const setIsSelectModeOnMock = jest.fn();
	const defaultProps = {
		itemsCount: 5,
		isSelectModeOn: false,
		setIsSelectModeOn: setIsSelectModeOnMock,
		folderPath: 'root/folder/subfolder',
		folderId: '123',
		isSearchModule: false
	};

	beforeEach(() => {
		(getFolderPathForBreadcrumb as jest.Mock).mockReturnValue({
			folderPathFirstPart: 'root/folder/',
			folderPathLastPart: 'subfolder'
		});
	});

	it('renders the Breadcrumbs component', () => {
		const store = generateStore();
		setupTest(<Breadcrumbs {...defaultProps} />, { store });
		expect(screen.getByTestId('breadcrumb-path')).toBeInTheDocument();
		expect(screen.getByTestId('breadcrumb-count')).toBeInTheDocument();
	});

	it('displays the correct folder path', () => {
		const store = generateStore();
		setupTest(<Breadcrumbs {...defaultProps} />, { store });
		expect(screen.getByTestId('breadcrumb-path')).toHaveTextContent('root/folder/subfolder');
	});

	it('displays the correct items count', () => {
		const store = generateStore();
		setupTest(<Breadcrumbs {...defaultProps} />, { store });
		expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('5');
	});

	it('displays the correct items count when count exceeds 100', () => {
		const store = generateStore();
		setupTest(<Breadcrumbs {...defaultProps} itemsCount={1_000} />, { store });
		expect(screen.getByTestId('breadcrumb-count')).toHaveTextContent('1000');
	});

	it('toggles selection mode when SelectIconCheckbox is clicked', async () => {
		const store = generateStore();
		const { user } = setupTest(<Breadcrumbs {...defaultProps} />, { store });
		const checkbox = await screen.findByTestId('select-icon-checkbox');
		await act(async () => {
			await user.click(checkbox);
		});
		expect(setIsSelectModeOnMock).toHaveBeenCalledWith(expect.any(Function));
	});

	it('renders SortingComponent and LayoutComponent when not in search module', () => {
		const store = generateStore();
		setupTest(<Breadcrumbs {...defaultProps} />, { store });
		expect(screen.getByTestId('layout-component')).toBeInTheDocument();
		expect(screen.getByTestId('sorting-dropdown')).toBeInTheDocument();
	});

	it('does not render SortingComponent and LayoutComponent when in search module', () => {
		const store = generateStore();
		setupTest(<Breadcrumbs {...defaultProps} isSearchModule />, { store });
		expect(screen.queryByTestId('layout-component')).not.toBeInTheDocument();
		expect(screen.queryByTestId('sorting-dropdown')).not.toBeInTheDocument();
	});
});
