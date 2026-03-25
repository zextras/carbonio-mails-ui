/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';

import { Input, Container, Checkbox, Padding, Divider, Row } from '@zextras/carbonio-design-system';
import { BooleanString, useUserSettings } from '@zextras/carbonio-shell-ui';
import { ModalHeader } from '@zextras/carbonio-ui-commons';
import { map, omit, reduce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import { Filter, FilterActions } from 'types/filters';
import { CreateFilterContext } from 'views/settings/filters/parts/create-filter-context';
import ModalFooter from 'views/settings/filters/parts/create-filter-modal-footer';
import DefaultCondition from 'views/settings/filters/parts/create-filters-conditions/default';
import { FilterActionsPanel } from 'views/settings/filters/parts/filter-actions-panel';
import { FilterConditionsPanel } from 'views/settings/filters/parts/filter-conditions-panel';
import { getButtonInfo } from 'views/settings/filters/parts/utils';

type ComponentProps = {
	onClose: () => void;
	onConfirm: (newFilter: Filter) => void;
	isIncoming: boolean;
};

const CreateFilterModal: FC<ComponentProps> = ({
	onClose,
	onConfirm,
	isIncoming
}): ReactElement => {
	const [t] = useTranslation();
	const [filterName, setFilterName] = useState('');
	const [activeFilter, setActiveFilter] = useState(false);
	const [condition, setCondition] = useState('anyof');
	const [dontProcessAddFilters, setDontProcessAddFilters] = useState(true);
	const [tempActions, setTempActions] = useState<FilterActions>([
		{ actionKeep: [{}], id: uuidv4() }
	]);
	const zimbraFeatureMailForwardingInFiltersEnabled = useUserSettings().attrs
		.zimbraFeatureMailForwardingInFiltersEnabled as BooleanString;
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
	const onFilterNameChange = useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>) => setFilterName(ev.target.value),
		[]
	);

	const requiredFilterTest = useMemo(() => {
		const allTest = map(newFilters, (f) => f.filterTests[0]);

		return reduce(
			allTest,
			(a, i) => {
				const firstKey = Object.keys(omit(i, ['condition']))[0];
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
				? ([
						{
							...omit(finalActions, 'id'),
							actionStop: [{}]
						}
					] as FilterActions)
				: ([
						{
							...omit(finalActions, 'id')
						}
					] as FilterActions),
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

	const [createFilterDisabled, buttonTooltip] = useMemo(
		() => getButtonInfo(filterName, requiredFilters, t),
		[filterName, requiredFilters, t]
	);

	const toggleCheckBox = useCallback(() => {
		setDontProcessAddFilters(!dontProcessAddFilters);
	}, [dontProcessAddFilters]);

	const filterActionProps = useMemo(
		() => ({
			t,
			activeFilter,
			filterName,
			isIncoming,
			tempActions,
			setTempActions,
			zimbraFeatureMailForwardingInFiltersEnabled
		}),
		[
			t,
			activeFilter,
			filterName,
			isIncoming,
			tempActions,
			zimbraFeatureMailForwardingInFiltersEnabled
		]
	);
	const filterTestConditionRowProps = useMemo(
		() => ({ t, newFilters, setNewFilters, condition, setCondition, activeFilter, filterName }),
		[t, newFilters, setNewFilters, condition, setCondition, activeFilter, filterName]
	);
	return (
		<CreateFilterContext.Provider value={{ newFilters, setNewFilters }}>
			<Container
				padding={{ bottom: 'medium' }}
				crossAlignment="flex-start"
				mainAlignment="flex-start"
				maxHeight="100%"
				style={{ overflowY: 'scroll', overflowX: 'hidden' }}
			>
				<ModalHeader
					title={t('settings.create_new_filter', 'Create new Filter')}
					onClose={onClose}
				/>
				<Input
					label={`${t('settings.filter_name', 'Filter Name')}*`}
					value={filterName}
					onChange={onFilterNameChange}
					background="gray5"
					data-testid="filter-name"
				/>
				<Padding top="small" />
				<Checkbox
					value={activeFilter}
					onClick={toggleActiveFilter}
					label={t('settings.active_filter', 'Active filter')}
					data-testid={'active-filter'}
				/>
				<Row
					padding={{ vertical: 'medium' }}
					height="fit"
					maxHeight="100%"
					crossAlignment="flex-start"
					mainAlignment="flex-start"
					style={{ overflowY: 'scroll', overflowX: 'hidden' }}
					display="block"
					maxWidth="100%"
					width="100%"
				>
					<FilterConditionsPanel compProps={filterTestConditionRowProps} />
					<Padding top="medium" />
					<Divider />
					<FilterActionsPanel compProps={filterActionProps} />
				</Row>
				<ModalFooter
					label={t('label.create', 'Create')}
					toolTipText={buttonTooltip}
					onConfirm={(): void => onConfirm(requiredFilters)}
					disabled={createFilterDisabled}
					onSecondaryAction={toggleCheckBox}
					checked={dontProcessAddFilters}
					checkboxLabel={t(
						'settings.do_not_process_additional_filters',
						'Do not process additional filters'
					)}
				/>
			</Container>
		</CreateFilterContext.Provider>
	);
};

export default CreateFilterModal;
