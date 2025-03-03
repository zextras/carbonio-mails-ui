/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';
import { useTheme } from '@zextras/carbonio-design-system';

import { setupHook, setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { getFolderPathForBreadcrumb } from '../../../../../helpers/folders';
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
