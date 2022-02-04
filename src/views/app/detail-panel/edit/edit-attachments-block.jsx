/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { filter, find, map, random, uniqBy } from 'lodash';
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
import { useDispatch } from 'react-redux';
import { updateEditor } from '../../../../store/editor-slice';
import { getFileExtension } from '../../../../commons/utils';

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

function Attachment({ filename, size, link, editor, part, iconColors, throttledSaveToDraft, att }) {
	const theme = useTheme();
	const extension = filename?.split('.').pop() ?? getFileExtension(att.contentType, theme).ext;
	const sizeLabel = useMemo(() => getSizeLabel(size), [size]);
	const [t] = useTranslation();
	const inputRef = useRef();
	const inputRef2 = useRef();
	const dispatch = useDispatch();

	const removeAttachment = useCallback(() => {
		dispatch(
			updateEditor({
				editorId: editor.editorId,
				data: {
					attach: { mp: filter(editor.attach.mp, (p) => p.part !== part) },
					attachmentFiles: filter(editor.attachmentFiles, (p) => p.name !== part)
				}
			})
		);
		throttledSaveToDraft({
			attach: { mp: filter(editor.attach.mp, (p) => p.part !== part) },
			attachmentFiles: filter(editor.attachmentFiles, (p) => p.name !== part)
		});
	}, [dispatch, editor, throttledSaveToDraft, part]);

	return (
		<AttachmentContainer
			orientation="horizontal"
			mainAlignment="flex-start"
			height="fit"
			background="gray3"
		>
			<Tooltip key={`${editor.id}-Preview`} label={t('action.preview', 'Preview')}>
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
				<AttachmentHoverBarContainer>
					<Tooltip
						key={`${editor.id}-DeletePermanentlyOutline`}
						label={t('label.delete', 'Delete')}
					>
						<IconButton size="medium" icon="DeletePermanentlyOutline" onClick={removeAttachment} />
					</Tooltip>
				</AttachmentHoverBarContainer>
			</Row>
			<AttachmentLink
				rel="noopener"
				ref={inputRef2}
				target="_blank"
				href={`/service/home/~/?auth=co&id=${editor.id}&part=${part}`}
			/>
			<AttachmentLink ref={inputRef} rel="noopener" target="_blank" href={link} />
		</AttachmentContainer>
	);
}

export default function EditAttachmentsBlock({ editor, throttledSaveToDraft }) {
	const [t] = useTranslation();
	const [expanded, setExpanded] = useState(false);
	const dispatch = useDispatch();
	const theme = useTheme();

	const removeAllAttachments = useCallback(() => {
		dispatch(
			updateEditor({
				editorId: editor.editorId,
				data: {
					attach: { mp: [] },
					attachmentFiles: []
				}
			})
		);
		throttledSaveToDraft({
			attach: { mp: [] },
			attachmentFiles: []
		});
	}, [editor.editorId, dispatch, throttledSaveToDraft]);

	const iconColors = useMemo(
		() =>
			uniqBy(
				map(editor.attachmentFiles, (att) => {
					if (iconColors) {
						return [
							...iconColors,
							{
								extension:
									att.filename?.split('.').pop() ?? getFileExtension(att.contentType, theme).ext,
								color: getFileExtension(att.contentType, theme).color
							}
						];
					}
					return {
						extension:
							att.filename?.split('.').pop() ?? getFileExtension(att.contentType, theme).ext,
						color: getFileExtension(att.contentType, theme).color
					};
				}),
				'extension'
			),
		[editor.attachmentFiles, theme]
	);
	return (
		editor.attachmentFiles.length > 0 && (
			<Container crossAlignment="flex-start" padding={{ horizontal: 'large' }}>
				<Container orientation="horizontal" mainAlignment="space-between" wrap="wrap">
					{map(
						expanded ? editor.attachmentFiles : editor.attachmentFiles.slice(0, 2),
						(att, index) => (
							<Attachment
								key={`att-${att.filename}-${index}`}
								filename={att.filename}
								size={att.size}
								link={getAttachmentsLink(editor.id, editor.subject, [att.name])}
								editor={editor}
								part={att.name}
								iconColors={iconColors}
								throttledSaveToDraft={throttledSaveToDraft}
								att={att}
							/>
						)
					)}
				</Container>
				<Row mainAlignment="flex-start" padding={{ top: 'extrasmall', bottom: 'medium' }}>
					<Padding right="small">
						{editor.attachmentFiles.length === 1 && (
							<Text color="gray1">{`1 ${t('label.attachment', 'Attachment')}`}</Text>
						)}
						{editor.attachmentFiles.length === 2 && (
							<Text color="gray1">
								{`${editor.attachmentFiles.length} ${t('label.attachment_plural', 'Attachments')}`}
							</Text>
						)}
						{editor.attachmentFiles.length > 2 &&
							(expanded ? (
								<Row onClick={() => setExpanded(false)} style={{ cursor: 'pointer' }}>
									<Padding right="small">
										<Text color="primary">
											{`${editor.attachmentFiles.length} ${t(
												'label.attachment_plural',
												'attachments'
											)}`}
										</Text>
									</Padding>
									<Icon icon="ArrowIosUpward" color="primary" />
								</Row>
							) : (
								<Row onClick={() => setExpanded(true)} style={{ cursor: 'pointer' }}>
									<Padding right="small">
										<Text color="primary">
											{`${t('label.show_all', 'Show all')} ${editor.attachmentFiles.length} ${t(
												'label.attachment_plural',
												'attachments'
											)}`}
										</Text>
									</Padding>
									<Icon icon="ArrowIosDownward" color="primary" />
								</Row>
							))}
					</Padding>
					<Link size="medium" onClick={removeAllAttachments}>
						{t('label.remove', {
							count: editor.attachmentFiles.length,
							defaultValue: 'Remove',
							defaultValue_plural: 'Remove all'
						})}
					</Link>
				</Row>
			</Container>
		)
	);
}
