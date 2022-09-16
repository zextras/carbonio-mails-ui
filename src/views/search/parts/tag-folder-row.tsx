/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';
import { Container, ChipInput } from '@zextras/carbonio-design-system';
import { filter } from 'lodash';
import { ZIMBRA_STANDARD_COLORS, t } from '@zextras/carbonio-shell-ui';
import FolderSelectModal from './folder-modal';

type ComponentProps = {
	compProps: {
		folder: Array<any>;
		setFolder: (arg: any) => void;
		tagOptions: Array<any>;
		tag: Array<any>;
		setTag: (arg: any) => void;
	};
};
const TagFolderRow: FC<ComponentProps> = ({ compProps }): ReactElement => {
	const { folder, setFolder, tagOptions, tag, setTag } = compProps;
	const [open, setOpen] = useState(false);

	const onClose = useCallback(() => setOpen(false), []);
	const openFolderModal = useCallback(() => setOpen(true), []);

	const chipOnAdd = useCallback(
		(label, preText, hasAvatar, isGeneric, isQueryFilter, avatarIcon, avatarBackground) => ({
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
		(label): any => chipOnAdd(label, 'in', true, false, true, 'FolderOutline', ''),
		[chipOnAdd]
	);
	const tagChipOnAdd = useCallback(
		(label): any => {
			const chipBg = filter(tagOptions, { label })[0];
			return chipOnAdd(
				label,
				'tag',
				true,
				false,
				true,
				'Tag',
				ZIMBRA_STANDARD_COLORS[chipBg.color].hex
			);
		},
		[chipOnAdd, tagOptions]
	);
	const folderOnChange = useCallback((folderChips) => setFolder(folderChips), [setFolder]);

	const modalProps = useMemo(
		() => ({
			open,
			onClose,
			setFolder
		}),
		[open, onClose, setFolder]
	);
	const tagPlaceholder = useMemo(() => t('label.tag', 'Tag'), []);
	const onTagChange = useCallback(
		(chip) => {
			setTag(chip);
		},
		[setTag]
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
				<FolderSelectModal compProps={modalProps} />
			</Container>
		</Container>
	);
};

export default TagFolderRow;
