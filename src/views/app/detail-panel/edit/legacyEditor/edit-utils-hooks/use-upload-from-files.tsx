/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { t, useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { filter, map } from 'lodash';

import { PAYLOAD_TOO_LARGE_STATUS } from './constants';

export type FileNode = {
	id: string;
	name: string;
	size: number;
	mime_type: string;
	__typename: 'File' | 'Folder';
};

export function isValidFileNode(obj: unknown): obj is FileNode {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		typeof (obj as FileNode).id === 'string' &&
		typeof (obj as FileNode).name === 'string' &&
		(((obj as FileNode).__typename === 'File' &&
			typeof (obj as FileNode).size === 'number' &&
			typeof (obj as FileNode).mime_type === 'string') ||
			(obj as FileNode).__typename === 'Folder')
	);
}

export type UploadToTargetIntegratedFunction = (arg: {
	nodeId: string;
	targetModule: string;
}) => Promise<{ attachmentId: string }>;

/**
 * Rejection reason of the Files `upload-to-target-and-get-target-id` integrated function
 */
export type UploadToTargetError = {
	status: number;
	statusText: string;
};

export function isFileSizeExceededError(reason: unknown): reason is UploadToTargetError {
	return (
		typeof reason === 'object' &&
		reason !== null &&
		(reason as UploadToTargetError).status === PAYLOAD_TOO_LARGE_STATUS
	);
}

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
	/**
	 * Called with the nodes refused by the server because they exceed the allowed size.
	 * When it is set, these failures are not reported by the snackbar
	 */
	onFileSizeExceeded?: (nodes: Array<FileNode>) => void;
};

function getFeedback(
	res: UseUploadFromFilesResult,
	failsCount: number
): { severity: 'info' | 'warning'; label: string } {
	if (failsCount === 0) {
		return {
			severity: 'info',
			label: t('message.snackbar.all_att_added', 'Attachments added successfully')
		};
	}
	if (failsCount === res.length) {
		return {
			severity: 'warning',
			label: t(
				'message.snackbar.att_err_adding',
				'There seems to be a problem when adding attachments, please try again'
			)
		};
	}
	return {
		severity: 'warning',
		label: t(
			'message.snackbar.some_att_add_fails',
			'There seems to be a problem when adding some attachments, please try again'
		)
	};
}

export const useUploadFromFiles = ({
	onComplete,
	onFileSizeExceeded
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
					const isHandledSizeExceeded = (result: PromiseSettledResult<UploadMetadata>): boolean =>
						!!onFileSizeExceeded &&
						result.status === 'rejected' &&
						isFileSizeExceededError(result.reason);
					// the settled results do not carry the node, so they are matched by index
					const sizeExceededNodes = filter(nodes, (_node, index) =>
						isHandledSizeExceeded(res[index])
					);
					const otherResults = filter(res, (result) => !isHandledSizeExceeded(result));

					if (otherResults.length > 0) {
						const { severity, label } = getFeedback(
							otherResults,
							filter(otherResults, ['status', 'rejected']).length
						);
						createSnackbar({
							key: `calendar-moved-root`,
							replace: false,
							severity,
							hideButton: true,
							label,
							autoHideTimeout: 4000
						});
					}

					onComplete(success);

					if (sizeExceededNodes.length > 0) {
						onFileSizeExceeded?.(sizeExceededNodes);
					}
				});
			}
		},
		[isAvailable, uploadTo, createSnackbar, onComplete, onFileSizeExceeded]
	);
	return [confirmAction, isAvailable];
};
