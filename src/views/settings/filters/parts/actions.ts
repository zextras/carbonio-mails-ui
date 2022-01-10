/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { concat, filter, findIndex } from 'lodash';
import { TFunction } from 'i18next';

type FilterListType = {
	active: boolean;
	filterActions: Array<any>;
	filterTests: Array<any>;
	id?: string;
	name: string;
};
type ListType = {
	isSelecting: boolean;
	list: Array<FilterListType>;
	moveDown: (arg: number) => void;
	moveUp: (arg: number) => void;
	selected: Record<string, boolean>;
	toggle: (arg: string) => void;
	unSelect: () => void;
};

type CompProps = {
	t: TFunction;
	availableList: ListType;
	activeList: ListType;
	setFilters: (arg: Array<FilterListType>) => void;
	setFetchFilters: (arg: boolean) => void;
	modifierFunc: (arg: any) => Promise<any>;
};

type DeleteFilterCompProps = {
	t: TFunction;
	availableList: ListType;
	activeList: ListType;
	setFilters: (arg: Array<FilterListType>) => void;
	setFetchFilters: (arg: boolean) => void;
	modifierFunc: Promise<any>;
	createSnackbar: any;
	onClose: () => void;
	selectedFilter: any;
	incomingFilters: any;
};

type DeleteOutgoingFilterCompProps = {
	t: TFunction;
	availableList: ListType;
	activeList: ListType;
	setFilters: (arg: Array<FilterListType>) => void;
	setFetchFilters: (arg: boolean) => void;
	modifierFunc: Promise<any>;
	createSnackbar: any;
	onClose: () => void;
	selectedFilter: any;
	outgoingFilters: any;
};
export const removeFilter = ({
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
		.then((res) => {
			setFetchFilters(true);
		})
		.catch((error) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			createSnackbar({
				key: `share`,
				replace: true,
				hideButton: true,
				type: 'error',
				label:
					error?.message || t('label.error_try_again', 'Something went wrong, please try again'),
				autoHideTimeout: 5000
			});
		});
};

export const addFilter = ({
	t,
	activeList,
	availableList,
	setFilters,
	setFetchFilters,
	modifierFunc
}: CompProps): void => {
	const activeFiltersCopy = activeList?.list?.slice();
	const availableFiltersCopy = availableList?.list?.slice();
	const activeFilter = filter(availableFiltersCopy, { id: Object.keys(availableList.selected)[0] });
	const activeIndex = findIndex(availableFiltersCopy, activeFilter[0]);
	availableFiltersCopy.splice(activeIndex, 1);
	activeFiltersCopy.push({ ...activeFilter[0], active: true });
	const newFilters = concat(activeFiltersCopy, availableFiltersCopy);
	setFilters(newFilters);
	availableList.unSelect();
	modifierFunc(newFilters)
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		.then((res) => {
			setFetchFilters(true);
		})
		.catch((error: { message: any }) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			createSnackbar({
				key: 'filter-delete-error',
				type: 'error',
				label:
					error.message || t('label.error_try_again', 'Something went wrong, please try again'),
				hideButton: true
			});
		});
};

export const deleteOutgoingFilter = ({
	t,
	setFetchFilters,
	modifierFunc,
	createSnackbar,
	onClose,
	selectedFilter,
	outgoingFilters
}: DeleteOutgoingFilterCompProps): void => {
	const newFilters = filter(outgoingFilters, (f) => f.name !== selectedFilter.name);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	modifierFunc(newFilters)
		.then(() => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			createSnackbar({
				key: 'filter-delete-success',
				type: 'info',
				label: t('settings.filter_deleted', 'Filter successfully deleted'),
				hideButton: true
			});
			setFetchFilters(true);
		})
		.catch((error: { message: any }) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			createSnackbar({
				key: 'filter-delete-error',
				type: 'error',
				label:
					error.message || t('label.error_try_again', 'Something went wrong, please try again'),
				hideButton: true
			});
		});
	onClose();
};

export const deleteFilter = ({
	t,
	setFetchFilters,
	modifierFunc,
	createSnackbar,
	onClose,
	selectedFilter,
	incomingFilters
}: DeleteFilterCompProps): void => {
	const newFilters = filter(incomingFilters, (f) => f.name !== selectedFilter.name);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	modifierFunc(newFilters)
		.then(() => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			createSnackbar({
				key: 'filter-delete-success',
				type: 'info',
				label: t('settings.filter_deleted', 'Filter successfully deleted'),
				hideButton: true
			});
			setFetchFilters(true);
		})
		.catch((error: { message: any }) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			createSnackbar({
				key: 'filter-delete-error',
				type: 'error',
				label:
					error.message || t('label.error_try_again', 'Something went wrong, please try again'),
				hideButton: true
			});
		});
	onClose();
};
