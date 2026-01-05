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
	gap: 0.75rem;
	max-height: 4rem;
	padding-bottom: 0.5rem;
	width: 100%;
	position: relative;
	bottom: 0;
	background-color: ${(props): string => props.theme.palette.gray6.regular};
`;

export const EditViewFooter = ({ editorId, onDraftDeleted }: EditViewFooterProps): JSX.Element => {
	const draftSaveStatus = useEditorDraftSaveProcessStatus(editorId);
	const { did: draftId } = useEditorDid(editorId);
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();

	const { folderId: routeFolderId } = useParams();

	const confirmationModalId = useMemo<string>(
		() => `delete-draft-confirmation-${draftId}`,
		[draftId]
	);

	const isDraftSaved = useMemo<boolean>((): boolean => !!draftId, [draftId]);

	const isDeleteDisabled = useMemo<boolean>(
		(): boolean => draftSaveStatus?.status === PROCESS_STATUS.RUNNING,
		[draftSaveStatus?.status]
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

		if (!isDraftSaved) {
			return t('editView.footer.draftNotSaved', 'Draft not saved');
		}

		return '';
	}, [isDraftSaved, draftSaveStatus?.lastSaveTimestamp, draftSaveStatus?.status, t]);

	const onDeleteComplete = useCallback((): void => {
		closeModal(confirmationModalId);
		onDraftDeleted && onDraftDeleted();
	}, [closeModal, confirmationModalId, onDraftDeleted]);

	const { execute: deleteDraft } = useMsgMoveToTrashDescriptor({
		ids: [draftId ?? ''],
		messageFolderId: FOLDERS.DRAFTS,
		routeFolderId: routeFolderId ?? '',
		shouldReplaceHistory: true,
		onActionComplete: onDeleteComplete
	});

	const onDeleteClick = useCallback((): void => {
		if (!isDraftSaved) {
			onDeleteComplete();
			return;
		}

		deleteDraft();
	}, [isDraftSaved, deleteDraft, onDeleteComplete]);

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
