/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Accordion, Button, Container, Input, Padding } from '@zextras/carbonio-design-system';
import {
	FOLDERS,
	Folder,
	getFolder,
	t,
	useFoldersByView,
	useUserAccount
} from '@zextras/carbonio-shell-ui';
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
import ModalAccordionCustomComponent from '../parts/edit/modal-accordion-custom-component';
import { FOLDER_VIEW } from '../../../carbonio-ui-commons/constants';
import { getFolderTranslatedName } from '../utils';
import { getRootAccountName } from '../../../helpers/folders';

const ContainerEl = styled(Container)`
	overflow-y: auto;
	display: block;
`;

type FolderSelectorProps = {
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
	const folders = useFoldersByView(FOLDER_VIEW.message);
	const folder = getFolder(folderId);

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

	const rootName = useMemo(() => getRootAccountName(folder), [folder]);

	const filteredFolders = folders.filter((item) =>
		rootName ? item.name === rootName : item.id === FOLDERS.USER_ROOT
	);

	const flattenFolders = useCallback(
		(arr: Array<Folder>): Array<Folder> => {
			const result: Array<Folder> = [];
			arr.forEach((item) => {
				const { children } = item;
				if (
					item.id !== FOLDERS.TRASH &&
					item.id !== FOLDERS.SPAM &&
					!startsWith(item.absFolderPath, '/Trash')
				)
					result.push({
						...item,
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						CustomComponent: ModalAccordionCustomComponent,
						onClick: () => {
							setFolderDestination(item);
						},
						background:
							typeof folderDestination !== 'undefined' && folderDestination.id === item.id
								? 'highlight'
								: undefined,
						label:
							item.id === FOLDERS.USER_ROOT
								? accountName
								: getFolderTranslatedName({
										folderId: item.id,
										folderName: item.name
								  }),
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
		() => flattenFolders(filteredFolders),
		[filteredFolders, flattenFolders]
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
					items={filteredFromUserInput as any[]}
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
