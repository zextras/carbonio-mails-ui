/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';
import { Container, CustomModal, Input, Text, Icon } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import { filter, isEmpty, reduce, startsWith } from 'lodash';
import { useSelector } from 'react-redux';
import ModalFooter from '../../../sidebar/commons/modal-footer';
import ModalHeader from '../../../sidebar/commons/modal-header';
import FolderItem from '../../../sidebar/commons/folder-item';
import { selectFolders } from '../../../../store/folders-slice';
import { getFolderIconColor, getFolderIconName } from '../../../sidebar/utils';
import { FolderType } from '../../../../types/folder';

type ComponentProps = {
	compProps: {
		open: boolean;
		setOpen: (arg: any) => void;
		onClose: () => void;
		t: TFunction;
		activeIndex: number;
		tempActions: any;
		setTempActions: (arg: any) => void;
		folderDestination: FolderType;
		setFolderDestination: (arg: any) => void;
		folder: FolderType;
		setFolder: (arg: any) => void;
	};
};

const FolderSelectModal: FC<ComponentProps> = ({ compProps }): ReactElement => {
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
	const folders = useSelector(selectFolders);
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
		(items: Array<FolderType>, id: string, results: Array<FolderType>, getSharedFolder: boolean) =>
			reduce(
				filter(items, (item) =>
					getSharedFolder
						? item.parent === id && item.isSharedFolder
						: item.parent === id && item.id !== '4' && item.id !== '3' && !item.isSharedFolder
				),
				(acc: Array<FolderType>, item: any) => {
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
		previous[activeIndex] = {
			id: previous[activeIndex]?.id,
			actionFileInto: [{ folderPath: `${folderDestination.name}` }]
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

export default FolderSelectModal;
