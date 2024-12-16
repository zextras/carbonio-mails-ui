/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';

import {
	Button,
	Container,
	IconButton,
	Padding,
	Row,
	Text,
	Tooltip,
	getColor
} from '@zextras/carbonio-design-system';
import { filter, omit } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

import CustomSelect from './custom-select';
import { MarkAs } from './filter-actions/mark-as';
import { MovetoFolder } from './filter-actions/move-to-folder';
import { RedirectTo } from './filter-actions/redirect-to';
import { ShowTag } from './filter-actions/show-tag';
import { getActionOptions, getMarkAsOptions } from './utils';
import { ZIMBRA_STANDARD_COLORS } from '../../../../carbonio-ui-commons/constants';
import { CONTACT_TYPES } from '../../../../carbonio-ui-commons/integrations/constants';
import { ContactInputItem } from '../../../../carbonio-ui-commons/integrations/types';
import { Folder } from '../../../../carbonio-ui-commons/types/folder';

export const StyledIconButton = styled(Button)`
	border: 0.0625rem solid
		${({ theme, disabled, color = 'primary' }): string =>
			disabled ? theme.palette.gray2.regular : getColor(String(color), theme)};
	svg {
		border: none !important;
	}
`;

// TODO: move this one
type Tag = {
	label: string;
	customComponent?: React.ReactNode;
	hasAvatar: boolean;
	avatarIcon: 'Tag';
	background: 'gray2';
	avatarBackground: string;
	color?: number;
};

type ActionFileInto = {
	folderPath?: string;
};
// FIXME: this type was introduced just to start understanding what this code is doing but it is clear it is trying to represent a code that does too many things
export type TempAction = {
	id?: string;
	a?: string;
	label?: string;
	value?: string;
	actionKeep?: Array<unknown>;
	actionStop?: Array<unknown>;
	actionRedirect?: Array<unknown>;
	actionTag?: Array<unknown>;
	actionFileInto?: Array<ActionFileInto>;
	actionDiscard?: Array<unknown>;
	tagName?: string;
	flagName?: string;
	folderPath?: string;
};

// FIXME: what is "comp" supposed to be?
type CompProps = {
	isIncoming: boolean;
	tempActions: Array<TempAction>;
	setTempActions: (tempActions: Array<TempAction>) => void;
	zimbraFeatureMailForwardingInFiltersEnabled: 'TRUE' | 'FALSE';
};

type FilterActionRowProps = {
	tmpFilter: Record<string, [TempAction]>;
	index: number;
	compProps: CompProps;
	tagOptions?: Array<any>;
};

