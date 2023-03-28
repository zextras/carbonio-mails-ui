/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useContext, useMemo } from 'react';
import type { TFunction } from 'i18next';
import { Button, Padding, ModalManagerContext } from '@zextras/carbonio-design-system';
import { find } from 'lodash';
import { StoreProvider } from '../../../../store/redux';
import { removeFilter, addFilter } from './actions';
import { modifyFilterRules } from '../../../../store/actions/modify-filter-rules';
import { FilterContext } from './filter-context';
import CreateFilterModal from './create-filter-modal';
import DeleteFilterModal from './delete-filter-modal';
import ModifyFilterModal from './modify-filter/modify-filter-modal';

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
		incomingFilters: ListType;
	};
};
const IncomingFilterActions: FC<ComponentProps> = ({ compProps }): ReactElement => {
	const { t, availableList, activeList, incomingFilters } = compProps;
	const { setFetchIncomingFilters, setIncomingFilters } = useContext(FilterContext);
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
						<CreateFilterModal
							t={t}
							onClose={(): void => closeModal()}
							incomingFilters={incomingFilters}
							setFetchIncomingFilters={setFetchIncomingFilters}
							setIncomingFilters={setIncomingFilters}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [createModal, t, incomingFilters, setIncomingFilters, setFetchIncomingFilters]);
	const openDeleteModal = useCallback(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const closeModal = createModal(
			{
				size: 'small',
				children: (
					<StoreProvider>
						<DeleteFilterModal
							onClose={(): void => closeModal()}
							t={t}
							availableList={availableList}
							activeList={activeList}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							setFilters={setIncomingFilters}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							setFetchFilters={setFetchIncomingFilters}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							modifierFunc={modifyFilterRules}
							filterName={selectedFilterName}
							selectedFilter={selectedFilter}
							incomingFilters={incomingFilters}
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
		incomingFilters,
		selectedFilter,
		selectedFilterName,
		setFetchIncomingFilters,
		setIncomingFilters,
		t
	]);
	const onRemove = useCallback(
		() =>
			removeFilter({
				t,
				availableList,
				activeList,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				setFilters: setIncomingFilters,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				setFetchFilters: setFetchIncomingFilters,
				modifierFunc: modifyFilterRules
			}),
		[t, availableList, activeList, setIncomingFilters, setFetchIncomingFilters]
	);

	const onAdd = useCallback(
		() =>
			addFilter({
				t,
				availableList,
				activeList,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				setFilters: setIncomingFilters,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				setFetchFilters: setFetchIncomingFilters,
				modifierFunc: modifyFilterRules
			}),
		[t, availableList, activeList, setIncomingFilters, setFetchIncomingFilters]
	);

	const openFilterModifyModal = useCallback(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const closeModal = createModal(
			{
				size: 'large',
				maxHeight: '80vh',
				children: (
					<StoreProvider>
						<ModifyFilterModal
							t={t}
							selectedFilter={selectedFilter}
							onClose={(): void => closeModal()}
							incomingFilters={incomingFilters}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							setFetchIncomingFilters={setFetchIncomingFilters}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							setIncomingFilters={setIncomingFilters}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [
		createModal,
		t,
		incomingFilters,
		setIncomingFilters,
		setFetchIncomingFilters,
		selectedFilter
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
				label={t('label.remove', 'Remove')}
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
				onClick={openDeleteModal}
				disabled={disableDelete}
				width="fill"
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

export default IncomingFilterActions;
