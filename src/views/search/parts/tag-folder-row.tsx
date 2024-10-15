/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';

import { ChipInput, ChipItem, Container, CustomModal } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { filter } from 'lodash';

import { ZIMBRA_STANDARD_COLORS } from '../../../carbonio-ui-commons/constants/utils';
import { isSharedAccountFolder } from '../../../helpers/folders';
import type { ChipOnAdd, Folder, TagFolderRowProps } from '../../../types';
import { SelectFolderModal } from '../../../ui-actions/modals/select-folder-modal';
import { getFolderIconColor } from '../../sidebar/utils';

const TagFolderRow: FC<TagFolderRowProps> = ({ compProps }): ReactElement => {
	const { folder, setFolder, tagOptions, tag, setTag } = compProps;
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
		(label: unknown): ChipOnAdd => {
			const chipBg = filter(tagOptions, { label })[0];
			return chipOnAdd(
				label as string,
				'tag',
				true,
				false,
				true,
				'Tag',
				ZIMBRA_STANDARD_COLORS[chipBg.color ?? 0].hex
			);
		},
		[chipOnAdd, tagOptions]
	);
	const folderOnChange = useCallback(
		(folderChips: ChipItem[]) => setFolder(folderChips),
		[setFolder]
	);

	const tagPlaceholder = useMemo(() => t('label.tag', 'Tag'), []);
	const onTagChange = useCallback(
		(chip: ChipItem[]) => {
			setTag(chip);
		},
		[setTag]
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
				setFolder([
					{
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
		[setFolder]
	);

	return (
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
				<ChipInput
					placeholder={tagPlaceholder}
					background="gray5"
					defaultValue={[]}
					options={tagOptions}
					value={tag}
					onChange={onTagChange}
					onAdd={tagChipOnAdd}
					disableOptions={false}
					disabled
					requireUniqueChips
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
				<ChipInput
					background="gray5"
					icon="FolderOutline"
					placeholder={t('share.is_contained_in', 'Is contained in')}
					value={folder}
					onChange={folderOnChange}
					onAdd={folderChipOnAdd}
					disabled
					iconAction={openFolderModal}
					requireUniqueChips
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
					/>
				</CustomModal>
			</Container>
		</Container>
	);
};

export default TagFolderRow;
