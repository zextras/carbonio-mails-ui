/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { find, forEach, map, reduce, uniqBy } from 'lodash';
import {
	Container,
	Icon,
	IconButton,
	Link,
	Padding,
	Row,
	Text,
	Tooltip,
	useTheme
} from '@zextras/carbonio-design-system';
import { getAction, soapFetch } from '@zextras/carbonio-shell-ui';
import { getFileExtension, calcColor } from '../../../../commons/utilities';
import { MailMessagePart } from '../../../../types/mail-message';
import { EditorAttachmentFiles } from '../../../../types/mails-editor';

const AttachmentsActions = styled(Row)``;

function findAttachments(parts, acc) {
	return reduce(
		parts,
		(found, part) => {
			if (part && part.disposition === 'attachment') {
				found.push(part);
			}
			if (part.parts) return findAttachments(part.parts, found);
			return acc;
		},
		acc
	);
}

function getSizeLabel(size) {
	let value = '';
	if (size < 1024000) {
		value = `${Math.round((size / 1024) * 100) / 100} KB`;
	} else if (size < 1024000000) {
		value = `${Math.round((size / 1024 / 1024) * 100) / 100} MB`;
	} else {
		value = `${Math.round((size / 1024 / 1024 / 1024) * 100) / 100} GB`;
	}
	return value;
}

function getAttachmentsLink(messageId, messageSubject, attachments) {
	if (attachments.length > 1) {
		return `/service/home/~/?auth=co&id=${messageId}&filename=${messageSubject}&charset=UTF-8&part=${attachments.join(
			','
		)}&disp=a&fmt=zip`;
	}
	return `/service/home/~/?auth=co&id=${messageId}&part=${attachments.join(',')}&disp=a`;
}

const AttachmentHoverBarContainer = styled(Container)`
	display: none;
	height: 0px;
`;

const AttachmentContainer = styled(Container)`
	border-radius: 2px;
	width: calc(50% - 4px);
	transition: 0.2s ease-out;
	margin-bottom: ${({ theme }) => theme.sizes.padding.small};
	&:hover {
		background-color: ${({ theme, background }) => theme.palette[background].hover};
		& ${AttachmentHoverBarContainer} {
			display: flex;
		}
	}
	&:focus {
		background-color: ${({ theme, background }) => theme.palette[background].focus};
	}
	cursor: pointer;
`;

const AttachmentLink = styled.a`
	margin-bottom: ${({ theme }) => theme.sizes.padding.small};
	position: relative;
	text-decoration: none;
`;

const AttachmentExtension = styled(Text)`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 32px;
	height: 32px;
	border-radius: ${({ theme }) => theme.borderRadius};
	background-color: ${({ background }) => background.color};
	color: ${({ theme }) => theme.palette.gray6.regular};
	font-size: calc(${({ theme }) => theme.sizes.font.small} - 2px);
	text-transform: uppercase;
	margin-right: ${({ theme }) => theme.sizes.padding.small};
`;

function Attachment({
	filename,
	size,
	link,
	message,
	part,
	iconColors,
	att,
	uploadIntegration,
	isUploadIntegrationAvailable
}) {
	const extension = getFileExtension(att);
	const sizeLabel = useMemo(() => getSizeLabel(size), [size]);
	const [t] = useTranslation();
	const inputRef = useRef();
	const inputRef2 = useRef();

	const downloadAttachment = useCallback(() => {
		if (inputRef.current) {
			// eslint-disable-next-line no-param-reassign
			inputRef.current.value = null;
			inputRef.current.click();
		}
	}, [inputRef]);

	return (
		<AttachmentContainer
			orientation="horizontal"
			mainAlignment="flex-start"
			height="fit"
			background="gray3"
		>
			<Tooltip
				key={`${message.id}-Preview`}
				label={t('action.preview_new_tab', 'Click to preview in another tab')}
			>
				<Row
					padding={{ all: 'small' }}
					mainAlignment="flex-start"
					onClick={(ev) => {
						ev.preventDefault();
						if (inputRef2.current) {
							// eslint-disable-next-line no-param-reassign
							inputRef2.current.value = null;
							inputRef2.current.click();
						}
					}}
					takeAvailableSpace
				>
					<AttachmentExtension background={find(iconColors, (ic) => ic.extension === extension)}>
						{extension}
					</AttachmentExtension>
					<Row orientation="vertical" crossAlignment="flex-start" takeAvailableSpace>
						<Padding style={{ width: '100%' }} bottom="extrasmall">
							<Text>
								{filename ||
									t('label.attachement_unknown', {
										mimeType: att?.contentType,
										defaultValue: 'Unknown <{{mimeType}}>'
									})}
							</Text>
						</Padding>
						<Text color="gray1" size="small">
							{sizeLabel}
						</Text>
					</Row>
				</Row>
			</Tooltip>
			<Row orientation="horizontal" crossAlignment="center">
				<AttachmentHoverBarContainer orientation="horizontal">
					{isUploadIntegrationAvailable && (
						<Tooltip
							key={uploadIntegration.id}
							label={t('label.upload_to_files', {
								defaultValue: 'Upload to Files'
							})}
						>
							<IconButton
								size="medium"
								icon={uploadIntegration.icon}
								onClick={uploadIntegration.click}
							/>
						</Tooltip>
					)}
					<Tooltip key={`${message.id}-DownloadOutline`} label={t('label.download', 'Download')}>
						<IconButton size="medium" icon="DownloadOutline" onClick={downloadAttachment} />
					</Tooltip>
				</AttachmentHoverBarContainer>
			</Row>
			<AttachmentLink
				rel="noopener"
				ref={inputRef2}
				target="_blank"
				href={`/service/home/~/?auth=co&id=${message.id}&part=${part}`}
			/>
			<AttachmentLink ref={inputRef} rel="noopener" target="_blank" href={link} />
		</AttachmentContainer>
	);
}

