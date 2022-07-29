/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useContext, useMemo } from 'react';
import { TFunction } from 'i18next';
import { Button, Padding, ModalManagerContext } from '@zextras/carbonio-design-system';
import { find, noop } from 'lodash';
import { removeFilter, addFilter } from './actions';
import {
	modifyFilterRules,
	modifyOutgoingFilterRules
} from '../../../../store/actions/modify-filter-rules';
import { FilterContext } from './filter-context';
import CreateFilterModal from './create-filter-modal';
import ModifyOutgoingFilterModal from './modify-filter/modify-outgoing-filter-modal';

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
	const createModal = useContext(ModalManagerContext);
	const openCreateModal = useCallback(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const closeModal = createModal(
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			{ size: 'large', children: <CreateFilterModal t={t} onClose={(): void => closeModal()} /> },
			true
		);
	}, [createModal, t]);
	const onRemove = useCallback(
		() =>
			removeFilter({
				t,
				availableList,
				activeList,

				setFilters:
					selectedFilterType === 'incoming-messages' ? setIncomingFilters : setOutgoingFilters,
				setFetchFilters:
					selectedFilterType === 'incoming-messages'
						? setFetchIncomingFilters
						: setFetchOutgoingFilters,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				modifierFunc:
					selectedFilterType === 'incoming-messages' ? modifyFilterRules : modifyOutgoingFilterRules
			}),
		[
			t,
			availableList,
			activeList,
			selectedFilterType,
			setIncomingFilters,
			setOutgoingFilters,
			setFetchIncomingFilters,
			setFetchOutgoingFilters
		]
	);
	const onAdd = useCallback(
		() =>
			addFilter({
				t,
				availableList,
				activeList,
				setFilters:
					selectedFilterType === 'incoming-messages' ? setIncomingFilters : setOutgoingFilters,
				setFetchFilters:
					selectedFilterType === 'incoming-messages'
						? setFetchIncomingFilters
						: setFetchOutgoingFilters,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				modifierFunc:
					selectedFilterType === 'incoming-messages' ? modifyFilterRules : modifyOutgoingFilterRules
			}),
		[
			t,
			availableList,
			activeList,
			selectedFilterType,
			setIncomingFilters,
			setOutgoingFilters,
			setFetchIncomingFilters,
			setFetchOutgoingFilters
		]
	);

	const openFilterModifyModal = useCallback(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const closeModal = createModal(
			{
				size: 'large',
				maxHeight: '70vh',
				children: (
					<ModifyOutgoingFilterModal
						t={t}
						selectedFilter={selectedFilter}
						onClose={(): void => closeModal()}
						outgoingFilters={outgoingFilters}
						setFetchOutgoingFilters={setFetchOutgoingFilters}
						setOutgoingFilters={setOutgoingFilters}
					/>
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
				label={t('label.remove', 'REMOVE')}
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
