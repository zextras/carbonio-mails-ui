/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo } from 'react';

import { Button, Padding, useModal, useSnackbar } from '@zextras/carbonio-design-system';
import { find, findIndex, noop } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useRemoveFilter, useAddFilter, useDeleteFilter } from './actions';
import CreateFilterModal from './create-filter-modal';
import DeleteFilterModal from './delete-filter-modal';
import { ModifyFilterModal } from './modify-filter/modify-filter-modal';
import { StoreProvider } from '../../../../store/redux';
import { Filter } from '../../../../types';

type ListType = {
	isSelecting: boolean;
	list: Array<Filter>;
	moveDown: (arg: number) => void;
	moveUp: (arg: number) => void;
	selected: Record<string, boolean>;
	toggle: (arg: string) => void;
	unSelect: () => void;
};
export type FilterActionProps = {
	availableList: ListType;
	activeList: ListType;
	filters: Filter[];
	setFetchFilters: (arg: any) => void;
	setFilters: (arg: any) => void;
};

type InternalFilterActionProps = FilterActionProps & {
	isIncoming: boolean;
	onFiltersSave: (toSave: Array<any>) => Promise<any>;
};
const FilterActions: FC<InternalFilterActionProps> = ({
	availableList,
	activeList,
	filters,
	setFetchFilters,
	setFilters,
	isIncoming,
	onFiltersSave
}): ReactElement => {
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();
	const { selected: availableSelected } = availableList;
	const disableAdd = useMemo(() => Object.keys(availableSelected).length <= 0, [availableSelected]);
	const disableRemove = useMemo(
		() => Object.keys(activeList.selected).length <= 0,
		[activeList.selected]
	);

	const selectedFilter = useMemo(
		() =>
			find(availableList.list, { name: Object.keys(availableList.selected)[0] }) ||
			find(activeList.list, { name: Object.keys(activeList.selected)[0] }),
		[availableList, activeList]
	);

	const activeSelected = activeList.selected;
	const disableEdit = useMemo(
		() => !Object.keys(activeSelected).length && !Object.keys(availableList.selected).length,
		[activeSelected, availableList.selected]
	);
	const disableDelete = useMemo(
		() => !Object.keys(activeList.selected).length && !Object.keys(availableList.selected).length,
		[activeList.selected, availableList.selected]
	);
	const filtersCopy = useMemo(() => filters?.slice(), [filters]);

	const disablCreate = useMemo(() => false, []);
	const { createModal, closeModal } = useModal();
	const openCreateModal = useCallback(() => {
		const modalId = Date.now().toString();
		const modalClose = (): void => closeModal(modalId);

		const onCreateConfirm = (newFilter: Filter): void => {
			const toSend = [...filtersCopy, newFilter];
			setFilters?.(toSend);
			onFiltersSave(toSend)
				.then(() => {
					setFetchFilters?.(true);
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
			modalClose();
		};
		createModal(
			{
				id: modalId,
				size: 'large',
				maxHeight: '80vh',
				children: (
					<StoreProvider>
						<CreateFilterModal
							onConfirm={onCreateConfirm}
							onClose={modalClose}
							isIncoming={isIncoming}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [
		createModal,
		isIncoming,
		closeModal,
		filtersCopy,
		setFilters,
		onFiltersSave,
		setFetchFilters,
		createSnackbar,
		t
	]);

	const removeFilter = useRemoveFilter();
	const onRemove = useCallback(
		() =>
			removeFilter({
				availableList,
				activeList,
				setFilters,
				setFetchFilters,
				modifierFunc: onFiltersSave
			}),
		[removeFilter, availableList, activeList, setFilters, setFetchFilters, onFiltersSave]
	);

	const addFilter = useAddFilter();
	const onAdd = useCallback(
		() =>
			addFilter({
				availableList,
				activeList,
				setFilters,
				setFetchFilters,
				modifierFunc: onFiltersSave
			}),
		[addFilter, availableList, activeList, setFilters, setFetchFilters, onFiltersSave]
	);
	const deleteFilter = useDeleteFilter();
	const openDeleteModal = useCallback(() => {
		if (!selectedFilter) return;
		const modalId = Date.now().toString();
		const modalClose = (): void => closeModal(modalId);
		const deleteConfirm = (): void =>
			deleteFilter({
				onClose: modalClose,
				availableList,
				activeList,
				setFetchFilters: setFetchFilters ?? noop,
				setFilters: setFilters ?? noop,
				modifierFunc: onFiltersSave,
				filterToDelete: selectedFilter,
				filters
			});
		createModal(
			{
				id: modalId,
				size: 'small',
				children: (
					<StoreProvider>
						<DeleteFilterModal
							onClose={modalClose}
							onConfirmDelete={deleteConfirm}
							selectedFilter={selectedFilter}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [
		activeList,
		availableList,
		closeModal,
		createModal,
		deleteFilter,
		filters,
		onFiltersSave,
		selectedFilter,
		setFetchFilters,
		setFilters
	]);

	const openFilterModifyModal = useCallback(() => {
		if (!selectedFilter) return;
		const modalId = Date.now().toString();
		const modalClose = (): void => closeModal(modalId);

		const onModifyConfirm = (requiredFilter: Filter): void => {
			const selectedFilterIndex = findIndex(
				filtersCopy,
				(filterCopy: any) => filterCopy.name === selectedFilter?.name
			);
			const toSend = filtersCopy.slice();
			toSend[selectedFilterIndex] = requiredFilter;
			setFilters?.(toSend);

			onFiltersSave(toSend)
				.then(() => {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					setFetchFilters(true);
					createSnackbar({
						key: `share`,
						replace: true,
						hideButton: true,
						severity: 'info',
						label: t('label.filter_modified', 'Filter modified succesfully'),
						autoHideTimeout: 5000
					});
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
			modalClose();
		};

		createModal(
			{
				id: modalId,
				size: 'large',
				maxHeight: '80vh',
				children: (
					<StoreProvider>
						<ModifyFilterModal
							isIncoming={isIncoming}
							selectedFilter={selectedFilter}
							onClose={modalClose}
							onModifyConfirm={onModifyConfirm}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [
		selectedFilter,
		createModal,
		isIncoming,
		closeModal,
		filtersCopy,
		setFilters,
		onFiltersSave,
		setFetchFilters,
		createSnackbar,
		t
	]);
	return (
		<>
			<Padding top="medium" />
			<Button
				label={t('label.add', 'Add')}
				type="outlined"
				icon="ArrowheadLeftOutline"
				iconPlacement="left"
				disabled={disableAdd}
				onClick={onAdd}
				width="fill"
			/>
			<Padding bottom="medium" />
			<Button
				label={t('label.remove_one', 'Remove')}
				type="outlined"
				color="error"
				icon="ArrowheadRightOutline"
				disabled={disableRemove}
				onClick={onRemove}
				width="fill"
			/>
			<Padding bottom="medium" />
			<Button
				label={t('label.edit', 'Edit')}
				type="outlined"
				disabled={disableEdit}
				width="fill"
				onClick={openFilterModifyModal}
			/>
			<Padding bottom="medium" />
			<Button
				label={t('label.delete', 'Delete')}
				type="outlined"
				color="error"
				disabled={disableDelete}
				width="fill"
				onClick={openDeleteModal}
			/>
			<Padding bottom="medium" />
			<Button
				label={t('label.create', 'Create')}
				type="outlined"
				disabled={disablCreate}
				width="fill"
				onClick={openCreateModal}
			/>
		</>
	);
};

// TODO: avoid isIncoming and such boolean. We should declare how, not what.
//  For example the onFilterSave defines a way (how) to save filters.
//  instead of using isIncoming we should pass the actionOptions through the function getActionOptions
export function getFilterActions(
	isIncoming: boolean,
	onFilterSave: (filters: Array<any>) => Promise<any>
): (props: FilterActionProps) => ReactElement {
	// eslint-disable-next-line react/display-name
	return (props: FilterActionProps) => (
		<FilterActions {...props} onFiltersSave={onFilterSave} isIncoming={isIncoming} />
	);
}