export default function AttachmentsBlock({ message }) {
	const [t] = useTranslation();
	const [expanded, setExpanded] = useState(false);
	const attachments = useMemo(() => findAttachments(message.parts, []), [message]);
	const attachmentsCount = useMemo(() => attachments.length, [attachments]);
	const attachmentsParts = useMemo(() => map(attachments, 'name'), [attachments]);
	const theme = useTheme();
	const actionsDownloadLink = useMemo(
		() => getAttachmentsLink(message.id, message.subject, attachmentsParts),
		[message, attachmentsParts]
	);
	const removeAttachments = useCallback(() => removeAttachments(), []);

	const iconColors = useMemo(
		() =>
			uniqBy(
				map(attachments, (att) => {
					const fileExtn = getFileExtension(att);
					const color = calcColor(att.contentType, theme);

					if (iconColors) {
						return [
							...iconColors,
							{
								extension: fileExtn,
								color
							}
						];
					}
					return {
						extension: fileExtn,
						color
					};
				}),
				'extension'
			),
		[attachments, theme]
	);

	const confirmAction = (nodes) => {
		console.clear();
		console.log(nodes[0]);
		soapFetch('CopyToFiles', {
			_jsns: 'urn:zimbraMail',
			mid: message.id,
			part: attachments[0].name,
			destinationFolderId: nodes[0].id
		});
	};

	const isAValidDestination = (node) => node.permissions?.can_write_file;

	const actionTarget = {
		title: t('label.select_folder', 'Select folder'),
		confirmAction,
		confirmLabel: t('label.select', 'Select'),
		disabledTooltip: t('label.invalid_destination', 'This node is not a valid destination'),
		allowFiles: false,
		allowFolders: true,
		isValidSelection: isAValidDestination,
		canSelectOpenedFolder: true,
		maxSelection: 1
	};

	const [uploadIntegration, isUploadIntegrationAvailable] = getAction(
		'carbonio_files_action',
		'files-select-nodes',
		actionTarget
	);

	return (
		attachmentsCount > 0 && (
			<Container crossAlignment="flex-start" padding={{ horizontal: 'medium' }}>
				<Container orientation="horizontal" mainAlignment="space-between" wrap="wrap">
					{map(expanded ? attachments : attachments.slice(0, 2), (att, index) => (
						<Attachment
							key={`att-${att.filename}-${index}`}
							filename={att.filename}
							size={att.size}
							link={getAttachmentsLink(message.id, message.subject, [att.name])}
							message={message}
							part={att.name}
							iconColors={iconColors}
							att={att}
							isUploadIntegrationAvailable={isUploadIntegrationAvailable}
							uploadIntegration={uploadIntegration}
						/>
					))}
				</Container>
				<AttachmentsActions
					mainAlignment="flex-start"
					padding={{ top: 'extrasmall', bottom: 'medium' }}
				>
					<Padding right="small">
						{attachmentsCount === 1 && (
							<Text color="gray1">{`1 ${t('label.attachment', 'Attachment')}`}</Text>
						)}
						{attachmentsCount === 2 && (
							<Text color="gray1">
								{`${attachmentsCount} ${t('label.attachment_plural', 'Attachments')}`}
							</Text>
						)}
						{attachmentsCount > 2 &&
							(expanded ? (
								<Row onClick={() => setExpanded(false)} style={{ cursor: 'pointer' }}>
									<Padding right="small">
										<Text color="primary">
											{`${attachmentsCount} ${t('label.attachment_plural', 'Attachments')}`}
										</Text>
									</Padding>
									<Icon icon="ArrowIosUpward" color="primary" />
								</Row>
							) : (
								<Row onClick={() => setExpanded(true)} style={{ cursor: 'pointer' }}>
									<Padding right="small">
										<Text color="primary">
											{`${t('label.show_all', 'Show all')} ${attachmentsCount} ${t(
												'label.attachment_plural',
												'attachments'
											)}`}
										</Text>
									</Padding>
									<Icon icon="ArrowIosDownward" color="primary" />
								</Row>
							))}{' '}
					</Padding>
					<Link size="medium" href={actionsDownloadLink}>
						{t('label.download', {
							count: attachmentsCount,
							defaultValue: 'Download',
							defaultValue_plural: 'Downloads'
						})}
					</Link>
					{isUploadIntegrationAvailable && (
						<Link size="medium" onClick={uploadIntegration.click} style={{ paddingLeft: '8px' }}>
							{t('label.upload_to_files', {
								defaultValue: 'Upload to Files'
							})}
						</Link>
					)}
				</AttachmentsActions>
			</Container>
		)
	);
}
