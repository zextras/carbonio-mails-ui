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
	IconButton, ChipItem,
} from '@zextras/carbonio-design-system';
import styled from 'styled-components';
import { filter, omit } from 'lodash';
import { ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-shell-ui';
import { v4 as uuidv4 } from 'uuid';
import { getActionOptions, getMarkAsOptions } from './utils';
import CustomSelect from './custom-select';

export const StyledIconButton = styled(IconButton)`
	border: 1px solid
		${({ theme, disabled, iconColor = 'primary' }): string =>
			disabled ? theme.palette.gray2.regular : theme.palette[iconColor].regular};
	svg {
		border: none !important;
	}
`;

type FilterActionRowProps = {
	tmpFilter: any;
	index: string;
	compProps: any;
	modalProps: any;
	tagOptions?: Array<any>;
};
const FilterActionRows: FC<FilterActionRowProps> = ({
	tmpFilter,
	index,
	compProps,
	modalProps,
	tagOptions
}): ReactElement => {
	const { t, isIncoming, tempActions, setTempActions } = compProps;
	const { setOpen, setActiveIndex, folder, setFolder } = modalProps;

	const actionOptions = useMemo(() => getActionOptions(t, isIncoming ?? false), [t, isIncoming]);
	const markAsOptions = useMemo(() => getMarkAsOptions(t), [t]);
	const [tag, setTag] = useState<Array<any>>([]);
	const [redirectAddress, setRedirectAddress] = useState('');

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
	const defaultValue = useMemo(() => {
		const action = Object.keys(omit(tmpFilter, 'id'))[0];
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
				setTag([
					{
						label: `${tmpFilter[action][0].tagName}`,
						hasAvatar: true,
						avatarIcon: 'Tag',
						background: 'gray2',
						avatarBackground: ZIMBRA_STANDARD_COLORS[chipBg?.color]?.hex
					}
				]);
				return actionOptions[3];
			}
			case 'actionRedirect': {
				setActiveActionOption('redirectToAddress');
				setRedirectAddress(tmpFilter[action][0].a);
				return actionOptions[5];
			}
			default:
				return actionOptions[0];
		}
	}, [tmpFilter, actionOptions, setFolder, tagOptions]);

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

				case 'tagWith': {
					const previous = tempActions.slice();
					previous[index] = { id: previous[index].id, actionDiscard: [{}] };
					setTempActions(previous);
					break;
				}
				case 'markAs': {
					const previous = tempActions.slice();
					previous[index] = {
						id: previous[index].id,
						actionFlag: [{ flagName: 'read' }]
					};
					setTempActions(previous);
					break;
				}
				case 'redirectToAddress': {
					const previous = tempActions.slice();
					previous[index] = { actionRedirect: [{ a: '' }], id: previous[index].id };
					setTempActions(previous);
					break;
				}
				default: {
					const previous = tempActions.slice();
					previous[index] = { actionKeep: [{}], id: previous[index].id };
					setTempActions(previous);
				}
			}
			setActiveActionOption(str);
		},
		[tempActions, index, setTempActions]
	);
	const openFolderModalDisabled = useMemo(
		() => activeActionOption !== 'moveIntoFolder',
		[activeActionOption]
	);

	const redirectAddressChange = useCallback(
		(ev) => {
			const previous = tempActions.slice();
			previous[index] = { actionRedirect: [{ a: ev.target.value }], id: uuidv4() };
			setTempActions(previous);
		},
		[tempActions, index, setTempActions]
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
			const requiredTag = chip.length > 1 ? chip[1] : chip[0];
			setTag([requiredTag]);
			const previous = tempActions.slice();
			previous[index] = { id: previous[index]?.id, actionTag: [{ tagName: requiredTag.label }] };
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
				<Row padding={{ right: 'small' }} minWidth="200px">
					<CustomSelect
						items={actionOptions}
						background="gray5"
						label={t('settings.actions', 'Actions')}
						onChange={onActionOptionChange}
						defaultSelection={defaultValue}
					/>
				</Row>
				{showBrowseBtn && (
					<>
						{folder && Object.keys(folder).length > 0 && (
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
					<Row padding={{ right: 'small' }} minWidth="200px">
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
					<Row padding={{ right: 'small' }} minWidth="200px">
						<Input onChange={redirectAddressChange} defaultValue={redirectAddress} />
					</Row>
				)}

				{showTagOptions && (
					<Row padding={{ right: 'small' }} minWidth="200px">
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
				<Tooltip label={t('settings.add_condition', 'Add new condition')} placement="top">
					<StyledIconButton icon="PlusOutline" onClick={addFilterCondition} iconColor="primary" />
				</Tooltip>
				<Padding left="small">
					<Tooltip label={t('settings.remove_condition', 'Remove this condition')} placement="top">
						<StyledIconButton
							icon="MinusOutline"
							disabled={disableRemove}
							onClick={onRemove}
							iconColor="secondary"
						/>
					</Tooltip>
				</Padding>
			</Container>
		</Container>
	);
};

export default FilterActionRows;
