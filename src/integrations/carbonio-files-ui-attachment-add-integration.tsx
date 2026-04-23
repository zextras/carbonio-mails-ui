/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect } from 'react';

import { useModal, useSnackbar } from '@zextras/carbonio-design-system';
import { t, useIntegratedFunction, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, map } from 'lodash';

import { useAttachmentAddActionStore } from 'store/attachment-add-actions/store';
import { useEditorsStore } from 'store/editor/store';
import { ArrayOneOrMore, NodeWithMetadata } from 'types/integrations/carbonio-files-ui';
import { BASE_64_CONVERSION_RATE } from 'views/app/detail-panel/edit/edit-utils-hooks/constants';
import {
	FileNode,
	isValidFileNode,
	UploadToTargetIntegratedFunction
} from 'views/app/detail-panel/edit/edit-utils-hooks/use-upload-from-files';
import { SmartlinkFromFilesModal } from 'views/app/detail-panel/edit/parts/smartlink-modal/smartlink-from-files-modal';

/**
 * Registers the built-in carbonio-files-ui integrations into the composer dropdown.
 *
 * This hook must be called from a React component (AddAttachmentsDropdown) because it
 * needs access to React hooks (useModal, useIntegratedFunction, useSnackbar) to wire
 * up the smartlink modal and upload snackbar feedback.
 *
 * It registers two dropdown entries:
 *  - 'carbonio-files-ui:attach'  → "Add from Files"
 *  - 'carbonio-files-ui:link'    → "Add public link from Files"
 *
 * Each entry is unregistered when the component unmounts.
 */
export const useRegisterFilesAttachmentAddIntegrations = (): void => {
	const { createModal, closeModal } = useModal();
	const createSnackbar = useSnackbar();
	const maxMessageSizeStr = useUserSettings().attrs?.zimbraMtaMaxMessageSize as string | undefined;
	const maxAllowedMailSize = parseInt(maxMessageSizeStr ?? '0', 10);

	const [selectNodes, isSelectNodesAvailable] = useIntegratedFunction('select-nodes');
	const [uploadTo, isUploadAvailable] = useIntegratedFunction('upload-to-target-and-get-target-id');
	const [getLink, isGetLinkAvailable] = useIntegratedFunction('get-link');

	// "Add from Files" integration
	useEffect(() => {
		if (!isSelectNodesAvailable || !isUploadAvailable) {
			return undefined;
		}

		useAttachmentAddActionStore.getState().register({
			id: 'carbonio-files-ui:attach',
			label: t('composer.attachment.files', 'Add from Files'),
			icon: 'DriveOutline',
			onClick: (ctx) => {
				selectNodes({
					title: t('label.choose_file', 'Choose file'),
					confirmLabel: t('label.select', 'Select'),
					allowFiles: true,
					allowFolders: false,
					confirmAction: (nodes: ArrayOneOrMore<NodeWithMetadata>) => {
						const fileNodes = nodes.filter(isValidFileNode) as FileNode[];

						const filesSize = fileNodes.reduce((acc, file) => acc + file.size, 0);
						const calculatedEditorSizeWithFiles =
							ctx.currentEditorSize + filesSize * BASE_64_CONVERSION_RATE;

						if (calculatedEditorSizeWithFiles < ctx.maxAllowedSize) {
							// Files fit within the size limit — upload and attach directly.
							const promises = map(fileNodes, (node) =>
								(uploadTo as UploadToTargetIntegratedFunction)({
									nodeId: node.id,
									targetModule: 'MAILS'
								}).then(({ attachmentId }) => {
									useEditorsStore.getState().addUnsavedAttachments(ctx.editorId, [
										{
											filename: node.name,
											contentType: node.mime_type,
											size: node.size,
											aid: attachmentId,
											isInline: false,
											uploadStatus: { status: 'completed', progress: 0 }
										}
									]);
								})
							);

							Promise.allSettled(promises).then((res) => {
								const success = filter(res, ['status', 'fulfilled']);
								const allSuccess = res.length === success.length;
								const allFails = res.length === filter(res, ['status', 'rejected']).length;
								createSnackbar({
									key: 'files-attachment',
									replace: false,
									severity: allSuccess ? 'info' : 'warning',
									hideButton: true,
									label: allSuccess
										? t('message.snackbar.all_att_added', 'Attachments added successfully')
										: allFails
											? t(
													'message.snackbar.att_err_adding',
													'There seems to be a problem when adding attachments, please try again'
												)
											: t(
													'message.snackbar.some_att_add_fails',
													'There seems to be a problem when adding some attachments, please try again'
												),
									autoHideTimeout: 4000
								});
							});
						} else {
							// Files exceed the size limit — offer the smartlink alternative.
							const modalId = 'smartlink-from-files-modal';
							createModal(
								{
									id: modalId,
									maxHeight: '90vh',
									size: 'medium',
									onClose: (): void => closeModal(modalId),
									children: (
										<SmartlinkFromFilesModal
											onClose={(): void => closeModal(modalId)}
											fileNodes={fileNodes}
											editorId={ctx.editorId}
										/>
									)
								},
								true
							);
						}
					}
				});
			}
		});

		return (): void => {
			useAttachmentAddActionStore.getState().unregister('carbonio-files-ui:attach');
		};
	}, [
		closeModal,
		createModal,
		createSnackbar,
		isSelectNodesAvailable,
		isUploadAvailable,
		maxAllowedMailSize,
		selectNodes,
		uploadTo
	]);

	// "Add public link from Files" integration
	useEffect(() => {
		if (!isSelectNodesAvailable || !isGetLinkAvailable) {
			return undefined;
		}

		useAttachmentAddActionStore.getState().register({
			id: 'carbonio-files-ui:link',
			label: t('composer.attachment.url', 'Add public link from Files'),
			icon: 'Link2',
			onClick: (ctx) => {
				selectNodes({
					title: t('label.choose_file', 'Choose file'),
					confirmLabel: t('label.share_public_link', 'Share Public Link'),
					allowFiles: true,
					allowFolders: false,
					confirmAction: (nodes: ArrayOneOrMore<NodeWithMetadata>) => {
						const promises = map(nodes, (node) =>
							getLink({ node, type: 'createLink', description: node.id })
						);

						Promise.allSettled(promises).then((res) => {
							const success = filter(res, ['status', 'fulfilled']) as Array<{
								status: 'fulfilled';
								value: { url?: string | null };
							}>;
							const allSuccess = res.length === success.length;
							const allFails = res.length === filter(res, ['status', 'rejected']).length;

							createSnackbar({
								key: 'public-link',
								replace: true,
								severity: allSuccess ? 'info' : 'warning',
								hideButton: true,
								label: allSuccess
									? t('message.snackbar.all_link_copied', 'Public link copied successfully')
									: allFails
										? t(
												'message.snackbar.link_copying_error',
												'There seems to be a problem while generating public link, please try again'
											)
										: t(
												'message.snackbar.some_link_copying_error',
												'There seems to be a problem while generating public url for some files, please try again'
											),
								autoHideTimeout: 4000
							});

							ctx.onLinksInserted(
								success.map((r) => ({ url: r.value?.url ?? '' })).filter((l) => l.url)
							);
						});
					}
				});
			}
		});

		return (): void => {
			useAttachmentAddActionStore.getState().unregister('carbonio-files-ui:link');
		};
	}, [createSnackbar, getLink, isGetLinkAvailable, isSelectNodesAvailable, selectNodes]);
};
