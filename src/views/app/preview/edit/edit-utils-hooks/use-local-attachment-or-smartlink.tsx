/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { useModal } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';

import { BASE_64_CONVERSION_RATE } from './constants';
import { SmartlinkFromLocalModal } from '../parts/smartlink-modal/smartlink-from-local-modal';
import { useEditorAttachments, useEditorsStore } from 'store/editor';

type UseLocalAttachmentOrSmartlinkArgs = {
	editorId: string;
};

type UseLocalAttachmentOrSmartlinkResult = {
	addLocalFiles: (files: File[]) => void;
	maxAllowedMailSize: number;
	BASE_64_CONVERSION_RATE: number;
};

/**
 * Custom hook that provides file attachment functionality with size validation.
 * When files exceed the maximum allowed mail size, it shows the SmartlinkFromLocalModal
 * to allow the user to choose between uploading to Files or creating smart links.
 *
 * @param editorId - The ID of the editor
 * @returns An object containing the addFiles function, maxAllowedMailSize, and BASE_64_CONVERSION_RATE
 */
export const useLocalAttachmentOrSmartlink = ({
	editorId
}: UseLocalAttachmentOrSmartlinkArgs): UseLocalAttachmentOrSmartlinkResult => {
	const { addStandardAttachments } = useEditorAttachments(editorId);
	const editor = useEditorsStore((state) => state.editors[editorId]);
	const maxMessageSize = useUserSettings().attrs?.zimbraMtaMaxMessageSize;
	const maxAllowedMailSize = parseInt(maxMessageSize as string, 10);
	const { createModal, closeModal } = useModal();

	/**
	 * Adds files as either attachments or smartlinks based on size validation.
	 * If the total size (editor + files) exceeds the maximum allowed mail size,
	 * it shows the SmartlinkFromLocalModal to offer smartlink alternatives.
	 *
	 * @param files - Array of File objects to be processed
	 */
	const addLocalFiles = useCallback(
		(files: File[]): void => {
			const filesSize = files.reduce((acc, file) => acc + file.size, 0);
			const calculatedEditorSizeWithFiles = editor.size + filesSize * BASE_64_CONVERSION_RATE;
			const modalId = 'smartlink-from-local-modal';

			if (calculatedEditorSizeWithFiles < maxAllowedMailSize) {
				addStandardAttachments(files, {});
			} else {
				createModal(
					{
						id: modalId,
						maxHeight: '90vh',
						size: 'medium',
						onClose: (): void => {
							closeModal(modalId);
						},
						children: (
							<SmartlinkFromLocalModal
								onClose={(): void => closeModal(modalId)}
								files={files}
								editorId={editorId}
							/>
						)
					},
					true
				);
			}
		},
		[addStandardAttachments, closeModal, createModal, editor.size, editorId, maxAllowedMailSize]
	);

	return {
		addLocalFiles,
		maxAllowedMailSize,
		BASE_64_CONVERSION_RATE
	};
};
