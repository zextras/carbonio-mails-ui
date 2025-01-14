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

import CustomSelect from './custom-select';
import { getActionComponents, getMarkAsOptions } from './utils';
import { ActionKey, FilterAction } from '../../../../types';

export type FilterActionRowProps = {
	getOptionsTranslations: (t: TFunction) => Record<ActionKey, string>;
	mailForwardingEnabled: 'TRUE' | 'FALSE';
	selectedAction: FilterAction;
	onActionSwitch: (action: FilterAction) => void;
	onActionValueChange: (action: FilterAction) => void;
	onRemoveAction: () => void;
	disableRemove: boolean;
	onAddNewAction: (action: FilterAction) => void;
};

const COMMON_OPTIONS = [
	'actionKeep',
	'actionDiscard',
	'actionFileInto',
	'actionTag',
	'actionFlag'
] as const;

const OPTIONS_WITH_REDIRECT = [...COMMON_OPTIONS, 'actionRedirect'] as const;
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
	const optionsToDisplay =
		mailForwardingEnabled === 'TRUE' ? OPTIONS_WITH_REDIRECT : COMMON_OPTIONS;

	const userChoseRedirectToActionInThePast =
		mailForwardingEnabled === 'FALSE' && 'actionRedirect' in selectedAction;

	const actionsComponents = getActionComponents();

	const activeActionOption: ActionKey = (optionsToDisplay.find((key) => key in selectedAction) ??
		'actionKeep') as ActionKey;
	const ActionComponentToDisplay = actionsComponents[activeActionOption];

	const [t] = useTranslation();
	const markAsOptions = useMemo(() => getMarkAsOptions(t), [t]);

	const optionsTranslations = getOptionsTranslations(t);
	const actionOptions = optionsToDisplay.map((actionKey) => ({
		value: actionKey,
		label: optionsTranslations[actionKey]
	}));

	const defaultValue = {
		label: optionsTranslations[activeActionOption],
		value: activeActionOption
	};
	const onRemove = useMemo(
		() => (disableRemove ? (): null => null : onRemoveAction),
		[disableRemove, onRemoveAction]
	);
	const onSwitchAction = useCallback(
		(str: ActionKey) => {
			let newAction: FilterAction = selectedAction;
			switch (str) {
				case 'actionDiscard': {
					newAction = { actionDiscard: [{}] };
					break;
				}
				case 'actionFlag': {
					newAction = {
						actionFlag: [{ flagName: markAsOptions?.[0].value.actionFlag[0].flagName }]
					};
					break;
				}
				case 'actionKeep': {
					newAction = { actionKeep: [{}] };
					break;
				}
				case 'actionTag': {
					if (!('actionTag' in selectedAction)) {
						newAction = {
							actionTag: [{ tagName: '' }]
						};
					}
					break;
				}
				case 'actionFileInto': {
					if (!('actionFileInto' in selectedAction)) {
						newAction = {
							actionFileInto: [{ folderPath: '' }]
						};
					}
					break;
				}
				case 'actionRedirect': {
					if (!('actionRedirect' in selectedAction)) {
						newAction = {
							actionRedirect: [{ a: '' }]
						};
					}
					break;
				}
				default:
					newAction = { actionKeep: [{}] };
					break;
			}
			onActionSwitch(newAction);
		},
		[selectedAction, markAsOptions, onActionSwitch]
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
						items={actionOptions}
						background="gray5"
						label={t('settings.actions', 'Actions')}
						onChange={onSwitchAction}
						defaultSelection={defaultValue}
					/>
				</Row>
				{userChoseRedirectToActionInThePast && (
					<Row padding={{ right: 'small' }} minWidth="12.5rem">
						<Text size="medium" color="info">
							{t('label.admin_disabled_action', 'The Admin disabled the redirect action')}
						</Text>
					</Row>
				)}
				{ActionComponentToDisplay && (
					<ActionComponentToDisplay value={selectedAction} onChange={onActionValueChange} />
				)}
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
