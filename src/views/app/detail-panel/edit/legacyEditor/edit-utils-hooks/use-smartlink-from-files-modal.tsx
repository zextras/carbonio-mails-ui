/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { useModal } from '@zextras/carbonio-design-system';

import { FileNode } from './use-upload-from-files';
import { SmartlinkFromFilesModal } from '../parts/smartlink-modal/smartlink-from-files-modal';

type UseSmartlinkFromFilesModalResult = {
	openSmartlinkFromFilesModal: (fileNodes: Array<FileNode>) => void;
};

/**
 * Custom hook that opens the SmartlinkFromFilesModal, which proposes to add the given
 * files from Files app to the editor as smart links instead of attachments
 *
 * @param editorId - The ID of the editor
 * @returns An object containing the openSmartlinkFromFilesModal function
 */
export const useSmartlinkFromFilesModal = ({
	editorId
}: {
	editorId: string;
}): UseSmartlinkFromFilesModalResult => {
	const { createModal, closeModal } = useModal();

	const openSmartlinkFromFilesModal = useCallback(
		(fileNodes: Array<FileNode>): void => {
			const modalId = 'smartlink-from-files-modal';
			createModal(
				{
					id: modalId,
					maxHeight: '90vh',
					size: 'medium',
					onClose: (): void => {
						closeModal(modalId);
					},
					children: (
						<SmartlinkFromFilesModal
							onClose={(): void => closeModal(modalId)}
							fileNodes={fileNodes}
							editorId={editorId}
						/>
					)
				},
				true
			);
		},
		[closeModal, createModal, editorId]
	);

	return {
		openSmartlinkFromFilesModal
	};
};
