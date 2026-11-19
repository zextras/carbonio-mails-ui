/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button, Container, Input, Modal, Tooltip } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { $getNodeByKey, type LexicalEditor } from 'lexical';

import { INSERT_INLINE_IMAGE_COMMAND } from './image-plugin';
import { $getSelectedImageNode, $isImageNode, type ImageNode } from './nodes/image-node';
import { type ImageDimension } from './nodes/image-types';

type ImageModalProps = {
	editor: LexicalEditor;
	open: boolean;
	onClose: () => void;
};

/** A dimension of the edited image and the text its input was pre-filled with. */
type InitialDimension = {
	value: ImageDimension;
	input: string;
};

type InitialDimensions = {
	width: InitialDimension;
	height: InitialDimension;
};

/**
 * Pre-fills the input of a stored {@link ImageDimension}; an 'inherit' dimension
 * shows the size the image is currently rendered with.
 */
function initialDimension(
	value: ImageDimension,
	renderedSize: number | undefined
): InitialDimension {
	if (value !== 'inherit') {
		return { value, input: String(value) };
	}
	return { value, input: renderedSize ? String(renderedSize) : '' };
}

function readInitialDimensions(editor: LexicalEditor, imageNode: ImageNode): InitialDimensions {
	const rendered = editor.getElementByKey(imageNode.getKey())?.querySelector('img');
	return {
		width: initialDimension(imageNode.getWidth(), rendered?.clientWidth),
		height: initialDimension(imageNode.getHeight(), rendered?.clientHeight)
	};
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
 * Dimension saved for an input. While the input still holds its pre-filled text
 * the image keeps its own dimension: saving the dialog (e.g. to change the
 * alternative text) must not pin an image sized by the browser to the size it
 * happens to be rendered with.
 */
function toDimension(input: string, initial: InitialDimension | undefined): ImageDimension {
	return initial?.input === input ? initial.value : inputToDimension(input);
}

/**
 * Modal "Insert/Edit Image" dialog: it collects the image source URL, the
 * alternative description and the width/height. When a single image node is
 * selected the fields are pre-filled so the same dialog edits it in place (the
 * width/height of an image without explicit size show its rendered size);
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
	const editImageKey = useRef<string | null>(null);
	const initialDimensions = useRef<InitialDimensions | null>(null);
	const naturalRatio = useRef<number | null>(null);

	useEffect(() => {
		if (!open) {
			return;
		}
		naturalRatio.current = null;
		editor.getEditorState().read(() => {
			const imageNode = $getSelectedImageNode();
			editImageKey.current = imageNode?.getKey() ?? null;
			initialDimensions.current = imageNode ? readInitialDimensions(editor, imageNode) : null;
			setSrc(imageNode?.getSrc() ?? '');
			setAltText(imageNode?.getAltText() ?? '');
			setWidth(initialDimensions.current?.width.input ?? '');
			setHeight(initialDimensions.current?.height.input ?? '');
		});
		setLocked(true);
	}, [editor, open]);

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
		const initial = initialDimensions.current;
		const nextWidth = toDimension(width, initial?.width);
		const nextHeight = toDimension(height, initial?.height);
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
		? t('lexical-label.unlock_aspect_ratio', 'Unlock aspect ratio')
		: t('lexical-label.lock_aspect_ratio', 'Lock aspect ratio');

	return (
		<Modal
			open={open}
			title={t('lexical-label.insert_edit_image', 'Insert/Edit Image')}
			size="small"
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
					label={t('lexical-label.image_source', 'Source')}
					value={src}
					onChange={(ev: React.ChangeEvent<HTMLInputElement>): void => setSrc(ev.target.value)}
					background="gray5"
				/>
				<Input
					label={t('lexical-label.image_alt', 'Alternative description')}
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
						label={t('lexical-label.width', 'Width')}
						type="number"
						value={width}
						onChange={onWidthChange}
						background="gray5"
						minWidth={0}
					/>
					<Input
						label={t('lexical-label.height', 'Height')}
						type="number"
						value={height}
						onChange={onHeightChange}
						background="gray5"
						minWidth={0}
					/>
					<Tooltip label={lockLabel}>
						<Button
							icon={locked ? 'Lock' : 'Unlock'}
							type="ghost"
							color="text"
							size="extralarge"
							minWidth="fit-content"
							aria-label={lockLabel}
							aria-pressed={locked}
							onClick={(): void => setLocked((prev) => !prev)}
						/>
					</Tooltip>
				</Container>
			</Container>
		</Modal>
	);
};
