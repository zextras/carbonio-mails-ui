/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Checkbox, Container, Divider, Input, Padding, Row } from '@zextras/carbonio-design-system';
import { getBridgedFunctions, useUserSettings } from '@zextras/carbonio-shell-ui';
import { TFunction } from 'i18next';
import { map, omit, reduce } from 'lodash';
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';
import ModalHeader from '../../../../carbonio-ui-commons/components/modals/modal-header';
import { modifyOutgoingFilterRules } from '../../../../store/actions/modify-filter-rules';
import { FilterActions } from '../../../../types';
import { CreateFilterContext } from './create-filter-context';
import ModalFooter from './create-filter-modal-footer';
import DefaultCondition from './create-filters-conditions/default';
import FilterTestConditionRow from './filter-test-condition-row';
import FilterActionConditions from './new-filter-action-conditions';
import { getButtonInfo } from './utils';

type ComponentProps = {
	t: TFunction;
	onClose: () => void;
	outgoingFilters?: any;
	setFetchOutgoingFilters: (arg: boolean) => void;
	setOutgoingFilters: (arg: any) => void;
};

const CreateOutgoingFilterModal: FC<ComponentProps> = ({
	t,
	onClose,
	outgoingFilters,
	setFetchOutgoingFilters,
	setOutgoingFilters
}): ReactElement => {
	const [filterName, setFilterName] = useState('');
	const [activeFilter, setActiveFilter] = useState(false);
	const [condition, setCondition] = useState('anyof');
	const [dontProcessAddFilters, setDontProcessAddFilters] = useState(true);
	const [tempActions, setTempActions] = useState([{ actionKeep: [{}] }]);
	const { zimbraFeatureMailForwardingInFiltersEnabled } = useUserSettings().attrs;

	const finalActions = useMemo(
		() =>
			reduce(
				tempActions,
				(a, i) => {
					const firstKey = Object.keys(omit(i, 'id'))[0];
					if (Object.keys(a).includes(firstKey)) {
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						return { ...a, [firstKey]: [...a[firstKey], ...i[firstKey]] };
					}
					return { ...a, ...i };
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
	const inputLabel = useMemo(() => `${t('settings.filter_name', 'Filter Name')}*`, [t]);
	const activeFilterLabel = useMemo(() => t('settings.active_filter', 'Active filter'), [t]);

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
				? ([{ ...finalActions, actionStop: [{}] }] as FilterActions[])
				: ([{ ...finalActions }] as FilterActions[]),
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

	const outgoingFiltersCopy = useMemo(() => outgoingFilters?.slice() || [], [outgoingFilters]);
	const onConfirm = useCallback(() => {
		const toSend = [...outgoingFiltersCopy, requiredFilters];
		setOutgoingFilters(toSend);
		modifyOutgoingFilterRules(toSend)
			.then(() => {
				setFetchOutgoingFilters(true);
			})
			.catch((error) => {
				getBridgedFunctions()?.createSnackbar({
					key: `share`,
					replace: true,
					hideButton: true,
					type: 'error',
					label:
						error?.message || t('label.error_try_again', 'Something went wrong, please try again'),
					autoHideTimeout: 5000
				});
			});
		onClose();
	}, [
		outgoingFiltersCopy,
		requiredFilters,
		setOutgoingFilters,
		onClose,
		setFetchOutgoingFilters,
		t
	]);

	const toggleCheckBox = useCallback(() => {
		setDontProcessAddFilters(!dontProcessAddFilters);
	}, [dontProcessAddFilters]);

	const filterActionProps = useMemo(
		() => ({
			t,
			activeFilter,
			filterName,
			isIncoming: false,
			tempActions,
			setTempActions,
			zimbraFeatureMailForwardingInFiltersEnabled
		}),
		[t, activeFilter, filterName, tempActions, zimbraFeatureMailForwardingInFiltersEnabled]
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
				<ModalHeader title={modalTitle} onClose={onClose} />
				<Input
					label={inputLabel}
					value={filterName}
					onChange={onFilterNameChange}
					backgroundColor="gray5"
				/>
				<Padding top="small" />
				<Checkbox value={activeFilter} onClick={toggleActiveFilter} label={activeFilterLabel} />

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
					<FilterTestConditionRow compProps={filterTestConditionRowProps} />
					<Padding top="medium" />
					<Divider />
					<FilterActionConditions compProps={filterActionProps} />
				</Row>

				<ModalFooter
					label={t('label.create', 'Create')}
					toolTipText={buttonTooltip}
					onConfirm={onConfirm}
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

export default CreateOutgoingFilterModal;
