/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useState, useMemo, useContext, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { filter, map, remove, sortBy, reduce, uniqWith, isEqual } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import {
	SnackbarManagerContext,
	Accordion,
	ModalManagerContext,
	Container,
	Button,
	Row,
	Icon,
	AccordionItem,
	Padding,
	Dropdown
} from '@zextras/carbonio-design-system';
import CollapsedSideBarItems from './collapsed-sidebar-items';
import { FolderActionsType } from '../../types/folder';
import { selectFolders } from '../../store/folders-slice';
import { NewModal } from './new-modal';
import { DeleteModal } from './delete-modal';
import { EditModal } from './edit-modal';
import { MoveModal } from './move-modal';
import { EmptyModal } from './empty-modal';
import { getShareInfo } from '../../store/actions/get-share-info';
import { SharesModal } from './shares-modal';
import ShareFolderModal from './share-folder-modal';
import ModalWrapper from './commons/modal-wrapper';
import setAccordionCustomComponent from './accordion-custom-components';
import useGetTagsAccordion from '../../hooks/use-get-tags-accordions';
import { createTag } from '../../ui-actions/tag-actions';

const nest = (items, id, newFolder, setNewFolder, expanded, level) =>
	map(
		filter(items, (item) => item.parent === id),
		(item) => {
			const open = newFolder ? newFolder.id === item.id || newFolder.absParent === item.id : false;
			return {
				...item,
				items: nest(items, item.id, newFolder, setNewFolder, expanded, level + 1),
				to: `/folder/${item.id}`,
				open,
				divider: false
			};
		}
	);

const SharesItem = ({ item }) => (
	<Container
		width="fill"
		mainAlignment="center"
		orientation="horizontal"
		style={{ padding: '8px 16px' }}
		data-testid="find-shares-button"
	>
		<Button
			type="outlined"
			label={item.label}
			color="primary"
			size="fill"
			onClick={(ev) => {
				ev.stopPropagation();
				item?.context?.dispatch(getShareInfo()).then((res) => {
					if (res.type.includes('fulfilled')) {
						const folders = uniqWith(
							filter(res?.payload?.share ?? [], ['view', 'message']),
							isEqual
						);
						const closeModal = item.context.createModal(
							{
								children: <SharesModal folders={folders} onClose={() => closeModal()} />
							},
							true
						);
					}
				});
			}}
		/>
	</Container>
);

