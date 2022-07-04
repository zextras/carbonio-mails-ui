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
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import {
	Input,
	Text,
	Container,
	Accordion,
	Padding,
	Button,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import { cloneDeep, filter, startsWith } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import {
	AccordionFolder,
	Folder,
	FOLDERS,
	useFoldersAccordionByView,
	useUserAccount
} from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { folderAction } from '../../store/actions/folder-action';
import ModalFooter from './commons/modal-footer';
import { ModalHeader } from './commons/modal-header';
import { FOLDER_VIEW } from '../../constants';
import ModalAccordionCustomComponent from './parts/edit/modal-accordion-custom-component';
import { ModalProps } from '../../types/commons';
import { getFolderTranslatedName } from './utils';

const ContainerEl = styled(Container)`
	overflow-y: auto;
	display: block;
`;

export const MoveModal: FC<ModalProps> = ({ folder, onClose }) => {
	const [t] = useTranslation();
	const dispatch = useDispatch();
	// eslint-disable-next-line @typescript-eslint/ban-types
	const createSnackbar = useContext(SnackbarManagerContext) as Function;
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const folders = useFoldersAccordionByView(FOLDER_VIEW.message, null);
	const [searchString, setSearchString] = useState('');
	const [folderDestination, setFolderDestination] = useState<Folder | undefined>(folder.folder);
	const { folderId } = useParams<{ folderId: string }>();
	const accountName = useUserAccount().name;
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
							setFolderDestination(item.folder);
						},
						background:
							typeof folderDestination !== 'undefined' && folderDestination.id === item.folder.id
								? 'highlight'
								: undefined,
						label:
							item.folder.id === FOLDERS.USER_ROOT
								? accountName
								: getFolderTranslatedName({
										t,
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
		[folderDestination, accountName, t, folderId, accordionWidth]
	);
	const getFolderRootName = (_folder: AccordionFolder): string => {
		let result = cloneDeep(_folder.folder);
		while (result.parent?.parent) {
			result = result.parent;
		}
		return result.owner || result.parent?.name || result.name;
	};

	const filteredFolders = folders.filter((item) => item.label === getFolderRootName(folder));

	const flattenedFolders = useMemo(
		() => flattenFolders(filteredFolders),
		[filteredFolders, flattenFolders]
	);

	const filteredFromUserInput = useMemo(
		() =>
			filter(flattenedFolders, (item) => {
				const folderName = item.label.toLowerCase();
				return startsWith(folderName, searchString.toLowerCase());
			}),
		[flattenedFolders, searchString]
	);

	const onConfirm = useCallback(() => {
		const restoreFolder = (): void =>
			dispatch(folderAction({ folder: folder.folder, l: folder.folder.l, op: 'move' }))
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				.then((res) => {
					if (res.type.includes('fulfilled')) {
						createSnackbar({
							key: `move-folder`,
							replace: true,
							type: 'success',
							label: t('messages.snackbar.folder_restored', 'Folder restored'),
							autoHideTimeout: 3000,
							hideButton: true
						});
					} else {
						createSnackbar({
							key: `move`,
							replace: true,
							type: 'error',
							label: t('label.error_try_again', 'Something went wrong, please try again'),
							autoHideTimeout: 3000,
							hideButton: true
						});
					}
				});

		if (
			folderDestination?.id !== folder.folder?.l &&
			!startsWith(folderDestination?.absFolderPath, folder.folder?.absFolderPath)
		) {
			// if (folderDestination?.id !== folder.id && folderDestination?.l !== folder.folder?.l) {
			dispatch(
				folderAction({
					folder: folder.folder,
					l: folderDestination?.id || FOLDERS.USER_ROOT,
					op: 'move'
				})
			)
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				.then((res) => {
					if (res.type.includes('fulfilled')) {
						createSnackbar({
							key: `move`,
							replace: true,
							type: 'success',
							label: t('messages.snackbar.folder_moved', 'Folder successfully moved'),
							autoHideTimeout: 5000,
							hideButton: false,
							actionLabel: 'Undo',
							onActionClick: () => restoreFolder()
						});
					} else {
						createSnackbar({
							key: `move`,
							replace: true,
							type: 'error',
							label: t('label.error_try_again', 'Something went wrong, please try again.'),
							autoHideTimeout: 3000
						});
					}
				});
		}

		setFolderDestination(undefined);
		setSearchString('');
		onClose();
	}, [folderDestination, folder, onClose, dispatch, createSnackbar, t]);

	return folder ? (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
			<ModalHeader onClose={onClose} title={`${t('label.move', 'Move')} ${folder.folder?.name}`} />
			<Container
				padding={{ all: 'small' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<Container padding={{ all: 'small' }} mainAlignment="center" crossAlignment="flex-start">
					<Text overflow="break-word">
						{t(
							'folder_panel.modal.move.body.message1',
							'Select a folder to move the considered one to:'
						)}
					</Text>
				</Container>
				<Input
					inputName={folder.folder?.name}
					label={t('label.filter_folders', 'Filter folders')}
					backgroundColor="gray5"
					value={searchString}
					onChange={(e: ChangeEvent<HTMLInputElement>): void => setSearchString(e.target.value)}
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

				<Container
					padding={{ top: 'medium', bottom: 'medium' }}
					mainAlignment="center"
					crossAlignment="flex-start"
				>
					<Button type="ghost" label={t('label.new_folder', 'New Folder')} color="primary" />
				</Container>
				<ModalFooter
					onConfirm={onConfirm}
					secondaryAction={onClose}
					label={t('label.move', 'Move')}
					secondaryLabel={t('label.cancel', 'Cancel')}
					disabled={typeof folderDestination === 'undefined'}
				/>
			</Container>
		</Container>
	) : (
		<></>
	);
};
