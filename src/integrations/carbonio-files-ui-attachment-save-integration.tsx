/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import {
	ErrorSoapBodyResponse,
	t,
	useIntegratedFunction
} from '@zextras/carbonio-shell-ui';
import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { useAttachmentSaveActionStore } from 'store/attachment-save-actions/store';
import { CopyToFileRequest, CopyToFileResponse } from 'types/details-pannel';
import { NodeWithMetadata } from 'types/integrations/carbonio-files-ui';

/**
 * Registers the built-in carbonio-files-ui save integration into the attachment hover bar.
 *
 * This hook must be called from a React component (AttachmentsBlock) because it needs
 * access to React hooks (useSnackbar, useIntegratedFunction) to wire up snackbar feedback
 * and the node picker integration.
 *
 * It registers one save action:
 *  - 'carbonio-files-ui:save' → "Save to Files"
 *
 * The action is unregistered when the component unmounts.
 */
export const useRegisterFilesAttachmentSaveIntegration = (): void => {
	const createSnackbar = useSnackbar();
	const [selectNodes, isSelectNodesAvailable] = useIntegratedFunction('select-nodes');

	useEffect(() => {
		if (!isSelectNodesAvailable) {
			return undefined;
		}

		useAttachmentSaveActionStore.getState().register({
			id: 'carbonio-files-ui:save',
			label: t('label.save_to_files', 'Save to Files'),
			icon: 'DriveOutline',
			onClick: (ctx) => {
				selectNodes({
					title: t('label.select_folder', 'Select folder'),
					confirmLabel: t('label.save', 'Save'),
					disabledTooltip: t('label.invalid_destination', 'This node is not a valid destination'),
					allowFiles: false,
					allowFolders: true,
					canCreateFolder: true,
					isValidSelection: (node: { permissions?: { can_write_file?: boolean } }) =>
						node?.permissions?.can_write_file,
					maxSelection: 1,
					canSelectOpenedFolder: true,
					confirmAction: (nodes: NodeWithMetadata[]) => {
						legacySoapFetch<CopyToFileRequest, CopyToFileResponse | ErrorSoapBodyResponse>(
							'CopyToFiles',
							{
								_jsns: 'urn:zimbraMail',
								mid: ctx.messageId,
								part: ctx.partName,
								destinationFolderId: nodes[0].id
							}
						)
							.then((res) => {
								if (!('Fault' in res)) {
									createSnackbar({
										key: 'save-to-files',
										replace: true,
										severity: 'info',
										hideButton: true,
										label: t(
											'message.snackbar.att_saved',
											'Attachment saved in the selected folder'
										),
										autoHideTimeout: 3000
									});
								} else {
									createSnackbar({
										key: 'save-to-files',
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
									key: 'save-to-files',
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
					}
				});
			}
		});

		return (): void => {
			useAttachmentSaveActionStore.getState().unregister('carbonio-files-ui:save');
		};
	}, [createSnackbar, isSelectNodesAvailable, selectNodes]);
};
