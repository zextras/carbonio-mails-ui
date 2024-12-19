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
	const { tempActions, setTempActions } = compProps;
	const tagOptions = useMemo(
		() =>
			map(getTags(), (item) => ({
				...item,
				label: item.name
			})),
		[]
	);

	const onAddAction = useCallback(() => {
		const newActions = tempActions.slice();
		newActions.push({ actionKeep: [{}], actionStop: [{}], id: uuidv4() });
		setTempActions(newActions);
	}, [setTempActions, tempActions]);

	const onRemoveAction = useCallback(
		(indexToRemove: number) => () => {
			const newActions = tempActions.slice();
			newActions.splice(indexToRemove, 1);
			setTempActions(newActions);
		},
		[setTempActions, tempActions]
	);

	const onActionUpdate = useCallback(
		(indexToUpdate: number) => (newAction: FilterAction) => {
			const newActions = tempActions.slice();
			const oldValue = newActions[indexToUpdate];
			newActions[indexToUpdate] = { id: oldValue.id, ...newAction };
			setTempActions(newActions);
		},
		[setTempActions, tempActions]
	);
	return (
		<Container padding={{ top: 'medium' }} crossAlignment="flex-start" mainAlignment="flex-start">
			<Heading title={t('settings.actions', 'Actions')} size="medium" />
			<Text>{t('settings.perform_following_action', 'Perform the following actions:')}</Text>
			<Container padding={{ top: 'small' }} mainAlignment="flex-start">
				{map(tempActions, (tempAction, index: number) => (
					<FilterActionRow
						key={`filter-action-row-${index}`}
						index={index}
						onAddNewAction={onAddAction}
						onRemoveAction={onRemoveAction(index)}
						onActionSwitch={onActionUpdate(index)}
						disableRemove={tempActions.length > 1}
						onDefaultActionValueChange={onActionUpdate(index)}
						defaultAction={tempAction}
						compProps={compProps}
						tagOptions={tagOptions}
					/>
				))}
			</Container>
		</Container>
	);
};

export default FilterActionConditions;
