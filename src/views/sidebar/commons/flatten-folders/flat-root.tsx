/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useState, useCallback, ReactElement } from 'react';

import {
	Text,
	Container,
	Padding,
	Avatar,
	Tooltip,
	IconButton,
	Collapse,
	List,
	Row,
	ListItem
} from '@zextras/carbonio-design-system';
import { useUserAccount } from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';

import { FlatFolder, type FlaFolderProps } from './flat-folder';
import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { Folder } from '../../../../types';

type FlatRootProps = FlaFolderProps & {
	childrenFolders: Array<Folder>;
	isOpen?: boolean;
	onOpenStatusChange?: (isOpen: boolean) => void;
	selectedFolderId?: string;
	allowRootSelection?: boolean;
};

const FOLDER_ROW_HEIGHT = '2.6rem';

const CustomListItem = styled(ListItem).attrs({
	background: 'gray6',
	activeBackground: 'highlight',
	selectedBackground: 'gray5'
})``;

const CustomContainer = styled(Container)<{ $active?: boolean }>`
	&:hover {
		background-color: ${({ theme, $active }): string =>
			$active ? theme.palette.highlight.active : theme.palette.gray6.hover};
	}
`;

export const FlatRoot = ({
	folder,
	childrenFolders,
	isOpen = false,
	onFolderSelected,
	onOpenStatusChange,
	selectedFolderId,
	allowRootSelection
}: FlatRootProps): React.JSX.Element => {
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
		<Row
			width="fill"
			style={{
				cursor: 'pointer'
			}}
			data-testid={`folder-accordion-root-${folder.id}`}
		>
			<CustomContainer
				orientation="horizontal"
				width="fill"
				height="fit"
				mainAlignment="space-between"
				padding={'small'}
				onClick={onClick}
				background={selectedFolderId === folder.id ? 'highlight.active' : 'gray6'}
				$active={selectedFolderId === folder.id}
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
				<List>
					{childrenFolders.map<ReactElement>((childFolder) => (
						<CustomListItem
							key={childFolder.id}
							selected={selectedFolderId === childFolder.id}
							active={selectedFolderId === childFolder.id}
						>
							{(visible: boolean): ReactElement =>
								visible ? (
									<FlatFolder
										data-testid={`folder-accordion-item-${childFolder.id}`}
										folder={childFolder}
										onFolderSelected={onFolderSelected}
									/>
								) : (
									<div style={{ height: `${FOLDER_ROW_HEIGHT}` }} />
								)
							}
						</CustomListItem>
					))}
				</List>
			</Collapse>
		</Row>
	);
};
