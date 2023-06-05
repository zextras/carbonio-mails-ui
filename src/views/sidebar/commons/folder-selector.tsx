/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Accordion, Button, Container, Input, Padding } from '@zextras/carbonio-design-system';
import { FOLDERS, t, useUserAccount } from '@zextras/carbonio-shell-ui';
import { filter, startsWith } from 'lodash';
import React, {
	ChangeEvent,
	ReactElement,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import styled from 'styled-components';
import { getFolder, getRoot } from '../../../carbonio-ui-commons/store/zustand/folder/hooks';
import type { Folder } from '../../../carbonio-ui-commons/types/folder';
import { isSpam, isTrash, isTrashed } from '../../../helpers/folders';
import ModalAccordionCustomComponent from '../parts/edit/modal-accordion-custom-component';
import { getFolderTranslatedName } from '../utils';

const ContainerEl = styled(Container)`
	overflow-y: auto;
	display: block;
`;

export type FolderSelectorProps = {
	inputLabel?: string;
	onNewFolderClick?: () => void;
	folderId: string;
	folderDestination: Folder | undefined;
	setFolderDestination: (arg: Folder) => void;
};

export const FolderSelector = ({
	inputLabel,
	onNewFolderClick,
	folderId,
	folderDestination,
	setFolderDestination
}: FolderSelectorProps): ReactElement => {
	const [inputValue, setInputValue] = useState('');
	const accountName = useUserAccount().name;
	const folder = getFolder(folderId);
	const accountRootFolder = getRoot(folderId);

	const accordionRef = useRef<HTMLDivElement>();
	const [accordionWidth, setAccordionWidth] = useState<number>();

	useLayoutEffect(() => {
		const calculateAvailableWidth = (): void => {
			if (accordionRef && accordionRef.current) {
				setAccordionWidth(accordionRef?.current?.clientWidth);
			}
		};
		window.addEventListener('resize', calculateAvailableWidth);
		return (): void => window.removeEventListener('resize', calculateAvailableWidth);
	}, [accordionRef]);

	const flattenFolders = useCallback(
		(arr: Array<Folder> | undefined): Array<Folder> => {
			if (!arr) return [];
			const result: Array<Folder> = [];
			arr.forEach((item) => {
				if (isTrash(item.id) || isSpam(item.id) || isTrashed({ folder: item })) {
					return;
				}

				const { children } = item;

				result.push({
					...item,
					name: item.id === FOLDERS.USER_ROOT ? accountName : item.name,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					CustomComponent: ModalAccordionCustomComponent,
					onClick: () => {
						setFolderDestination(item);
					},
					id: item.id,
					background:
						typeof folderDestination !== 'undefined' && folderDestination.id === item.id
							? 'highlight'
							: undefined,

					activeId: item.id === folderId,
					accordionWidth,
					items: []
				});
				if (children?.length) result.push(...flattenFolders(children));
			});
			return result;
		},
		[folderDestination, accountName, folderId, accordionWidth, setFolderDestination]
	);

	const flattenedFolders = useMemo(
		() => flattenFolders(accountRootFolder && [accountRootFolder]),
		[accountRootFolder, flattenFolders]
	);

	const filteredFromUserInput = useMemo(
		() =>
			filter(flattenedFolders, (item) => {
				const folderName = item.name.toLowerCase();
				return startsWith(folderName, inputValue.toLowerCase());
			}),
		[flattenedFolders, inputValue]
	);

	return folder ? (
		<>
			<Input
				data-testid={'folder-name-filter'}
				inputName={folder?.name}
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
					items={filteredFromUserInput}
					style={{ overflowY: 'hidden' }}
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
	) : (
		<></>
	);
};
