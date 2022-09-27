/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useRef, useState, useContext, FC, ReactElement } from 'react';
import styled from 'styled-components';
import { filter, find, includes, map, noop, reduce, uniqBy } from 'lodash';
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
import { getAction, soapFetch, t, getBridgedFunctions } from '@zextras/carbonio-shell-ui';
import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';
import { getFileExtension, calcColor } from '../../../../commons/utilities';
import { humanFileSize, previewType } from './file-preview';
import {
	AttachmentPartType,
	AttachmentType,
	MailMessage,
	MailMessagePart
} from '../../../../types';
import { getMsgsForPrint } from '../../../../store/actions';
import { getEMLContent, getErrorPage } from '../../../../commons/preview-eml';

const AttachmentsActions = styled(Row)``;
function findAttachments(parts: MailMessagePart[], acc: MailMessagePart[]): AttachmentPartType[] {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return reduce(
		parts,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		(found, part: MailMessagePart) => {
			if (part && part.disposition === 'attachment') {
				found.push(part);
			}
			if (part.parts) return findAttachments(part.parts, found);
			return acc;
		},
		acc
	);
}

function getAttachmentsDownloadLink(
	messageId: string,
	messageSubject: string,
	attachments: Array<string>
): string {
	if (attachments.length > 1) {
		return `/service/home/~/?auth=co&id=${messageId}&filename=${messageSubject}&charset=UTF-8&part=${attachments.join(
			','
		)}&disp=a&fmt=zip`;
	}
	return `/service/home/~/?auth=co&id=${messageId}&part=${attachments.join(',')}&disp=a`;
}

