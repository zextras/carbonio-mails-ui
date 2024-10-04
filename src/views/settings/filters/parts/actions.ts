/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { TFunction } from 'i18next';
import { concat, filter, findIndex } from 'lodash';

import { useUiUtilities } from '../../../../hooks/use-ui-utilities';
import { FilterListType } from '../../../../types';

export type ListType = {
	isSelecting: boolean;
	list: Array<FilterListType>;
	moveDown: (arg: number) => void;
	moveUp: (arg: number) => void;
	selected: Record<string, boolean>;
	toggle: (arg: string) => void;
	unSelect: () => void;
};

export type CompProps = {
	t: TFunction;
	availableList: ListType;
	activeList: ListType;
	setFilters: (arg: Array<FilterListType>) => void;
	setFetchFilters: (arg: boolean) => void;
	modifierFunc: (arg: FilterListType[]) => Promise<void>;
};

export type DeleteFilterCompProps = CompProps & {
	onClose: () => void;
	selectedFilter: FilterListType;
	incomingFilters: FilterListType[];
};

export type DeleteOutgoingFilterCompProps = CompProps & {
	onClose: () => void;
	selectedFilter: FilterListType;
	outgoingFilters: FilterListType[];
};

export const useRemoveFilter = (): ((arg: CompProps) => void) => {
	const { createSnackbar } = useUiUtilities();

	return useCallback(
		({
			t,
			activeList,
			availableList,
			setFilters,
			setFetchFilters,
			modifierFunc
		}: CompProps): void => {
			const activeFiltersCopy = activeList?.list?.slice();
			const availableFiltersCopy = availableList?.list?.slice();
			const activeFilter = filter(activeFiltersCopy, { id: Object.keys(activeList.selected)[0] });
			const activeIndex = findIndex(activeFiltersCopy, activeFilter[0]);
			activeFiltersCopy.splice(activeIndex, 1);
			availableFiltersCopy.push({ ...activeFilter[0], active: false });
			const newFilters = concat(activeFiltersCopy, availableFiltersCopy);
			setFilters(newFilters);
			activeList.unSelect();

			modifierFunc(newFilters)
				.then(() => {
					setFetchFilters(true);
				})
				.catch((error) => {
					createSnackbar({
						key: `share`,
						replace: true,
						hideButton: true,
						severity: 'error',
						label:
							error?.message ||
							t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 5000
					});
				});
		},
		[createSnackbar]
	);
};

export const useAddFilter = (): ((arg: CompProps) => void) => {
	const { createSnackbar } = useUiUtilities();
	return useCallback(
		({
			t,
			activeList,
			availableList,
			setFilters,
			setFetchFilters,
			modifierFunc
		}: CompProps): void => {
			const activeFiltersCopy = activeList?.list?.slice();
			const availableFiltersCopy = availableList?.list?.slice();
			const activeFilter = filter(availableFiltersCopy, {
				id: Object.keys(availableList.selected)[0]
			});
			const activeIndex = findIndex(availableFiltersCopy, activeFilter[0]);
			availableFiltersCopy.splice(activeIndex, 1);
			activeFiltersCopy.push({ ...activeFilter[0], active: true });
			const newFilters = concat(activeFiltersCopy, availableFiltersCopy);
			setFilters(newFilters);
			availableList.unSelect();
			modifierFunc(newFilters)
				.then(() => {
					setFetchFilters(true);
				})
				.catch((error: { message: string }) => {
					createSnackbar({
						key: 'filter-delete-error',
						severity: 'error',
						label:
							error.message || t('label.error_try_again', 'Something went wrong, please try again'),
						hideButton: true
					});
				});
		},
		[createSnackbar]
	);
};

export const useDeleteOutgoingFilter = (): ((args: DeleteOutgoingFilterCompProps) => void) => {
	const { createSnackbar } = useUiUtilities();
	return useCallback(
		({
			t,
			setFetchFilters,
			modifierFunc,
			onClose,
			selectedFilter,
			outgoingFilters
		}: DeleteOutgoingFilterCompProps): void => {
			const newFilters = filter(outgoingFilters, (f) => f.name !== selectedFilter.name);
			modifierFunc(newFilters)
				.then(() => {
					createSnackbar({
						key: 'filter-delete-success',
						severity: 'info',
						label: t('settings.filter_deleted', 'Filter successfully deleted'),
						hideButton: true
					});
					setFetchFilters(true);
				})
				.catch((error: { message: any }) => {
					createSnackbar({
						key: 'filter-delete-error',
						severity: 'error',
						label:
							error.message || t('label.error_try_again', 'Something went wrong, please try again'),
						hideButton: true
					});
				});
			onClose();
		},
		[createSnackbar]
	);
};

export const useDeleteFilter = (): ((args: DeleteFilterCompProps) => void) => {
	const { createSnackbar } = useUiUtilities();
	return useCallback(
		({
			t,
			setFetchFilters,
			modifierFunc,
			onClose,
			selectedFilter,
			incomingFilters
		}: DeleteFilterCompProps): void => {
			const newFilters = filter(incomingFilters, (f) => f.name !== selectedFilter.name);
			modifierFunc(newFilters)
				.then(() => {
					createSnackbar({
						key: 'filter-delete-success',
						severity: 'info',
						label: t('settings.filter_deleted', 'Filter successfully deleted'),
						hideButton: true
					});
					setFetchFilters(true);
				})
				.catch((error: { message: string }) => {
					createSnackbar({
						key: 'filter-delete-error',
						severity: 'error',
						label:
							error.message || t('label.error_try_again', 'Something went wrong, please try again'),
						hideButton: true
					});
				});
			onClose();
		},
		[createSnackbar]
	);
};
