/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { Padding, Text } from '@zextras/carbonio-design-system';
import { FOLDERS, t } from '@zextras/carbonio-shell-ui';

import ModalFooter from '../../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../../carbonio-ui-commons/components/modals/modal-header';
import { useAppDispatch } from '../../../../../hooks/redux';
import { useUiUtilities } from '../../../../../hooks/use-ui-utilities';
import { StoreProvider } from '../../../../../store/redux';
import { useEditorDid, useEditorDraftSave } from '../../../../../store/zustand/editor';
import { MailsEditorV2, UiUtilities } from '../../../../../types';
import { moveMsgToTrash } from '../../../../../ui-actions/message-actions';

type EditViewClosingModalProps = {
	editorId: MailsEditorV2['id'];
	onCloseConfirmed?: () => void;
	onCloseCanceled?: () => void; // TODO use it to cancel the edit view closing operation
};

export const EditViewClosingModal = ({
	editorId,
	onCloseConfirmed
}: EditViewClosingModalProps): React.ReactElement => {
	const { did: draftId } = useEditorDid(editorId);
	const { saveDraft, status: saveDraftAllowed } = useEditorDraftSave(editorId);

	const dispatch = useAppDispatch();
	const uiUtilities = useUiUtilities();

	const onCloseModal = useCallback(() => {
		onCloseConfirmed && onCloseConfirmed();
	}, [onCloseConfirmed]);

	const onKeepDraft = useCallback(() => {
		saveDraft({
			onComplete: () => {
				onCloseConfirmed && onCloseConfirmed();
			}
		});
	}, [onCloseConfirmed, saveDraft]);

	const onDeleteDraft = useCallback(
		(ev) => {
			if (!draftId) {
				return;
			}

			moveMsgToTrash({
				ids: [draftId],
				dispatch,
				folderId: FOLDERS.TRASH,
				uiUtilities
			})?.onClick(ev);
			onCloseConfirmed && onCloseConfirmed();
		},
		[dispatch, draftId, onCloseConfirmed, uiUtilities]
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
				disabled={!saveDraftAllowed?.allowed}
				tooltip={saveDraftAllowed?.reason}
				onConfirm={onKeepDraft}
				label={t('label.keep_draft', 'Keep Draft')}
				secondaryAction={onDeleteDraft}
				secondaryLabel={t('label.delete_draft', 'Delete Draft')}
				secondaryColor="primary"
				paddingTop="0"
			/>
		</>
	);
};

type KeepDraftModalProps = {
	editorId: MailsEditorV2['id'];
	uiUtilities: UiUtilities;
	onCloseConfirmed?: () => void;
};

export function keepOrDiscardDraft({
	editorId,
	onCloseConfirmed,
	uiUtilities
}: KeepDraftModalProps): void {
	const closeModal = uiUtilities.createModal(
		{
			children: (
				<StoreProvider>
					<EditViewClosingModal
						editorId={editorId}
						onCloseConfirmed={(): void => {
							closeModal();
							onCloseConfirmed && onCloseConfirmed();
						}}
					/>
				</StoreProvider>
			)
		},
		true
	);
}
