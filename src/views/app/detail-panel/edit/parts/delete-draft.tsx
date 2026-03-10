/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { FOLDERS, ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';

import { useMsgMoveToTrashFn } from 'hooks/actions/use-msg-move-to-trash';
import { deleteEditor } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';
import { useGlobalModal } from 'views/global-modal-manager';

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
	const onCloseModal = useCallback(() => {
		onClose?.();
	}, [onClose]);

	const onDraft = useCallback(() => {
		onConfirm?.();
		onClose?.();
	}, [onClose, onConfirm]);

	const moveMsgToTrash = useMsgMoveToTrashFn({
		ids,
		messageFolderId: FOLDERS.DRAFTS,
		shouldReplaceHistory: false
	});
	const onDeleteAction = useCallback(() => {
		moveMsgToTrash.canExecute() && moveMsgToTrash.execute();
		onDelete?.();
		onClose?.();
	}, [moveMsgToTrash, onClose, onDelete]);

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
	const { createModal, closeModal } = useGlobalModal();
	return useCallback(
		({ editorId, draftId, onConfirm }) => {
			const onDelete = (): void => {
				deleteEditor({ id: editorId });
			};

			if (draftId && editorId) {
				const id = Date.now().toString();
				createModal(
					{
						id,
						onClose: (): void => {
							closeModal(id);
						},
						children: (
							<DeleteDraftModal
								ids={[draftId]}
								onDelete={onDelete}
								onConfirm={(): void => onConfirm?.()}
								onClose={(): void => closeModal(id)}
							/>
						)
					},
					true
				);
			}
		},
		[closeModal, createModal]
	);
};
