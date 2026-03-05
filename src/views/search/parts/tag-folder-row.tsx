/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';

import {
	ChipInput,
	Container,
	CustomModal,
	Icon,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { Folder, getTags, Tag, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';
import { map } from 'lodash';
import { Controller, UseFormSetValue } from 'react-hook-form';

import { isSharedAccountFolder } from 'helpers/folders';
import { ChipOnAdd } from 'types/search';
import { SelectFolderModal } from 'ui-actions/modals/select-folder-modal';
import {
	AdvancedFilterModalFormValues,
	FormValuesControlProps,
	KeywordState
} from 'views/search/types/types';
import { getFolderIconColor } from 'views/sidebar/utils';

type TagFolderRowControlProps = FormValuesControlProps & {
	setValue: UseFormSetValue<AdvancedFilterModalFormValues>;
};

export const TagFolderRow = ({
	control,
	setValue
}: TagFolderRowControlProps): React.JSX.Element => {
	const tagOptions: Array<Tag & { label: string; customComponent: React.JSX.Element }> = useMemo(
		() =>
			map(getTags(), (item) => ({
				...item,
				label: item.name,
				customComponent: (
					<Row takeAvailableSpace mainAlignment="flex-start">
						<Row takeAvailableSpace mainAlignment="space-between">
							<Row mainAlignment="flex-end">
								<Padding right="small">
									<Icon icon="Tag" color={ZIMBRA_STANDARD_COLORS[item.color ?? 0].hex} />
								</Padding>
							</Row>
							<Row takeAvailableSpace mainAlignment="flex-start">
								<Tooltip label={item.name} overflowTooltip>
									<Text>{item.name}</Text>
								</Tooltip>
							</Row>
						</Row>
					</Row>
				)
			})),
		[]
	);
	const [open, setOpen] = useState(false);
	const onClose = useCallback(() => setOpen(false), []);
	const openFolderModal = useCallback(() => setOpen(true), []);

	const chipOnAdd = useCallback(
		(
			label: string,
			preText: string,
			hasAvatar: boolean,
			isGeneric: boolean,
			isQueryFilter: boolean,
			avatarIcon: string,
			avatarBackground: string
		): ChipOnAdd => ({
			label: `${preText}:${label}`,
			hasAvatar,
			isGeneric,
			avatarIcon,
			background: 'gray2',
			avatarBackground: avatarBackground || 'gray2',
			isQueryFilter,
			value: `${preText}:"${label}"`
		}),
		[]
	);
	const folderChipOnAdd = useCallback(
		(label: unknown): ChipOnAdd =>
			chipOnAdd(label as string, 'in', true, false, true, 'FolderOutline', ''),
		[chipOnAdd]
	);

	const tagChipOnAdd = useCallback(
		(label: string, values: KeywordState): ChipOnAdd | undefined => {
			const alreadyExists = values.some(
				({ label: currentLabel }) => currentLabel === `tag:${label}`
			);
			if (alreadyExists) {
				return undefined;
			}
			const chipBg = tagOptions.filter((tag) => tag.label === label);
			return chipOnAdd(
				label as string,
				'tag',
				true,
				false,
				true,
				'Tag',
				ZIMBRA_STANDARD_COLORS[chipBg[0]?.color ?? 0].hex
			);
		},
		[chipOnAdd, tagOptions]
	);

	const headerTitle = t('share.is_contained_in', 'Is contained in');
	const actionLabel = t('label.choose_folder', 'Choose folder');
	const inputLabel = t(
		'share.filter_folder_message',
		'Select a folder where to start your advanced search'
	);

	const confirmAction = useCallback(
		(
			folderDestination: Folder | undefined,
			_setFolderDestination: (_folder: Folder | undefined) => void,
			_onClose: () => void
		) => {
			folderDestination &&
				setValue('folderInput', [
					{
						id: '',
						label: `in:${folderDestination?.absFolderPath}`,
						hasAvatar: true,
						maxWidth: '12.5rem',
						isGeneric: false,
						background: 'gray2',
						avatarBackground: getFolderIconColor(folderDestination),
						avatarIcon: 'FolderOutline',
						isQueryFilter: true,
						value: isSharedAccountFolder(folderDestination?.id)
							? `inid:"${folderDestination?.id}"`
							: `in:"${folderDestination?.absFolderPath}"`
					}
				]);
			_onClose();
		},
		[setValue]
	);

	return (
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
				<Controller
					control={control}
					name={'tagInput'}
					render={({ field: { onChange, value } }): React.JSX.Element => (
						<ChipInput
							placeholder={t('label.tags', 'Tags')}
							background="gray5"
							defaultValue={[]}
							options={tagOptions}
							value={value}
							onChange={(chips): void => {
								const validChips = chips.filter((chip) => chip !== undefined);
								onChange(validChips);
							}}
							onAdd={(label): any => {
								if (typeof label !== 'string') {
									return undefined;
								}
								// fix typings on DS
								return tagChipOnAdd(label, value);
							}}
							disableOptions={false}
							disabled
							data-testid="tagInput"
						/>
					)}
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
				<Controller
					control={control}
					name={'folderInput'}
					render={({ field: { onChange, value } }): React.JSX.Element => (
						<ChipInput
							background="gray5"
							icon="FolderOutline"
							placeholder={t('share.is_contained_in', 'Is contained in')}
							value={value}
							onChange={onChange}
							onAdd={folderChipOnAdd}
							disabled
							iconAction={openFolderModal}
							data-testid="folderInput"
						/>
					)}
				/>
				<CustomModal open={open} onClose={onClose} maxHeight="90vh" size={'medium'}>
					<SelectFolderModal
						onClose={onClose}
						headerTitle={headerTitle}
						actionLabel={actionLabel}
						inputLabel={inputLabel}
						confirmAction={confirmAction}
						allowRootSelection={false}
						allowFolderCreation={false}
						showSharedAccounts
						showTrashFolder
						showSpamFolder
						data-testid="selectFolderModal"
					/>
				</CustomModal>
			</Container>
		</Container>
	);
};
