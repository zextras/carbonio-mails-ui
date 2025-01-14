/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';

import { Button, Container, Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import { noop } from 'lodash';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import CustomSelect from './custom-select';
import { MarkAs } from './filter-actions/mark-as';
import { MovetoFolder } from './filter-actions/move-to-folder';
import { RedirectTo } from './filter-actions/redirect-to';
import { ActionTagComponent } from './tests/filter-actions/action-tag-component';
import { getMarkAsOptions } from './utils';
import { ContactInputItem } from '../../../../carbonio-ui-commons/integrations/types';
import { Folder } from '../../../../carbonio-ui-commons/types';
import { ActionKey, FilterAction, FilterTag, MarkAsOption } from '../../../../types';

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

	const activeActionOption: ActionKey = (optionsToDisplay.find((key) => key in selectedAction) ??
		'actionKeep') as ActionKey;

	const [t] = useTranslation();
	const markAsOptions = useMemo(() => getMarkAsOptions(t), [t]);

	const optionsTranslations = getOptionsTranslations(t);
	const actionOptions = optionsToDisplay.map((actionKey) => ({
		value: actionKey,
		label: optionsTranslations[actionKey]
	}));

	const showRedirectToAddrsInput = useMemo(
		() => activeActionOption === 'actionRedirect',
		[activeActionOption]
	);
	const showBrowseBtn = useMemo(
		() => activeActionOption === 'actionFileInto',
		[activeActionOption]
	);
	const showTagOptions = useMemo(() => 'actionTag' in selectedAction, [selectedAction]);

	const [contacts, setContacts] = useState<ContactInputItem[]>([]);

	const onRedirectToChange = useCallback(
		(users: ContactInputItem[]): void => {
			const email = users?.length > 0 ? users[0].value.email : '';
			onActionValueChange({
				actionRedirect: [{ a: email }],
				id: uuidv4()
			});
		},
		[onActionValueChange]
	);

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
						setContacts([]);
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

	const handleMarkAsOptionChange = useCallback(
		(value: MarkAsOption['value']) => {
			onActionValueChange(value);
		},
		[onActionValueChange]
	);

	const confirmMoveToFolder = useCallback(
		(folderDestination: Folder | undefined) => {
			onActionValueChange({
				actionFileInto: [{ folderPath: `${folderDestination?.absFolderPath}` }]
			});
		},
		[onActionValueChange]
	);

	const onAddingNewAction = useCallback((): void => {
		onAddNewAction({ actionKeep: [{}], actionStop: [{}], id: uuidv4() });
	}, [onAddNewAction]);

	const defaultMoveToFolder =
		'actionFileInto' in selectedAction
			? { name: selectedAction.actionFileInto[0].folderPath }
			: undefined;

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

				{showBrowseBtn && (
					<MovetoFolder
						destination={defaultMoveToFolder}
						onSelectFolder={noop}
						onConfirmDestination={confirmMoveToFolder}
					/>
				)}
				{'actionFlag' in selectedAction && (
					<MarkAs
						selected={selectedAction.actionFlag[0]}
						options={markAsOptions}
						onChange={handleMarkAsOptionChange}
					/>
				)}

				{showRedirectToAddrsInput && (
					<RedirectTo defaultValue={contacts} onChange={onRedirectToChange} />
				)}

				{showTagOptions && (
					<ActionTagComponent onChange={onActionValueChange} value={selectedAction as FilterTag} />
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
