/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';
import { Input, Container, Checkbox, Padding, Divider } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import { map, omit, reduce } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import ModalFooter from './create-filter-modal-footer';
import { ModalHeader } from '../../../sidebar/commons/modal-header';
import DefaultCondition from './create-filters-conditions/default';
import { CreateFilterContext } from './create-filter-context';
import { modifyFilterRules } from '../../../../store/actions/modify-filter-rules';
import FilterActionConditions from './new-filter-action-conditions';
import FilterTestConditionRow from './filter-test-condition-row';

type ComponentProps = {
	t: TFunction;
	onClose: () => void;
	incomingFilters?: any;
	setFetchIncomingFilters: (arg: boolean) => void;
	setIncomingFilters: (arg: any) => void;
};

type ActionType = Record<string, Array<any>>;

const CreateFilterModal: FC<ComponentProps> = ({
	t,
	onClose,
	incomingFilters,
	setFetchIncomingFilters,
	setIncomingFilters
}): ReactElement => {
	const [filterName, setFilterName] = useState('');
	const [activeFilter, setActiveFilter] = useState(false);
	const [condition, setCondition] = useState('anyof');
	const [dontProcessAddFilters, setDontProcessAddFilters] = useState(true);
	const [tempActions, setTempActions] = useState([{ actionKeep: [{}], id: uuidv4() }]);
	const finalActions = useMemo(
		() =>
			reduce(
				tempActions,
				(acc, i) => {
					const firstKey = Object.keys(omit(i, 'id'))[0];
					if (Object.keys(acc).includes(firstKey)) {
						const accWithoutId = omit(acc, 'id');
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						return { ...accWithoutId, [firstKey]: [...accWithoutId[firstKey], ...i[firstKey]] };
					}
					return { ...acc, ...i };
				},
				{}
			),
		[tempActions]
	);

	const [newFilters, setNewFilters] = useState([
		{
			filterActions: [{ actionKeep: [{}], actionStop: [{}] }],
			active: activeFilter,
			name: filterName,
			key: 'subject',
			label: 'Subject',
			filterTests: [{}],
			index: 0,
			comp: <DefaultCondition t={t} activeIndex={0} />
		}
	]);

	const toggleActiveFilter = useCallback(() => setActiveFilter(!activeFilter), [activeFilter]);
	const onFilterNameChange = useCallback((ev) => setFilterName(ev.target.value), []);
	const modalTitle = useMemo(() => t('settings.create_new_filter', 'Create new Filter'), [t]);
	const inputLabel = useMemo(() => t('settings.filter_name', 'Filter Name'), [t]);
	const activeFilterLabel = useMemo(() => t('settings.active_filter', 'Active filter'), [t]);

	const requiredFilterTest = useMemo(() => {
		const allTest = map(newFilters, (f) => f.filterTests[0]);

		return reduce(
			allTest,
			(a, i) => {
				const firstKey = Object.keys(i)[0];
				if (Object.keys(a).includes(firstKey)) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					return { ...a, [firstKey]: [...a[firstKey], ...i[firstKey]] };
				}
				return { ...a, ...i };
			},
			{}
		);
	}, [newFilters]);
	const requiredFilters = useMemo(
		() => ({
			filterActions: dontProcessAddFilters
				? [{ ...omit(finalActions, 'id'), actionStop: [{}] }]
				: [{ ...omit(finalActions, 'id') }],
			active: activeFilter,
			name: filterName,
			filterTests: [
				{
					...requiredFilterTest,
					condition
				}
			]
		}),
		[activeFilter, filterName, condition, requiredFilterTest, finalActions, dontProcessAddFilters]
	);

	const createFilterDisabled = useMemo(() => filterName.length === 0, [filterName]);
	const incomingFiltersCopy = useMemo(() => incomingFilters?.slice() || [], [incomingFilters]);

	const onConfirm = useCallback(() => {
		const toSend = [...incomingFiltersCopy, requiredFilters];

		setIncomingFilters(toSend);
		modifyFilterRules(toSend).then(() => {
			setFetchIncomingFilters(true);
		});
		onClose();
	}, [incomingFiltersCopy, requiredFilters, setIncomingFilters, onClose, setFetchIncomingFilters]);

	const toggleCheckBox = useCallback(() => {
		setDontProcessAddFilters(!dontProcessAddFilters);
	}, [dontProcessAddFilters]);

	const filterActionProps = useMemo(
		() => ({
			t,
			activeFilter,
			filterName,
			isIncoming: true,
			tempActions,
			setTempActions
		}),
		[t, activeFilter, filterName, tempActions, setTempActions]
	);
	const filterTestConditionRowProps = useMemo(
		() => ({ t, newFilters, setNewFilters, condition, setCondition, activeFilter, filterName }),
		[t, newFilters, setNewFilters, condition, setCondition, activeFilter, filterName]
	);
	return (
		<Container padding={{ bottom: 'medium' }} maxHeight="fit">
			<ModalHeader title={modalTitle} onClose={onClose} />
			<CreateFilterContext.Provider value={{ newFilters, setNewFilters }}>
				<Container
					padding={{ top: 'medium' }}
					crossAlignment="flex-start"
					mainAlignment="flex-start"
				>
					<Input
						label={inputLabel}
						value={filterName}
						onChange={onFilterNameChange}
						backgroundColor="gray5"
					/>
					<Padding top="small" />
					<Checkbox value={activeFilter} onClick={toggleActiveFilter} label={activeFilterLabel} />
					<Padding top="medium" />

					<FilterTestConditionRow compProps={filterTestConditionRowProps} />
				</Container>
				<Padding top="medium" />
				<Divider />
				<FilterActionConditions compProps={filterActionProps} />

				<ModalFooter
					label={t('label.create', 'Create')}
					onConfirm={onConfirm}
					disabled={createFilterDisabled}
					onSecondaryAction={toggleCheckBox}
					checked={dontProcessAddFilters}
					checkboxLabel={t(
						'settings.do_not_process_additional_filters',
						'Do not process additional filters'
					)}
				/>
			</CreateFilterContext.Provider>
		</Container>
	);
};

export default CreateFilterModal;
