/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useState, useMemo, FC, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Prompt, useHistory } from 'react-router-dom';
import { Padding, Text, useModal } from '@zextras/carbonio-design-system';
import { FOLDERS, t } from '@zextras/carbonio-shell-ui';
import { StoreProvider } from '../../../../../store/redux';
import { moveMsgToTrash } from '../../../../../ui-actions/message-actions';
import ModalFooter from '../../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../../carbonio-ui-commons/components/modals/modal-header';

type DeleteDraftModalProps = {
	ids: Array<string>;
	onClose: () => void;
	onConfirm: () => void;
	onDelete: () => void;
};

export const DeleteDraftModal = ({
	ids,
	onClose,
	onConfirm,
	onDelete
}: DeleteDraftModalProps): React.ReactElement => {
	const dispatch = useDispatch();

	const onCloseModal = useCallback(() => {
		onClose?.();
	}, [onClose]);

	const onDraft = useCallback(() => {
		onConfirm?.();
		onClose?.();
	}, [onClose, onConfirm]);

	const onDeleteAction = useCallback(() => {
		moveMsgToTrash({
			ids,
			dispatch,
			folderId: FOLDERS.TRASH
		})?.click();
		onDelete?.();
		onClose?.();
	}, [dispatch, ids, onClose, onDelete]);

	return (
		<>
			<ModalHeader title={t('label.before_you_leave', 'Before you leave')} onClose={onCloseModal} />
			<Padding vertical="medium">
				<Text>
					{t('modal.delete_draft.message1', 'Do you want to keep this draft or delete it?')}
				</Text>
			</Padding>
			<ModalFooter
				secondaryBtnType={'outlined'}
				onConfirm={onDraft}
				label={t('label.keep_draft', 'Keep Draft')}
				secondaryAction={onDeleteAction}
				secondaryLabel={t('label.delete_draft', 'Delete Draft')}
				secondaryColor="primary"
				paddingTop="0"
			/>
		</>
	);
};

export const RouteLeavingGuard: FC<{
	when: boolean;
	onDeleteDraft: () => void;
	id: string | undefined;
}> = ({ when, onDeleteDraft, id }) => {
	const history = useHistory();
	const lastLocationInitial = useMemo<string>(() => history.location.pathname, [history]);
	const [lastLocation, setLastLocation] = useState(lastLocationInitial);
	const [confirmedNavigation, setConfirmedNavigation] = useState(false);
	const createModal = useModal();

	const onDelete = useCallback(() => {
		onDeleteDraft?.();
		setConfirmedNavigation(true);
	}, [onDeleteDraft]);

	const onDraft = useCallback(() => {
		setConfirmedNavigation(true);
	}, []);

	const handleBlockedNavigation = useCallback(
		(nextLocation) => {
			if (!confirmedNavigation && nextLocation.pathname !== (lastLocation || lastLocationInitial)) {
				const closeModal = createModal(
					{
						children: (
							<StoreProvider>
								<DeleteDraftModal
									ids={[id ?? '']}
									onDelete={onDelete}
									onConfirm={onDraft}
									onClose={(): void => closeModal()}
								/>
							</StoreProvider>
						)
					},
					true
				);
				setLastLocation(nextLocation?.pathname);
				return false;
			}
			return true;
		},
		[confirmedNavigation, createModal, id, lastLocation, lastLocationInitial, onDelete, onDraft]
	);
	useEffect(() => {
		if (confirmedNavigation && lastLocation) {
			// Navigate to the previous blocked location with your navigate function
			history.push(lastLocation);
		}
	}, [confirmedNavigation, history, lastLocation]);

	return <Prompt when={when} message={handleBlockedNavigation} />;
};
