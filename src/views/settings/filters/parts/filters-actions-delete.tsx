/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useContext, useMemo } from 'react';

import { Button, Padding } from '@zextras/carbonio-design-system';
import type { TFunction } from 'i18next';
import { find, noop } from 'lodash';

import { useRemoveFilter, useAddFilter } from './actions';
import CreateFilterModal from './create-filter-modal';
import { FilterContext } from './filter-context';
import ModifyOutgoingFilterModal from './modify-filter/modify-outgoing-filter-modal';
import { useUiUtilities } from '../../../../hooks/use-ui-utilities';
import {
	modifyFilterRules,
	modifyOutgoingFilterRules
} from '../../../../store/actions/modify-filter-rules';
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
		selectedFilterType: string;
		outgoingFilters: ListType;
	};
};
const FilterActions: FC<ComponentProps> = ({ compProps }): ReactElement => {
	const { t, availableList, activeList, selectedFilterType, outgoingFilters } = compProps;
	const {
		setFetchIncomingFilters,
		setIncomingFilters,
		setFetchOutgoingFilters,
		setOutgoingFilters
	} = useContext(FilterContext);

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
	const disableEdit = useMemo(() => !(!disableAdd || !disableRemove), [disableRemove, disableAdd]);
	const disableRun = useMemo(() => true, []);
	const disableDelete = useMemo(() => true, []);
	const disablCreate = useMemo(() => false, []);
	const { createModal, closeModal } = useUiUtilities();
	const openCreateModal = useCallback(() => {
		const modalId = Date.now().toString();
		createModal(
			{
				id: modalId,
				size: 'large',
				children: (
					<StoreProvider>
						<CreateFilterModal t={t} onClose={(): void => closeModal(modalId)} />
					</StoreProvider>
				)
			},
			true
		);
	}, [closeModal, createModal, t]);

	const setFilters =
		selectedFilterType === 'incoming-messages' ? setIncomingFilters : setOutgoingFilters;
	const setFetchFilters =
		selectedFilterType === 'incoming-messages' ? setFetchIncomingFilters : setFetchOutgoingFilters;
	const modifierFunc =
		selectedFilterType === 'incoming-messages' ? modifyFilterRules : modifyOutgoingFilterRules;
	const emptyFilter = (): void => undefined;

	const removeFilter = useRemoveFilter();
	const onRemove = useCallback(() => {
		removeFilter({
			t,
			availableList,
			activeList,
			setFilters: setFilters ?? emptyFilter,
			setFetchFilters: setFetchFilters ?? emptyFilter,
			modifierFunc
		});
	}, [removeFilter, t, availableList, activeList, setFilters, setFetchFilters, modifierFunc]);

	const addFilter = useAddFilter();
	const onAdd = useCallback(
		() =>
			addFilter({
				t,
				availableList,
				activeList,
				setFilters: setFilters ?? emptyFilter,
				setFetchFilters: setFetchFilters ?? emptyFilter,
				modifierFunc
			}),
		[addFilter, t, availableList, activeList, setFilters, setFetchFilters, modifierFunc]
	);

	const openFilterModifyModal = useCallback(() => {
		const modalId = Date.now().toString();
		createModal(
			{
				id: modalId,
				size: 'large',
				maxHeight: '70vh',
				children: (
					<StoreProvider>
						<ModifyOutgoingFilterModal
							t={t}
							selectedFilter={selectedFilter}
							onClose={(): void => closeModal(modalId)}
							outgoingFilters={outgoingFilters}
							setFetchOutgoingFilters={setFetchOutgoingFilters ?? emptyFilter}
							setOutgoingFilters={setOutgoingFilters ?? emptyFilter}
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
		setOutgoingFilters,
		closeModal
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
				label={t('label.remove_one', 'REMOVE')}
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
				label={t('filters.run', 'RUN')}
				type="outlined"
				disabled={disableRun}
				width="fill"
				onClick={noop}
			/>
			<Padding bottom="medium" />
			<Button
				label={t('filters.delete', 'Delete')}
				type="outlined"
				color="error"
				disabled={disableDelete}
				width="fill"
				onClick={noop}
			/>
			<Padding bottom="medium" />
			<Button
				label={t('label.create', 'CREATE')}
				type="outlined"
				disabled={disablCreate}
				width="fill"
				onClick={openCreateModal}
			/>
		</>
	);
};

export default FilterActions;
