/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { concat, filter, findIndex } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useUiUtilities } from 'hooks/use-ui-utilities';
import { Filter } from 'types/filters';

export type ListType = {
	isSelecting: boolean;
	list: Array<Filter>;
	moveDown: (arg: number) => void;
	moveUp: (arg: number) => void;
	selected: Record<string, boolean>;
	toggle: (arg: string) => void;
	unSelect: () => void;
};

export type CompProps = {
	availableList: ListType;
	activeList: ListType;
	modifierFunc: (arg: Filter[]) => Promise<void>;
};

export type DeleteFilterCompProps = CompProps & {
	onClose: () => void;
	filterToDelete: Filter;
	filters: Filter[];
};

export const useRemoveFilter = (): ((arg: CompProps) => void) => {
	const { createSnackbar } = useUiUtilities();
	const [t] = useTranslation();

	return useCallback(
		({ activeList, availableList, modifierFunc }: CompProps): void => {
			const activeFiltersCopy = activeList?.list?.slice();
			const availableFiltersCopy = availableList?.list?.slice();
			const activeFilter = filter(activeFiltersCopy, { name: Object.keys(activeList.selected)[0] });
			const activeIndex = findIndex(activeFiltersCopy, activeFilter[0]);
			activeFiltersCopy.splice(activeIndex, 1);
			availableFiltersCopy.push({ ...activeFilter[0], active: false });
			const newFilters = concat(activeFiltersCopy, availableFiltersCopy);
			activeList.unSelect();

			modifierFunc(newFilters).catch((error) => {
				createSnackbar({
					key: `share`,
					replace: true,
					hideButton: true,
					severity: 'error',
					label:
						error?.message || t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 5000
				});
			});
		},
		[createSnackbar, t]
	);
};

export const useAddFilter = (): ((arg: CompProps) => void) => {
	const { createSnackbar } = useUiUtilities();
	const [t] = useTranslation();

	return useCallback(
		({ activeList, availableList, modifierFunc }: CompProps): void => {
			const activeFiltersCopy = activeList?.list?.slice();
			const availableFiltersCopy = availableList?.list?.slice();
			const activeFilter = filter(availableFiltersCopy, {
				name: Object.keys(availableList.selected)[0]
			});
			const activeIndex = findIndex(availableFiltersCopy, activeFilter[0]);
			availableFiltersCopy.splice(activeIndex, 1);
			activeFiltersCopy.push({ ...activeFilter[0], active: true });
			const newFilters = concat(activeFiltersCopy, availableFiltersCopy);
			availableList.unSelect();
			modifierFunc(newFilters).catch((error: { message: string }) => {
				createSnackbar({
					key: 'filter-delete-error',
					severity: 'error',
					label:
						error.message || t('label.error_try_again', 'Something went wrong, please try again'),
					hideButton: true
				});
			});
		},
		[createSnackbar, t]
	);
};

export const useDeleteFilter = (): ((args: DeleteFilterCompProps) => void) => {
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();
	return useCallback(
		({ modifierFunc, onClose, filterToDelete, filters }: DeleteFilterCompProps): void => {
			const newFilters = filter(filters, (f) => f.name !== filterToDelete.name);
			modifierFunc(newFilters)
				.then(() => {
					createSnackbar({
						key: 'filter-delete-success',
						severity: 'info',
						label: t('settings.filter_deleted', 'Filter successfully deleted'),
						hideButton: true
					});
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
		[createSnackbar, t]
	);
};
