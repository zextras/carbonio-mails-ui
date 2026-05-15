/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useState } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import type { Grant } from '@zextras/carbonio-ui-commons';
import { soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';

import { ModalProps } from 'types/utils';
import { AddShareModal } from 'views/sidebar/add-share-modal';
import { EditShareModal } from 'views/sidebar/edit-share-modal';
import { MainEditModal } from 'views/sidebar/parts/edit/edit-default-modal';
import { ShareRevokeModal } from 'views/sidebar/parts/edit/share-revoke-modal';

type ModalView =
	| { kind: 'default' }
	| { kind: 'add-share' }
	| { kind: 'edit-share'; grant: Grant }
	| { kind: 'revoke-share'; grant: Grant };

export const EditModal: FC<ModalProps> = ({ folder, onClose }) => {
	const [view, setView] = useState<ModalView>({ kind: 'default' });
	const [grants, setGrants] = useState<Grant[]>(folder.acl?.grant ?? []);

	const refreshGrants = useCallback(() => {
		soapFetchV2<
			{ _jsns: string; folder: { l: string } },
			{ GetFolderResponse: { folder?: Array<{ acl?: { grant?: Grant[] } }> } }
		>('GetFolder', { _jsns: 'urn:zimbraMail', folder: { l: folder.id } })
			.then((res): void => {
				if (res?.Body && !('Fault' in res.Body)) {
					setGrants(res.Body.GetFolderResponse?.folder?.[0]?.acl?.grant ?? []);
				}
			})
			.catch(() => undefined);
	}, [folder.id]);

	useEffect(() => {
		const initialGrants = folder.acl?.grant;

		if (initialGrants === undefined) {
			refreshGrants();
			return;
		}

		setGrants(initialGrants);
	}, [folder.acl?.grant, refreshGrants]);

	const goBack = useCallback(() => setView({ kind: 'default' }), []);
	const onAddShare = useCallback(() => setView({ kind: 'add-share' }), []);
	const onEditGrant = useCallback((grant: Grant) => setView({ kind: 'edit-share', grant }), []);
	const onRevokeGrant = useCallback((grant: Grant) => setView({ kind: 'revoke-share', grant }), []);

	return (
		<Container
			padding={{ all: 'medium' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
			{view.kind === 'default' && (
				<MainEditModal
					folder={folder}
					onClose={onClose}
					grants={grants}
					onAddShare={onAddShare}
					onEditGrant={onEditGrant}
					onRevokeGrant={onRevokeGrant}
				/>
			)}

			{view.kind === 'add-share' && (
				<AddShareModal
					folder={folder}
					onClose={onClose}
					goBack={goBack}
					onSuccess={refreshGrants}
				/>
			)}

			{view.kind === 'edit-share' && (
				<EditShareModal
					folder={folder}
					onClose={onClose}
					grant={view.grant}
					goBack={goBack}
					onSuccess={refreshGrants}
				/>
			)}

			{view.kind === 'revoke-share' && (
				<ShareRevokeModal
					folder={folder}
					onClose={onClose}
					grant={view.grant}
					goBack={goBack}
					onSuccess={refreshGrants}
				/>
			)}
		</Container>
	);
};
