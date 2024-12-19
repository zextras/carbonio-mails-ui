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
	compProps: CompProps;
	tagOptions?: Array<MailFilterTag>;
	defaultAction: FilterAction;
	onActionChange?: (action: FilterAction) => void;
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
	defaultAction
}): ReactElement => {
	const { isIncoming, tempActions, setTempActions, zimbraFeatureMailForwardingInFiltersEnabled } =
		compProps;
	const [activeIndex, setActiveIndex] = useState(0);
	const [isRedirectToActionRemoved, setIsRedirectToActionRemoved] = useState(false);
	const [t] = useTranslation();
	const actionOptions = useMemo(
		() => getActionOptions(t, zimbraFeatureMailForwardingInFiltersEnabled, isIncoming ?? false),
		[t, zimbraFeatureMailForwardingInFiltersEnabled, isIncoming]
	);
	const [tag, setTag] = useState<Array<MailFilterTag>>([]);

	const addFilterCondition = useCallback(() => {
		const previousTempActions = tempActions.slice();
		previousTempActions.push({ actionKeep: [{}], actionStop: [{}], id: uuidv4() });
		setTempActions(previousTempActions);
	}, [tempActions, setTempActions]);

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
			const previous = tempActions.slice();
			const email = users?.length > 0 ? users[0].value.email : '';
			previous[index] = {
				actionRedirect: [{ a: email }],
				id: uuidv4()
			};
			setContacts(users);
			setTempActions(previous);
		},
		[index, setTempActions, tempActions]
	);

	const defaultValue = useMemo(() => {
		if (
			'actionRedirect' in defaultAction &&
			zimbraFeatureMailForwardingInFiltersEnabled === 'FALSE'
		) {
			setIsRedirectToActionRemoved(true);
			const previous = tempActions.slice();
			previous[index] = { actionKeep: [{}], id: previous[index].id };
			setTempActions(previous);
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
		tempActions,
		index,
		setTempActions,
		actionOptions
	]);

	const removeFilterCondition = useCallback(
		(indexToRemove: number) => (): void => {
			const previousTempActions = tempActions.slice();
			previousTempActions.splice(indexToRemove, 1);
			setTempActions(previousTempActions);
		},
		[tempActions, setTempActions]
	);

	const disableRemove = useMemo(() => tempActions.length === 1, [tempActions]);
	const onRemove = useMemo(
		() => (disableRemove ? (): null => null : removeFilterCondition(index)),
		[disableRemove, removeFilterCondition, index]
	);
	const onActionOptionChange = useCallback(
		(str: ActiveOption) => {
			switch (str) {
				case 'discard': {
					const previous = tempActions.slice();
					previous[index] = { id: previous[index].id, actionDiscard: [{}] };
					setTempActions(previous);
					break;
				}
				case 'inbox': {
					const previous = tempActions.slice();
					previous[index] = { actionKeep: [{}], id: previous[index].id };
					setTempActions(previous);
					break;
				}
				case 'tagWith': {
					const previous = tempActions.slice();
					if (!('actionTag' in previous[index])) {
						previous[index] = {
							id: previous[index]?.id,
							actionTag: [{ tagName: '' }]
						};
						setTempActions(previous);
						setTag([]);
					}
					break;
				}
				case 'moveIntoFolder': {
					const previous = tempActions.slice();
					if (!('actionFileInto' in previous[index])) {
						previous[index] = {
							id: previous[index]?.id,
							actionFileInto: [{ folderPath: '' }]
						};
					}
					setTempActions(previous);
					break;
				}
				case 'redirectToAddress': {
					const previous = tempActions.slice();
					if (!('actionRedirect' in previous[index])) {
						previous[index] = {
							id: previous[index]?.id,
							actionRedirect: [{ a: '' }]
						};
						setContacts([]);
					}
					setTempActions(previous);
					break;
				}
				default:
			}
			if (isRedirectToActionRemoved) {
				setIsRedirectToActionRemoved(false);
			}
			setActiveActionOption(str);
		},
		[index, isRedirectToActionRemoved, setTempActions, tempActions]
	);

	const onSelectFolder = useCallback(() => {
		setActiveIndex(index);
	}, [setActiveIndex, index]);

	const onTagChange = useCallback(
		(chip: MailFilterTag[]) => {
			const previous = tempActions.slice();
			if (chip.length > 0) {
				const requiredTag = chip.length > 1 ? chip[1] : chip[0];
				setTag([requiredTag]);
				previous[index] = { id: previous[index]?.id, actionTag: [{ tagName: requiredTag.label }] };
			} else {
				previous[index] = { id: previous[index]?.id, actionTag: [{ tagName: '' }] };
				setTag([]);
			}
			setTempActions(previous);
		},
		[setTag, tempActions, setTempActions, index]
	);

	const handleMarkAsOptionChange = useCallback(
		(option: { label: string; value: any }) => {
			const previous = tempActions.slice();
			// TODO: how do I 100% know this option is markAs?
			previous[index] = option;
			setTempActions(previous);
		},
		[tempActions, index, setTempActions]
	);

	const confirmAction = useCallback(
		(folderDestination: Folder | undefined) => {
			const previous = tempActions.slice();
			previous[activeIndex] = {
				id: previous[activeIndex]?.id,
				actionFileInto: [{ folderPath: `${folderDestination?.absFolderPath}` }]
			};
			setTempActions(previous);
		},
		[tempActions, activeIndex, setTempActions]
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
						onChange={onActionOptionChange}
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
						onConfirmDestination={confirmAction}
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
					<Button icon="PlusOutline" onClick={addFilterCondition} color="primary" type="outlined" />
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
