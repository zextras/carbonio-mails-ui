/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container } from '@zextras/carbonio-design-system';
import React, { FC, useCallback, useState } from 'react';
import type { ModalProps } from '../../types';
import EditPermissionsModal from './edit-permissions-modal';
import { Context } from './parts/edit/edit-context';
import MainEditModal from './parts/edit/edit-default-modal';
import ShareRevokeModal from './parts/edit/share-revoke-modal';

export const EditModal: FC<ModalProps> = ({ folder, onClose }) => {
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
					<MainEditModal folder={folder} onClose={onClose} setActiveModal={setActiveModal} />
				)}

				{activeModal === 'edit' && (
					<EditPermissionsModal
						folder={folder}
						onClose={onClose}
						goBack={goBack}
						editMode
						grant={Object.keys(activeGrant).length > 0 ? activeGrant : folder?.acl?.grant[0]}
					/>
				)}

				{activeModal === 'revoke' && (
					<ShareRevokeModal
						folder={folder}
						goBack={goBack}
						grant={Object.keys(activeGrant).length > 0 ? activeGrant : folder?.acl?.grant[0]}
					/>
				)}
				{activeModal === 'share' && <EditPermissionsModal folder={folder} onClose={onClose} />}
			</Container>
		</Context.Provider>
	);
};
