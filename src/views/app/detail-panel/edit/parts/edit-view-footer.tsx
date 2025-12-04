/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import { Container, Text, Button, Tooltip, useModal } from '@zextras/carbonio-design-system';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { Divider } from '../../../../../components/divider';
import { PROCESS_STATUS } from '../../../../../constants';
import { useMsgMoveToTrashDescriptor } from '../../../../../hooks/actions/use-msg-move-to-trash';
import { useEditorDid, useEditorDraftSaveProcessStatus } from '../../../../../store/editor';
import { MailsEditorV2 } from '../../../../../types/editor';

type EditViewFooterProps = {
	editorId: MailsEditorV2['id'];
	onDraftDeleted?: () => void;
};

const FooterContainer = styled(Container)`
	gap: 1rem;
	max-height: 3.5rem;
	position: fixed;
	bottom: 0;
	left: 0;
	padding-bottom: 0.5rem;
	width: 100%;
`;

export const EditViewFooter = ({ editorId, onDraftDeleted }: EditViewFooterProps): JSX.Element => {
	const draftSaveStatus = useEditorDraftSaveProcessStatus(editorId);
	const { did: draftId } = useEditorDid(editorId);
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();

	const { folderId: routeFolderId } = useParams();
	const { execute: deleteDraft } = useMsgMoveToTrashDescriptor({
		ids: [draftId ?? ''],
		messageFolderId: FOLDERS.DRAFTS,
		routeFolderId: routeFolderId ?? '',
		shouldReplaceHistory: true
	});

	const confirmationModalId = useMemo<string>(
		() => `delete-draft-confirmation-${draftId}`,
		[draftId]
	);

	const isDeleteDisabled = useMemo<boolean>(
		(): boolean => !draftId || draftSaveStatus?.status === PROCESS_STATUS.RUNNING,
		[draftId, draftSaveStatus?.status]
	);

	const buttonColor = useMemo<string>(
		() => (isDeleteDisabled ? 'secondary' : 'secondary.focus'),
		[isDeleteDisabled]
	);

	const draftSavedStatusMessage = useMemo<string>((): string => {
		if (draftSaveStatus?.status === PROCESS_STATUS.RUNNING) {
			return t('editView.footer.draftSaving', 'Saving...');
		}

		if (draftSaveStatus?.status === PROCESS_STATUS.COMPLETED) {
			return t('editView.footer.draftSavedAt', {
				time: moment(draftSaveStatus?.lastSaveTimestamp).format('LTS'),
				defaultValue: 'Draft saved at {{time}}'
			});
		}

		if (!draftId) {
			return t('editView.footer.draftNotSaved', 'Draft not saved');
		}

		return '';
	}, [draftId, draftSaveStatus?.lastSaveTimestamp, draftSaveStatus?.status, t]);

	const onDeleteConfirm = useCallback((): void => {
		closeModal(confirmationModalId);
		deleteDraft();
		onDraftDeleted && onDraftDeleted();
	}, [closeModal, confirmationModalId, deleteDraft, onDraftDeleted]);

	const onDeleteClick = useCallback((): void => {
		createModal({
			id: confirmationModalId,
			title: t('editView.footer.deleteDraftConfirmationTitle', 'Delete draft'),
			confirmLabel: t('label.delete', 'Delete'),
			confirmColor: 'error',
			onConfirm: onDeleteConfirm,
			onClose: () => {
				closeModal(confirmationModalId);
			},
			showCloseIcon: true,
			children: (
				<Text overflow="break-word">
					{t(
						'editView.footer.deleteDraftConfirmationContent',
						'Are you sure you want to delete this draft?'
					)}
				</Text>
			)
		});
	}, [createModal, confirmationModalId, t, onDeleteConfirm, closeModal]);

	return (
		<FooterContainer>
			<Divider />
			<Container
				orientation="horizontal"
				mainAlignment="flex-end"
				crossAlignment="center"
				gap="1rem"
				padding={{ right: '0.5rem' }}
			>
				<Text color="gray1">{draftSavedStatusMessage}</Text>
				<Divider orientation="vertical" />
				<Tooltip label={t('editView.footer.deleteDraft', 'Delete draft')}>
					<Button
						type="ghost"
						size="extralarge"
						color={buttonColor}
						icon="Trash2Outline"
						onClick={onDeleteClick}
						disabled={isDeleteDisabled}
					/>
				</Tooltip>
			</Container>
		</FooterContainer>
	);
};
