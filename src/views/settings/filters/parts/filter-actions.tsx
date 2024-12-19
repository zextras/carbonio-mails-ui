/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';

import { v4 as uuidv4 } from '*';
import { FilterActionRow } from './filter-action-row';
import { getTags } from '../../../../carbonio-ui-commons/store/zustand/tags';
import { CompProps, FilterAction } from '../../../../types';
import Heading from '../../components/settings-heading';

type ComponentProps = {
	compProps: CompProps;
};
const FilterActionConditions: FC<ComponentProps> = ({ compProps }): ReactElement => {
	const [t] = useTranslation();
	const {
		tempActions: actions,
		setTempActions: setActions,
		isIncoming,
		zimbraFeatureMailForwardingInFiltersEnabled
	} = compProps;
	const onAddAction = useCallback(() => {
		const newActions = actions.slice();
		newActions.push({ actionKeep: [{}], actionStop: [{}], id: uuidv4() });
		setActions(newActions);
	}, [actions, setActions]);

	const onRemoveAction = useCallback(
		(indexToRemove: number) => () => {
			const newActions = actions.slice();
			newActions.splice(indexToRemove, 1);
			setActions(newActions);
		},
		[actions, setActions]
	);

	const onActionUpdate = useCallback(
		(indexToUpdate: number) => (newAction: FilterAction) => {
			const newActions = actions.slice();
			const oldValue = newActions[indexToUpdate];
			newActions[indexToUpdate] = { id: oldValue.id, ...newAction };
			setActions(newActions);
		},
		[actions, setActions]
	);
	const tagOptions = useMemo(
		() =>
			map(getTags(), (item) => ({
				...item,
				label: item.name
			})),
		[]
	);
	return (
		<Container padding={{ top: 'medium' }} crossAlignment="flex-start" mainAlignment="flex-start">
			<Heading title={t('settings.actions', 'Actions')} size="medium" />
			<Text>{t('settings.perform_following_action', 'Perform the following actions:')}</Text>
			<Container padding={{ top: 'small' }} mainAlignment="flex-start">
				{map(actions, (tempAction, index: number) => (
					<FilterActionRow
						key={`filter-action-row-${index}`}
						mailForwardingEnabled={zimbraFeatureMailForwardingInFiltersEnabled}
						isIncomingFilter={isIncoming}
						onAddNewAction={onAddAction}
						onRemoveAction={onRemoveAction(index)}
						onActionSwitch={onActionUpdate(index)}
						disableRemove={actions.length > 1}
						onDefaultActionValueChange={onActionUpdate(index)}
						defaultAction={tempAction}
						tagOptions={tagOptions}
					/>
				))}
			</Container>
		</Container>
	);
};

export default FilterActionConditions;
