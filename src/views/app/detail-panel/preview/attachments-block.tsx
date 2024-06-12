/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useContext, useMemo, useRef, useState } from 'react';

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
import { getIntegratedFunction, soapFetch, SoapResponse, t } from '@zextras/carbonio-shell-ui';
import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';
import { filter, map } from 'lodash';
import styled from 'styled-components';

import DeleteAttachmentModal from './delete-attachment-modal';
import { humanFileSize, previewType } from './file-preview';
import {
	getAttachmentIconColors,
	getAttachmentsDownloadLink,
	getAttachmentsLink,
	getLocationOrigin
} from './utils';
import { getFileExtension } from '../../../../commons/utilities';
import { useAttachmentIconColor } from '../../../../helpers/attachments';
import { useAppDispatch } from '../../../../hooks/redux';
import { useUiUtilities } from '../../../../hooks/use-ui-utilities';
import { getMsgsForPrint } from '../../../../store/actions';
import { deleteAttachments } from '../../../../store/actions/delete-all-attachments';
import { StoreProvider } from '../../../../store/redux';
import type {
	AttachmentPart,
	AttachmentType,
	CopyToFileRequest,
	CopyToFileResponse,
	MailMessage,
	OpenEmlPreviewType
} from '../../../../types';
import { useExtraWindow } from '../../extra-windows/use-extra-window';

/**
 * The BE currently doesn't support the preview of PDF attachments
 * whose part name consists in more than 2 numbers (which is common
 * for attachments nested inside an EML. Example: 1.3.2)
 *
 * As a workaround we intercept those cases and handle them
 * with the browser pdf preview
 *
 * TODO remove it when IRIS-3918 will be implemented
 */
const UNSUPPORTED_PDF_ATTACHMENT_PARTNAME_PATTERN = /\d+\.\d+\../;

const AttachmentHoverBarContainer = styled(Container)`
	display: none;
	height: 0;
`;

