/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useRef, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { find, map, reduce, uniqBy } from 'lodash';
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
import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';
import { getFileExtension, calcColor } from '../../../../commons/utilities';
import { humanFileSize, previewType } from './file-preview';

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

function Attachment({ filename, size, link, message, part, iconColors, att }) {
	const { createPreview } = useContext(PreviewsManagerContext);
	const extension = getFileExtension(att);
	const sizeLabel = useMemo(() => humanFileSize(size), [size]);
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

	const preview = useCallback(
		(ev) => {
			ev.preventDefault();
			const pType = previewType(att.contentType);
			if (pType) {
				createPreview({
					src: link,
					previewType: pType,
					/** Left Action for the preview */
					closeAction: {
						id: 'close',
						icon: 'ArrowBack',
						tooltipLabel: t('preview.close', 'Close Preview')
					},
					/** Actions for the preview */
					// actions: HeaderAction[],
					/** Extension of the file, shown as info */
					extension: att.filename.substring(att.filename.lastIndexOf('.') + 1),
					/** Name of the file, shown as info */
					filename: att.filename,
					/** Size of the file, shown as info */
					size: humanFileSize(att.size)
				});
			} else if (inputRef2.current) {
				// eslint-disable-next-line no-param-reassign
				inputRef2.current.value = null;
				inputRef2.current.click();
			}
		},
		[att, createPreview, link, t]
	);
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
					onClick={preview}
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
					{/* <FilePreview att={att} link={link} /> */}
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
				</AttachmentsActions>
			</Container>
		)
	);
}
