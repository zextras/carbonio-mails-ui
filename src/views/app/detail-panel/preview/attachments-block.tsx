/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useContext, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import {
	Button,
	Container,
	Dropdown,
	DropdownItem,
	getColor,
	Icon,
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
	useAppContext,
	useIntegratedFunction
} from '@zextras/carbonio-shell-ui';
import { PreviewsManagerContext } from '@zextras/carbonio-ui-preview';
import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
import { filter, includes, map } from 'lodash';
import { useTranslation } from 'react-i18next';

import {
	PreviewSaveAttachmentProviderContext,
	usePreviewSaveAttachmentProviders
} from './preview-utils-hooks/use-preview-save-attachment-providers';
import {
	getAttachmentIconColors,
	getAttachmentsDownloadLink,
	getAttachmentsLink,
	getLocationOrigin
} from './utils';
import { AppContext } from 'app-utils/app-context-initializer';
import { getAttachmentExtension, useAttachmentIconColor } from 'helpers/attachments';
import { openEmlStandalonePreview } from 'helpers/external-tabs';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { deleteAttachmentsEmailStoreAction } from 'store/emails/actions/delete-attachments-action';
import { AttachmentType, CopyToFileRequest, CopyToFileResponse } from 'types/details-pannel';
import {
	ArrayOneOrMore,
	NodeWithMetadata,
	SelectNodesFunctionArgs
} from 'types/integrations/carbonio-files-ui';
import { AttachmentPart, MailMessage } from 'types/messages';
import DeleteAttachmentModal from 'views/app/detail-panel/preview/delete-attachment-modal';
import {
	humanFileSize,
	isDocument,
	previewType
} from 'views/app/detail-panel/preview/file-preview';

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

const AttachmentContainer = styled(Row)`
	border-radius: 0.125rem;
	transition: background-color 0.2s ease-out;
	cursor: pointer;
	&:hover {
		background-color: ${({ theme, background = 'currentColor' }): string =>
			getColor(`${background}.hover`, theme)};
		& ${AttachmentHoverBarContainer} {
			display: flex;
		}
	}
`;

const DropdownStretchWrapper = styled.div`
	align-self: stretch;
	display: flex;
`;

