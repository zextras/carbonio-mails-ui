/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';

import { Button, Container, Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import CustomSelect from './custom-select';
import { MarkAs } from './filter-actions/mark-as';
import { MovetoFolder } from './filter-actions/move-to-folder';
import { RedirectTo } from './filter-actions/redirect-to';
import { ShowTag } from './filter-actions/show-tag';
import { getActionOptions } from './utils';
import { CONTACT_TYPES } from '../../../../carbonio-ui-commons/integrations/constants';
import { ContactInputItem } from '../../../../carbonio-ui-commons/integrations/types';
import { Folder } from '../../../../carbonio-ui-commons/types/folder';
import { FilterAction, CompProps, MailFilterTag } from '../../../../types';

type FilterActionRowProps = {
	index: number;
	compProps: Pick<CompProps, 'zimbraFeatureMailForwardingInFiltersEnabled'> &
		Pick<CompProps, 'isIncoming'>;
	tagOptions?: Array<MailFilterTag>;
	defaultAction: FilterAction;
	onActionSwitch: (action: FilterAction) => void;
	onDefaultActionValueChange: (action: FilterAction) => void;
	onRemoveAction: () => void;
	disableRemove: boolean;
	onAddNewAction: () => void;
};

type ActiveOption =
	| 'inbox'
	| 'markAs'
	| 'moveIntoFolder'
	| 'tagWith'
	| 'redirectToAddress'
	| 'discard';

export const FilterActionRow: FC<FilterActionRowProps> = ({
	index,
	compProps,
	tagOptions,
	defaultAction,
	onAddNewAction,
	onRemoveAction,
	onActionSwitch,
	disableRemove,
	onDefaultActionValueChange
}): ReactElement => {
	const { isIncoming, zimbraFeatureMailForwardingInFiltersEnabled } = compProps;
	const [activeIndex, setActiveIndex] = useState(0);
	const [isRedirectToActionRemoved, setIsRedirectToActionRemoved] = useState(false);
	const [t] = useTranslation();
	const actionOptions = useMemo(
		() => getActionOptions(t, zimbraFeatureMailForwardingInFiltersEnabled, isIncoming ?? false),
		[t, zimbraFeatureMailForwardingInFiltersEnabled, isIncoming]
	);
	const [tag, setTag] = useState<Array<MailFilterTag>>([]);

	const [activeActionOption, setActiveActionOption] = useState<ActiveOption>('inbox');
	const showMarksAsBtn = useMemo(() => activeActionOption === 'markAs', [activeActionOption]);
	const showRedirectToAddrsInput = useMemo(
		() => activeActionOption === 'redirectToAddress',
		[activeActionOption]
	);
	const showBrowseBtn = useMemo(
		() => activeActionOption === 'moveIntoFolder',
		[activeActionOption]
	);
	const showTagOptions = useMemo(() => activeActionOption === 'tagWith', [activeActionOption]);

	const [contacts, setContacts] = useState<ContactInputItem[]>([]);

	const onRedirectToChange = useCallback(
		(users: ContactInputItem[]): void => {
			const email = users?.length > 0 ? users[0].value.email : '';
			onDefaultActionValueChange({
				actionRedirect: [{ a: email }],
				id: uuidv4()
			});
		},
		[onDefaultActionValueChange]
	);

	const defaultValue = useMemo(() => {
		if (
			'actionRedirect' in defaultAction &&
			zimbraFeatureMailForwardingInFiltersEnabled === 'FALSE'
		) {
			setIsRedirectToActionRemoved(true);
			onDefaultActionValueChange({ actionKeep: [{}] });
			return actionOptions[0];
		}
		if ('actionDiscard' in defaultAction) {
			return actionOptions[1];
		}
		if ('actionKeep' in defaultAction) {
			return actionOptions[0];
		}
		if ('actionFileInto' in defaultAction) {
			setActiveActionOption('moveIntoFolder');
			return actionOptions[2];
		}
		if ('actionFlag' in defaultAction) {
			setActiveActionOption('markAs');
			return actionOptions[4];
		}
		if ('actionRedirect' in defaultAction) {
			setActiveActionOption('redirectToAddress');
			const email = defaultAction.actionRedirect[0].a;
			if (email) {
				setContacts([
					{
						id: email,
						label: email,
						value: { id: email, email, type: CONTACT_TYPES.CONTACT }
					}
				]);
			} else {
				setContacts([]);
			}
			return actionOptions[5];
		}
		setActiveActionOption('tagWith');
		const { tagName } = defaultAction.actionTag[0];
		setTag(
			tagName
				? [
						{
							label: tagName
						}
					]
				: []
		);
		return actionOptions[3];
	}, [
		defaultAction,
		zimbraFeatureMailForwardingInFiltersEnabled,
		actionOptions,
		onDefaultActionValueChange
	]);

	// TODO: pass me from outside
	const onRemove = useMemo(
		() => (disableRemove ? (): null => null : onRemoveAction),
		[disableRemove, onRemoveAction]
	);
	const onSwitchAction = useCallback(
		(str: ActiveOption) => {
			let newAction: FilterAction = defaultAction;
			switch (str) {
				case 'discard': {
					newAction = { actionDiscard: [{}] };
					break;
				}
				case 'inbox': {
					newAction = { actionKeep: [{}] };
					break;
				}
				case 'tagWith': {
					if (!('actionTag' in defaultAction)) {
						newAction = {
							actionTag: [{ tagName: '' }]
						};
						setTag([]);
					}
					break;
				}
				case 'moveIntoFolder': {
					if (!('actionFileInto' in defaultAction)) {
						newAction = {
							actionFileInto: [{ folderPath: '' }]
						};
					}
					break;
				}
				case 'redirectToAddress': {
					if (!('actionRedirect' in defaultAction)) {
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
			if (isRedirectToActionRemoved) {
				setIsRedirectToActionRemoved(false);
			}
			setActiveActionOption(str);
			onActionSwitch(newAction);
		},
		[defaultAction, isRedirectToActionRemoved, onActionSwitch]
	);

	// TODO: check me, what is it useful for?
	const onSelectFolder = useCallback(() => {
		setActiveIndex(index);
	}, [setActiveIndex, index]);

	const onTagChange = useCallback(
		(chip: MailFilterTag[]) => {
			if (chip.length > 0) {
				const requiredTag = chip.length > 1 ? chip[1] : chip[0];
				setTag([requiredTag]);
				onDefaultActionValueChange({
					actionTag: [{ tagName: requiredTag.label }]
				});
			} else {
				onDefaultActionValueChange({ actionTag: [{ tagName: '' }] });
				setTag([]);
			}
		},
		[onDefaultActionValueChange]
	);

	const handleMarkAsOptionChange = useCallback(
		(option: { label: string; value: any }) => {
			// TODO: check me
			onDefaultActionValueChange({ actionFlag: [{ flagName: option.value }] });
		},
		[onDefaultActionValueChange]
	);

	const confirmMoveToFolder = useCallback(
		(folderDestination: Folder | undefined) => {
			onDefaultActionValueChange({
				actionFileInto: [{ folderPath: `${folderDestination?.absFolderPath}` }]
			});
		},
		[onDefaultActionValueChange]
	);

	const defaultMarkAs = 'actionFlag' in defaultAction ? defaultAction.actionFlag[0] : undefined;

	const defaultMoveToFolder =
		'actionFileInto' in defaultAction
			? { name: defaultAction.actionFileInto[0].folderPath }
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
				{isRedirectToActionRemoved &&
					(defaultValue.value === 'inbox' || defaultValue.value === 'sent') && (
						<Row padding={{ right: 'small' }} minWidth="12.5rem">
							<Text size="medium" color="info">
								{t('label.admin_disabled_action', 'The Admin disabled the redirect action')}
							</Text>
						</Row>
					)}
				{showBrowseBtn && (
					<MovetoFolder
						destination={defaultMoveToFolder}
						onSelectFolder={onSelectFolder}
						onConfirmDestination={confirmMoveToFolder}
					/>
				)}
				{showMarksAsBtn && <MarkAs selected={defaultMarkAs} onChange={handleMarkAsOptionChange} />}

				{showRedirectToAddrsInput && (
					<RedirectTo defaultValue={contacts} onChange={onRedirectToChange} />
				)}

				{showTagOptions && (
					<ShowTag
						value={tag}
						tagOptions={tagOptions}
						onTagChange={onTagChange}
						data-testid={'tag-input'}
					/>
				)}
			</Row>
			<Container orientation="horizontal" mainAlignment="flex-end" width="auto">
				<Tooltip label={t('settings.add_action', 'Add new action')} placement="top">
					<Button icon="PlusOutline" onClick={onAddNewAction} color="primary" type="outlined" />
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
