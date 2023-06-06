/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container, CustomModal, Icon, Input, Text } from '@zextras/carbonio-design-system';
import type { TFunction } from 'i18next';
import { filter, isEmpty, reduce, startsWith } from 'lodash';
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';
import ModalFooter from '../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../carbonio-ui-commons/components/modals/modal-header';
import { useFoldersMap } from '../../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { Folder } from '../../../../carbonio-ui-commons/types/folder';
import { isSpam, isTrash } from '../../../../helpers/folders';
import FolderItem from '../../../sidebar/commons/folder-item';
import { getFolderIconColor, getFolderIconName } from '../../../sidebar/utils';

type ComponentProps = {
	compProps: {
		open: boolean;
		setOpen: (arg: any) => void;
		onClose: () => void;
		t: TFunction;
		activeIndex: number;
		tempActions: any;
		setTempActions: (arg: any) => void;
		folderDestination: Folder;
		setFolderDestination: (arg: any) => void;
		folder: Folder;
		setFolder: (arg: any) => void;
	};
};

export const MoveToFolderModal: FC<ComponentProps> = ({ compProps }): ReactElement => {
	const {
		open,
		setOpen,
		onClose,
		t,
		activeIndex,
		tempActions,
		setTempActions,
		folderDestination,
		setFolderDestination,
		setFolder
	} = compProps;
	const folders = useFoldersMap();
	const [input, setInput] = useState('');

	const filterFromInput = useMemo(
		() =>
			filter(folders, (v) => {
				if (isEmpty(v)) {
					return false;
				}

				return startsWith(v?.name?.toLowerCase(), input.toLowerCase());
			}),
		[folders, input]
	);

	const nestFilteredFolders: any = useCallback(
		(items: Array<Folder>, id: string, results: Array<Folder>, getSharedFolder: boolean) =>
			reduce(
				filter(items, (item) =>
					getSharedFolder
						? 'isSharedFolder' in item && item.parent === id && item.isSharedFolder
						: 'isSharedFolder' in item &&
						  item.parent === id &&
						  !isSpam(item.id) &&
						  !isTrash(item.id) &&
						  !item.isSharedFolder
				),
				(acc: Array<Folder>, item: any) => {
					const match = filter(results, (result) => result.id === item.id);
					if (match && match.length) {
						return [
							...acc,
							{ divider: true },
							{
								...item,
								label: item.name,
								icon: getFolderIconName(item),
								iconCustomColor: getFolderIconColor(item),
								items: nestFilteredFolders(items, item.id, results, getSharedFolder),
								onClick: (): void => setFolderDestination(item),
								open: !!input.length,
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
		[folderDestination.id, input.length, setFolderDestination]
	);

	const shareFolders = useMemo(
		() => [
			{
				id: '1',
				label: 'Shared Folders',
				level: '0',
				icon: 'Share',
				items: nestFilteredFolders(folders, '1', filterFromInput, true),
				background: folderDestination.id === '1' ? 'highlight' : undefined,
				onClick: (): void => setFolderDestination({ id: '1' })
			}
		],
		[filterFromInput, folderDestination.id, folders, nestFilteredFolders, setFolderDestination]
	);
	const nestedData = useMemo(
		() => nestFilteredFolders(folders, '1', filterFromInput, false),
		[nestFilteredFolders, folders, filterFromInput]
	);
	const requiredData = useMemo(() => nestedData.concat(shareFolders), [nestedData, shareFolders]);
	const onConfirm = useCallback(() => {
		const previous = tempActions.slice();
		previous[activeIndex] = 'path' in folderDestination && {
			id: previous[activeIndex]?.id,
			actionFileInto: [{ folderPath: `${folderDestination.path}` }]
		};
		setTempActions(previous);
		setFolder(folderDestination);
		setOpen(false);
	}, [tempActions, activeIndex, folderDestination, setTempActions, setFolder, setOpen]);

	const disabled = useMemo(() => isEmpty(folderDestination), [folderDestination]);
	return (
		<CustomModal open={open} onClose={onClose} maxHeight="90vh" size="medium">
			<Container
				padding={{ all: 'large' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<ModalHeader title={t('label.choose_folder', 'Choose Folder')} onClose={onClose} />
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
								{t('settings.filter_folder_message', 'Select a folder to apply your filter:')}
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
						<FolderItem folders={requiredData} />
					</Container>
					<ModalFooter
						onConfirm={onConfirm}
						secondaryAction={onClose}
						label={t('settings.choose', 'Choose')}
						secondaryLabel={t('label.new_folder', 'New Folder')}
						disabled={disabled}
						secondaryBtnType="outlined"
						secondaryColor="primary"
					/>
				</Container>
			</Container>
		</CustomModal>
	);
};
