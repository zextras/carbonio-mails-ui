/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useState } from 'react';
import { Container, CustomModal } from '@zextras/zapp-ui';
import EditDefaultModal from './parts/edit/edit-default-modal';
import ShareFolderModal from './share-folder-modal';
import ShareRevokeModal from './parts/edit/share-revoke-modal';
import { Context } from './parts/edit/edit-context';

export const EditModal = ({
	currentFolder,
	openModal,
	setModal,
	dispatch,
	t,
	createSnackbar,
	allFolders
}) => {
	const [activeModal, setActiveModal] = useState('default');
	const [activeGrant, setActiveGrant] = useState({});
	const onClose = useCallback(() => {
		setModal('');
	}, [setModal]);

	const goBack = useCallback(() => {
		setActiveModal('default');
	}, [setActiveModal]);
	return (
		<CustomModal open={openModal} onClose={onClose} maxHeight="90vh" size="medium">
			<Context.Provider
				value={{ activeModal, setActiveModal, activeGrant, setActiveGrant, onClose }}
			>
				<Container
					padding={{ all: 'medium' }}
					mainAlignment="center"
					crossAlignment="flex-start"
					height="fit"
				>
					{activeModal === 'default' && (
						<EditDefaultModal
							t={t}
							currentFolder={currentFolder}
							openModal={openModal}
							setModal={setModal}
							dispatch={dispatch}
							createSnackbar={createSnackbar}
							allFolders={allFolders}
							onClose={onClose}
							setActiveModal={setActiveModal}
							setActiveGrant={setActiveGrant}
						/>
					)}

					{activeModal === 'edit' && (
						<ShareFolderModal
							openModal
							title="edit"
							activeGrant={activeGrant}
							goBack={goBack}
							folder={currentFolder}
							folders={allFolders}
							setModal={setModal}
							dispatch={dispatch}
							allFolders={allFolders}
							t={t}
							editMode
							setActiveModal={setActiveModal}
							createSnackbar={createSnackbar}
						/>
					)}

					{activeModal === 'revoke' && (
						<ShareRevokeModal
							folder={currentFolder}
							goBack={goBack}
							onClose={() => setModal('')}
							grant={activeGrant || currentFolder?.acl?.grant[0]}
							createSnackbar={createSnackbar}
						/>
					)}
					{activeModal === 'share' && (
						<ShareFolderModal
							openModal
							title="edit"
							activeGrant={activeGrant}
							goBack={goBack}
							folder={currentFolder}
							folders={allFolders}
							setModal={setModal}
							dispatch={dispatch}
							allFolders={allFolders}
							t={t}
							setActiveModal={setActiveModal}
							createSnackbar={createSnackbar}
						/>
					)}
				</Container>
			</Context.Provider>
		</CustomModal>
	);
};
