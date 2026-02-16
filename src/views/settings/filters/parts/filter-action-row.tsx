/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo } from 'react';

import { Button, Container, Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import { FilterAction } from 'types/filters';
import { ACTION_OPTION_KEYS, ACTION_OPTIONS } from 'views/settings/filters/constants';
import CustomSelect from 'views/settings/filters/parts/custom-select';
import { getActionComponent, getActionsInitialValues } from 'views/settings/filters/parts/utils';

export type FilterActionRowProps = {
	getOptionsTranslations: (t: TFunction) => Record<ACTION_OPTION_KEYS, string>;
	mailForwardingEnabled: 'TRUE' | 'FALSE';
	selectedAction: FilterAction;
	onActionSwitch: (action: FilterAction) => void;
	onActionValueChange: (action: FilterAction) => void;
	onRemoveAction: () => void;
	disableRemove: boolean;
	onAddNewAction: (action: FilterAction) => void;
};

const COMMON_OPTIONS = [
	ACTION_OPTIONS.KEEP,
	ACTION_OPTIONS.DISCARD,
	ACTION_OPTIONS.MOVE_TO_FOLDER,
	ACTION_OPTIONS.TAG,
	ACTION_OPTIONS.MARK_AS
] as const;

const OPTIONS_WITH_REDIRECT = [...COMMON_OPTIONS, ACTION_OPTIONS.REDIRECT_TO] as const;
export const FilterActionRow: FC<FilterActionRowProps> = ({
	getOptionsTranslations,
	mailForwardingEnabled,
	selectedAction,
	onAddNewAction,
	onRemoveAction,
	onActionSwitch,
	disableRemove,
	onActionValueChange
}): ReactElement => {
	const [t] = useTranslation();

	const selectActionOptionKeys =
		mailForwardingEnabled === 'TRUE' ? OPTIONS_WITH_REDIRECT : COMMON_OPTIONS;
	const selectedOptionKey =
		selectActionOptionKeys.find((key) => key in selectedAction) ?? 'actionKeep';

	const selectActionOptionsTranslations = getOptionsTranslations(t);
	const selectActionOptions = selectActionOptionKeys.map((actionKey) => ({
		value: actionKey,
		label: selectActionOptionsTranslations[actionKey]
	}));
	const selectActionDefaultValue = {
		label: selectActionOptionsTranslations[selectedOptionKey],
		value: selectedOptionKey
	};

	const userChoseRedirectToActionInThePast =
		mailForwardingEnabled === 'FALSE' && 'actionRedirect' in selectedAction;

	const actionComponentToDisplay = getActionComponent(selectedAction, onActionValueChange);

	const onRemove = useMemo(
		() => (disableRemove ? (): null => null : onRemoveAction),
		[disableRemove, onRemoveAction]
	);
	const initialValuesOnSwitchAction = getActionsInitialValues(t);
	const onSwitchAction = useCallback(
		(str: ACTION_OPTION_KEYS) => {
			const newAction = initialValuesOnSwitchAction[str];
			onActionSwitch(newAction);
		},
		[initialValuesOnSwitchAction, onActionSwitch]
	);

	const onAddingNewAction = useCallback((): void => {
		onAddNewAction({ actionKeep: [{}], actionStop: [{}], id: uuidv4() });
	}, [onAddNewAction]);

	return (
		<Container
			mainAlignment="space-between"
			crossAlignment="center"
			orientation="horizontal"
			padding={{ top: 'small' }}
			data-testid={'actions-panel'}
		>
			<Row>
				<Row padding={{ right: 'small' }} minWidth="12.5rem">
					<CustomSelect
						items={selectActionOptions}
						background="gray5"
						label={t('settings.actions', 'Actions')}
						onChange={onSwitchAction}
						defaultSelection={selectActionDefaultValue}
					/>
				</Row>
				{userChoseRedirectToActionInThePast && (
					<Row padding={{ right: 'small' }} minWidth="12.5rem">
						<Text size="medium" color="info">
							{t('label.admin_disabled_action', 'The Admin disabled the redirect action')}
						</Text>
					</Row>
				)}
				{actionComponentToDisplay}
			</Row>
			<Container orientation="horizontal" mainAlignment="flex-end" width="auto">
				<Tooltip label={t('settings.add_action', 'Add new action')} placement="top">
					<Button icon="PlusOutline" onClick={onAddingNewAction} color="primary" type="outlined" />
				</Tooltip>
				<Padding left="small">
					<Tooltip label={t('settings.remove_action', 'Remove this action')} placement="top">
						<Button
							icon="MinusOutline"
							disabled={disableRemove}
							onClick={onRemove}
							color="secondary"
							type="outlined"
						/>
					</Tooltip>
				</Padding>
			</Container>
		</Container>
	);
};
