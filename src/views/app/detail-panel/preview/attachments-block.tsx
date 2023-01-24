/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Container,
	getColor,
	Icon,
	IconButton,
	Link,
	Padding,
	Row,
	Text,
	Tooltip,
	useTheme
} from '@zextras/carbonio-design-system';
import { getAction, getBridgedFunctions, soapFetch, t } from '@zextras/carbonio-shell-ui';
import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';
import { filter, find, map, noop } from 'lodash';
import React, { FC, ReactElement, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { errorPage } from '../../../../commons/preview-eml/error-page';
import { getEMLContent } from '../../../../commons/preview-eml/get-eml-content';
import { getFileExtension } from '../../../../commons/utilities';
import { getCurrentDocumentBody } from '../../../../commons/utils';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import { getMsgsForPrint } from '../../../../store/actions';
import { deleteAttachments } from '../../../../store/actions/delete-all-attachments';
import { StoreProvider } from '../../../../store/redux';
import {
	AttachmentPart,
	AttachmentType,
	GetMsgRequest,
	GetMsgResponse,
	MailMessage
} from '../../../../types';
import DeleteAttachmentModal from './delete-attachment-modal';
import { humanFileSize, previewType } from './file-preview';
import { getAttachmentIconColors, getAttachmentsDownloadLink, getAttachmentsLink } from './utils';

const AttachmentHoverBarContainer = styled(Container)`
	display: none;
	height: 0;
`;

const AttachmentContainer = styled(Container)`
	border-radius: 0.125rem;
	width: calc(50% - 0.25rem);
	transition: 0.2s ease-out;
	margin-bottom: ${({ theme }): string => theme.sizes.padding.small};
	&:hover {
		background-color: ${({ theme, background = 'currentColor' }): string =>
			getColor(`${background}.hover`, theme)};
		& ${AttachmentHoverBarContainer} {
			display: flex;
		}
	}
	&:focus {
		background-color: ${({ theme, background = 'currentColor' }): string =>
			getColor(`${background}.focus`, theme)};
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
	width: 2rem;
	height: 2rem;
	border-radius: ${({ theme }): string => theme.borderRadius};
	background-color: ${({ background }): string => background.color};
	color: ${({ theme }): string => theme.palette.gray6.regular};
	font-size: calc(${({ theme }): string => theme.sizes.font.small} - 0.125rem);
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
	att,
	emlViewerInvoker
}) => {
	const { createPreview } = useContext(PreviewsManagerContext);
	const extension = getFileExtension(att).value;
	const theme = useTheme();

	const sizeLabel = useMemo(() => humanFileSize(size), [size]);
	const inputRef = useRef<HTMLAnchorElement>(null);
	const inputRef2 = useRef<HTMLAnchorElement>(null);
	const dispatch = useDispatch();

	const downloadAttachment = useCallback(() => {
		if (inputRef.current) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			inputRef2.current.value = null;
			inputRef.current.click();
		}
	}, [inputRef]);

	const onDeleteAttachment = useCallback(() => {
		dispatch(deleteAttachments({ id: message.id, attachments: [part] }));
	}, [dispatch, message.id, part]);

	const onDownloadAndDelete = useCallback(() => {
		downloadAttachment();
		onDeleteAttachment();
	}, [downloadAttachment, onDeleteAttachment]);

	const removeAttachment = useCallback(() => {
		const closeModal = getBridgedFunctions()?.createModal(
			{
				maxHeight: '90vh',
				children: (
					<StoreProvider>
						<DeleteAttachmentModal
							// TODO : fix it inside shell
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							onClose={(): void => closeModal()}
							onDownloadAndDelete={onDownloadAndDelete}
							onDeleteAttachment={onDeleteAttachment}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [onDeleteAttachment, onDownloadAndDelete]);

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
		// tempGetMsg(message.id, att?.name)
		// 	.then((msg) => {
		// 		emlViewerInvoker(msg);
		// 	})
		// 	.catch((reason) => {
		// 		console.error(reason);
		// 	});
		// const printWindow = window.open('', '_blank');
		getMsgsForPrint({ ids: [message.id], part: att?.name })
			.then((res) => {
				// const content = getEMLContent({
				// 	messages: res,
				// 	conversations,
				// 	isMsg: true,
				// 	theme
				// });
				// if (printWindow && printWindow.top && printWindow.document) {
				// 	printWindow.top.document.title = 'Carbonio';
				// 	printWindow.document.write(content);
				// 	printWindow.focus();
				// }
				emlViewerInvoker(res[0]);
			})
			.catch(() => {
				const errorContent = errorPage;
				// printWindow && printWindow.document.write(errorContent);
			});
	}, [att?.name, emlViewerInvoker, message]);

	const preview = useCallback(
		(ev) => {
			ev.preventDefault();
			const pType = previewType(att.contentType);

			if (pType) {
				createPreview({
					src: link,
					previewType: pType,
					// container: getCurrentDocumentBody(),
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
			data-testid={`attachment-container-${filename}`}
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
					<Padding right="small">
						<Tooltip
							key={`${message.id}-DeletePermanentlyOutline`}
							label={t('label.delete', 'Delete')}
						>
							<IconButton
								size="medium"
								icon="DeletePermanentlyOutline"
								onClick={removeAttachment}
							/>
						</Tooltip>
					</Padding>
				</AttachmentHoverBarContainer>
			</Row>
			<AttachmentLink
				rel="noopener"
				ref={inputRef2}
				target="_blank"
				href={`https://localhost:9000/service/home/~/?auth=co&id=${message.id}&part=${part}`}
			/>
			<AttachmentLink ref={inputRef} rel="noopener" target="_blank" href={downloadlink} />
		</AttachmentContainer>
	);
};

