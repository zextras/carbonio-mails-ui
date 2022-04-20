/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useRef, FC } from 'react';
import { useFoldersAccordionByView } from '@zextras/carbonio-shell-ui';
import { Accordion } from '@zextras/carbonio-design-system';
import CollapsedSideBarItems from './collapsed-sidebar-items';
import { FOLDER_VIEW } from '../../constants';
import { AccordionCustomComponent } from './accordion-custom-component';

type SidebarProps = {
	expanded: boolean;
};

const Sidebar: FC<SidebarProps> = ({ expanded }) => {
	const sidebarRef = useRef(null);

	const accordions = useFoldersAccordionByView(FOLDER_VIEW.message, AccordionCustomComponent);
	console.log({ accordions });

	return (
		<>
			{expanded ? (
				<>
					<Accordion ref={sidebarRef} items={accordions} />
				</>
			) : (
				accordions[0].items.map((folder, index) => (
					<CollapsedSideBarItems key={index} folder={folder} />
				))
			)}
			{/* remove and replace with createModal */}
			{/* <NewModal
				openModal={modal === FolderActionsType.NEW}
				currentFolder={currentFolder}
				folders={accordions}
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
					accordions={accordions}
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
					folders={accordions}
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
					accordions={accordions}
					openModal={modal === FolderActionsType.EDIT}
					setModal={setModal}
					dispatch={dispatch}
					t={t}
					allFolders={accordions[0].items}
					createSnackbar={createSnackbar}
				/>
			)}
			{modal === 'share' && (
				<ModalWrapper open={modal === 'share'}>
					<ShareFolderModal
						openModal={modal === 'share'}
						folder={currentFolder}
						folders={accordions}
						setModal={setModal}
						dispatch={dispatch}
						allFolders={accordions[0].items}
						t={t}
						createSnackbar={createSnackbar}
					/>
				</ModalWrapper> }
			)} */}
		</>
	);
};

export default Sidebar;
