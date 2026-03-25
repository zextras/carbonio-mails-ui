/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo } from 'react';

import { Button, Padding, useModal, useSnackbar } from '@zextras/carbonio-design-system';
import { find, findIndex } from 'lodash';
import { useTranslation } from 'react-i18next';

import { Filter } from 'types/filters';
import {
	ApplyFilterUIActionExecutionParams,
	getApplyFilterUIAction
} from 'ui-actions/apply-filter';
import {
	useAddFilter,
	useDeleteFilter,
	useRemoveFilter
} from 'views/settings/filters/parts/actions';
import CreateFilterModal from 'views/settings/filters/parts/create-filter-modal';
import DeleteFilterModal from 'views/settings/filters/parts/delete-filter-modal';
import { ModifyFilterModal } from 'views/settings/filters/parts/modify-filter/modify-filter-modal';
import { FiltersListType } from 'views/settings/filters/types';

export type FilterManagerProps = {
	availableList: FiltersListType;
	activeList: FiltersListType;
	filters: Filter[];
	onFiltersSave: (arg: Array<Filter>) => Promise<void>;
};

const FilterManager: FC<
	FilterManagerProps & {
		isIncoming: boolean;
	}
> = ({ availableList, activeList, filters, isIncoming, onFiltersSave }): ReactElement => {
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
	const disableApply = !selectedFilter;
	const filtersCopy = useMemo(() => filters.slice(), [filters]);

	const disableCreate = useMemo(() => false, []);
	const { createModal, closeModal } = useModal();

	const applySelectedFilter = useCallback((): void => {
		if (disableApply) {
			return;
		}
		const action = getApplyFilterUIAction();
		const executionParams: ApplyFilterUIActionExecutionParams = {
			uiUtilities: {
				closeModal,
				createModal
			},
			criteria: {
				filterName: selectedFilter?.name
			}
		};
		action?.openModal?.(executionParams);
	}, [closeModal, createModal, disableApply, selectedFilter?.name]);
	const openCreateModal = useCallback(() => {
		const modalId = Date.now().toString();
		const modalClose = (): void => closeModal(modalId);

		const onCreateConfirm = (newFilter: Filter): void => {
			const toSend = [...filtersCopy, newFilter];
			onFiltersSave(toSend).catch((error) => {
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
			modalClose();
		};
		createModal(
			{
				id: modalId,
				size: 'large',
				maxHeight: '80vh',
				onClose: modalClose,
				children: (
					<CreateFilterModal
						onConfirm={onCreateConfirm}
						onClose={modalClose}
						isIncoming={isIncoming}
					/>
				)
			},
			true
		);
	}, [createModal, isIncoming, closeModal, filtersCopy, onFiltersSave, createSnackbar, t]);

	const removeFilter = useRemoveFilter();
	const onRemove = useCallback(
		() =>
			removeFilter({
				availableList,
				activeList,
				modifierFunc: onFiltersSave
			}),
		[removeFilter, availableList, activeList, onFiltersSave]
	);

	const addFilter = useAddFilter();
	const onAdd = useCallback(
		() =>
			addFilter({
				availableList,
				activeList,
				modifierFunc: onFiltersSave
			}),
		[addFilter, availableList, activeList, onFiltersSave]
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
				modifierFunc: onFiltersSave,
				filterToDelete: selectedFilter,
				filters
			});
		createModal(
			{
				id: modalId,
				size: 'small',
				onClose: modalClose,
				children: (
					<DeleteFilterModal
						onClose={modalClose}
						onConfirmDelete={deleteConfirm}
						selectedFilter={selectedFilter}
					/>
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
		selectedFilter
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

			onFiltersSave(toSend)
				.then(() => {
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
				onClose: modalClose,
				children: (
					<ModifyFilterModal
						isIncoming={isIncoming}
						selectedFilter={selectedFilter}
						onClose={modalClose}
						onModifyConfirm={onModifyConfirm}
					/>
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
		onFiltersSave,
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
			{isIncoming && (
				<Button
					label={t('filters.apply', 'Apply')}
					type="outlined"
					disabled={disableApply}
					width="fill"
					onClick={applySelectedFilter}
				/>
			)}
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
				disabled={disableCreate}
				width="fill"
				onClick={openCreateModal}
			/>
		</>
	);
};

export function getFiltermanager(isIncoming: boolean): (props: FilterManagerProps) => ReactElement {
	// eslint-disable-next-line react/display-name
	return (props: FilterManagerProps) => <FilterManager {...props} isIncoming={isIncoming} />;
}
