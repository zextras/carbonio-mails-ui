/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, SyntheticEvent, useCallback, useMemo, useRef } from 'react';

import {
	Container,
	getColor,
	Icon,
	IconButton,
	Padding,
	Row,
	Text,
	Tooltip,
	useTheme
} from '@zextras/carbonio-design-system';
import { t, useLocalStorage } from '@zextras/carbonio-shell-ui';
import styled, { SimpleInterpolation } from 'styled-components';

import { AttachmentUploadStatus } from './attachment-upload-status';
import {
	composeAttachmentDownloadUrl,
	getAttachmentExtension,
	getSizeDescription,
	useAttachmentIconColor
} from '../../../../helpers/attachments';
import {
	getEditor,
	useEditorAttachments,
	useEditorDraftSave,
	useEditorSubject
} from '../../../../store/zustand/editor';
import {
	isAttachmentUploading,
	isSavedAttachment,
	isUnsavedAttachment
} from '../../../../store/zustand/editor/editor-utils';
import { useEditorUploadProcess } from '../../../../store/zustand/editor/hooks/updload';
import StyledWrapper from '../../../../styled-wrapper';
import { MailsEditorV2, SavedAttachment, UnsavedAttachment } from '../../../../types';
import { getAttachmentsLink } from '../preview/utils';

const AttachmentHoverBarContainer = styled(Container)`
	display: none;
`;

const AttachmentContainer = styled(Container).attrs(
	(props: { hoverBarDisabled: boolean; isSmartLink: boolean }) => ({
		hoverBarDisabled: props.hoverBarDisabled,
		isSmartLink: props.isSmartLink
	})
)`
	border-bottom: ${(props): string =>
		props.isSmartLink ? `1px solid ${props.theme.palette.primary.regular}` : 'none'};
	border-radius: 0.125rem;
	width: calc(50% - 0.25rem);
	transition: 0.2s ease-out;
	margin-bottom: ${({ theme }): string => theme.sizes.padding.small};
	&:hover {
		background-color: ${({ theme, background }): SimpleInterpolation =>
			background && getColor(`${background}.hover`, theme)};
		& ${AttachmentHoverBarContainer} {
			display: ${(props): string => (props.hoverBarDisabled ? 'none' : 'flex')};
		}
	}
	&:focus {
		background-color: ${({ theme, background }): SimpleInterpolation =>
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
	background: string;
}>`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 2rem;
	height: 2rem;
	border-radius: ${({ theme }): string => theme.borderRadius};
	background-color: ${({ background }): string => background};
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
	const extension = getAttachmentExtension(attachment).value;

	const attachmentExtensionContent = useMemo(
		() =>
			isSavedAttachment(attachment) && attachment.isSmartLink ? (
				<Icon icon="Link2Outline" size="large" color="primary" />
			) : (
				extension
			),
		[attachment, extension]
	);

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
	const { removeUnsavedAttachment, removeSavedAttachment, toggleSmartLink } =
		useEditorAttachments(editorId);
	const { subject } = useEditorSubject(editorId);

	const { saveDraft } = useEditorDraftSave(editor.id);
	const [smartLinks, setSmartLinks] = useLocalStorage<Array<{ partName: string; draftId: string }>>(
		`smartlinks`,
		[]
	);
	const removeSmartLink = useCallback(() => {
		const draftId = editor.did;
		if (isSavedAttachment(attachment) && draftId) {
			const { partName } = attachment;
			const newSmartLink = { partName, draftId };
			setSmartLinks((state) =>
				state.filter(
					(smartLink) =>
						smartLink.partName !== newSmartLink.partName ||
						smartLink.draftId !== newSmartLink.draftId
				)
			);
		}
	}, [attachment, editor.did, setSmartLinks]);

	const toggleSmartLinkAction = useCallback(() => {
		const draftId = editor.did;
		if (isSavedAttachment(attachment) && draftId) {
			const { partName } = attachment;
			toggleSmartLink(partName);
			const newSmartLink = { partName, draftId };
			setSmartLinks((state) =>
				state.some(
					(smartLink) =>
						smartLink.partName === newSmartLink.partName &&
						smartLink.draftId === newSmartLink.draftId
				)
					? state.filter(
							(smartLink) =>
								smartLink.partName !== newSmartLink.partName ||
								smartLink.draftId !== newSmartLink.draftId
					  )
					: [...state, newSmartLink]
			);
			saveDraft();
		}
	}, [attachment, editor.did, saveDraft, setSmartLinks, toggleSmartLink]);

	const removeAttachment = useCallback(() => {
		removeSmartLink();
		isUnsavedAttachment(attachment) && removeUnsavedAttachment(attachment.uploadId as string);
		isSavedAttachment(attachment) && removeSavedAttachment(attachment.partName);
	}, [attachment, removeSavedAttachment, removeSmartLink, removeUnsavedAttachment]);

	const attachItemColor = useAttachmentIconColor(attachment);
	const attachmentExtensionColor = useMemo(
		() =>
			isSavedAttachment(attachment) && attachment.isSmartLink ? 'transparent' : attachItemColor,
		[attachItemColor, attachment]
	);

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

	const theme = useTheme();

	const backgroundColor = useMemo(() => {
		if (isSavedAttachment(attachment) && attachment.isSmartLink) {
			return theme.palette.infoBanner.regular;
		}
		return 'gray3';
	}, [attachment, theme.palette.infoBanner.regular]);

	return (
		<StyledWrapper>
			<AttachmentContainer
				orientation="horizontal"
				mainAlignment="flex-start"
				crossAlignment={'center'}
				height="fit"
				background={backgroundColor}
				data-testid={`attachment-container-${attachment.filename}`}
				hoverBarDisabled={isUploading}
				isSmartLink={isSavedAttachment(attachment) && attachment.isSmartLink}
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
						<AttachmentExtension background={attachmentExtensionColor}>
							{attachmentExtensionContent}
						</AttachmentExtension>
						<Row orientation="vertical" crossAlignment="flex-start" takeAvailableSpace>
							<Text size={'small'}>
								{attachment.filename ||
									t('label.attachement_unknown', {
										mimeType: attachment?.contentType,
										defaultValue: 'Unknown <{{mimeType}}>'
									})}
							</Text>
							{!(isSavedAttachment(attachment) && attachment?.isSmartLink) && (
								<Padding style={{ width: '100%' }} top="extrasmall">
									<Text color="gray1" size={'small'}>
										{sizeLabel}
									</Text>
								</Padding>
							)}
						</Row>
					</Row>
				</Tooltip>
				{uploadProcess?.status && (
					<AttachmentUploadStatus
						data-testid={'attachmentuploadstatus-container'}
						uploadStatus={uploadProcess.status}
						cancelUpload={cancelUpload}
					/>
				)}
				<Row orientation="horizontal" crossAlignment="center">
					<AttachmentHoverBarContainer>
						<Row>
							{isSavedAttachment(attachment) && (
								<Tooltip
									label={
										attachment.isSmartLink
											? t('label.convert_back_to_attachment', 'Convert back to attachment')
											: t('label.convert_to_smart_link', 'Convert to smart link')
									}
								>
									<IconButton size="medium" icon="DriveOutline" onClick={toggleSmartLinkAction} />
								</Tooltip>
							)}
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
