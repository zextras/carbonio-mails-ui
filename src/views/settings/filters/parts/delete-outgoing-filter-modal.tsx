/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Text } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import React, { FC, ReactElement, useCallback, useMemo } from 'react';
import ModalFooter from '../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../carbonio-ui-commons/components/modals/modal-header';
import { FilterListType } from '../../../../types';
import { deleteOutgoingFilter } from './actions';

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
	t: TFunction;
	onClose: () => void;
	availableList: ListType;
	activeList: ListType;
	setFilters: (arg: Array<FilterListType>) => void;
	setFetchFilters: (arg: boolean) => void;
	modifierFunc: Promise<any>;
	selectedFilter: any;
	outgoingFilters: any;
};

const DeleteOutgoingFilterModal: FC<ComponentProps> = ({
	t,
	onClose,
	availableList,
	activeList,
	setFilters,
	setFetchFilters,
	modifierFunc,
	selectedFilter,
	outgoingFilters
}): ReactElement => {
	const modalTitle = useMemo(() => t('settings.delete_filter', 'Delete filter'), [t]);
	const onConfirmDelete = useCallback(() => {
		deleteOutgoingFilter({
			t,
			onClose,
			availableList,
			activeList,
			setFilters,
			setFetchFilters,
			modifierFunc,
			selectedFilter,
			outgoingFilters
		});
	}, [
		t,
		onClose,
		availableList,
		activeList,
		setFilters,
		setFetchFilters,
		modifierFunc,
		selectedFilter,
		outgoingFilters
	]);
	return (
		<>
			<Container padding={{ bottom: 'medium' }}>
				<ModalHeader title={modalTitle} onClose={onClose} />
				<Container orientation="horizontal" padding={{ all: 'medium' }}>
					<Text overflow="break-word">
						{t('settings.delete_filter_text', 'Are you sure to delete filter ')}
					</Text>
					<Text weight="bold" style={{ paddingLeft: '0.3125rem', paddingRight: '0.3125rem' }}>
						{`"${selectedFilter?.name}" ?`}
					</Text>
				</Container>
				<ModalFooter
					onConfirm={onConfirmDelete}
					label={t('label.delete', 'Delete')}
					background="error"
				/>
			</Container>
		</>
	);
};

export default DeleteOutgoingFilterModal;