const AttachmentContainer = styled(Container).attrs(
	(props: { requiresSmartLinkConversion: boolean }) => ({
		requiresSmartLinkConversion: props.requiresSmartLinkConversion
	})
)`
	border-bottom: ${(props): string =>
		props.requiresSmartLinkConversion
			? `1px solid ${props.theme.palette.primary.regular}`
			: 'none'};

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

const Attachment: FC<AttachmentType> = ({
	filename,
	size,
	link,
	downloadlink,
	message,
	isExternalMessage = false,
	part,
	att,
	openEmlPreview
}) => {
	const { createPreview } = useContext(PreviewsManagerContext);
	const { isInsideExtraWindow } = useExtraWindow();
	const extension = getFileExtension(att).value;
	const { createSnackbar, createModal } = useUiUtilities();

	const inputRef = useRef<HTMLAnchorElement>(null);
	const inputRef2 = useRef<HTMLAnchorElement>(null);
	const dispatch = useAppDispatch();

	const downloadAttachment = useCallback(() => {
		if (inputRef.current) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			inputRef2.current.value = null;
			inputRef.current.click();
		}
	}, [inputRef]);

	// TODO remove it when IRIS-3918 will be implemented
	const browserPdfPreview = useCallback(() => {
		if (inputRef2.current) {
			inputRef2.current.click();
		}
	}, [inputRef2]);

	const isEML = extension === 'EML';

	const actionTooltipText = isEML
		? t('action.click_open', 'Click to open')
		: t('action.click_preview', 'Click to preview');

	const onDeleteAttachment = useCallback(() => {
		dispatch(deleteAttachments({ id: message.id, attachments: [part] }));
	}, [dispatch, message.id, part]);

	const onDownloadAndDelete = useCallback(() => {
		downloadAttachment();
		onDeleteAttachment();
	}, [downloadAttachment, onDeleteAttachment]);

	const removeAttachment = useCallback(() => {
		const closeModal = createModal(
			{
				maxHeight: '90vh',
				children: (
					<StoreProvider>
						<DeleteAttachmentModal
							onClose={(): void => closeModal()}
							onDownloadAndDelete={onDownloadAndDelete}
							onDeleteAttachment={onDeleteAttachment}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [createModal, onDeleteAttachment, onDownloadAndDelete]);

	const confirmAction = useCallback(
		(nodes) => {
			soapFetch<CopyToFileRequest, SoapResponse<CopyToFileResponse>>('CopyToFiles', {
				_jsns: 'urn:zimbraMail',
				mid: message.id,
				part: att.name,
				destinationFolderId: nodes[0].id
			})
				.then((res) => {
					if (!res.Body.Fault) {
						createSnackbar({
							key: `mail-moved-root`,
							replace: true,
							type: 'info',
							hideButton: true,
							label: t('message.snackbar.att_saved', 'Attachment saved in the selected folder'),
							autoHideTimeout: 3000
						});
					} else {
						createSnackbar({
							key: `mail-moved-root`,
							replace: true,
							type: 'warning',
							hideButton: true,
							label: t(
								'message.snackbar.att_err',
								'There seems to be a problem when saving, please try again'
							),
							autoHideTimeout: 3000
						});
					}
				})
				.catch(() => {
					createSnackbar({
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
		[att.name, createSnackbar, message.id]
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

	const [uploadIntegration, isUploadIntegrationAvailable] = getIntegratedFunction('select-nodes');

	const showEMLPreview = useCallback(() => {
		getMsgsForPrint({ ids: [message.id], part: att?.name })
			.then((res) => {
				openEmlPreview && openEmlPreview(message.id, att?.name, res[0]);
			})
			.catch(() => {
				createSnackbar({
					key: `eml-attachment-failed-download`,
					replace: true,
					type: 'error',
					hideButton: true,
					label: t(
						'message.snackbar.eml_download_failed',
						'The EML attachment could not be downloaded. Try later'
					),
					autoHideTimeout: 3000
				});
			});
	}, [att?.name, createSnackbar, message.id, openEmlPreview]);

	const preview = useCallback(
		(ev) => {
			ev.preventDefault();
			const pType = previewType(att.contentType);

			if (pType) {
				// TODO remove the condition and the conditional block when IRIS-3918 will be implemented
				if (pType === 'pdf' && att.name.match(UNSUPPORTED_PDF_ATTACHMENT_PARTNAME_PATTERN)) {
					browserPdfPreview();
				} else {
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
				}
			} else if (isEML) {
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
			att.name,
			att.size,
			browserPdfPreview,
			createPreview,
			downloadAttachment,
			isEML,
			link,
			showEMLPreview
		]
	);

	const theme = useTheme();
	const requiresSmartLinkConversion = !!att.requiresSmartLinkConversion;

	const sizeLabel = useMemo(() => humanFileSize(size), [size]);
	const backgroundColor = useMemo(() => {
		if (requiresSmartLinkConversion) {
			return theme.palette.infoBanner.regular;
		}
		return 'gray3';
	}, [requiresSmartLinkConversion, theme.palette.infoBanner.regular]);

	const attachmentExtensionContent = useMemo(
		() =>
			requiresSmartLinkConversion ? (
				<Icon icon="Link2Outline" size="large" color="primary" />
			) : (
				extension
			),
		[extension, requiresSmartLinkConversion]
	);

	const attachItemColor = useAttachmentIconColor(att);
	const attachmentExtensionColor = useMemo(
		() => (requiresSmartLinkConversion ? 'transparent' : attachItemColor),
		[attachItemColor, requiresSmartLinkConversion]
	);

	return (
		<AttachmentContainer
			orientation="horizontal"
			mainAlignment="flex-start"
			height="fit"
			background={backgroundColor}
			data-testid={`attachment-container-${filename}`}
			requiresSmartLinkConversion={requiresSmartLinkConversion}
		>
			<Tooltip key={`${message.id}-Preview`} label={actionTooltipText}>
				<Row
					padding={{ all: 'small' }}
					mainAlignment="flex-start"
					onClick={preview}
					takeAvailableSpace
				>
					<AttachmentExtension background={attachmentExtensionColor}>
						{attachmentExtensionContent}
					</AttachmentExtension>
					<Row orientation="vertical" crossAlignment="flex-start" takeAvailableSpace>
						{requiresSmartLinkConversion && <Padding top="small" />}
						<Padding style={{ width: '100%' }} bottom="extrasmall">
							<Text>
								{filename ||
									t('label.attachement_unknown', {
										mimeType: att?.contentType,
										defaultValue: 'Unknown <{{mimeType}}>'
									})}
							</Text>
						</Padding>
						{!requiresSmartLinkConversion ? (
							<Text color="gray1" size="small">
								{sizeLabel}
							</Text>
						) : (
							<Padding top="small" />
						)}
					</Row>
				</Row>
			</Tooltip>
			<Row orientation="horizontal" crossAlignment="center">
				<AttachmentHoverBarContainer orientation="horizontal">
					{isUploadIntegrationAvailable && !isInsideExtraWindow && (
						<Tooltip
							key={`${message.id}-DriveOutline`}
							label={
								isInsideExtraWindow
									? t(
											'label.extra_window.save_to_files_disabled',
											'Files’ attachments saving is available only from the main tab'
										)
									: t('label.save_to_files', 'Save to Files')
							}
						>
							<IconButton
								size="medium"
								icon="DriveOutline"
								onClick={(): void => {
									uploadIntegration && uploadIntegration(actionTarget);
								}}
							/>
						</Tooltip>
					)}

					<Padding right="small">
						<Tooltip key={`${message.id}-DownloadOutline`} label={t('label.download', 'Download')}>
							<IconButton size="medium" icon="DownloadOutline" onClick={downloadAttachment} />
						</Tooltip>
					</Padding>
					{!isExternalMessage && (
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
					)}
				</AttachmentHoverBarContainer>
			</Row>
			<AttachmentLink
				rel="noopener"
				ref={inputRef2}
				target="_blank"
				href={`${getLocationOrigin()}/service/home/~/?auth=co&id=${message.id}&part=${part}`}
			/>
			<AttachmentLink ref={inputRef} rel="noopener" target="_blank" href={downloadlink} />
		</AttachmentContainer>
	);
};

const copyToFiles = (
	att: AttachmentPart,
	message: MailMessage,
	nodes: any
): Promise<CopyToFileResponse> =>
	soapFetch('CopyToFiles', {
		_jsns: 'urn:zimbraMail',
		mid: message.id,
		part: att.name,
		destinationFolderId: nodes?.[0]?.id
	});

const AttachmentsBlock: FC<{
	message: MailMessage;
	isExternalMessage?: boolean;
	openEmlPreview?: OpenEmlPreviewType;
}> = ({ message, isExternalMessage = false, openEmlPreview }): ReactElement => {
	const { createSnackbar } = useUiUtilities();
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
			Promise.allSettled(promises).then((res: CopyToFileResponse[]) => {
				const isFault = res.length === filter(res, (r) => r?.value?.Fault)?.length;
				const allSuccess = isFault
					? false
					: res.length === filter(res, ['status', 'fulfilled'])?.length;
				const allFails = res.length === filter(res, ['status', 'rejected'])?.length;
				const type = allSuccess ? 'info' : 'warning';
				const label = getLabel({ allSuccess, allFails });
				createSnackbar({
					key: `calendar-moved-root`,
					replace: true,
					type,
					hideButton: true,
					label,
					autoHideTimeout: 4000
				});
			});
		},
		[attachments, createSnackbar, message]
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

	const [uploadIntegration, isUploadIntegrationAvailable] = getIntegratedFunction('select-nodes');

	const { isInsideExtraWindow } = useExtraWindow();

	const getSaveToFilesLink = useCallback((): ReactElement | null => {
		if (!isUploadIntegrationAvailable || isInsideExtraWindow) {
			return null;
		}

		return (
			<Link
				size="medium"
				onClick={(): void => {
					uploadIntegration && uploadIntegration(actionTarget);
				}}
				style={{ paddingLeft: '0.5rem' }}
			>
				{t('label.save_to_files', 'Save to Files')}
			</Link>
		);
	}, [actionTarget, isInsideExtraWindow, isUploadIntegrationAvailable, uploadIntegration]);

	return attachmentsCount > 0 ? (
		<Container crossAlignment="flex-start">
			<Container orientation="horizontal" mainAlignment="space-between" wrap="wrap">
				{map(expanded ? attachments : attachments?.slice(0, 2), (att, index) => (
					<Attachment
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
						isExternalMessage={isExternalMessage}
						part={att?.name ?? ''}
						iconColors={getAttachmentIconColors({ attachments, theme })}
						att={att}
						openEmlPreview={openEmlPreview}
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

				<Link target="_blank" size="medium" href={actionsDownloadLink}>
					{t('label.download', {
						count: attachmentsCount,
						defaultValue: 'Download',
						defaultValue_plural: 'Download all'
					})}
				</Link>
				{getSaveToFilesLink()}
			</Row>
		</Container>
	) : (
		<></>
	);
};
export default AttachmentsBlock;
