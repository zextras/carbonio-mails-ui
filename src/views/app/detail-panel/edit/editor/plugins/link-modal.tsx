/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
	$createLinkNode,
	$isLinkNode,
	$toggleLink,
	formatUrl,
	type LinkAttributes,
	type LinkNode
} from '@lexical/link';
import { $findMatchingParent } from '@lexical/utils';
import { Container, Input, Modal, Select, type SelectItem } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import {
	$createTextNode,
	$getNodeByKey,
	$getSelection,
	$isRangeSelection,
	type LexicalEditor,
	type RangeSelection
} from 'lexical';

type LinkModalProps = {
	editor: LexicalEditor;
	open: boolean;
	onClose: () => void;
};

type LinkTarget = 'self' | 'blank';

/** Updates an existing link node in place, replacing its text only when changed. */
function $updateLinkNode(
	node: LinkNode,
	url: string,
	attributes: LinkAttributes,
	text: string
): void {
	node.setURL(url);
	node.setTarget(attributes.target ?? null);
	node.setRel(attributes.rel ?? null);
	node.setTitle(attributes.title ?? null);
	if (text && text !== node.getTextContent()) {
		node.getChildren().forEach((child) => child.remove());
		node.append($createTextNode(text));
	}
}

/**
 * A collapsed caret or a display text that differs from the selected text inserts
 * a brand-new link node carrying that text; otherwise the selection is wrapped.
 */
function $insertOrWrapLink(
	selection: RangeSelection,
	url: string,
	attributes: LinkAttributes,
	text: string
): void {
	if (selection.isCollapsed() || (text && text !== selection.getTextContent())) {
		const linkNode = $createLinkNode(url, attributes);
		linkNode.append($createTextNode(text || url));
		selection.insertNodes([linkNode]);
	} else {
		$toggleLink({ url, ...attributes });
	}
}

/** Applies the modal values to the editor: edits the targeted link, or inserts/wraps. */
function $applyLink(
	url: string,
	text: string,
	attributes: LinkAttributes,
	editLinkKey: string | null
): void {
	const finalUrl = formatUrl(url);
	const editedNode = editLinkKey ? $getNodeByKey(editLinkKey) : null;
	if ($isLinkNode(editedNode)) {
		$updateLinkNode(editedNode, finalUrl, attributes, text);
		return;
	}
	const selection = $getSelection();
	if ($isRangeSelection(selection)) {
		$insertOrWrapLink(selection, finalUrl, attributes, text);
	}
}

/**
 * Modal "Insert/Edit Link" dialog: it collects
 * the URL, the text to display, the title attribute and whether the link opens in
 * the current or a new window. When the caret sits inside an existing link the
 * fields are pre-filled so the same dialog edits it. On save the link is created,
 * updated or applied to the current selection in the main editor.
 */
export const LinkModal = ({ editor, open, onClose }: LinkModalProps): React.JSX.Element => {
	const [url, setUrl] = useState('');
	const [text, setText] = useState('');
	const [title, setTitle] = useState('');
	const [target, setTarget] = useState<LinkTarget>('self');
	// Key of the link node being edited (caret inside an existing link), if any.
	const editLinkKey = useRef<string | null>(null);

	// Pre-fill the fields from the current selection each time the modal opens: an
	// enclosing link populates every field for editing, a plain text selection
	// seeds the "text to display", and a collapsed caret leaves everything empty.
	useEffect(() => {
		if (!open) {
			return;
		}
		editor.getEditorState().read(() => {
			const selection = $getSelection();
			editLinkKey.current = null;
			let nextUrl = '';
			let nextText = '';
			let nextTitle = '';
			let nextTarget: LinkTarget = 'self';

			if ($isRangeSelection(selection)) {
				const linkNode = $findMatchingParent(selection.anchor.getNode(), $isLinkNode);
				if ($isLinkNode(linkNode)) {
					editLinkKey.current = linkNode.getKey();
					nextUrl = linkNode.getURL();
					nextText = linkNode.getTextContent();
					nextTitle = linkNode.getTitle() ?? '';
					nextTarget = linkNode.getTarget() === '_blank' ? 'blank' : 'self';
				} else {
					nextText = selection.getTextContent();
				}
			}

			setUrl(nextUrl);
			setText(nextText);
			setTitle(nextTitle);
			setTarget(nextTarget);
		});
	}, [editor, open]);

	const targetItems = useMemo<Array<SelectItem>>(
		() => [
			{ label: t('lexical-label.current_window', 'Current window'), value: 'self' },
			{ label: t('lexical-label.new_window', 'New window'), value: 'blank' }
		],
		[]
	);

	const targetSelection = useMemo<SelectItem>(
		() => targetItems.find((item) => item.value === target) ?? targetItems[0],
		[target, targetItems]
	);

	const onConfirm = useCallback(() => {
		if (!url) {
			return;
		}
		const attributes: LinkAttributes = {
			target: target === 'blank' ? '_blank' : null,
			rel: target === 'blank' ? 'noopener noreferrer' : null,
			title: title || null
		};
		editor.update(() => $applyLink(url, text, attributes, editLinkKey.current));
		onClose();
	}, [editor, onClose, target, text, title, url]);

	return (
		<Modal
			open={open}
			title={t('lexical-label.insert_edit_link', 'Insert/Edit Link')}
			size="small"
			onClose={onClose}
			onConfirm={onConfirm}
			confirmLabel={t('label.save', 'Save')}
			confirmDisabled={!url}
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
					label={t('lexical-label.url', 'URL')}
					value={url}
					onChange={(ev: React.ChangeEvent<HTMLInputElement>): void => setUrl(ev.target.value)}
					background="gray5"
				/>
				<Input
					label={t('lexical-label.text_to_display', 'Text to display')}
					value={text}
					onChange={(ev: React.ChangeEvent<HTMLInputElement>): void => setText(ev.target.value)}
					background="gray5"
				/>
				<Input
					label={t('lexical-label.link_title', 'Title')}
					value={title}
					onChange={(ev: React.ChangeEvent<HTMLInputElement>): void => setTitle(ev.target.value)}
					background="gray5"
				/>
				<Select
					label={t('lexical-label.open_link_in', 'Open link in…')}
					items={targetItems}
					selection={targetSelection}
					onChange={(value): void => setTarget(value === 'blank' ? 'blank' : 'self')}
					background="gray5"
					showCheckbox={false}
				/>
			</Container>
		</Modal>
	);
};
