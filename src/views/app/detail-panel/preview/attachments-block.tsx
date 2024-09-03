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
import {
	ErrorSoapBodyResponse,
	getIntegratedFunction,
	soapFetch,
	useAppContext,
	useIntegratedFunction
} from '@zextras/carbonio-shell-ui';
import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';
import { filter, includes, map } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import DeleteAttachmentModal from './delete-attachment-modal';
import { humanFileSize, isDocument, previewType } from './file-preview';
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
	AppContext,
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
	messageId,
	isExternalMessage = false,
	part,
	att,
	openEmlPreview
}) => {
	const [t] = useTranslation();
	const { createPreview } = useContext(PreviewsManagerContext);
	const { isInsideExtraWindow } = useExtraWindow();
	const extension = getFileExtension(att).value;
	const { createSnackbar, createModal, closeModal } = useUiUtilities();
	const { servicesCatalog } = useAppContext<AppContext>();

	const inputRef = useRef<HTMLAnchorElement>(null);
	const inputRef2 = useRef<HTMLAnchorElement>(null);
	const dispatch = useAppDispatch();

	const pType = previewType(att.contentType);
	const [createContact, isAvailable] = useIntegratedFunction('create_contact_from_vcard');
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

	const onDeleteAttachment = useCallback(() => {
		dispatch(deleteAttachments({ id: messageId, attachments: [part] }));
	}, [dispatch, messageId, part]);

	const onDownloadAndDelete = useCallback(() => {
		downloadAttachment();
		onDeleteAttachment();
	}, [downloadAttachment, onDeleteAttachment]);

	const removeAttachment = useCallback(() => {
		const id = Date.now().toString();
		createModal(
			{
				id,
				maxHeight: '90vh',
				children: (
					<StoreProvider>
						<DeleteAttachmentModal
							onClose={(): void => closeModal(id)}
							onDownloadAndDelete={onDownloadAndDelete}
							onDeleteAttachment={onDeleteAttachment}
						/>
					</StoreProvider>
				)
			},
			true
		);
	}, [closeModal, createModal, onDeleteAttachment, onDownloadAndDelete]);

	const confirmAction = useCallback(
		(nodes) => {
			soapFetch<CopyToFileRequest, CopyToFileResponse | ErrorSoapBodyResponse>('CopyToFiles', {
				_jsns: 'urn:zimbraMail',
				mid: messageId,
				part: att.name,
				destinationFolderId: nodes[0].id
			})
				.then((res) => {
					if (!('Fault' in res)) {
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
		[att.name, createSnackbar, messageId, t]
	);
	const onCreateContact = useCallback(() => {
		createContact({ messageId, part });
	}, [createContact, messageId, part]);
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
		[confirmAction, isAValidDestination, t]
	);

	const [uploadIntegration, isUploadIntegrationAvailable] = getIntegratedFunction('select-nodes');

	const showEMLPreview = useCallback(() => {
		getMsgsForPrint({ ids: [messageId], part: att?.name })
			.then((res) => {
				openEmlPreview && openEmlPreview(messageId, att?.name, res[0]);
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
	}, [att?.name, createSnackbar, messageId, openEmlPreview, t]);

	const isCarbonioPreviewAvailable = useMemo(
		() => includes(servicesCatalog, 'carbonio-preview'),
		[servicesCatalog]
	);

	const isCarbonioDocsEditorAvailable = useMemo(
		() => includes(servicesCatalog, 'carbonio-docs-editor'),
		[servicesCatalog]
	);

	const isContentTypeDocument = isDocument(att.contentType);
	const isPDFDocument = pType === 'pdf' && !isContentTypeDocument;
	const isPreviewedByCarbonioPreview =
		(isPDFDocument || pType === 'image') && isCarbonioPreviewAvailable;

	const isPreviewedByCarbonioDocsEditor =
		pType === 'pdf' && isContentTypeDocument && isCarbonioDocsEditorAvailable;

	const isPreviewedByBrowser =
		isPDFDocument &&
		(att.name.match(UNSUPPORTED_PDF_ATTACHMENT_PARTNAME_PATTERN) || !isCarbonioPreviewAvailable);

	const actionTooltipText = useMemo(() => {
		if (isEML) {
			return t('action.click_open', 'Click to open');
		}
		if (isPreviewedByCarbonioPreview || isPreviewedByCarbonioDocsEditor || isPreviewedByBrowser) {
			return t('action.click_preview', 'Click to preview');
		}
		return t('action.click_download', 'Click to download');
	}, [
		isEML,
		isPreviewedByBrowser,
		isPreviewedByCarbonioDocsEditor,
		isPreviewedByCarbonioPreview,
		t
	]);

	const preview = useCallback(
		(ev) => {
			ev.preventDefault();
			// TODO remove the condition and the conditional block when IRIS-3918 will be implemented
			if (isPreviewedByBrowser) {
				browserPdfPreview();
			} else if (isPreviewedByCarbonioPreview || isPreviewedByCarbonioDocsEditor) {
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
			att.filename,
			att.size,
			browserPdfPreview,
			createPreview,
			downloadAttachment,
			isEML,
			isPreviewedByBrowser,
			isPreviewedByCarbonioDocsEditor,
			isPreviewedByCarbonioPreview,
			link,
			pType,
			showEMLPreview,
			t
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
			<Tooltip key={`${messageId}-Preview`} label={actionTooltipText}>
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
							key={`${messageId}-DriveOutline`}
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
						<Tooltip key={`${messageId}-DownloadOutline`} label={t('label.download', 'Download')}>
							<IconButton
								data-testid={`download-attachment-${filename}`}
								size="medium"
								icon="DownloadOutline"
								onClick={downloadAttachment}
							/>
						</Tooltip>
					</Padding>
					{!isExternalMessage && (
						<Padding right="small">
							<Tooltip
								key={`${messageId}-DeletePermanentlyOutline`}
								label={t('label.delete', 'Delete')}
							>
								<IconButton
									data-testid={`remove-attachments-${filename}`}
									size="medium"
									icon="DeletePermanentlyOutline"
									onClick={removeAttachment}
								/>
							</Tooltip>
						</Padding>
					)}
					{isAvailable && pType === 'vcard' && (
						<Padding right="small">
							<Tooltip
								key={`${messageId}-UploadOutline`}
								label={t('label.import_to_contacts', 'Import to Contacts')}
							>
								<IconButton
									data-testid={`import-contacts-${filename}`}
									size="medium"
									icon="UploadOutline"
									onClick={onCreateContact}
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
				href={`${getLocationOrigin()}/service/home/~/?auth=co&id=${messageId}&part=${part}`}
			/>
			<AttachmentLink ref={inputRef} rel="noopener" target="_blank" href={downloadlink} />
		</AttachmentContainer>
	);
};

const copyToFiles = (
	att: AttachmentPart,
	messageId: string,
	nodes: any
): Promise<CopyToFileResponse> =>
	soapFetch('CopyToFiles', {
		_jsns: 'urn:zimbraMail',
		mid: messageId,
		part: att.name,
		destinationFolderId: nodes?.[0]?.id
	});

const AttachmentsBlock: FC<{
	messageId: MailMessage['id'];
	messageSubject: MailMessage['subject'];
	messageAttachments: MailMessage['attachments'];
	isExternalMessage?: boolean;
	openEmlPreview?: OpenEmlPreviewType;
}> = ({
	isExternalMessage = false,
	openEmlPreview,
	messageId,
	messageSubject,
	messageAttachments
}): ReactElement => {
	const [t] = useTranslation();
	const { createSnackbar } = useUiUtilities();
	const [expanded, setExpanded] = useState(false);
	const attachments = useMemo(
		() => filter(messageAttachments, { cd: 'attachment' }),
		[messageAttachments]
	);

	const attachmentsCount = useMemo(() => attachments?.length || 0, [attachments]);
	const attachmentsParts = useMemo(() => map(attachments, 'name'), [attachments]);
	const theme = useTheme();
	const actionsDownloadLink = useMemo(
		() =>
			getAttachmentsDownloadLink({
				messageId,
				messageSubject,
				attachments: attachmentsParts
			}),
		[messageId, messageSubject, attachmentsParts]
	);

	const getLabel = useCallback(
		({ allSuccess, allFails }: { allSuccess: boolean; allFails: boolean }): string => {
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
		},
		[t]
	);

	const confirmAction = useCallback(
		(nodes) => {
			const promises = map(attachments, (att) => copyToFiles(att, messageId, nodes));
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
		[attachments, createSnackbar, getLabel, messageId]
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
		[confirmAction, isAValidDestination, t]
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
	}, [actionTarget, isInsideExtraWindow, isUploadIntegrationAvailable, t, uploadIntegration]);

	const attachmentsLabel = t('label.attachment', {
		count: attachmentsCount,
		defaultValue_one: '{{count}} attachment',
		defaultValue_other: '{{count}} attachments'
	});

	return attachmentsCount > 0 ? (
		<Container crossAlignment="flex-start">
			<Container orientation="horizontal" mainAlignment="space-between" wrap="wrap">
				{map(expanded ? attachments : attachments?.slice(0, 2), (att, index) => (
					<Attachment
						key={`att-${att.filename}-${index}`}
						filename={att?.filename}
						size={att?.size ?? 0}
						link={getAttachmentsLink({
							messageId,
							messageSubject,
							attachments: [att.name],
							attachmentType: att.contentType
						})}
						downloadlink={getAttachmentsDownloadLink({
							messageId,
							messageSubject,
							attachments: [att.name]
						})}
						messageId={messageId}
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
					{attachmentsCount > 0 && attachmentsCount <= 2 && (
						<Text color="gray1">{attachmentsLabel}</Text>
					)}
					{attachmentsCount > 2 &&
						(expanded ? (
							<Row
								data-testid="attachment-list-collapse-link"
								onClick={(): void => setExpanded(false)}
								style={{ cursor: 'pointer' }}
							>
								<Padding right="small">
									<Text color="primary">{attachmentsLabel}</Text>
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
										{t('label.show_all_attachments', {
											count: attachmentsCount,
											defaultValue_one: 'Show attachment',
											defaultValue_other: 'Show all {{count}} attachments'
										})}
									</Text>
								</Padding>
								<Icon icon="ArrowIosDownward" color="primary" />
							</Row>
						))}{' '}
				</Padding>

				<Link target="_blank" size="medium" href={actionsDownloadLink}>
					{t('label.download', {
						count: attachmentsCount,
						defaultValue_one: 'Download',
						defaultValue_other: 'Download all'
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