const Sidebar = ({ expanded }) => {
	const dispatch = useDispatch();
	const allFoldersWithJunk = useSelector(selectFolders);

	const allFolders = useMemo(() => {
		const folders = map(allFoldersWithJunk, (folder) => {
			if (folder.id === FOLDERS.SPAM) {
				return { ...folder, name: 'Spam' };
			}
			return folder;
		});
		return folders;
	}, [allFoldersWithJunk]);

	const createSnackbar = useContext(SnackbarManagerContext);
	const createModal = useContext(ModalManagerContext);
	const sidebarRef = useRef(null);
	const history = useHistory();

	const folders = useMemo(
		() =>
			reduce(
				allFolders,
				(a, c) => {
					a.push({
						...c,
						id: c.id,
						color: c.color,
						parent: c.parent,
						label: c.name,
						items: [],
						badgeCounter:
							// eslint-disable-next-line no-nested-ternary
							c.id === FOLDERS.DRAFTS
								? c.itemsCount > 0
									? c.itemsCount
									: undefined
								: c.unreadCount > 0
								? c.unreadCount
								: undefined,
						badgeType: c.id === FOLDERS.DRAFTS ? 'read' : 'unread',
						to: `/folder/${c.id}`
					});
					return a;
				},
				[]
			),
		[allFolders]
	);

	const [modal, setModal] = useState('');
	const [currentFolder, setCurrentFolder] = useState('2');
	const [newFolder, setNewFolder] = useState();
	const [t] = useTranslation();

	const tagsAccordionItems = useGetTagsAccordion();
	const [sidebarAccordions, modalAccordions] = useMemo(() => {
		const nestedFolders = nest(folders, '1', newFolder, setNewFolder, expanded, 1);
		const trashFolder = remove(nestedFolders, (c) => c.id === '3');
		const accordions = sortBy(nestedFolders, (item) => Number(item.id)).concat(trashFolder);
		const accordionItems = setAccordionCustomComponent({
			accordions,
			setAction: setModal,
			setCurrentFolder,
			t,
			dispatch,
			createModal,
			nestedFolders,
			createSnackbar,
			activeFolder: history?.location?.pathname?.split?.('/')?.[3] // Sorry, it's a quick fix
		});

		const sharedItems = remove(accordionItems, 'owner');

		const ShareLabel = (item) => (
			<Row
				mainAlignment="flex-start"
				padding={{ horizontal: 'large' }}
				takeAvailableSpace
				data-testid="share-label"
			>
				<Icon size="large" icon="ShareOutline" /> <Padding right="large" />
				<AccordionItem {...item} height={40} />
			</Row>
		);

		const TagLabel = (item) => (
			<Dropdown contextMenu display="block" width="fit" items={[createTag({ t, createModal })]}>
				<Row mainAlignment="flex-start" padding={{ horizontal: 'large' }} takeAvailableSpace>
					<Icon size="large" icon="TagsMoreOutline" /> <Padding right="large" />
					<AccordionItem {...item} height={40} />
				</Row>
			</Dropdown>
		);

		const requiredAccordions = accordionItems
			.concat({
				id: 'Tags',
				label: t('label.tags', 'Tags'),
				divider: true,
				open: false,
				onClick: (e) => e.stopPropagation(),
				CustomComponent: TagLabel,
				items: tagsAccordionItems
			})
			.concat({
				id: 'shares',
				label: t('label.shared_folders', 'Shared Folders'),
				divider: true,
				open: false,
				onClick: (e) => e.stopPropagation(),
				CustomComponent: ShareLabel,
				items: sharedItems.concat({
					label: t('label.find_shares', 'Find shares'),
					context: { dispatch, t, createModal },
					CustomComponent: SharesItem
				})
			});

		return [requiredAccordions, accordions];
	}, [
		folders,
		newFolder,
		expanded,
		t,
		dispatch,
		createModal,
		createSnackbar,
		history?.location?.pathname,
		tagsAccordionItems
	]);

	const modalFolders = useMemo(() => sortBy(folders, (item) => Number(item.id)), [folders]);
	const activeFolder = useMemo(
		() => filter(modalFolders, { id: currentFolder.id })[0],
		[modalFolders, currentFolder]
	);

	return currentFolder ? (
		<>
			{expanded ? (
				<Accordion ref={sidebarRef} items={sidebarAccordions} />
			) : (
				sidebarAccordions.map((folder, index) =>
					folder.id !== 'shares' ? <CollapsedSideBarItems key={index} folder={folder} /> : null
				)
			)}

			<NewModal
				openModal={modal === FolderActionsType.NEW}
				currentFolder={currentFolder}
				folders={modalFolders}
				setModal={setModal}
				dispatch={dispatch}
				setNew={setNewFolder}
				t={t}
				createSnackbar={createSnackbar}
			/>

			{modal === FolderActionsType.EMPTY && (
				<EmptyModal
					currentFolder={currentFolder}
					openModal={modal === FolderActionsType.EMPTY}
					setModal={setModal}
					dispatch={dispatch}
					t={t}
					createSnackbar={createSnackbar}
				/>
			)}
			{modal === FolderActionsType.DELETE && (
				<DeleteModal
					currentFolder={currentFolder}
					accordions={modalAccordions}
					openModal={modal === FolderActionsType.DELETE}
					setModal={setModal}
					dispatch={dispatch}
					t={t}
					createSnackbar={createSnackbar}
				/>
			)}

			{modal === FolderActionsType.MOVE && (
				<MoveModal
					currentFolder={currentFolder}
					folders={modalFolders}
					openModal={modal === FolderActionsType.MOVE}
					setModal={setModal}
					dispatch={dispatch}
					t={t}
					createSnackbar={createSnackbar}
				/>
			)}

			{modal === FolderActionsType.EDIT && (
				<EditModal
					currentFolder={activeFolder}
					accordions={modalAccordions}
					openModal={modal === FolderActionsType.EDIT}
					setModal={setModal}
					dispatch={dispatch}
					t={t}
					allFolders={allFolders}
					createSnackbar={createSnackbar}
				/>
			)}

			{modal === 'share' && (
				<ModalWrapper open={modal === 'share'}>
					<ShareFolderModal
						openModal={modal === 'share'}
						folder={currentFolder}
						folders={modalAccordions}
						setModal={setModal}
						dispatch={dispatch}
						allFolders={allFolders}
						t={t}
						createSnackbar={createSnackbar}
					/>
				</ModalWrapper>
			)}
		</>
	) : null;
};

export default Sidebar;
