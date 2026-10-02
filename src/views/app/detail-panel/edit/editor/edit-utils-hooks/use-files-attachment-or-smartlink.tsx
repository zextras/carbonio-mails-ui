/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';

import { BASE_64_CONVERSION_RATE } from './constants';
import { useSmartlinkFromFilesModal } from './use-smartlink-from-files-modal';
import { FileNode } from './use-upload-from-files';
import { useEditorsStore } from 'store/editor';

type UseFilesAttachmentOrSmartlinkArgs = {
	editorId: string;
	onUploadFiles: (fileNodes: FileNode[]) => void;
};

type UseFilesAttachmentOrSmartlinkResult = {
	addFilesFromFiles: (fileNodes: FileNode[]) => Promise<null> | void;
};

/**
 * Custom hook that provides Files attachment functionality with size validation.
 * When files from Files app exceed the maximum allowed mail size, it shows the
 * SmartlinkFromFilesModal to allow the user to choose between uploading or creating smart links.
 *
 * @param editorId - The ID of the editor
 * @param onUploadFiles - Callback to execute when files should be uploaded
 * @returns An object containing the addFilesFromFiles function
 */
export const useFilesAttachmentOrSmartlink = ({
	editorId,
	onUploadFiles
}: UseFilesAttachmentOrSmartlinkArgs): UseFilesAttachmentOrSmartlinkResult => {
	const editor = useEditorsStore((state) => state.editors[editorId]);
	const maxMessageSize = useUserSettings().attrs?.zimbraMtaMaxMessageSize;
	const maxAllowedMailSize = parseInt(maxMessageSize as string, 10);
	const { openSmartlinkFromFilesModal } = useSmartlinkFromFilesModal({ editorId });

	/**
	 * Adds files from Files app as either attachments or smartlinks based on size validation.
	 * If the total size (editor + files) exceeds the maximum allowed mail size,
	 * it shows the SmartlinkFromFilesModal to offer smartlink alternatives.
	 *
	 * @param fileNodes - Array of FileNode objects from Files app to be processed
	 */
	const addFilesFromFiles = useCallback(
		(fileNodes: FileNode[]): Promise<null> | void => {
			const filesSize = fileNodes.reduce((acc, file) => acc + file.size, 0);
			const calculatedEditorSizeWithFiles = editor.size + filesSize * BASE_64_CONVERSION_RATE;

			if (calculatedEditorSizeWithFiles < maxAllowedMailSize) {
				return onUploadFiles(fileNodes);
			}

			openSmartlinkFromFilesModal(fileNodes);
			return Promise.resolve(null);
		},
		[editor.size, maxAllowedMailSize, onUploadFiles, openSmartlinkFromFilesModal]
	);

	return {
		addFilesFromFiles
	};
};
