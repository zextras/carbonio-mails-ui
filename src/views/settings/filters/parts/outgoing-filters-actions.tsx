/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useContext, useMemo } from 'react';

import { Button, Padding, ModalManagerContext } from '@zextras/carbonio-design-system';
import type { TFunction } from 'i18next';
import { find } from 'lodash';

import { useRemoveFilter, useAddFilter } from './actions';
import CreateOutgoingFilterModal from './create-outgoing-filter-modal';
import DeleteOutgoingFilterModal from './delete-outgoing-filter-modal';
import { FilterContext } from './filter-context';
import ModifyOutgoingFilterModal from './modify-filter/modify-outgoing-filter-modal';
import { modifyOutgoingFilterRules } from '../../../../store/actions/modify-filter-rules';
import { StoreProvider } from '../../../../store/redux';

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
type ComponentProps = {
	compProps: {
		t: TFunction;
		availableList: ListType;
		activeList: ListType;
		outgoingFilters: ListType;
	};
};
const OutgoingFilterActions: FC<ComponentProps> = ({ compProps }): ReactElement => {
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
	const selectedFilterName = useMemo(
		() => Object.keys(activeList.selected)[0] || Object.keys(availableList.selected)[0],
		[activeList.selected, availableList.selected]
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
	const disableRun = useMemo(() => true, []);
	const disableDelete = useMemo(
		() => !Object.keys(activeList.selected).length && !Object.keys(availableList.selected).length,
		[activeList.selected, availableList.selected]
	);
	const disablCreate = useMemo(() => false, []);
	const createModal = useContext(ModalManagerContext);
	const openCreateModal = useCallback(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const closeModal = createModal(
			{
				size: 'large',
				maxHeight: '80vh',
				children: (
					<StoreProvider>
						<CreateOutgoingFilterModal
							t={t}
							onClose={(): void => closeModal()}
							outgoingFilters={outgoingFilters}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							setFetchOutgoingFilters={setFetchOutgoingFilters}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							setOutgoingFilters={setOutgoingFilters}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [createModal, t, outgoingFilters, setOutgoingFilters, setFetchOutgoingFilters]);

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

	const openDeleteModal = useCallback(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const closeModal = createModal(
			{
				size: 'small',
				children: (
					<StoreProvider>
						<DeleteOutgoingFilterModal
							onClose={(): void => closeModal()}
							t={t}
							availableList={availableList}
							activeList={activeList}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							setFilters={setOutgoingFilters}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							setFetchFilters={setFetchOutgoingFilters}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							modifierFunc={modifyOutgoingFilterRules}
							filterName={selectedFilterName}
							selectedFilter={selectedFilter}
							outgoingFilters={outgoingFilters}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [
		activeList,
		availableList,
		createModal,
		outgoingFilters,
		selectedFilter,
		selectedFilterName,
		setFetchOutgoingFilters,
		setOutgoingFilters,
		t
	]);
	const openFilterModifyModal = useCallback(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const closeModal = createModal(
			{
				size: 'large',
				maxHeight: '80vh',
				children: (
					<StoreProvider>
						<ModifyOutgoingFilterModal
							t={t}
							selectedFilter={selectedFilter}
							onClose={(): void => closeModal()}
							outgoingFilters={outgoingFilters}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							setFetchOutgoingFilters={setFetchOutgoingFilters}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							setOutgoingFilters={setOutgoingFilters}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [
		createModal,
		t,
		selectedFilter,
		outgoingFilters,
		setFetchOutgoingFilters,
		setOutgoingFilters
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
			{/* <Button label={t('filters.run', 'Run')} type="outlined" disabled={disableRun} size="fill" /> */}
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
