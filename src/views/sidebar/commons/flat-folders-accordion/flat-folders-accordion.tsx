/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useCallback, useState } from 'react';

import {
	Avatar,
	Collapse,
	Container,
	ContainerProps,
	getColor,
	Icon,
	IconButton,
	ListItem,
	ListV2,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { FOLDERS, useUserAccount } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';
import styled from 'styled-components';

import { StaticBreadcrumbs } from '../../../../carbonio-ui-commons/components/breadcrumbs/static-breadcrumbs';
import { Folder } from '../../../../carbonio-ui-commons/types/folder';
import { isRoot } from '../../../../helpers/folders';
import { getFolderIconColor, getFolderIconName, getSystemFolderTranslatedName } from '../../utils';

const FOLDER_ROW_HEIGHT = '2.6rem';

const FolderAccordionPlaceholder = styled.div`
	height: ${FOLDER_ROW_HEIGHT};
`;

const RootAccordion = styled(Row)`
	cursor: pointer;
`;

const CustomContainer = styled(Container)<ContainerProps & { active?: boolean }>`
	&:hover {
		background-color: ${({ theme, active }): string =>
			active ? theme.palette.highlight.active : theme.palette.gray6.hover};
	}
`;

const CustomListItemHelper = styled(ListItem)``;

export const CustomListItem = styled(CustomListItemHelper).attrs(
	({
		background = 'gray6',
		active,
		activeBackground = 'highlight',
		selected,
		selectedBackground = 'gray5',
		theme
	}) => ({
		$baseBackgroundColor: getColor(
			(active && activeBackground) || (selected && selectedBackground) || background,
			theme
		),
		$focusBackgroundColor: getColor(`${(active && activeBackground) || 'gray6'}.focus`, theme)
	})
)``;

type FlatFoldersAccordionFolderProps = {
	folder: Folder;
	selected?: boolean;
	onFolderSelected?: (arg: Folder) => void;
};

export type FlatFoldersAccordionRootProps = FlatFoldersAccordionFolderProps & {
	childrenFolders: Array<Folder>;
	isOpen?: boolean;
	onOpenStatusChange?: (isOpen: boolean) => void;
	selectedFolderId?: string;
	allowRootSelection?: boolean;
};

export type FlatFoldersAccordionProps = {
	roots: Array<Folder>;
	selectedFolderId?: string;
	onFolderSelected?: (folder: Folder) => void;
	allowRootSelection?: boolean;
};

/**
 * Process the absolute path of the given folder, removing
 * the leading slash
 *
 * @param folder
 * @return the array of the crumbs name of the path
 */
export const getFolderAbsPathParts = (folder: Folder): Array<string> => {
	if (!folder) {
		return [];
	}

	// Exception for root folders
	if (isRoot(folder?.id)) {
		return [folder.name ?? ''];
	}
	const reg = /^\/?(.*)$/gm;

	const matches = reg.exec(folder.absFolderPath ?? '');
	if (!matches) {
		return [];
	}

	return matches[1].split('/');
};

const FlatFoldersAccordionFolder: FC<FlatFoldersAccordionFolderProps> = ({
	folder,
	onFolderSelected,
	...rest
}) => {
	const iconName = getFolderIconName(folder);
	const iconColor = getFolderIconColor(folder);
	const parts = getFolderAbsPathParts(folder);

	/*
	 * Create the crumbs array and try to get the translations
	 * for the first part which usually represent a system folder
	 * for which a translated name is available
	 */
	const crumbs = parts.map((part, index) => ({
		id: `${index} `,
		label: index === 0 ? getSystemFolderTranslatedName({ folderName: part }) : part
	}));

	const selectionHandler = useCallback(() => {
		onFolderSelected ? onFolderSelected(folder) : noop;
	}, [onFolderSelected, folder]);

	return (
		<Container
			width="fill"
			main-alignment="flex-start"
			orientation="vertical"
			crossAlignment="flex-start"
			padding={{ top: 'small', right: 'small', bottom: 'small', left: 'extralarge' }}
			height={FOLDER_ROW_HEIGHT}
			onClick={selectionHandler}
			wrap="nowrap"
			{...rest}
		>
			<Row mainAlignment="flex-start" wrap="nowrap" width="fill">
				<Container width="fit">
					<Icon color={iconColor} icon={iconName || 'FolderOutline'} size="large" />
				</Container>
				<StaticBreadcrumbs crumbs={crumbs} size="large" />
			</Row>
		</Container>
	);
};

const FlatFoldersAccordionRoot: FC<FlatFoldersAccordionRootProps> = ({
	folder,
	childrenFolders,
	isOpen = false,
	onFolderSelected,
	onOpenStatusChange,
	selectedFolderId,
	allowRootSelection
}) => {
	const [open, setOpen] = useState(isOpen);
	const account = useUserAccount();

	const rootLabel = folder.id === FOLDERS.USER_ROOT ? account.name : folder.name;
	const toggleOpen = useCallback(
		(e: KeyboardEvent | React.SyntheticEvent) => {
			e.stopPropagation();
			setOpen((op) => {
				onOpenStatusChange && onOpenStatusChange(!op);
				return !op;
			});
		},
		[onOpenStatusChange]
	);

	const onClick = useCallback(
		(e: KeyboardEvent | React.SyntheticEvent) => {
			e.stopPropagation();
			if (!open) {
				setOpen(true);
			}

			if (!allowRootSelection) {
				return;
			}

			onFolderSelected && onFolderSelected(folder);
		},
		[open, allowRootSelection, onFolderSelected, folder]
	);
	return (
		<RootAccordion width="fill" data-testid={`folder-accordion-root-${folder.id}`}>
			<CustomContainer
				orientation="horizontal"
				width="fill"
				height="fit"
				mainAlignment="space-between"
				padding={'small'}
				onClick={onClick}
				background={selectedFolderId === folder.id ? 'highlight.active' : 'gray6'}
				active={selectedFolderId === folder.id}
			>
				<Container orientation="horizontal" width="fill" mainAlignment="flex-start">
					<Padding horizontal="small">
						<Avatar label={rootLabel} size="medium" />
					</Padding>
					<Tooltip label={rootLabel} placement="right" maxWidth="100%">
						<Text>{rootLabel}</Text>
					</Tooltip>
				</Container>

				<Padding right="small">
					<IconButton
						customSize={{ iconSize: 'large', paddingSize: 0 }}
						onClick={toggleOpen}
						icon={open ? 'ChevronUp' : 'ChevronDown'}
					/>
				</Padding>
			</CustomContainer>
			<Collapse crossSize="100%" orientation="vertical" open={open} disableTransition={false}>
				<ListV2>
					{childrenFolders.map<ReactElement>((childFolder) => (
						<CustomListItem
							key={childFolder.id}
							selected={selectedFolderId === childFolder.id}
							active={selectedFolderId === childFolder.id}
						>
							{(visible: boolean): ReactElement =>
								visible ? (
									<FlatFoldersAccordionFolder
										data-testid={`folder-accordion-item-${childFolder.id}`}
										folder={childFolder}
										onFolderSelected={onFolderSelected}
									/>
								) : (
									<FolderAccordionPlaceholder />
								)
							}
						</CustomListItem>
					))}
				</ListV2>
			</Collapse>
		</RootAccordion>
	);
};

export const FlatFoldersAccordion: FC<FlatFoldersAccordionProps> = ({
	roots,
	onFolderSelected,
	selectedFolderId,
	allowRootSelection
}) => (
	<Container orientation={'vertical'} style={{ overflowY: 'auto' }}>
		{roots.map<ReactElement>((root, index) => (
			<FlatFoldersAccordionRoot
				key={root.id}
				folder={root}
				childrenFolders={root.children}
				isOpen
				onFolderSelected={onFolderSelected}
				selectedFolderId={selectedFolderId}
				allowRootSelection={allowRootSelection}
			/>
		))}
	</Container>
);
