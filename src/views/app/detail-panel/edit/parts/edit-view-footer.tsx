/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import {
	Container,
	Text,
	Button,
	Tooltip,
	useModal,
	Padding,
	AnyColor
} from '@zextras/carbonio-design-system';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { Divider } from '../../../../../components/divider';
import { PROCESS_STATUS } from '../../../../../constants';
import { useMsgMoveToTrashDescriptor } from '../../../../../hooks/actions/use-msg-move-to-trash';
import { useEditorDid, useEditorDraftSaveProcessStatus } from '../../../../../store/editor';
import { MailsEditorV2 } from '../../../../../types/editor';

const DIVIDER_COLOR: AnyColor = 'gray2';

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
	const { closeModal } = useModal();

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

	const draftSavedStatusMessage = useMemo<string>((): string => {
		if (draftSaveStatus?.status === PROCESS_STATUS.RUNNING) {
			return t('editView.footer.draftSaving', 'Saving...');
		}

		if (draftSaveStatus?.status === PROCESS_STATUS.COMPLETED) {
			const isSameDay = draftSaveStatus?.lastSaveTimestamp?.getDay() === new Date().getDay();
			const formattedDate = moment(draftSaveStatus?.lastSaveTimestamp).format('L');
			const formattedTime = moment(draftSaveStatus?.lastSaveTimestamp).format('LT');

			return isSameDay
				? t('editView.footer.draftSaveTime', {
						time: formattedTime,
						defaultValue: 'Draft saved at {{time}}'
					})
				: t('editView.footer.draftSaveDateTime', {
						date: formattedDate,
						time: formattedTime,
						defaultValue: 'Draft saved on {{date}} at {{time}}'
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
		shouldReplaceHistory: false,
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
		<FooterContainer data-testid="edit-view-footer">
			<Divider color={DIVIDER_COLOR} />
			<Container
				orientation="horizontal"
				mainAlignment="flex-end"
				crossAlignment="center"
				gap="0.5rem"
				padding={{ right: '0.5rem' }}
			>
				<Text size="small" color="gray1">
					{draftSavedStatusMessage}
				</Text>
				<Padding left="0.5rem" />
				<Divider color={DIVIDER_COLOR} orientation="vertical" />
				<Tooltip label={t('editView.footer.deleteDraft', 'Delete draft')}>
					<Button
						type="ghost"
						size="extralarge"
						color="gray0"
						icon="Trash2Outline"
						onClick={onDeleteClick}
						disabled={isDeleteDisabled}
					/>
				</Tooltip>
			</Container>
		</FooterContainer>
	);
};