const FullHeightButtonWrapper = styled.div`
	height: 100%;
	transition: background-color 0.2s ease-out;
	&:hover {
		background-color: ${({ theme }): string => getColor('gray3.hover', theme)};
	}
	& > * {
		height: 100%;
		grid-template-rows: 100%;
	}
	& * {
		background-color: transparent !important;
	}
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

const Attachment = ({
	filename,
	size,
	link,
	downloadlink,
	messageId,
	isEml = false,
	part,
	att
}: AttachmentType): React.JSX.Element => {
	const [t] = useTranslation();
	const { createPreview } = useContext(PreviewsManagerContext);
	const extension = getAttachmentExtension(att.contentType, att.filename).value;
	const { createSnackbar, createModal, closeModal } = useUiUtilities();
	const { servicesCatalog } = useAppContext<AppContext>();

	const inputRef = useRef<HTMLAnchorElement>(null);
	const inputRef2 = useRef<HTMLAnchorElement>(null);

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
		deleteAttachmentsEmailStoreAction({ id: messageId, attachments: [part] });
	}, [messageId, part]);

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
				onClose: (): void => {
					closeModal(id);
				},
				children: (
					<DeleteAttachmentModal
						onClose={(): void => closeModal(id)}
						onDownloadAndDelete={onDownloadAndDelete}
						onDeleteAttachment={onDeleteAttachment}
					/>
				)
			},
			true
		);
	}, [closeModal, createModal, onDeleteAttachment, onDownloadAndDelete]);

	const confirmAction = useCallback(
		(nodes: { id: string }[]) => {
			legacySoapFetch<CopyToFileRequest, CopyToFileResponse | ErrorSoapBodyResponse>(
				'CopyToFiles',
				{
					_jsns: 'urn:zimbraMail',
					mid: messageId,
					part: att.name,
					destinationFolderId: nodes[0].id
				}
			)
				.then((res) => {
					if (!('Fault' in res)) {
						createSnackbar({
							key: `mail-moved-root`,
							replace: true,
							severity: 'info',
							hideButton: true,
							label: t('message.snackbar.att_saved', 'Attachment saved in the selected folder'),
							autoHideTimeout: 3000
						});
					} else {
						createSnackbar({
							key: `mail-moved-root`,
							replace: true,
							severity: 'warning',
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
						severity: 'warning',
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
	const isAValidDestination = useCallback(
		(node: { permissions?: { can_write_file?: boolean } }) => node?.permissions?.can_write_file,
		[]
	);

	const actionTarget = useMemo(
		() => ({
			title: t('label.select_folder', 'Select folder'),
			confirmAction,
			confirmLabel: t('label.save', 'Save'),
			disabledTooltip: t('label.invalid_destination', 'This node is not a valid destination'),
			allowFiles: false,
			allowFolders: true,
			canCreateFolder: true,
			isValidSelection: isAValidDestination,
			maxSelection: 1,
			canSelectOpenedFolder: true
		}),
		[confirmAction, isAValidDestination, t]
	);

	const [uploadIntegration, isUploadIntegrationAvailable] = getIntegratedFunction('select-nodes');

	const [openDropdown, setOpenDropdown] = useState(false);

	const saveContext = useMemo<PreviewSaveAttachmentProviderContext>(
		() => ({
			attachments: [
				{
					filename: filename ?? '',
					contentType: att.contentType,
					size,
					downloadUrl: downloadlink
				}
			]
		}),
		[filename, att.contentType, size, downloadlink]
	);

	const saveProviders = usePreviewSaveAttachmentProviders(saveContext);

	const dropdownItems = useMemo<DropdownItem[]>(() => {
		const items: DropdownItem[] = [];

		items.push({
			id: 'download',
			label: t('label.download', 'Download'),
			icon: 'DownloadOutline',
			onClick: downloadAttachment
		});

		if (isUploadIntegrationAvailable) {
			items.push({
				id: 'save-to-files',
				label: t('label.save_to_files', 'Save to Files'),
				icon: 'DriveOutline',
				onClick: (): void => {
					uploadIntegration?.(actionTarget);
				}
			});
		}

		saveProviders.forEach((provider) => {
			items.push({
				id: provider.id,
				label: provider.label,
				icon: provider.icon,
				onClick: (): void => {
					provider.execute();
				}
			});
		});

		if (isAvailable && pType === 'vcard') {
			items.push({
				id: 'import-contacts',
				label: t('label.import_to_contacts', 'Import to Contacts'),
				icon: 'UploadOutline',
				onClick: onCreateContact
			});
		}

		if (!isEml) {
			items.push({
				id: 'delete',
				label: t('label.delete', 'Delete'),
				icon: 'DeletePermanentlyOutline',
				onClick: removeAttachment
			});
		}

		return items;
	}, [
		isUploadIntegrationAvailable,
		uploadIntegration,
		actionTarget,
		saveProviders,
		downloadAttachment,
		isEml,
		removeAttachment,
		isAvailable,
		pType,
		onCreateContact,
		t
	]);

	const showEMLPreview = useCallback(() => {
		openEmlStandalonePreview({ messageId, part });
	}, [messageId, part]);

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
		(ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
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
					extension: att?.filename?.substring(att.filename.lastIndexOf('.') + 1),
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

	const sizeLabel = useMemo(() => humanFileSize(size), [size]);
	const attachmentExtensionContent = useMemo(() => extension, [extension]);

	const attachItemColor = useAttachmentIconColor(att);
	const attachmentExtensionColor = useMemo(() => attachItemColor, [attachItemColor]);

	return (
		<Row
			width={'calc(50% - 0.25rem)'}
			orientation="horizontal"
			mainAlignment="flex-start"
			background={'transparent'}
			padding={{ bottom: 'small' }}
		>
			<Container
				width={'100%'}
				orientation="horizontal"
				mainAlignment="flex-start"
				height="100%"
				background={'gray3'}
				data-testid={`attachment-container-${filename}`}
			>
				<AttachmentContainer
					orientation="horizontal"
					mainAlignment="flex-start"
					height="fit-content"
					takeAvailableSpace
					background={'gray3'}
				>
					<Tooltip key={`${messageId}-Preview`} label={actionTooltipText}>
						<Row
							height={'fill'}
							padding={{ all: 'small' }}
							mainAlignment="flex-start"
							onClick={preview}
							takeAvailableSpace
						>
							<AttachmentExtension $background={attachmentExtensionColor}>
								{attachmentExtensionContent}
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
							<Padding right="small">
								<Tooltip
									key={`${messageId}-DownloadOutline`}
									label={t('label.download', 'Download')}
								>
									<Button
										type={'ghost'}
										color={'gray0'}
										data-testid={`download-attachment-${filename}`}
										size="medium"
										icon="DownloadOutline"
										onClick={downloadAttachment}
									/>
								</Tooltip>
							</Padding>
							{!isEml && (
								<Padding right="small">
									<Tooltip
										key={`${messageId}-DeletePermanentlyOutline`}
										label={t('label.delete', 'Delete')}
									>
										<Button
											type={'ghost'}
											color={'gray0'}
											data-testid={`remove-attachments-${filename}`}
											size="medium"
											icon="DeletePermanentlyOutline"
											onClick={removeAttachment}
										/>
									</Tooltip>
								</Padding>
							)}
						</AttachmentHoverBarContainer>
					</Row>
				</AttachmentContainer>
				{!isEml && (
					<Tooltip label={t('label.view_all_actions', 'View all actions')}>
						<DropdownStretchWrapper>
							<Dropdown
								items={dropdownItems}
								style={{ height: '100%' }}
								onOpen={(): void => {
									setOpenDropdown(true);
								}}
								onClose={(): void => {
									setOpenDropdown(false);
								}}
							>
								<Row width={'fit'} height={'100%'}>
									<FullHeightButtonWrapper>
										<Button
											style={{ alignSelf: 'stretch' }}
											type={'ghost'}
											color={'gray0'}
											size="medium"
											data-testid={`attachment-actions-${filename}`}
											icon={openDropdown ? 'ChevronUpOutline' : 'ChevronDownOutline'}
											onClick={(): undefined => undefined}
										/>
									</FullHeightButtonWrapper>
								</Row>
							</Dropdown>
						</DropdownStretchWrapper>
					</Tooltip>
				)}
				<AttachmentLink
					rel="noopener"
					ref={inputRef2}
					target="_blank"
					href={`${getLocationOrigin()}/service/home/~/?auth=co&id=${messageId}&part=${part}`}
				/>
				<AttachmentLink ref={inputRef} rel="noopener" target="_blank" href={downloadlink} />
			</Container>
		</Row>
	);
};

const copyToFiles = (
	att: AttachmentPart,
	messageId: string,
	nodes: ArrayOneOrMore<NodeWithMetadata>
): Promise<CopyToFileResponse> =>
	legacySoapFetch('CopyToFiles', {
		_jsns: 'urn:zimbraMail',
		mid: messageId,
		part: att.name,
		destinationFolderId: nodes?.[0]?.id
	});
type AttachmentsBlockProps = {
	messageId: MailMessage['id'];
	messageSubject: MailMessage['subject'];
	messageAttachments: MailMessage['attachments'];
	isEml?: boolean;
};
const AttachmentsBlock = ({
	isEml = false,
	messageId,
	messageSubject,
	messageAttachments
}: AttachmentsBlockProps): React.JSX.Element => {
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

	// Context with all attachments — passed to external providers for the "save all" links.
	const saveAllContext = useMemo<PreviewSaveAttachmentProviderContext>(
		() => ({
			attachments: attachments.map((att) => ({
				filename: att.filename ?? '',
				contentType: att.contentType ?? '',
				size: att.size ?? 0,
				downloadUrl: getAttachmentsDownloadLink({
					messageId,
					messageSubject,
					attachments: [att.name]
				})
			}))
		}),
		[attachments, messageId, messageSubject]
	);
	const saveProvidersForLinks = usePreviewSaveAttachmentProviders(saveAllContext);

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

	const confirmAction = useCallback<SelectNodesFunctionArgs['confirmAction']>(
		(nodes) => {
			const promises = map(attachments, (att) => copyToFiles(att, messageId, nodes));
			Promise.allSettled(promises).then((res: CopyToFileResponse[]) => {
				const isFault = res.length === filter(res, (r) => r?.value?.Fault)?.length;
				const allSuccess = isFault
					? false
					: res.length === filter(res, ['status', 'fulfilled'])?.length;
				const allFails = res.length === filter(res, ['status', 'rejected'])?.length;
				const severity = allSuccess ? 'info' : 'warning';
				const label = getLabel({ allSuccess, allFails });
				createSnackbar({
					key: `calendar-moved-root`,
					replace: true,
					severity,
					hideButton: true,
					label,
					autoHideTimeout: 4000
				});
			});
		},
		[attachments, createSnackbar, getLabel, messageId]
	);

	const isAValidDestination = useCallback(
		(node: { permissions?: { can_write_file?: boolean } }) => node?.permissions?.can_write_file,
		[]
	);

	const actionTarget = useMemo(
		() => ({
			title: t('label.select_folder', 'Select folder'),
			confirmAction,
			confirmLabel: t('label.save', 'Save'),
			disabledTooltip: t('label.invalid_destination', 'This node is not a valid destination'),
			allowFiles: false,
			allowFolders: true,
			canCreateFolder: true,
			isValidSelection: isAValidDestination,
			maxSelection: 1,
			canSelectOpenedFolder: true
		}),
		[confirmAction, isAValidDestination, t]
	);

	const [uploadIntegration, isUploadIntegrationAvailable] = getIntegratedFunction('select-nodes');

	const getSaveToFilesLink = useCallback((): ReactElement | null => {
		if (!isUploadIntegrationAvailable) {
			return null;
		}

		return (
			<Link
				size="medium"
				onClick={(): void => {
					uploadIntegration?.(actionTarget);
				}}
				style={{ paddingLeft: '0.5rem' }}
			>
				{t('label.save_to_files', 'Save to Files')}
			</Link>
		);
	}, [actionTarget, isUploadIntegrationAvailable, t, uploadIntegration]);

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
						isEml={isEml}
						part={att?.name ?? ''}
						iconColors={getAttachmentIconColors({ attachments, theme })}
						// TODO FIX TYPE ISSUE
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						att={att}
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
											defaultValue: 'Show all {{count}} attachments'
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
				{saveProvidersForLinks.map((provider) => (
					<Link
						key={provider.id}
						size="medium"
						onClick={(): void => {
							provider.execute();
						}}
						style={{ paddingLeft: '0.5rem' }}
					>
						{provider.label}
					</Link>
				))}
			</Row>
		</Container>
	) : (
		<></>
	);
};
export default AttachmentsBlock;
