/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import ModalFooter from '../../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../../carbonio-ui-commons/components/modals/modal-header';
import { useAppDispatch } from '../../../../../hooks/redux';
import { StoreProvider } from '../../../../../store/redux';
import { deleteEditor } from '../../../../../store/zustand/editor';
import { MailsEditorV2 } from '../../../../../types';
import { useMoveMsgToTrash } from '../../../../../ui-actions/message-actions';
import { useGlobalModal } from '../../../../global-modal-manager';
import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';

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
	const dispatch = useAppDispatch();

	const onCloseModal = useCallback(() => {
		onClose?.();
	}, [onClose]);

	const onDraft = useCallback(() => {
		onConfirm?.();
		onClose?.();
	}, [onClose, onConfirm]);

	const moveMsgToTrash = useMoveMsgToTrash();
	const onDeleteAction = useCallback(
		(ev) => {
			moveMsgToTrash({
				ids,
				dispatch,
				folderId: FOLDERS.DRAFTS
			})?.onClick(ev);
			onDelete?.();
			onClose?.();
		},
		[dispatch, ids, moveMsgToTrash, onClose, onDelete]
	);

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

type KeepDraftModalProps = {
	editorId: MailsEditorV2['id'];
	draftId?: MailsEditorV2['did'];
	onConfirm?: () => void;
};

export const useKeepOrDiscardDraft = (): ((arg: KeepDraftModalProps) => void) => {
	const createModal = useGlobalModal();
	return useCallback(
		({ editorId, draftId, onConfirm }) => {
			const onDelete = (): void => {
				deleteEditor({ id: editorId });
			};

			if (draftId && editorId) {
				const closeModal = createModal(
					{
						children: (
							<StoreProvider>
								<DeleteDraftModal
									ids={[draftId]}
									onDelete={onDelete}
									onConfirm={(): void => onConfirm?.()}
									onClose={(): void => closeModal()}
								/>
							</StoreProvider>
						)
					},
					true
				);
			}
		},
		[createModal]
	);
};
