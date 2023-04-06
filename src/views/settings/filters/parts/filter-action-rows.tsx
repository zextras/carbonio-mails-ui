/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo, useCallback, useState } from 'react';
import {
	Container,
	Button,
	Row,
	Padding,
	ChipInput,
	Input,
	Tooltip,
	IconButton,
	ChipItem,
	getColor,
	Text
} from '@zextras/carbonio-design-system';
import styled from 'styled-components';
import { filter, omit } from 'lodash';
import { Folder, useIntegratedComponent, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-shell-ui';
import { v4 as uuidv4 } from 'uuid';
import { getActionOptions, getMarkAsOptions } from './utils';
import CustomSelect from './custom-select';
import MoveToFolderModal from './move-to-folder-modal';

export const StyledIconButton = styled(IconButton)`
	border: 0.0625rem solid
		${({ theme, disabled, iconColor = 'primary' }): string =>
			disabled ? theme.palette.gray2.regular : getColor(String(iconColor), theme)};
	svg {
		border: none !important;
	}
`;

type FilterActionRowProps = {
	tmpFilter: any;
	index: number;
	compProps: any;
	tagOptions?: Array<any>;
};

type ContactType = {
	company?: string;
	email: string;
	firstName?: string;
	fullName?: string;
	id?: string;
	label?: string;
	lastName?: string;
};

const FilterActionRows: FC<FilterActionRowProps> = ({
	tmpFilter,
	index,
	compProps,
	tagOptions
}): ReactElement => {
	const {
		t,
		isIncoming,
		tempActions,
		setTempActions,
		zimbraFeatureMailForwardingInFiltersEnabled
	} = compProps;
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const [folderDestination, setFolderDestination] = useState<Folder | any>({});
	const [folder, setFolder] = useState<Folder | any>({});
	const [isRedirectToActionRemoved, setIsRedirectToActionRemoved] = useState(false);

	const actionOptions = useMemo(
		() => getActionOptions(t, zimbraFeatureMailForwardingInFiltersEnabled, isIncoming ?? false),
		[t, zimbraFeatureMailForwardingInFiltersEnabled, isIncoming]
	);
	const markAsOptions = useMemo(() => getMarkAsOptions(t), [t]);
	const [tag, setTag] = useState<Array<any>>([]);

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
	const [contacts, setContacts] = useState<ContactType[]>([]);
	const [ContactInput, integrationAvailable] = useIntegratedComponent('contact-input');
	const onChange = useCallback(
		(users) => {
			const previous = tempActions.slice();
			const email = users.length > 0 && users[0].email !== '' ? users[0].email : '';
			previous[index] = {
				actionRedirect: [{ a: email }],
				id: uuidv4()
			};
			setContacts([{ email }]);
			setTempActions(previous);
		},
		[index, setTempActions, tempActions]
	);

	const onModalClose = useCallback(() => {
		setFolder({});
		setOpen(false);
	}, []);

	const modalProps = useMemo(
		() => ({
			open,
			onClose: onModalClose,
			t,
			setOpen,
			activeIndex,
			setActiveIndex,
			tempActions,
			setTempActions,
			folderDestination,
			setFolderDestination,
			folder,
			setFolder
		}),
		[open, onModalClose, t, activeIndex, tempActions, setTempActions, folderDestination, folder]
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
				setFolder({ name: tmpFilter[action][0].folderPath });
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
				if (tmpFilter[action][0].a) {
					setContacts([{ email: tmpFilter[action][0].a }]);
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
		(indexToRemove) => (): void => {
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
		(str) => {
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
					let tagDetails = [{}];
					if (!previous[index].actionTag) {
						tagDetails = [
							{
								id: previous[index]?.id,
								actionTag: [{ tagName: '' }]
							}
						];
						previous[index] = {
							id: previous[index]?.id,
							actionTag: [{ tagName: '' }]
						};
						setTempActions(previous);
						setTag(tagDetails);
					}

					break;
				}
				case 'moveIntoFolder': {
					const previous = tempActions.slice();
					let folderDetail = [{}];
					if (!previous[index].actionFileInto) {
						folderDetail = [
							{
								name: ''
							}
						];
						previous[index] = {
							id: previous[index]?.id,
							actionFileInto: [{ folderPath: '' }]
						};
					}
					setTempActions(previous);
					setFolder(folderDetail);
					break;
				}
				case 'redirectToAddress': {
					const previous = tempActions.slice();
					if (!previous[index].actionRedirect) {
						previous[index] = {
							id: previous[index]?.id,
							actionRedirect: [{ a: '' }]
						};
						setContacts([{ email: '' }]);
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
	const openFolderModalDisabled = useMemo(
		() => activeActionOption !== 'moveIntoFolder',
		[activeActionOption]
	);

	const showTagOptions = useMemo(() => activeActionOption === 'tagWith', [activeActionOption]);

	const tagChipOnAdd = useCallback(
		(label: unknown): ChipItem => {
			const chipBg = filter(tagOptions, { label })[0];
			return {
				label: `${label}`,
				hasAvatar: true,
				avatarIcon: 'Tag',
				background: 'gray2',
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				avatarBackground: ZIMBRA_STANDARD_COLORS[chipBg.color].hex
			};
		},
		[tagOptions]
	);
	const openModal = useCallback(() => {
		setActiveIndex(index);
		setOpen(true);
	}, [setOpen, setActiveIndex, index]);

	const onTagChange = useCallback(
		(chip) => {
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
		(option) => {
			const previous = tempActions.slice();
			previous[index] = option;
			setTempActions(previous);
		},
		[tempActions, index, setTempActions]
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
								{t('label.admin_disabled_action', 'Admin disabled the previous action')}
							</Text>
						</Row>
					)}
				{showBrowseBtn && (
					<>
						{folder && Object.keys(folder).length > 0 && folder?.name !== '' && (
							<Row padding={{ right: 'small' }}>
								<Input
									label={t('label.destination_folder', 'Destination Folder')}
									backgroundColor="gray5"
									value={folder?.name}
									disabled
								/>
							</Row>
						)}
						<Row>
							<Button
								disabled={openFolderModalDisabled}
								label={t('settings.browse', 'Browse')}
								type="outlined"
								// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
								onClick={openModal}
							/>
						</Row>
					</>
				)}
				{showMarksAsBtn && (
					<Row padding={{ right: 'small' }} minWidth="12.5rem">
						<CustomSelect
							items={markAsOptions}
							background="gray5"
							label=""
							onChange={handleMarkAsOptionChange}
							defaultSelection={defaultMarkAsOption}
						/>
					</Row>
				)}

				{showRedirectToAddrsInput && (
					<Row padding={{ right: 'small' }} minWidth="22rem">
						{integrationAvailable ? (
							<ContactInput
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								placeholder={t('settings.address', 'Address')}
								onChange={onChange}
								defaultValue={contacts}
								disablePortal
								maxChips={1}
							/>
						) : (
							<ChipInput
								placeholder={t('settings.address', 'Address')}
								onChange={onChange}
								defaultValue={contacts}
								maxChips={1}
							/>
						)}
					</Row>
				)}

				{showTagOptions && (
					<Row padding={{ right: 'small' }} minWidth="12.5rem">
						<ChipInput
							placeholder={t('label.tag', 'Tag')}
							background="gray4"
							defaultValue={[]}
							options={tagOptions}
							value={tag}
							singleSelection
							onChange={onTagChange}
							onAdd={tagChipOnAdd}
							disableOptions={false}
							disabled
						/>
					</Row>
				)}
			</Row>

			<Container orientation="horizontal" mainAlignment="flex-end" width="auto">
				<Tooltip label={t('settings.add_action', 'Add new action')} placement="top">
					<StyledIconButton icon="PlusOutline" onClick={addFilterCondition} iconColor="primary" />
				</Tooltip>
				<Padding left="small">
					<Tooltip label={t('settings.remove_action', 'Remove this action')} placement="top">
						<StyledIconButton
							icon="MinusOutline"
							disabled={disableRemove}
							onClick={onRemove}
							iconColor="secondary"
						/>
					</Tooltip>
				</Padding>
			</Container>
			<MoveToFolderModal compProps={modalProps} />
		</Container>
	);
};

export default FilterActionRows;
