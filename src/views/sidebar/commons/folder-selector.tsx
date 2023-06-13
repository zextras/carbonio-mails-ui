/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Accordion,
	AccordionItemType,
	Button,
	Container,
	Input,
	Padding
} from '@zextras/carbonio-design-system';
import { FOLDERS, t, useUserAccount } from '@zextras/carbonio-shell-ui';
import { filter, startsWith } from 'lodash';
import React, { ChangeEvent, ReactElement, useState } from 'react';
import styled from 'styled-components';
import { getFolder } from '../../../carbonio-ui-commons/store/zustand/folder/hooks';
import type { Folder } from '../../../carbonio-ui-commons/types/folder';
import { isRoot, isSpam, isTrash, isTrashed } from '../../../helpers/folders';
import { useFolders } from '../../../hooks/use-folders';
import ModalAccordionCustomComponent from '../parts/edit/modal-accordion-custom-component';
import { getSystemFolderTranslatedName } from '../utils';

const ContainerEl = styled(Container)`
	overflow-y: auto;
	display: block;
`;

export type FolderSelectorProps = {
	inputLabel?: string;
	onNewFolderClick?: () => void;
	preselectedFolderId?: string;
	folderDestination: Folder | undefined;
	setFolderDestination: (arg: Folder) => void;
};

type FlattenFoldersProps = {
	arr: Array<Folder> | undefined;
	accountName: string;
	preselectedFolderId?: string;
	folderDestination: Folder | undefined;
	setFolderDestination: (arg: Folder) => void;
};

export type FlattenedFoldersType = AccordionItemType & {
	label: string;
	items: Array<FlattenedFoldersType>;
	absFolderPath: string;
};

function flattenFolders({
	arr,
	accountName,
	preselectedFolderId,
	folderDestination,
	setFolderDestination
}: FlattenFoldersProps): Array<AccordionItemType> {
	if (!arr) return [];
	const result: Array<AccordionItemType> = [];
	arr.forEach((item) => {
		if (isTrash(item.id) || isSpam(item.id) || isTrashed({ folder: item })) {
			return;
		}

		const { children } = item;
		result.push({
			...item,
			label:
				item.id === FOLDERS.USER_ROOT
					? accountName
					: getSystemFolderTranslatedName({ folderName: item.name }),
			CustomComponent: ModalAccordionCustomComponent,
			onClick: () => setFolderDestination(item),
			id: item.id,
			background: folderDestination && folderDestination.id === item.id ? 'highlight' : undefined,
			active: item.id === folderDestination?.id,
			items: isRoot(item.id)
				? flattenFolders({
						arr: children,
						accountName,
						preselectedFolderId,
						folderDestination,
						setFolderDestination
				  })
				: []
		});
		if (children?.length && !isRoot(item.id))
			result.push(
				...flattenFolders({
					arr: children,
					accountName,
					preselectedFolderId,
					folderDestination,
					setFolderDestination
				})
			);
	});
	return result;
}

function filterChildren(
	items: Array<AccordionItemType>,
	inputValue: string
): Array<AccordionItemType> {
	return filter(items, (item) => {
		const folderName = item.label?.toLowerCase();
		return startsWith(folderName, inputValue.toLowerCase());
	});
}

function filterByUserInput(
	flattenedFolders: Array<AccordionItemType>,
	inputValue: string
): Array<AccordionItemType> {
	return flattenedFolders.reduce((acc, item) => {
		if (isRoot(item.id)) {
			acc.push({ ...item, items: item.items ? filterChildren(item.items, inputValue) : [] });
		}
		const result = acc.filter((accItem) => !!accItem.items?.length);
		return result;
	}, [] as Array<AccordionItemType>);
}

export const FolderSelector = ({
	inputLabel,
	onNewFolderClick,
	preselectedFolderId,
	folderDestination,
	setFolderDestination
}: FolderSelectorProps): ReactElement => {
	const [inputValue, setInputValue] = useState('');
	const accountName = useUserAccount().name;
	const folder = preselectedFolderId && getFolder(preselectedFolderId);
	const folders = useFolders();

	const flattenedFolders = flattenFolders({
		arr: folders,
		accountName,
		preselectedFolderId,
		folderDestination,
		setFolderDestination
	});

	const filteredByUserInput = filterByUserInput(flattenedFolders, inputValue);

	const openIds = flattenedFolders.map((item) => item.id);
	const inputName = folder ? folder.name : '';
	return (
		<>
			<Input
				data-testid={'folder-name-filter'}
				inputName={inputName}
				label={inputLabel ?? t('label.filter_folders', 'Filter folders')}
				backgroundColor="gray5"
				value={inputValue}
				onChange={(e: ChangeEvent<HTMLInputElement>): void => setInputValue(e.target.value)}
			/>
			<Padding vertical="medium" />
			<ContainerEl
				orientation="vertical"
				mainAlignment="flex-start"
				minHeight="30vh"
				maxHeight="60vh"
			>
				<Accordion
					background="gray6"
					items={filteredByUserInput}
					style={{ overflowY: 'hidden' }}
					openIds={openIds}
				/>
			</ContainerEl>
			{onNewFolderClick && (
				<Container
					padding={{ top: 'medium', bottom: 'medium' }}
					mainAlignment="center"
					crossAlignment="flex-start"
				>
					<Button
						type="ghost"
						label={t('label.new_folder', 'New Folder')}
						color="primary"
						onClick={onNewFolderClick}
					/>
				</Container>
			)}
		</>
	);
};