function getAttachmentsLink(
	messageId: string,
	messageSubject: string,
	attachments: Array<string>,
	attachmentType: string
): string {
	if (attachments.length > 1) {
		return `/service/home/~/?auth=co&id=${messageId}&filename=${messageSubject}&charset=UTF-8&part=${attachments.join(
			','
		)}&disp=a&fmt=zip`;
	}
	if (includes(['image/gif', 'image/png', 'image/jpeg', 'image/jpg'], attachmentType)) {
		return `/service/preview/image/${messageId}/${attachments.join(',')}/0x0/?quality=high`;
	}
	if (includes(['application/pdf'], attachmentType)) {
		return `/service/preview/pdf/${messageId}/${attachments.join(',')}/?first_page=1`;
	}
	if (
		includes(
			[
				'text/csv',
				'text/plain',
				'application/vnd.ms-excel',
				'application/msword',
				'application/vnd.oasis.opendocument.spreadsheet',
				'application/vnd.oasis.opendocument.presentation',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'application/vnd.oasis.opendocument.text'
			],
			attachmentType
		)
	) {
		return `/service/preview/document/${messageId}/${attachments.join(',')}`;
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
	margin-bottom: ${({ theme }): string => theme.sizes.padding.small};
	&:hover {
		background-color: ${({ theme, background = 'currentColor' }): string =>
			theme.palette[background].hover};
		& ${AttachmentHoverBarContainer} {
			display: flex;
		}
	}
	&:focus {
		background-color: ${({ theme, background = 'currentColor' }): string =>
			theme.palette[background].focus};
	}
	cursor: pointer;
`;

const AttachmentLink = styled.a`
	margin-bottom: ${({ theme }): string => theme.sizes.padding.small};
	position: relative;
	text-decoration: none;
`;

const AttachmentExtension = styled(Text)<{
	background: { color: string };
}>`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 32px;
	height: 32px;
	border-radius: ${({ theme }): string => theme.borderRadius};
	background-color: ${({ background }): string => background.color};
	color: ${({ theme }): string => theme.palette.gray6.regular};
	font-size: calc(${({ theme }): string => theme.sizes.font.small} - 2px);
	text-transform: uppercase;
	margin-right: ${({ theme }): string => theme.sizes.padding.small};
`;

const Attachment: FC<AttachmentType> = ({
	filename,
	size,
	link,
	downloadlink,
	message,
	part,
	iconColors,
	att
}) => {
	const { createPreview } = useContext(PreviewsManagerContext);
	const extension = getFileExtension(att);

	const sizeLabel = useMemo(() => humanFileSize(size), [size]);
	const inputRef = useRef<HTMLAnchorElement>(null);
	const inputRef2 = useRef<HTMLAnchorElement>(null);

	const downloadAttachment = useCallback(() => {
		if (inputRef.current) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			inputRef2.current.value = null;
			inputRef.current.click();
		}
	}, [inputRef]);

	const confirmAction = useCallback(
		(nodes) => {
			soapFetch('CopyToFiles', {
				_jsns: 'urn:zimbraMail',
				mid: message.id,
				part: att.name,
				destinationFolderId: nodes[0].id
			})
				.then(() => {
					getBridgedFunctions()?.createSnackbar({
						key: `calendar-moved-root`,
						replace: true,
						type: 'info',
						hideButton: true,
						label: t('message.snackbar.att_saved', 'Attachment saved in the selected folder'),
						autoHideTimeout: 3000
					});
				})
				.catch(() => {
					getBridgedFunctions()?.createSnackbar({
						key: `calendar-moved-root`,
						replace: true,
						type: 'warning',
						hideButton: true,
						label: t(
							'message.snackbar.att_err',
							'There seems to be a problem when saving, please try again'
						),
						autoHideTimeout: 3000
					});
				});
		},
		[att.name, message.id]
	);

	const isAValidDestination = useCallback((node) => node?.permissions?.can_write_file, []);

	const actionTarget = useMemo(
		() => ({
			title: t('label.select_folder', 'Select folder'),
			confirmAction,
			confirmLabel: t('label.save', 'Save'),
			disabledTooltip: t('label.invalid_destination', 'This node is not a valid destination'),
			allowFiles: false,
			allowFolders: true,
			isValidSelection: isAValidDestination,
			canSelectOpenedFolder: true,
			maxSelection: 1
		}),
		[confirmAction, isAValidDestination]
	);

	const [uploadIntegration, isUploadIntegrationAvailable] = getAction(
		'carbonio_files_action',
		'files-select-nodes',
		actionTarget
	);

	const showEMLPreview = useCallback(() => {
		const conversations = map([message], (msg) => ({
			conversation: msg.conversation,
			subject: msg.subject
		}));

		const printWindow = window.open('', '_blank');
		getMsgsForPrint({ ids: [message.id], part: att?.name })
			.then((res) => {
				const content = getEMLContent({
					messages: res,
					conversations,
					isMsg: true
				});
				if (printWindow && printWindow.top && printWindow.document) {
					printWindow.top.document.title = 'Carbonio';
					printWindow.document.write(content);
					printWindow.focus();
				}
			})
			.catch(() => {
				const errorContent = getErrorPage(t);
				printWindow && printWindow.document.write(errorContent);
			});
	}, [att?.name, message]);

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
					actions: [
						{
							icon: 'DownloadOutline',
							tooltipLabel: t('label.download', 'Download'),
							id: 'DownloadOutline',
							onClick: downloadAttachment
						}
					],
					/** Extension of the file, shown as info */
					extension: att.filename.substring(att.filename.lastIndexOf('.') + 1),
					/** Name of the file, shown as info */
					filename: att.filename,
					/** Size of the file, shown as info */
					size: humanFileSize(att.size)
				});
			} else if (extension === 'EML') {
				showEMLPreview();
			} else if (inputRef2.current) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				inputRef2.current.value = null;
				inputRef2.current.click();
			}
		},
		[
			att.contentType,
			att.filename,
			att.size,
			createPreview,
			downloadAttachment,
			extension,
			link,
			showEMLPreview
		]
	);

	return (
		<AttachmentContainer
			orientation="horizontal"
			mainAlignment="flex-start"
			height="fit"
			background="gray3"
		>
			<Tooltip key={`${message.id}-Preview`} label={t('action.click_preview', 'Click to preview')}>
				<Row
					padding={{ all: 'small' }}
					mainAlignment="flex-start"
					onClick={preview}
					takeAvailableSpace
				>
					<AttachmentExtension
						background={find(iconColors, (ic) => ic.extension === extension) ?? { color: '' }}
					>
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
						<Tooltip key={uploadIntegration?.id} label={t('label.save_to_files', 'Save to Files')}>
							<IconButton
								size="medium"
								icon={uploadIntegration?.icon ?? ''}
								onClick={uploadIntegration?.click ?? noop}
							/>
						</Tooltip>
					)}

					{/* <FilePreview att={att} link={link} /> */}
					<Padding right="small">
						<Tooltip key={`${message.id}-DownloadOutline`} label={t('label.download', 'Download')}>
							<IconButton size="medium" icon="DownloadOutline" onClick={downloadAttachment} />
						</Tooltip>
					</Padding>
				</AttachmentHoverBarContainer>
			</Row>
			<AttachmentLink
				rel="noopener"
				ref={inputRef2}
				target="_blank"
				href={`/service/home/~/?auth=co&id=${message.id}&part=${part}`}
			/>
			<AttachmentLink ref={inputRef} rel="noopener" target="_blank" href={downloadlink} />
		</AttachmentContainer>
	);
};

const copyToFiles = (att: AttachmentPartType, message: MailMessage, nodes: any): Promise<any> =>
	soapFetch('CopyToFiles', {
		_jsns: 'urn:zimbraMail',
		mid: message.id,
		part: att.name,
		destinationFolderId: nodes?.[0]?.id
	});

const AttachmentsBlock: FC<{ message: MailMessage }> = ({ message }): ReactElement => {
	const [expanded, setExpanded] = useState(false);
	const attachments = useMemo(() => findAttachments(message?.parts, []), [message]);
	const attachmentsCount = useMemo(() => attachments?.length, [attachments]);
	const attachmentsParts = useMemo(() => map(attachments, 'name'), [attachments]);
	const theme = useTheme();
	const actionsDownloadLink = useMemo(
		() => getAttachmentsDownloadLink(message.id, message.subject, attachmentsParts),
		[message, attachmentsParts]
	);

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const iconColors = useMemo(
		() =>
			uniqBy(
				map(attachments, (att) => {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
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

	const confirmAction = useCallback(
		(nodes) => {
			const promises = map(attachments, (att) => copyToFiles(att, message, nodes));
			Promise.allSettled(promises).then((res) => {
				const allSuccess = res.length === filter(res, ['status', 'fulfilled'])?.length;
				const allFails = res.length === filter(res, ['status', 'rejected'])?.length;
				const type = allSuccess ? 'info' : 'warning';
				// eslint-disable-next-line no-nested-ternary
				const label = allSuccess
					? t(
							'message.snackbar.all_att_saved',
							'Attachments successfully saved in the selected folder'
					  )
					: allFails
					? t(
							'message.snackbar.att_err',
							'There seems to be a problem when saving, please try again'
					  )
					: t(
							'message.snackbar.some_att_fails',
							'There seems to be a problem when saving some files, please try again'
					  );
				getBridgedFunctions()?.createSnackbar({
					key: `calendar-moved-root`,
					replace: true,
					type,
					hideButton: true,
					label,
					autoHideTimeout: 4000
				});
			});
		},
		[attachments, message]
	);

	const isAValidDestination = useCallback((node) => node?.permissions?.can_write_file, []);

	const actionTarget = useMemo(
		() => ({
			title: t('label.select_folder', 'Select folder'),
			confirmAction,
			confirmLabel: t('label.save', 'Save'),
			disabledTooltip: t('label.invalid_destination', 'This node is not a valid destination'),
			allowFiles: false,
			allowFolders: true,
			isValidSelection: isAValidDestination,
			canSelectOpenedFolder: true,
			maxSelection: 1
		}),
		[confirmAction, isAValidDestination]
	);

	const [uploadIntegration, isUploadIntegrationAvailable] = getAction(
		'carbonio_files_action',
		'files-select-nodes',
		actionTarget
	);

	return attachmentsCount > 0 ? (
		<Container crossAlignment="flex-start" padding={{ horizontal: 'medium' }}>
			<Container orientation="horizontal" mainAlignment="space-between" wrap="wrap">
				{map(expanded ? attachments : attachments?.slice(0, 2), (att, index) => (
					<Attachment
						key={`att-${att.filename}-${index}`}
						filename={att?.filename}
						size={att.size}
						link={getAttachmentsLink(message.id, message.subject, [att.name], att.contentType)}
						downloadlink={getAttachmentsDownloadLink(message.id, message.subject, [att.name])}
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
							<Row onClick={(): void => setExpanded(false)} style={{ cursor: 'pointer' }}>
								<Padding right="small">
									<Text color="primary">
										{`${attachmentsCount} ${t('label.attachment_plural', 'Attachments')}`}
									</Text>
								</Padding>
								<Icon icon="ArrowIosUpward" color="primary" />
							</Row>
						) : (
							<Row onClick={(): void => setExpanded(true)} style={{ cursor: 'pointer' }}>
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
						defaultValue_plural: 'Download all'
					})}
				</Link>
				{isUploadIntegrationAvailable && (
					<Link
						size="medium"
						onClick={uploadIntegration && uploadIntegration.click}
						style={{ paddingLeft: '8px' }}
					>
						{t('label.save_to_files', 'Save to Files')}
					</Link>
				)}
			</AttachmentsActions>
		</Container>
	) : (
		<></>
	);
};
export default AttachmentsBlock;
