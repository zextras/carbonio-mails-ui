/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, SnackbarManagerContext } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useContext, useState } from 'react';
import { ModalProps } from '../../types';
import { Context } from './parts/edit/edit-context';
import EditDefaultModal from './parts/edit/edit-default-modal';
import ShareRevokeModal from './parts/edit/share-revoke-modal';
import ShareFolderModal from './share-folder-modal';

export const EditModal: FC<ModalProps> = ({ folder, onClose }) => {
	// eslint-disable-next-line @typescript-eslint/ban-types
	const createSnackbar = useContext(SnackbarManagerContext) as Function;
	const [activeModal, setActiveModal] = useState('default');
	const [activeGrant, setActiveGrant] = useState({});
	const goBack = useCallback(() => {
		setActiveModal('default');
	}, [setActiveModal]);
	return (
		<Context.Provider value={{ activeModal, setActiveModal, activeGrant, setActiveGrant, onClose }}>
			<Container
				padding={{ all: 'medium' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				{activeModal === 'default' && (
					<EditDefaultModal folder={folder} onClose={onClose} setActiveModal={setActiveModal} />
				)}

				{activeModal === 'edit' && (
					<ShareFolderModal
						folder={folder}
						activeGrant={activeGrant}
						goBack={goBack}
						onClose={onClose}
						editMode
					/>
				)}

				{activeModal === 'revoke' && (
					<ShareRevokeModal
						folder={folder}
						goBack={goBack}
						grant={activeGrant || folder?.acl?.grant[0]}
						createSnackbar={createSnackbar}
					/>
				)}
				{activeModal === 'share' && (
					<ShareFolderModal
						folder={folder}
						activeGrant={activeGrant}
						onClose={onClose}
						goBack={goBack}
					/>
				)}
			</Container>
		</Context.Provider>
	);
};
