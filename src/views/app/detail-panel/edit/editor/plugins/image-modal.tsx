/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button, Container, Input, Modal, Tooltip } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { $getNodeByKey, $getSelection, $isNodeSelection, type LexicalEditor } from 'lexical';

import { INSERT_INLINE_IMAGE_COMMAND } from './image-plugin';
import { $isImageNode } from './nodes/image-node';
import { type ImageDimension } from './nodes/image-types';

type ImageModalProps = {
	editor: LexicalEditor;
	open: boolean;
	onClose: () => void;
};

/** Turns a stored {@link ImageDimension} into the string shown in the input. */
function dimensionToInput(value: ImageDimension): string {
	return value === 'inherit' ? '' : String(value);
}

/** Turns the input text back into an {@link ImageDimension} (empty/invalid -> 'inherit'). */
function inputToDimension(value: string): ImageDimension {
	const trimmed = value.trim();
	if (trimmed === '') {
		return 'inherit';
	}
	const parsed = Number(trimmed);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 'inherit';
}

/**
 * Modal "Insert/Edit Image" dialog: it collects the image source URL, the
 * alternative description and the width/height. When a single image node is
 * selected the fields are pre-filled so the same dialog edits it in place;
 * otherwise a brand-new inline image is inserted at the caret.
 *
 * The width/height fields can be kept proportional through the aspect-ratio
 * lock: while locked, editing one dimension scales the other using the image's
 * natural ratio (read by loading the source), falling back to the current
 * width/height ratio.
 */
