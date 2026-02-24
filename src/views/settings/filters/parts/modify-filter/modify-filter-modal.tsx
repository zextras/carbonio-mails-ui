/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, {
	FC,
	ReactElement,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState
} from 'react';

import { Checkbox, Container, Divider, Input, Padding, Row } from '@zextras/carbonio-design-system';
import { useUserSettings, BooleanString } from '@zextras/carbonio-shell-ui';
import { ModalHeader } from '@zextras/carbonio-ui-commons';
import { forEach, isEqual, map, omit, reduce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import type {
	AllFiltersTest,
	ApiFilterAction,
	Filter,
	FilterActions,
	FilterTest
} from 'types/filters';
import { CreateFilterContext } from 'views/settings/filters/parts/create-filter-context';
import ModalFooter from 'views/settings/filters/parts/create-filter-modal-footer';
import DefaultCondition from 'views/settings/filters/parts/create-filters-conditions/default';
import { FilterActionsPanel } from 'views/settings/filters/parts/filter-actions-panel';
import { FilterConditionsPanel } from 'views/settings/filters/parts/filter-conditions-panel';
import { findRowKey, getTestComponent } from 'views/settings/filters/parts/get-test-component';
import { getButtonInfo } from 'views/settings/filters/parts/utils';
import { capitalise } from 'views/sidebar/utils';

type ModifyFilterModalProps = {
	onClose: () => void;
	onModifyConfirm: (modifiedFilter: Filter) => void;
	selectedFilter: Filter;
	isIncoming: boolean;
};

export const ModifyFilterModal: FC<ModifyFilterModalProps> = ({
	onClose,
	onModifyConfirm,
	selectedFilter,
	isIncoming
}): ReactElement => {
	const [t] = useTranslation();
	const [filterName, setFilterName] = useState('');
	const [activeFilter, setActiveFilter] = useState(false);
	const [condition, setCondition] = useState('anyof');
	const [dontProcessAddFilters, setDontProcessAddFilters] = useState(true);

	const initialActions = useMemo((): FilterActions => {
		if (selectedFilter) {
			const actions: FilterActions = [];
			const filterActions = selectedFilter?.filterActions?.[0];

			const filterActionsKeys: Array<keyof ApiFilterAction> = Object.keys(filterActions) as Array<
				keyof ApiFilterAction
			>;

			forEach(filterActionsKeys, (key) => {
				switch (key) {
					case 'actionTag':
						filterActions.actionTag?.forEach((value) => {
							actions.push({ actionTag: [{ ...omit(value, 'index') }] });
						});
						break;
					case 'actionFlag':
						filterActions.actionFlag?.forEach((value) => {
							actions.push({ actionFlag: [{ ...omit(value, 'index') }] });
						});
						break;
					case 'actionRedirect':
						filterActions.actionRedirect?.forEach((value) => {
							actions.push({ actionRedirect: [{ ...omit(value, 'index') }] });
						});
						break;
					case 'actionFileInto':
						filterActions.actionFileInto?.forEach((value) => {
							actions.push({ actionFileInto: [{ ...omit(value, 'index') }] });
						});
						break;
					case 'actionKeep':
						filterActions.actionKeep?.forEach((value) => {
							actions.push({ actionKeep: [{ ...omit(value, 'index') }] });
						});
						break;
					case 'actionDiscard':
						filterActions.actionDiscard?.forEach((value) => {
							actions.push({ actionDiscard: [{ ...omit(value, 'index') }] });
						});
						break;
					default:
						break;
				}
			});

			return actions;
		}
		return [{ actionKeep: [{}], id: uuidv4() }];
	}, [selectedFilter]);

	const [tempActions, setTempActions] = useState(initialActions);
	const [copyRequiredFilters, setCopyRequiredFilters] = useState({});
	const [reFetch, setReFetch] = useState(false);
	const [updateRequiredFilters, setUpdateRequiredFilters] = useState(true);
	const zimbraFeatureMailForwardingInFiltersEnabled = useUserSettings().attrs
		.zimbraFeatureMailForwardingInFiltersEnabled as BooleanString;

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
	const modalTitle = useMemo(
		() => `${t('label.edit', 'Edit')} ${selectedFilter?.name}`,
		[t, selectedFilter?.name]
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

	const finalActions = useMemo(
		() =>
			reduce(
				tempActions,
				(acc, action) => {
					const firstActionKey = Object.keys(omit(action, 'id'))[0];
					if (Object.keys(acc).includes(firstActionKey)) {
						const accWithoutId = omit(acc, 'id');
						return {
							...accWithoutId,
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							[firstActionKey]: [...accWithoutId[firstActionKey], ...action[firstActionKey]]
						};
					}
					return { ...acc, ...action };
				},
				{}
			),
		[tempActions]
	);
	const requiredFilters = useMemo(
		() => ({
			filterActions: dontProcessAddFilters
				? ([{ ...omit(finalActions, 'id'), actionStop: [{}] }] as FilterActions)
				: ([{ ...omit(finalActions, 'id') }] as FilterActions),
			active: activeFilter,
			name: filterName,
			filterTests: [
				{
					...requiredFilterTest,
					condition
				} as AllFiltersTest
			]
		}),
		[activeFilter, filterName, condition, requiredFilterTest, dontProcessAddFilters, finalActions]
	);
	const [createFilterDisabled, buttonTooltip] = useMemo(() => {
		if (isEqual(copyRequiredFilters, requiredFilters)) {
			return [true, t('settings.label.not_changed_anything', 'No change was made')];
		}
		return getButtonInfo(filterName, requiredFilters, t, false);
	}, [copyRequiredFilters, filterName, requiredFilters, t]);

	const toggleCheckBox = useCallback(() => {
		setDontProcessAddFilters((prev) => !prev);
	}, []);

	useLayoutEffect(() => {
		setDontProcessAddFilters(!!selectedFilter?.filterActions[0]?.actionStop);
	}, [selectedFilter?.filterActions]);

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
		() => ({
			t,
			newFilters,
			setNewFilters,
			condition,
			setCondition,
			activeFilter,
			filterName,
			selectedFilter
		}),
		[
			t,
			newFilters,
			setNewFilters,
			condition,
			setCondition,
			activeFilter,
			filterName,
			selectedFilter
		]
	);

	useEffect(() => {
		if (selectedFilter) {
			setFilterName(selectedFilter?.name);
			setActiveFilter(selectedFilter?.active);
			setCondition(selectedFilter?.filterTests?.[0]?.condition);
		}
	}, [selectedFilter]);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const setCopyOfFilter = (): void => {
		setCopyRequiredFilters(requiredFilters);
	};
	useEffect(() => {
		if (selectedFilter) {
			if (updateRequiredFilters) {
				setTimeout(() => {
					setUpdateRequiredFilters(false);
					setCopyOfFilter();
				}, 10);
			}
		}
	}, [selectedFilter, setCopyOfFilter, updateRequiredFilters]);

	const previousFilterTests = useMemo(() => {
		const tempTests: Array<FilterTest> = [];
		const filterTest = selectedFilter?.filterTests?.[0];
		if (!filterTest) return tempTests;
		const keys = Object.keys(filterTest) as Array<keyof AllFiltersTest>;
		forEach(keys, (key) => {
			if (key !== 'condition') {
				const value = filterTest[key];
				map(value, (test) => {
					tempTests.push({ ...test, testName: key });
				});
			}
		});
		return tempTests;
	}, [selectedFilter]);

	const modifiedNewFilters = useMemo(
		() =>
			map(previousFilterTests, (test, index) => {
				if (index === previousFilterTests.length - 1) setReFetch(true);
				return {
					filterActions: [{ actionKeep: [{}], actionStop: [{}] }],
					active: false,
					name: '',
					key: findRowKey({ name: test.testName, test }),
					label: capitalise(findRowKey({ name: test.testName, test })),
					filterTests: [
						{
							...{ [test.testName]: [test] },
							condition: selectedFilter?.filterTests?.[0]?.condition
						}
					],
					index: 0,
					comp: getTestComponent({
						name: test.testName,
						test: { [test.testName]: [test] },
						index,
						t
					})
				};
			}),

		[previousFilterTests, t, selectedFilter]
	);

	useEffect(() => {
		setNewFilters(modifiedNewFilters);
		if (reFetch) setReFetch(false);
	}, [modifiedNewFilters, reFetch]);

	return (
		<CreateFilterContext.Provider value={{ newFilters, setNewFilters }}>
			<Container
				padding={{ bottom: 'medium' }}
				crossAlignment="flex-start"
				mainAlignment="flex-start"
				maxHeight="100%"
				style={{ overflowY: 'scroll', overflowX: 'hidden' }}
			>
				<ModalHeader title={modalTitle} onClose={onClose} showCloseIcon />
				<Input
					label={`${t('settings.filter_name', 'Filter Name')}*`}
					value={filterName}
					onChange={onFilterNameChange}
					background="gray5"
				/>
				<Padding top="small" />
				<Checkbox
					value={activeFilter}
					onClick={toggleActiveFilter}
					label={t('settings.active_filter', 'Active filter')}
				/>
				<Row
					padding={{ vertical: 'medium' }}
					height="fit"
					maxHeight="100%"
					crossAlignment="flex-start"
					mainAlignment="flex-start"
					style={{ overflowY: 'scroll' }}
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
					label={t('label.save', 'Save')}
					toolTipText={buttonTooltip}
					onConfirm={(): void => onModifyConfirm(requiredFilters)}
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
