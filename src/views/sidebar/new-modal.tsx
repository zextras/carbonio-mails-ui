/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, {
	ChangeEvent,
	FC,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import {
	Container,
	Input,
	Text,
	Padding,
	Accordion,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';

import { filter, includes, startsWith } from 'lodash';
import { nanoid } from '@reduxjs/toolkit';
import {
	AccordionFolder,
	FOLDERS,
	useFoldersAccordionByView,
	useUserAccount
} from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import ModalFooter from './commons/modal-footer';
import { ModalHeader } from './commons/modal-header';
import { createFolder } from '../../store/actions/create-folder';
import { FOLDER_VIEW } from '../../constants';
import ModalAccordionCustomComponent from './parts/edit/modal-accordion-custom-component';
import { ModalProps } from '../../types';
import { getFolderTranslatedName, translatedSystemFolders } from './utils';

const ContainerEl = styled(Container)`
	overflow-y: auto;
	display: block;
`;

export const NewModal: FC<ModalProps> = ({ folder, onClose }) => {
	const [t] = useTranslation();
	const dispatch = useDispatch();
	// eslint-disable-next-line @typescript-eslint/ban-types
	const createSnackbar = useContext(SnackbarManagerContext) as Function;
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const folders = useFoldersAccordionByView(FOLDER_VIEW.message, null);
	const [inputValue, setInputValue] = useState('');
	const [searchString, setSearchString] = useState('');
	const [folderDestination, setFolderDestination] = useState<AccordionFolder | undefined>(folder);
	const [disabled, setDisabled] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [label, setLabel] = useState<string>(
		t('folder_panel.modal.new.input.name', 'Enter Folder Name')
	);
	const { folderId } = useParams<{ folderId: string }>();
	const accountName = useUserAccount().name;
	const accordionRef = useRef<HTMLDivElement>(null);
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

	const showWarning = useMemo(() => includes(translatedSystemFolders(), inputValue), [inputValue]);

	const flattenFolders = useCallback(
		(arr: Array<AccordionFolder>): Array<AccordionFolder> => {
			const result: Array<AccordionFolder> = [];
			arr.forEach((item) => {
				const { items } = item;
				if (
					item.folder.id !== FOLDERS.TRASH &&
					item.folder.id !== FOLDERS.SPAM &&
					!startsWith(item.folder.absFolderPath, '/Trash')
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
							typeof folderDestination !== 'undefined' && folderDestination.id === item.folder.id
								? 'highlight'
								: undefined,
						label:
							item.folder.id === FOLDERS.USER_ROOT
								? accountName
								: getFolderTranslatedName({
										folderId: item.folder.id,
										folderName: item.folder.name
								  }),
						activeId: item.folder.id === folderId,
						accordionWidth,
						items: []
					});
				if (items) result.push(...flattenFolders(items));
			});
			return result;
		},
		[folderDestination, accountName, folderId, accordionWidth]
	);

	const getFolderRootName = useCallback((_folder: AccordionFolder): string => {
		let result = _folder.folder;
		while (result.parent?.parent) {
			result = result.parent;
		}
		return result.owner || result.parent?.name || result.name;
	}, []);

	const filteredFolders = useMemo(
		() => folders.filter((item) => item.label === getFolderRootName(folder)),
		[folders, getFolderRootName, folder]
	);

	const flattenedFolders = useMemo(
		() => flattenFolders(filteredFolders),
		[filteredFolders, flattenFolders]
	);

	useEffect(() => {
		if (!folderDestination || !inputValue.length || showWarning) {
			setDisabled(true);
			return;
		}
		const value = !!filter(folderDestination.folder.children, (item) => item.name === inputValue)
			.length;
		if (value) {
			setLabel(t('folder_panel.modal.new.input.name_exist', 'Name already exists in this path'));
		} else {
			setLabel(t('folder_panel.modal.new.input.name', 'Enter Folder Name'));
		}
		setHasError(value);
		setDisabled(value);
	}, [folderDestination, inputValue, showWarning, t]);

	const filteredFromUserInput = useMemo(
		() =>
			filter(flattenedFolders, (item) => {
				const folderName = item.label.toLowerCase();
				return startsWith(folderName, searchString.toLowerCase());
			}),
		[flattenedFolders, searchString]
	);

	const onConfirm = useCallback(() => {
		dispatch(createFolder({ parentFolder: folderDestination, name: inputValue, id: nanoid() }))
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			.then((res: unknown & { type: string }) => {
				if (res.type.includes('fulfilled')) {
					createSnackbar({
						key: `edit`,
						replace: true,
						type: 'success',
						label: t('messages.snackbar.folder_created', 'New folder created'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				} else {
					createSnackbar({
						key: `edit`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		setSearchString('');
		setInputValue('');
		setLabel(t('folder_panel.modal.new.input.name', 'Enter Folder Name'));
		setFolderDestination(undefined);
		setHasError(false);
		onClose();
	}, [dispatch, folderDestination, inputValue, t, onClose, createSnackbar]);

	return folder ? (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
			<ModalHeader
				title={t('folder_panel.modal.new.title', 'Create a new folder')}
				onClose={onClose}
			/>
			<Container mainAlignment="center" crossAlignment="flex-start" height="fit">
				<Input
					label={label}
					backgroundColor="gray5"
					hasError={hasError}
					defaultValue={inputValue}
					onChange={(e: ChangeEvent<HTMLInputElement>): void => setInputValue(e.target.value)}
				/>
				{showWarning && (
					<Padding all="small">
						<Text size="small" color="error">
							{`${t(
								'folder.modal.edit.rename_warning',
								'You cannot rename a folder as a system one.'
							)}`}
						</Text>
					</Padding>
				)}
				<Input
					label={t('label.filter_folders', 'Filter folders')}
					backgroundColor="gray5"
					value={searchString}
					onChange={(e: ChangeEvent<HTMLInputElement>): void => setSearchString(e.target.value)}
				/>
				<ContainerEl
					orientation="vertical"
					mainAlignment="flex-start"
					minHeight="30vh"
					maxHeight="60vh"
				>
					<Accordion
						ref={accordionRef}
						background="gray6"
						items={filteredFromUserInput as any[]}
						style={{ overflowY: 'hidden' }}
					/>
				</ContainerEl>
				<ModalFooter
					onConfirm={onConfirm}
					secondaryAction={onClose}
					label={t('label.create_and_move', 'Create and move')}
					disabled={disabled}
				/>
			</Container>
		</Container>
	) : (
		<></>
	);
};
