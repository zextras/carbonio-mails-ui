/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { type DropdownItem } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { COMMAND_PRIORITY_LOW, type LexicalEditor } from 'lexical';

import { OPEN_IMAGE_MODAL_COMMAND, SET_INLINE_IMAGE_ALIGNMENT_COMMAND } from '../image-plugin';
import { type ImageAlignment } from '../nodes/image-node';
import {
	uploadAndInsertInlineImages,
	type UploadInlineImagesHandler
} from '../use-inline-image-upload';

type ImageActions = {
	alignImage: (alignment: ImageAlignment) => void;
	imageAlignItems: Array<DropdownItem>;
	openImageModal: () => void;
	onImageFilesSelected: (event: ChangeEvent<HTMLInputElement>) => void;
	imageModalOpen: boolean;
	setImageModalOpen: (open: boolean) => void;
};

export function useImageActions(
	editor: LexicalEditor,
	onUploadInlineImages?: UploadInlineImagesHandler
): ImageActions {
	const [imageModalOpen, setImageModalOpen] = useState(false);

	useEffect(
		() =>
			editor.registerCommand(
				OPEN_IMAGE_MODAL_COMMAND,
				() => {
					setImageModalOpen(true);
					return true;
				},
				COMMAND_PRIORITY_LOW
			),
		[editor]
	);

	const alignImage = useCallback(
		(alignment: ImageAlignment): void => {
			editor.dispatchCommand(SET_INLINE_IMAGE_ALIGNMENT_COMMAND, alignment);
		},
		[editor]
	);

	const openImageModal = useCallback((): void => {
		setImageModalOpen(true);
	}, []);

	const onImageFilesSelected = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			const fileList = event.target.files;
			if (!fileList?.length || !onUploadInlineImages) {
				return;
			}
			uploadAndInsertInlineImages(editor, onUploadInlineImages, Array.from(fileList));
			event.target.value = '';
		},
		[onUploadInlineImages, editor]
	);

	const imageAlignItems = useMemo<Array<DropdownItem>>(
		() => [
			{
				id: 'image-left',
				label: t('lexical-label.align_left', 'Align left'),
				onClick: () => alignImage('left')
			},
			{
				id: 'image-center',
				label: t('lexical-label.align_center', 'Center'),
				onClick: () => alignImage('center')
			},
			{
				id: 'image-right',
				label: t('lexical-label.align_right', 'Align right'),
				onClick: () => alignImage('right')
			}
		],
		[alignImage]
	);

	return {
		alignImage,
		imageAlignItems,
		openImageModal,
		onImageFilesSelected,
		imageModalOpen,
		setImageModalOpen
	};
}
