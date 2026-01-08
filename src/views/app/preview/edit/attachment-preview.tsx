/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, SyntheticEvent, useCallback, useMemo, useRef } from 'react';

import styled from '@emotion/styled';
import {
	Container,
	getColor,
	IconButton,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { AttachmentUploadStatus } from './attachment-upload-status';
import { getAttachmentsLink } from '../preview/utils';
import {
	composeAttachmentDownloadUrl,
	getAttachmentExtension,
	getSizeDescription,
	useAttachmentIconColor
} from 'helpers/attachments';
import {
	isAttachmentUploading,
	isSavedAttachment,
	isUnsavedAttachment
} from 'store/editor/editor-utils';
import { useEditorUploadProcess } from 'store/editor/hooks/updload';
import { getEditor, useEditorAttachments, useEditorSubject } from 'store/editor/index';
import StyledWrapper from 'styled-wrapper';
import { MailsEditorV2, SavedAttachment, UnsavedAttachment } from 'types/index.d';

const AttachmentHoverBarContainer = styled(Container)`
	display: none;
`;

const AttachmentContainer = styled(Container)<{
	$hoverBarDisabled: boolean;
}>`
	border-bottom: ${({ theme, background }): string => {
		const color = getColor(`${background}.regular`, theme);
		return `1px solid ${color}`;
	}};
	border-radius: 0.125rem;
	width: calc(50% - 0.25rem);
	transition: 0.2s ease-out;
	margin-bottom: ${({ theme }): string => theme.sizes.padding.small};
	&:hover {
		border-bottom: ${({ theme, background }): string => {
			const color = getColor(`${background}.hover`, theme);
			return `1px solid ${color}`;
		}};
		background-color: ${({ theme, background }): undefined | string =>
			background && getColor(`${background}.hover`, theme)};
		& ${AttachmentHoverBarContainer} {
			display: ${({ $hoverBarDisabled }): string => ($hoverBarDisabled ? 'none' : 'flex')};
		}
	}
	&:focus {
		border-bottom: ${({ theme, background }): string => {
			const color = getColor(`${background}.focus`, theme);
			return `1px solid ${color}`;
		}};
		background-color: ${({ theme, background }): undefined | string =>
			background && getColor(`${background}.focus`, theme)};
	}
	cursor: pointer;
`;

const AttachmentLink = styled.a`
	margin-bottom: ${({ theme }): string => theme.sizes.padding.small};
	position: relative;
	text-decoration: none;
`;

const AttachmentExtension = styled(Text)<{
	$background: string;
}>`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 2rem;
	height: 2rem;
	border-radius: ${({ theme }): string => theme.borderRadius};
	background-color: ${({ $background }): string => $background};
	color: ${({ theme }): string => theme.palette.gray6.regular};
	font-size: calc(${({ theme }): string => theme.sizes.font.small} - 0.125rem);
	text-transform: uppercase;
	margin-right: ${({ theme }): string => theme.sizes.padding.small};
`;

type AttachmentCardProps = {
	editorId: MailsEditorV2['id'];
	attachment: UnsavedAttachment | SavedAttachment;
};

export const AttachmentPreview: FC<AttachmentCardProps> = ({ editorId, attachment }) => {
	const extension = getAttachmentExtension(attachment.contentType, attachment.filename).value;

	const attachmentExtensionContent = useMemo(() => extension, [extension]);

	const sizeLabel = getSizeDescription(attachment.size);
	const inputRef = useRef<HTMLAnchorElement>(null);
	const inputRef2 = useRef<HTMLAnchorElement>(null);
	const editor = getEditor({ id: editorId });
	if (!editor) {
		throw new Error('Cannot find the given editor');
	}
	const uploadProcess = useEditorUploadProcess(
		editorId,
		isUnsavedAttachment(attachment) ? (attachment.uploadId as string) : ''
	);
	const { removeUnsavedAttachment, removeSavedAttachment } = useEditorAttachments(editorId);
	const { subject } = useEditorSubject(editorId);

	const removeAttachment = useCallback(() => {
		isUnsavedAttachment(attachment) && removeUnsavedAttachment(attachment.uploadId as string);
		isSavedAttachment(attachment) && removeSavedAttachment(attachment.partName);
	}, [attachment, removeSavedAttachment, removeUnsavedAttachment]);

	const attachItemColor = useAttachmentIconColor(attachment);
	const attachmentExtensionColor = useMemo(() => attachItemColor, [attachItemColor]);

	const isUploading = useMemo<boolean>(
		() => isUnsavedAttachment(attachment) && isAttachmentUploading(attachment),
		[attachment]
	);

	const link = isSavedAttachment(attachment)
		? getAttachmentsLink({
				messageId: editor?.did ?? '',
				messageSubject: subject,
				attachments: [attachment.partName],
				attachmentType: attachment.contentType
			})
		: null;

	const cancelUpload = useCallback(() => {
		if (uploadProcess?.status.status !== 'running') {
			return;
		}
		uploadProcess && uploadProcess.cancel();
	}, [uploadProcess]);

	const isDeletable = useMemo(
		() =>
			isSavedAttachment(attachment) ||
			(isUnsavedAttachment(attachment) && !isAttachmentUploading(attachment)),
		[attachment]
	);

	return (
		<StyledWrapper>
			<AttachmentContainer
				orientation="horizontal"
				mainAlignment="flex-start"
				crossAlignment={'center'}
				height="fit"
				background={'gray3'}
				data-testid={`attachment-container-${attachment.filename}`}
				$hoverBarDisabled={isUploading}
			>
				<Tooltip label={t('action.preview', 'Preview')}>
					<Row
						padding={{ all: 'small' }}
						mainAlignment="flex-start"
						onClick={(ev: SyntheticEvent): void => {
							ev.preventDefault();
							if (inputRef2.current) {
								inputRef2.current.click();
							}
						}}
						takeAvailableSpace
					>
						<AttachmentExtension $background={attachmentExtensionColor}>
							{attachmentExtensionContent}
						</AttachmentExtension>
						<Row orientation="vertical" crossAlignment="flex-start" takeAvailableSpace>
							<Padding style={{ width: '100%' }} bottom="extrasmall">
								<Text size={'small'}>
									{attachment.filename ||
										t('label.attachement_unknown', {
											mimeType: attachment?.contentType,
											defaultValue: 'Unknown <{{mimeType}}>'
										})}
								</Text>
							</Padding>
							<Text color="gray1" size={'small'}>
								{sizeLabel}
							</Text>
						</Row>
					</Row>
				</Tooltip>
				{!isSavedAttachment(attachment) && (
					<AttachmentUploadStatus
						data-testid={'attachmentuploadstatus-container'}
						uploadStatus={{ status: 'running' }}
						cancelUpload={cancelUpload}
					/>
				)}
				<Row orientation="horizontal" crossAlignment="center">
					<AttachmentHoverBarContainer>
						<Row>
							{isDeletable && (
								<Padding right="small">
									<Tooltip label={t('label.delete', 'Delete')}>
										<IconButton
											size="large"
											icon="DeletePermanentlyOutline"
											data-testid={'btn-delete-attachment'}
											onClick={removeAttachment}
										/>
									</Tooltip>
								</Padding>
							)}
						</Row>
					</AttachmentHoverBarContainer>
				</Row>
				{isSavedAttachment(attachment) && link && (
					<>
						<AttachmentLink
							rel="noopener"
							ref={inputRef2}
							target="_blank"
							href={composeAttachmentDownloadUrl(attachment)}
						/>
						<AttachmentLink ref={inputRef} rel="noopener" target="_blank" href={link} />
					</>
				)}
			</AttachmentContainer>
		</StyledWrapper>
	);
};