export const ImageModal = ({ editor, open, onClose }: ImageModalProps): React.JSX.Element => {
	const [src, setSrc] = useState('');
	const [altText, setAltText] = useState('');
	const [width, setWidth] = useState('');
	const [height, setHeight] = useState('');
	const [locked, setLocked] = useState(true);
	// Key of the image node being edited (single image selected), if any.
	const editImageKey = useRef<string | null>(null);
	// Natural width/height ratio of the current source, once it has loaded.
	const naturalRatio = useRef<number | null>(null);

	// Pre-fill the fields from the current selection each time the modal opens: a
	// single selected image populates every field for editing, otherwise the
	// dialog starts empty for a fresh insertion.
	useEffect(() => {
		if (!open) {
			return;
		}
		naturalRatio.current = null;
		editor.getEditorState().read(() => {
			const selection = $getSelection();
			editImageKey.current = null;
			let nextSrc = '';
			let nextAlt = '';
			let nextWidth = '';
			let nextHeight = '';

			if ($isNodeSelection(selection)) {
				const nodes = selection.getNodes();
				const imageNode = nodes.length === 1 && $isImageNode(nodes[0]) ? nodes[0] : null;
				if (imageNode) {
					editImageKey.current = imageNode.getKey();
					nextSrc = imageNode.getSrc();
					nextAlt = imageNode.getAltText();
					nextWidth = dimensionToInput(imageNode.getWidth());
					nextHeight = dimensionToInput(imageNode.getHeight());
				}
			}

			setSrc(nextSrc);
			setAltText(nextAlt);
			setWidth(nextWidth);
			setHeight(nextHeight);
		});
		setLocked(true);
	}, [editor, open]);

	// Read the natural ratio of the source: it feeds the aspect-ratio lock and,
	// for a fresh insertion, pre-fills the dimensions with the natural size.
	useEffect(() => {
		if (!open || !src) {
			return undefined;
		}
		let cancelled = false;
		const image = new Image();
		image.onload = (): void => {
			if (cancelled || !image.naturalWidth || !image.naturalHeight) {
				return;
			}
			naturalRatio.current = image.naturalWidth / image.naturalHeight;
			if (!editImageKey.current) {
				setWidth((prev) => (prev === '' ? String(image.naturalWidth) : prev));
				setHeight((prev) => (prev === '' ? String(image.naturalHeight) : prev));
			}
		};
		image.src = src;
		return (): void => {
			cancelled = true;
		};
	}, [open, src]);

	const currentRatio = useCallback((): number | null => {
		if (naturalRatio.current && naturalRatio.current > 0) {
			return naturalRatio.current;
		}
		const w = Number(width);
		const h = Number(height);
		return w > 0 && h > 0 ? w / h : null;
	}, [width, height]);

	const onWidthChange = useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>): void => {
			const { value } = ev.target;
			setWidth(value);
			if (!locked) {
				return;
			}
			const ratio = currentRatio();
			const w = Number(value);
			if (ratio && w > 0) {
				setHeight(String(Math.round(w / ratio)));
			}
		},
		[currentRatio, locked]
	);

	const onHeightChange = useCallback(
		(ev: React.ChangeEvent<HTMLInputElement>): void => {
			const { value } = ev.target;
			setHeight(value);
			if (!locked) {
				return;
			}
			const ratio = currentRatio();
			const h = Number(value);
			if (ratio && h > 0) {
				setWidth(String(Math.round(h * ratio)));
			}
		},
		[currentRatio, locked]
	);

	const onConfirm = useCallback(() => {
		if (!src) {
			return;
		}
		const nextWidth = inputToDimension(width);
		const nextHeight = inputToDimension(height);
		const key = editImageKey.current;
		if (key) {
			editor.update(() => {
				const node = $getNodeByKey(key);
				if ($isImageNode(node)) {
					node.setSrc(src);
					node.setAltText(altText);
					node.setWidthAndHeight(nextWidth, nextHeight);
				}
			});
		} else {
			editor.dispatchCommand(INSERT_INLINE_IMAGE_COMMAND, {
				src,
				cidUrl: undefined,
				altText,
				width: nextWidth,
				height: nextHeight
			});
		}
		onClose();
	}, [altText, editor, height, onClose, src, width]);

	const lockLabel = locked
		? t('label.unlock_aspect_ratio', 'Unlock aspect ratio')
		: t('label.lock_aspect_ratio', 'Lock aspect ratio');

	return (
		<Modal
			open={open}
			title={t('label.insert_edit_image', 'Insert/Edit Image')}
			size="medium"
			onClose={onClose}
			onConfirm={onConfirm}
			confirmLabel={t('label.save', 'Save')}
			confirmDisabled={!src}
			onSecondaryAction={onClose}
			secondaryActionLabel={t('label.cancel', 'Cancel')}
			showCloseIcon
		>
			<Container
				padding={{ vertical: 'large' }}
				gap="1rem"
				mainAlignment="flex-start"
				crossAlignment="flex-start"
			>
				<Input
					label={t('label.image_source', 'Source')}
					value={src}
					onChange={(ev: React.ChangeEvent<HTMLInputElement>): void => setSrc(ev.target.value)}
					background="gray5"
				/>
				<Input
					label={t('label.image_alt', 'Alternative description')}
					value={altText}
					onChange={(ev: React.ChangeEvent<HTMLInputElement>): void => setAltText(ev.target.value)}
					background="gray5"
				/>
				<Container
					orientation="horizontal"
					gap="0.5rem"
					mainAlignment="flex-start"
					crossAlignment="flex-end"
					width="fill"
				>
					<Input
						label={t('label.width', 'Width')}
						type="number"
						value={width}
						onChange={onWidthChange}
						background="gray5"
					/>
					<Input
						label={t('label.height', 'Height')}
						type="number"
						value={height}
						onChange={onHeightChange}
						background="gray5"
					/>
					<Tooltip label={lockLabel}>
						<Button
							icon={locked ? 'Lock' : 'Unlock'}
							type="ghost"
							color="text"
							size="large"
							aria-label={lockLabel}
							onClick={(): void => setLocked((prev) => !prev)}
						/>
					</Tooltip>
				</Container>
			</Container>
		</Modal>
	);
};
