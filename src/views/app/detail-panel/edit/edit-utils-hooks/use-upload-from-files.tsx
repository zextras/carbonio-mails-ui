/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { t, useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { filter, map } from 'lodash';

export type FileNode = { id: string; name: string; size: number; mime_type: string };

export type UploadToTargetIntegratedFunction = (arg: {
	nodeId: string;
	targetModule: string;
}) => Promise<{ attachmentId: string }>;

export const uploadToTarget = async (
	node: FileNode,
	uploadTo: UploadToTargetIntegratedFunction
): Promise<{ attachmentId: string }> => uploadTo({ nodeId: node.id, targetModule: 'MAILS' });

export type UploadMetadata = {
	attachmentId: string;
	fileName: string;
	contentType: string;
	size: number;
};

export type UseUploadFromFilesResult = Array<PromiseSettledResult<UploadMetadata>>;

export type UseUploadFromFilesParams = {
	onComplete: (filesResponse: UseUploadFromFilesResult) => void;
};

export const useUploadFromFiles = ({
	onComplete
}: UseUploadFromFilesParams): [(nodes: Array<FileNode>) => void, boolean] => {
	const [uploadTo, isAvailable] = useIntegratedFunction('upload-to-target-and-get-target-id');
	const createSnackbar = useSnackbar();

	const confirmAction = useCallback(
		(nodes: Array<FileNode>) => {
			const promises = map(nodes, (node) =>
				uploadToTarget(node, uploadTo as UploadToTargetIntegratedFunction).then<UploadMetadata>(
					({ attachmentId }) => ({
						attachmentId,
						fileName: node.name,
						contentType: node.mime_type,
						size: node.size
					})
				)
			);

			if (isAvailable) {
				Promise.allSettled(promises).then((res) => {
					const success = filter(res, ['status', 'fulfilled']);
					const allSuccess = res.length === success?.length;
					const allFails = res.length === filter(res, ['status', 'rejected'])?.length;
					const severity = allSuccess ? 'info' : 'warning';
					// eslint-disable-next-line no-nested-ternary
					const label = allSuccess
						? t('message.snackbar.all_att_added', 'Attachments added successfully')
						: allFails
							? t(
									'message.snackbar.att_err_adding',
									'There seems to be a problem when adding attachments, please try again'
								)
							: t(
									'message.snackbar.some_att_add_fails',
									'There seems to be a problem when adding some attachments, please try again'
								);
					createSnackbar({
						key: `calendar-moved-root`,
						replace: true,
						severity,
						hideButton: true,
						label,
						autoHideTimeout: 4000
					});

					onComplete(success);
				});
			}
		},
		[isAvailable, uploadTo, createSnackbar, onComplete]
	);
	return [confirmAction, isAvailable];
};
