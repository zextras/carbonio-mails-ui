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
import { Folder, FOLDERS, useFoldersByView, useUserAccount } from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { folderAction } from '../../store/actions/folder-action';
import ModalFooter from './commons/modal-footer';
import { ModalHeader } from './commons/modal-header';
import { FOLDER_VIEW } from '../../constants';
import ModalAccordionCustomComponent from './parts/edit/modal-accordion-custom-component';
import { ModalProps } from '../../types';
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
	const folders = useFoldersByView(FOLDER_VIEW.message);
	const [searchString, setSearchString] = useState('');
	const [folderDestination, setFolderDestination] = useState<Folder | undefined>(folder);
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
		(arr: Array<Folder>): Array<Folder> => {
			const result: Array<Folder> = [];
			arr.forEach((item) => {
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
										t,
										folderId: item.id,
										folderName: item.name
								  }),
						activeId: item.id === folderId,
						accordionWidth,
						items: []
					});
				if (item.children) result.push(...flattenFolders(item.children));
			});
			return result;
		},
		[folderDestination, accountName, t, folderId, accordionWidth]
	);
	const getFolderRootName = (_folder: Folder): string => {
		let result = cloneDeep(_folder);
		while (result.parent?.parent) {
			result = result.parent;
		}
		return (result.isLink && result.owner) || result.parent?.name || result.name;
	};

	const filteredFolders = folders.filter((item) => item.name === getFolderRootName(folder));

	const flattenedFolders = useMemo(
		() => flattenFolders(filteredFolders),
		[filteredFolders, flattenFolders]
	);

	const filteredFromUserInput = useMemo(
		() =>
			filter(flattenedFolders, (item) => {
				const folderName = item.name.toLowerCase();
				return startsWith(folderName, searchString.toLowerCase());
			}),
		[flattenedFolders, searchString]
	);

	const onConfirm = useCallback(() => {
		const restoreFolder = (): void =>
			dispatch(folderAction({ folder, l: folder.l, op: 'move' }))
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
			folderDestination?.id !== folder.l &&
			!startsWith(folderDestination?.absFolderPath, folder.absFolderPath)
		) {
			// if (folderDestination?.id !== folder.id && folderDestination?.l !== folder.folder?.l) {
			dispatch(
				folderAction({
					folder,
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
			<ModalHeader onClose={onClose} title={`${t('label.move', 'Move')} ${folder.name}`} />
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
					inputName={folder.name}
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
