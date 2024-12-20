/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';

import { Button, Container, Padding, Row, Text, Tooltip } from '@zextras/carbonio-design-system';
import { noop } from 'lodash';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import CustomSelect from './custom-select';
import { MarkAs } from './filter-actions/mark-as';
import { MovetoFolder } from './filter-actions/move-to-folder';
import { RedirectTo } from './filter-actions/redirect-to';
import { ShowTag } from './filter-actions/show-tag';
import { getActionOptions, getMarkAsOptions } from './utils';
import { CONTACT_TYPES } from '../../../../carbonio-ui-commons/integrations/constants';
import { ContactInputItem } from '../../../../carbonio-ui-commons/integrations/types';
import { Folder } from '../../../../carbonio-ui-commons/types/folder';
import { FilterAction, MailFilterTag, MarkAsOption } from '../../../../types';

type FilterActionRowProps = {
	mailForwardingEnabled: 'TRUE' | 'FALSE';
	isIncomingFilter: boolean;
	tagOptions?: Array<MailFilterTag>;
	defaultAction: FilterAction;
	onActionSwitch: (action: FilterAction) => void;
	onDefaultActionValueChange: (action: FilterAction) => void;
	onRemoveAction: () => void;
	disableRemove: boolean;
	onAddNewAction: (action: FilterAction) => void;
};

type ActiveOption =
	| 'actionTag'
	| 'actionKeep'
	| 'actionFlag'
	| 'actionRedirect'
	| 'actionFileInto'
	| 'actionDiscard';

export const FilterActionRow: FC<FilterActionRowProps> = ({
	isIncomingFilter,
	mailForwardingEnabled,
	tagOptions,
	defaultAction,
	onAddNewAction,
	onRemoveAction,
	onActionSwitch,
	disableRemove,
	onDefaultActionValueChange
}): ReactElement => {
	const [isRedirectToActionRemoved, setIsRedirectToActionRemoved] = useState(false);
	const [t] = useTranslation();
	const markAsOptions = useMemo(() => getMarkAsOptions(t), [t]);
	const actionOptions = useMemo(
		() => getActionOptions(t, mailForwardingEnabled, isIncomingFilter ?? false),
		[t, mailForwardingEnabled, isIncomingFilter]
	);
	const [tag, setTag] = useState<Array<MailFilterTag>>([]);

	const [activeActionOption, setActiveActionOption] = useState<ActiveOption>('actionKeep');
	const showRedirectToAddrsInput = useMemo(
		() => activeActionOption === 'actionRedirect',
		[activeActionOption]
	);
	const showBrowseBtn = useMemo(
		() => activeActionOption === 'actionFileInto',
		[activeActionOption]
	);
	const showTagOptions = useMemo(() => activeActionOption === 'actionTag', [activeActionOption]);

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
		if ('actionRedirect' in defaultAction && mailForwardingEnabled === 'FALSE') {
			setIsRedirectToActionRemoved(true);
			onDefaultActionValueChange({ actionKeep: [{}] });
			return {
				label: isIncomingFilter
					? t('settings.keep_in_inbox', 'Keep in Inbox')
					: t('settings.keep_in_sent', 'Keep in Sent'),
				value: 'actionKeep'
			};
		}
		if ('actionDiscard' in defaultAction) {
			setActiveActionOption('actionDiscard');
			return {
				label: t('settings.discard', 'Discard'),
				value: 'actionDiscard'
			};
		}
		if ('actionKeep' in defaultAction) {
			setActiveActionOption('actionKeep');
			return actionOptions[0];
		}
		// TODO: check me, what is the meaning of having just a stop action?
		if ('actionStop' in defaultAction) {
			return actionOptions[0];
		}
		if ('actionFileInto' in defaultAction) {
			setActiveActionOption('actionFileInto');
			return {
				label: t('settings.move_into_folder', 'Move Into Folder'),
				value: 'actionFileInto'
			};
		}
		if ('actionFlag' in defaultAction) {
			setActiveActionOption('actionFlag');
			return {
				label: t('settings.mark_as', 'Mark as'),
				value: 'actionFlag'
			};
		}
		if ('actionRedirect' in defaultAction) {
			setActiveActionOption('actionRedirect');
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
			return {
				label: t('settings.redirect_to_address', 'Redirect to address'),
				value: 'actionRedirect'
			};
		}
		setActiveActionOption('actionTag');
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
		return {
			label: t('settings.tag_with', 'Tag with'),
			value: 'actionTag'
		};
	}, [
		defaultAction,
		mailForwardingEnabled,
		t,
		onDefaultActionValueChange,
		isIncomingFilter,
		actionOptions
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
					if (!('actionTag' in defaultAction)) {
						newAction = {
							actionTag: [{ tagName: '' }]
						};
						setTag([]);
					}
					break;
				}
				case 'actionFileInto': {
					if (!('actionFileInto' in defaultAction)) {
						newAction = {
							actionFileInto: [{ folderPath: '' }]
						};
					}
					break;
				}
				case 'actionRedirect': {
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
		[defaultAction, isRedirectToActionRemoved, markAsOptions, onActionSwitch]
	);

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
		(value: MarkAsOption['value']) => {
			onDefaultActionValueChange(value);
		},
		[onDefaultActionValueChange]
	);
	// TODO: check what we need to do 'on select folder' also as it is not clear

	const confirmMoveToFolder = useCallback(
		(folderDestination: Folder | undefined) => {
			onDefaultActionValueChange({
				actionFileInto: [{ folderPath: `${folderDestination?.absFolderPath}` }]
			});
		},
		[onDefaultActionValueChange]
	);

	const onAddingNewAction = useCallback((): void => {
		// TODO: figure out if we want to pass the id here or on filter-actions file
		onAddNewAction({ actionKeep: [{}], actionStop: [{}], id: uuidv4() });
	}, [onAddNewAction]);

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
				{isRedirectToActionRemoved && defaultValue.value === 'actionKeep' && (
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
				{'actionFlag' in defaultAction && (
					<MarkAs
						selected={defaultAction.actionFlag[0]}
						options={markAsOptions}
						onChange={handleMarkAsOptionChange}
					/>
				)}

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
