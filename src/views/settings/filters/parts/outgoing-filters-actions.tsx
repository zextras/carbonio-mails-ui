/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useContext, useMemo } from 'react';

import { Button, Padding, useModal, useSnackbar } from '@zextras/carbonio-design-system';
import type { TFunction } from 'i18next';
import { find, findIndex, noop } from 'lodash';

import { useRemoveFilter, useAddFilter, useDeleteFilter } from './actions';
import CreateFilterModal from './create-filter-modal';
import DeleteFilterModal from './delete-filter-modal';
import { FilterContext } from './filter-context';
import { ModifyFilterModal } from './modify-filter/modify-filter-modal';
import { modifyOutgoingFilterRules } from '../../../../store/actions/modify-filter-rules';
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
type ComponentProps = {
	compProps: {
		t: TFunction;
		availableList: ListType;
		activeList: ListType;
		outgoingFilters: Filter[];
	};
};
const OutgoingFilterActions: FC<ComponentProps> = ({ compProps }): ReactElement => {
	const createSnackbar = useSnackbar();
	const { t, availableList, activeList, outgoingFilters } = compProps;
	const { setFetchOutgoingFilters, setOutgoingFilters } = useContext(FilterContext);
	const disableAdd = useMemo(
		() => Object.keys(availableList.selected).length <= 0,
		[availableList.selected]
	);
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

	const disableEdit = useMemo(
		() => !Object.keys(activeList.selected).length && !Object.keys(availableList.selected).length,
		[activeList.selected, availableList.selected]
	);
	const disableDelete = useMemo(
		() => !Object.keys(activeList.selected).length && !Object.keys(availableList.selected).length,
		[activeList.selected, availableList.selected]
	);
	const outgoingFiltersCopy = useMemo(() => outgoingFilters?.slice(), [outgoingFilters]);

	const disablCreate = useMemo(() => false, []);
	const { createModal, closeModal } = useModal();
	const openCreateModal = useCallback(() => {
		const modalId = Date.now().toString();
		const modalClose = (): void => closeModal(modalId);

		const onCreateConfirm = (newFilter: Filter): void => {
			const toSend = [...outgoingFiltersCopy, newFilter];
			setOutgoingFilters?.(toSend);
			modifyOutgoingFilterRules(toSend)
				.then(() => {
					setFetchOutgoingFilters?.(true);
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
						<CreateFilterModal onConfirm={onCreateConfirm} onClose={modalClose} isIncoming />
					</StoreProvider>
				)
			},
			true
		);
	}, [
		createModal,
		closeModal,
		outgoingFiltersCopy,
		setOutgoingFilters,
		setFetchOutgoingFilters,
		createSnackbar,
		t
	]);

	const removeFilter = useRemoveFilter();
	const onRemove = useCallback(
		() =>
			removeFilter({
				t,
				availableList,
				activeList,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				setFilters: setOutgoingFilters,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				setFetchFilters: setFetchOutgoingFilters,
				modifierFunc: modifyOutgoingFilterRules
			}),
		[removeFilter, t, availableList, activeList, setOutgoingFilters, setFetchOutgoingFilters]
	);

	const addFilter = useAddFilter();
	const onAdd = useCallback(
		() =>
			addFilter({
				t,
				availableList,
				activeList,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				setFilters: setOutgoingFilters,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				setFetchFilters: setFetchOutgoingFilters,
				modifierFunc: modifyOutgoingFilterRules
			}),
		[addFilter, t, availableList, activeList, setOutgoingFilters, setFetchOutgoingFilters]
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
				setFetchFilters: setFetchOutgoingFilters ?? noop,
				setFilters: setOutgoingFilters ?? noop,
				modifierFunc: modifyOutgoingFilterRules,
				filterToDelete: selectedFilter,
				filters: outgoingFilters
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
		outgoingFilters,
		selectedFilter,
		setFetchOutgoingFilters,
		setOutgoingFilters
	]);

	const openFilterModifyModal = useCallback(() => {
		if (!selectedFilter) return;
		const modalId = Date.now().toString();
		const modalClose = (): void => closeModal(modalId);

		const onModifyConfirm = (requiredFilter: Filter): void => {
			const selectedFilterIndex = findIndex(
				outgoingFiltersCopy,
				(filterCopy: any) => filterCopy.name === selectedFilter?.name
			);
			const toSend = outgoingFiltersCopy.slice();
			toSend[selectedFilterIndex] = requiredFilter;
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			setOutgoingFilters(toSend);

			modifyOutgoingFilterRules(toSend)
				.then(() => {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					setFetchOutgoingFilters(true);
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
							isIncoming={false}
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
		closeModal,
		outgoingFiltersCopy,
		setOutgoingFilters,
		setFetchOutgoingFilters,
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

export default OutgoingFilterActions;
