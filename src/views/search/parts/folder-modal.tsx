/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';
import { Container, CustomModal, Input, Text, Icon } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import { filter, includes, isEmpty, reduce, remove, sortBy, startsWith } from 'lodash';
import { useSelector } from 'react-redux';
import { FOLDERS, useUserSettings } from '@zextras/carbonio-shell-ui';

import ModalFooter from '../../sidebar/commons/modal-footer';
import { ModalHeader } from '../../sidebar/commons/modal-header';
import FolderItem from '../../sidebar/commons/folder-item';
import { selectFolders } from '../../../store/folders-slice';
import { Folder as FolderType } from '../../../types/folder';
import {
	getFolderIconColor,
	getFolderIconName,
	getFolderTranslatedName
} from '../../sidebar/utils';

type ComponentProps = {
	compProps: { open: boolean; onClose: () => void; setFolder: (arg: any) => void; t: TFunction };
};

const FolderSelectModal: FC<ComponentProps> = ({ compProps }): ReactElement => {
	const { open, onClose, setFolder, t } = compProps;
	const folders = useSelector(selectFolders);
	const settings = useUserSettings()?.prefs;
	const [input, setInput] = useState('');
	const [folderDestination, setFolderDestination] = useState<FolderType | any>({});

	const [includeSpam, includeTrash, includeSharedFolders] = useMemo(
		() => [
			settings?.zimbraPrefIncludeSpamInSearch === 'TRUE',
			settings?.zimbraPrefIncludeTrashInSearch === 'TRUE',
			settings?.zimbraPrefIncludeSharedItemsInSearch === 'TRUE'
		],
		[settings]
	);

	const filterFromInput = useMemo(
		() =>
			filter(folders, (v) => {
				if (isEmpty(v)) {
					return false;
				}

				const folderName = getFolderTranslatedName({
					t,
					folderId: v?.id,
					folderName: v?.name
				})?.toLowerCase();

				return startsWith(folderName, input.toLowerCase());
			}),
		[folders, input, t]
	);
	const foldersToFilterOut = useMemo(
		() => [...(includeTrash ? [] : FOLDERS.TRASH), ...(includeSpam ? [] : FOLDERS.SPAM)],
		[includeSpam, includeTrash]
	);

	const nestFilteredFolders: any = useCallback(
		(items: Array<FolderType>, id: string, results: Array<FolderType>, getSharedFolder: boolean) =>
			reduce(
				filter(items, (item) =>
					getSharedFolder
						? item.parent === id && item.isSharedFolder
						: item.parent === id && !includes(foldersToFilterOut, item.id) && !item.isSharedFolder
				),
				(acc: Array<FolderType>, item: any) => {
					const match = filter(results, (result) => result.id === item.id);
					if (match && match.length) {
						return [
							...acc,
							{
								...item,
								label: getFolderTranslatedName({ t, folderId: item.id, folderName: item.name }),
								icon: getFolderIconName(item),
								iconCustomColor: getFolderIconColor(item),
								items: nestFilteredFolders(items, item.id, results, getSharedFolder),
								onClick: (): void => setFolderDestination(item),
								open: !!input.length,
								divider: true,
								background: folderDestination.id === item.id ? 'highlight' : undefined
							}
						];
					}
					if (match && !match.length) {
						return [...acc, ...nestFilteredFolders(items, item.id, results)];
					}
					return acc;
				},
				[]
			),
		[foldersToFilterOut, t, input.length, folderDestination.id]
	);

	const shareFolders = useMemo(
		() => [
			{
				id: '1',
				label: 'Shared Folders',
				level: '0',
				icon: 'Share',
				divider: true,
				items: nestFilteredFolders(folders, '1', filterFromInput, true),
				background: folderDestination.id === '1' ? 'highlight' : undefined,
				onClick: (): void => setFolderDestination({ id: '1' })
			}
		],
		[filterFromInput, folderDestination.id, folders, nestFilteredFolders]
	);

	const onConfirm = useCallback(() => {
		setFolder([
			{
				label: `in:${folderDestination.name}`,
				hasAvatar: true,
				isGeneric: false,
				background: 'gray2',
				avatarBackground: getFolderIconColor(folderDestination),
				avatarIcon: 'FolderOutline',
				isQueryFilter: true,
				value: `in:"${folderDestination.name}"`
			}
		]);
		onClose();
	}, [setFolder, folderDestination, onClose]);

	const disabled = useMemo(() => isEmpty(folderDestination), [folderDestination]);

	const accordionData = useMemo(() => {
		const ownFolders = nestFilteredFolders(folders, '1', filterFromInput, false);
		const trashFolder = remove(ownFolders, (c: any) => c.id === FOLDERS.TRASH);
		const foldersWithTrash = sortBy(ownFolders, (item) => Number(item.id)).concat(trashFolder);
		return includeSharedFolders ? foldersWithTrash.concat(shareFolders) : foldersWithTrash;
	}, [filterFromInput, folders, includeSharedFolders, nestFilteredFolders, shareFolders]);

	return (
		<CustomModal open={open} onClose={onClose} maxHeight="90vh" size="medium">
			<Container
				padding={{ all: 'large' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<ModalHeader title={t('share.is_contained_in', 'Is contained in')} onClose={onClose} />
				<Container mainAlignment="center" crossAlignment="flex-start">
					<Container
						padding={{ all: 'small' }}
						mainAlignment="center"
						crossAlignment="flex-start"
						height="fit"
					>
						<Container
							padding={{ all: 'small' }}
							mainAlignment="center"
							crossAlignment="flex-start"
						>
							<Text overflow="break-word">
								{t(
									'share.filter_folder_message',
									'Select a folder where to start your advanced search'
								)}
							</Text>
						</Container>
						<Input
							inputName="test"
							label={t('label.filter_folders', 'Filter folders')}
							backgroundColor="gray5"
							value={input}
							CustomIcon={({ hasFocus }: { hasFocus: boolean }): ReactElement => (
								<Icon icon="FunnelOutline" size="large" color={hasFocus ? 'primary' : 'text'} />
							)}
							onChange={(e: any): void => setInput(e.target.value)}
						/>

						<FolderItem folders={accordionData} />
					</Container>
					<ModalFooter
						onConfirm={onConfirm}
						secondaryAction={onClose}
						label={t('label.choose_folder', 'Choose folder')}
						secondaryLabel={t('label.go_back', 'Go Back')}
						disabled={disabled}
					/>
				</Container>
			</Container>
		</CustomModal>
	);
};

export default FolderSelectModal;
