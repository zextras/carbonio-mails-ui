/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useRef } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
	$getNodeByKey,
	$getSelection,
	$isNodeSelection,
	CLICK_COMMAND,
	COMMAND_PRIORITY_LOW,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
	type NodeKey
} from 'lexical';

import { ImageResizer } from './image-resizer';
import { type ImageDimension, OPEN_IMAGE_MODAL_COMMAND } from './image-types';

export type ImageComponentProps = {
	nodeKey: NodeKey;
	src: string;
	altText: string;
	width: ImageDimension;
	height: ImageDimension;
	onResize: (width: number, height: number) => void;
};

function dimensionToStyle(value: ImageDimension): number | undefined {
	return value === 'inherit' ? undefined : value;
}

/**
 * React view for an inline image node. Makes the image selectable (click to
 * select, Delete/Backspace to remove) and, while selected, renders the
 * {@link ImageResizer} drag handles. Mirrors the Lexical playground behavior.
 *
 * While the editor is editable the image is natively draggable, so that it can
 * be moved to another position of the body; the drag and the drop are handled by
 * the `ImagePlugin`.
 *
 * Resize is committed back to the node through the `onResize` callback provided
 * by the node's `decorate()`, so this component does not depend on the node
 * module (avoiding an import cycle).
 */
export const ImageComponent = ({
	nodeKey,
	src,
	altText,
	width,
	height,
	onResize
}: ImageComponentProps): React.JSX.Element => {
	const [editor] = useLexicalComposerContext();
	const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
	const imageRef = useRef<HTMLImageElement>(null);

	const onDelete = useCallback(
		(event: KeyboardEvent): boolean => {
			if (isSelected && $isNodeSelection($getSelection())) {
				event.preventDefault();
				$getNodeByKey(nodeKey)?.remove();
				return true;
			}
			return false;
		},
		[isSelected, nodeKey]
	);

	// Double-clicking an image selects it and opens the Insert/Edit Image dialog,
	// which then reads the selected node to pre-fill its fields.
	const onDoubleClick = useCallback(
		(event: React.MouseEvent): void => {
			event.preventDefault();
			clearSelection();
			setSelected(true);
			editor.dispatchCommand(OPEN_IMAGE_MODAL_COMMAND, undefined);
		},
		[clearSelection, editor, setSelected]
	);

	useEffect(
		() =>
			mergeRegister(
				editor.registerCommand<MouseEvent>(
					CLICK_COMMAND,
					(event) => {
						if (event.target === imageRef.current) {
							event.preventDefault();
							if (event.shiftKey) {
								setSelected(!isSelected);
							} else {
								clearSelection();
								setSelected(true);
							}
							return true;
						}
						return false;
					},
					COMMAND_PRIORITY_LOW
				),
				editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
				editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW)
			),
		[clearSelection, editor, isSelected, onDelete, setSelected]
	);

	const isEditable = useLexicalEditable();
	const resizable = isSelected && isEditable;

	return (
		<span
			className={`mails-lexical-image-wrapper${isSelected ? ' mails-lexical-image-selected' : ''}`}
		>
			<img
				ref={imageRef}
				src={src}
				alt={altText}
				draggable={isEditable}
				onDoubleClick={onDoubleClick}
				style={{
					width: dimensionToStyle(width),
					height: dimensionToStyle(height),
					maxWidth: '100%'
				}}
			/>
			{resizable && (
				<ImageResizer
					imageRef={imageRef}
					onResizeStart={(): void => setSelected(true)}
					onResizeEnd={onResize}
				/>
			)}
		</span>
	);
};