const FilterActionRows: FC<FilterActionRowProps> = ({
	tmpFilter,
	index,
	compProps,
	tagOptions
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
	const markAsOptions = useMemo(() => getMarkAsOptions(t), [t]);
	const [tag, setTag] = useState<Array<Tag>>([]);

	const addFilterCondition = useCallback(() => {
		const previousTempActions = tempActions.slice();
		previousTempActions.push({ actionKeep: [{}], actionStop: [{}], id: uuidv4() });
		setTempActions(previousTempActions);
	}, [tempActions, setTempActions]);

	const [activeActionOption, setActiveActionOption] = useState('inbox');
	const showMarksAsBtn = useMemo(() => activeActionOption === 'markAs', [activeActionOption]);
	const showRedirectToAddrsInput = useMemo(
		() => activeActionOption === 'redirectToAddress',
		[activeActionOption]
	);
	const [contacts, setContacts] = useState<ContactInputItem[]>([]);

	const onChange = useCallback(
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
		const action = Object.keys(omit(tmpFilter, 'id'))[0];
		if (action === 'actionRedirect' && zimbraFeatureMailForwardingInFiltersEnabled === 'FALSE') {
			setIsRedirectToActionRemoved(true);
			const previous = tempActions.slice();
			previous[index] = { actionKeep: [{}], id: previous[index].id };
			setTempActions(previous);
			return actionOptions[0];
		}
		switch (action) {
			case 'actionDiscard': {
				return actionOptions[1];
			}
			case 'actionKeep': {
				return actionOptions[0];
			}
			case 'actionFileInto': {
				setActiveActionOption('moveIntoFolder');
				return actionOptions[2];
			}
			case 'actionFlag': {
				setActiveActionOption('markAs');
				return actionOptions[4];
			}
			case 'actionTag': {
				setActiveActionOption('tagWith');
				const chipBg = filter(tagOptions, { label: tmpFilter[action][0].tagName })[0];
				setTag(
					tmpFilter[action][0].tagName
						? [
								{
									label: `${tmpFilter[action][0].tagName}`,
									hasAvatar: true,
									avatarIcon: 'Tag',
									background: 'gray2',
									avatarBackground: ZIMBRA_STANDARD_COLORS[chipBg?.color]?.hex
								}
							]
						: []
				);
				return actionOptions[3];
			}
			case 'actionRedirect': {
				setActiveActionOption('redirectToAddress');
				const email = tmpFilter[action][0].a;
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
			default:
				return actionOptions[0];
		}
	}, [
		tmpFilter,
		zimbraFeatureMailForwardingInFiltersEnabled,
		tempActions,
		index,
		setTempActions,
		actionOptions,
		tagOptions
	]);

	const defaultMarkAsOption = useMemo(() => {
		const action = Object.keys(omit(tmpFilter, 'id'))[0];
		return tmpFilter[action][0].flagName === 'flagged' ? markAsOptions[1] : markAsOptions[0];
	}, [tmpFilter, markAsOptions]);

	const showBrowseBtn = useMemo(
		() => activeActionOption === 'moveIntoFolder',
		[activeActionOption]
	);

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
		(str: string) => {
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
					if (!previous[index].actionTag) {
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
					if (!previous[index].actionFileInto) {
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
					if (!previous[index].actionRedirect) {
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

	const showTagOptions = useMemo(() => activeActionOption === 'tagWith', [activeActionOption]);

	const onSelectFolder = useCallback(() => {
		setActiveIndex(index);
	}, [setActiveIndex, index]);

	const onTagChange = useCallback(
		(chip: Tag[]) => {
			const previous = tempActions.slice();
			if (chip.length > 0) {
				const requiredTag = chip.length > 1 ? chip[1] : chip[0];
				setTag([requiredTag]);
				previous[index] = { id: previous[index]?.id, actionTag: [{ tagName: requiredTag.label }] };
				setTempActions(previous);
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
			// setDestination({ name: folderDestination?.name });
		},
		[tempActions, activeIndex, setTempActions]
	);

	return (
		<Container
			mainAlignment="space-between"
			crossAlignment="center"
			orientation="horizontal"
			padding={{ top: 'small' }}
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
						destination={
							tempActions[0]?.actionFileInto?.[0]
								? { name: tempActions[0].actionFileInto[0].folderPath }
								: undefined
						}
						onSelectFolder={onSelectFolder}
						onConfirmDestination={confirmAction}
					/>
				)}
				{showMarksAsBtn && (
					<MarkAs
						options={markAsOptions}
						onChange={handleMarkAsOptionChange}
						selected={defaultMarkAsOption}
					/>
				)}

				{showRedirectToAddrsInput && <RedirectTo defaultValue={contacts} onChange={onChange} />}

				{showTagOptions && (
					<ShowTag value={tag} tagOptions={tagOptions} onTagChange={onTagChange} />
				)}
			</Row>
			<Container orientation="horizontal" mainAlignment="flex-end" width="auto">
				<Tooltip label={t('settings.add_action', 'Add new action')} placement="top">
					<StyledIconButton
						icon="PlusOutline"
						onClick={addFilterCondition}
						color="primary"
						type="outlined"
					/>
				</Tooltip>
				<Padding left="small">
					<Tooltip label={t('settings.remove_action', 'Remove this action')} placement="top">
						<StyledIconButton
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

export default FilterActionRows;