const copyToFiles = (att: AttachmentPart, message: MailMessage, nodes: any): Promise<any> =>
	soapFetch('CopyToFiles', {
		_jsns: 'urn:zimbraMail',
		mid: message.id,
		part: att.name,
		destinationFolderId: nodes?.[0]?.id
	});

const AttachmentsBlock: FC<{ message: MailMessage; emlViewerInvoker: any }> = ({
	message,
	emlViewerInvoker
}): ReactElement => {
	const [expanded, setExpanded] = useState(false);
	const attachments = useMemo(
		() => filter(message?.attachments, { cd: 'attachment' }),
		[message?.attachments]
	);

	const attachmentsCount = useMemo(() => attachments?.length || 0, [attachments]);
	const attachmentsParts = useMemo(() => map(attachments, 'name'), [attachments]);
	const theme = useTheme();
	const actionsDownloadLink = useMemo(
		() =>
			getAttachmentsDownloadLink({
				messageId: message.id,
				messageSubject: message.subject,
				attachments: attachmentsParts
			}),
		[message, attachmentsParts]
	);

	const getLabel = ({
		allSuccess,
		allFails
	}: {
		allSuccess: boolean;
		allFails: boolean;
	}): string => {
		if (allSuccess) {
			return t(
				'message.snackbar.all_att_saved',
				'Attachments successfully saved in the selected folder'
			);
		}
		if (allFails) {
			return t(
				'message.snackbar.att_err',
				'There seems to be a problem when saving, please try again'
			);
		}
		return t(
			'message.snackbar.some_att_fails',
			'There seems to be a problem when saving some files, please try again'
		);
	};

	const confirmAction = useCallback(
		(nodes) => {
			const promises = map(attachments, (att) => copyToFiles(att, message, nodes));
			Promise.allSettled(promises).then((res) => {
				const allSuccess = res.length === filter(res, ['status', 'fulfilled'])?.length;
				const allFails = res.length === filter(res, ['status', 'rejected'])?.length;
				const type = allSuccess ? 'info' : 'warning';
				const label = getLabel({ allSuccess, allFails });
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
						emlViewerInvoker={emlViewerInvoker}
						key={`att-${att.filename}-${index}`}
						filename={att?.filename}
						size={att?.size ?? 0}
						link={getAttachmentsLink({
							messageId: message.id,
							messageSubject: message.subject,
							attachments: [att.name],
							attachmentType: att.contentType
						})}
						downloadlink={getAttachmentsDownloadLink({
							messageId: message.id,
							messageSubject: message.subject,
							attachments: [att.name]
						})}
						message={message}
						part={att?.name ?? ''}
						iconColors={getAttachmentIconColors({ attachments, theme })}
						att={att}
					/>
				))}
			</Container>
			<Row mainAlignment="flex-start" padding={{ top: 'extrasmall', bottom: 'medium' }}>
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
							<Row
								data-testid="attachment-list-collapse-link"
								onClick={(): void => setExpanded(false)}
								style={{ cursor: 'pointer' }}
							>
								<Padding right="small">
									<Text color="primary">
										{`${attachmentsCount} ${t('label.attachment_plural', 'Attachments')}`}
									</Text>
								</Padding>
								<Icon icon="ArrowIosUpward" color="primary" />
							</Row>
						) : (
							<Row
								data-testid="attachment-list-expand-link"
								onClick={(): void => setExpanded(true)}
								style={{ cursor: 'pointer' }}
							>
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
						style={{ paddingLeft: '0.5rem' }}
					>
						{t('label.save_to_files', 'Save to Files')}
					</Link>
				)}
			</Row>
		</Container>
	) : (
		<></>
	);
};
export default AttachmentsBlock;
